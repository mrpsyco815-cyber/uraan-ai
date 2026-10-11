import { isSupabaseConfigured, supabase } from './supabase'
import { fetchApplications } from './applications'

export type NotifType = 'deadline_reminder' | 'mentorship' | 'system' | 'opportunity'

export interface Notification {
  id: string
  user_id: string
  type: NotifType
  title: string
  message: string
  link: string
  read: boolean
  created_at: string
}

const memNotifs: Notification[] = []

export async function fetchNotifications(userId: string): Promise<Notification[]> {
  if (!isSupabaseConfigured) {
    const computed = await computeDeadlineReminders(userId)
    return [...computed, ...memNotifs.filter((n) => n.user_id === userId)].sort(
      (a, b) => b.created_at.localeCompare(a.created_at),
    )
  }
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw new Error(error.message)
  return (data ?? []) as Notification[]
}

/**
 * Client-side deadline reminders: tracked applications with reminder_date
 * within the next 7 days (or overdue). Stored reminders come from the
 * Edge Function cron in production; this keeps the UI useful offline.
 */
export async function computeDeadlineReminders(userId: string): Promise<Notification[]> {
  try {
    const apps = await fetchApplications(userId)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const out: Notification[] = []
    for (const a of apps) {
      if (!a.reminder_date || ['accepted', 'rejected', 'withdrawn'].includes(a.status)) continue
      const d = new Date(a.reminder_date)
      const days = Math.round((d.getTime() - now.getTime()) / 86400000)
      if (days <= 7) {
        out.push({
          id: `dl-${a.id}`,
          user_id: userId,
          type: 'deadline_reminder',
          title: days < 0 ? `Overdue: ${a.opportunity_title}` : days === 0 ? `Due today: ${a.opportunity_title}` : `${days} day${days === 1 ? '' : 's'} left: ${a.opportunity_title}`,
          message: days < 0 ? 'This reminder date has passed — update your application.' : 'Your reminder date is approaching.',
          link: `/applications/${a.id}`,
          read: false,
          created_at: new Date().toISOString(),
        })
      }
    }
    return out
  } catch {
    return []
  }
}

export async function markRead(id: string): Promise<void> {
  if (id.startsWith('dl-') || id.startsWith('mem-')) {
    const n = memNotifs.find((x) => x.id === id)
    if (n) n.read = true
    return
  }
  if (!isSupabaseConfigured) return
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function markAllRead(userId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    memNotifs.forEach((n) => { if (n.user_id === userId) n.read = true })
    return
  }
  const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
  if (error) throw new Error(error.message)
}
