import { isSupabaseConfigured, supabase } from './supabase'

export interface AnalyticsData {
  users: { total: number; byRole: Record<string, number> }
  opportunities: { total: number; byStatus: Record<string, number> }
  applications: { total: number; byStatus: Record<string, number> }
  mentors: { total: number; verified: number; pending: number }
  requests: { total: number; pending: number }
  recentActivity: { action: string; entity: string; created_at: string }[]
}

function countBy<T extends Record<string, unknown>>(rows: T[], key: keyof T): Record<string, number> {
  const out: Record<string, number> = {}
  for (const r of rows) {
    const k = String(r[key] ?? 'unknown')
    out[k] = (out[k] ?? 0) + 1
  }
  return out
}

export async function fetchAnalytics(): Promise<{ data: AnalyticsData; live: boolean }> {
  if (!isSupabaseConfigured) {
    return {
      live: false,
      data: {
        users: { total: 128, byRole: { student: 112, mentor: 12, admin: 4 } },
        opportunities: { total: 45, byStatus: { published: 32, pending_review: 8, draft: 5 } },
        applications: { total: 210, byStatus: { interested: 60, applied: 80, documents: 30, interview: 20, offered: 12, accepted: 8 } },
        mentors: { total: 12, verified: 9, pending: 3 },
        requests: { total: 34, pending: 6 },
        recentActivity: [
          { action: 'opportunity.published', entity: 'opportunity', created_at: new Date().toISOString() },
          { action: 'opportunity.create', entity: 'opportunity', created_at: new Date().toISOString() },
        ],
      },
    }
  }

  const [profiles, opps, apps, mentors, reqs, audit] = await Promise.all([
    supabase.from('profiles').select('role'),
    supabase.from('opportunities').select('status'),
    supabase.from('applications').select('status'),
    supabase.from('mentor_profiles').select('verified'),
    supabase.from('mentorship_requests').select('status'),
    supabase.from('audit_logs').select('action,entity,created_at').order('created_at', { ascending: false }).limit(10),
  ])

  if (profiles.error || opps.error) throw new Error('Analytics query failed.')

  const mentorRows = (mentors.data ?? []) as { verified: boolean }[]
  const reqRows = (reqs.data ?? []) as { status: string }[]

  return {
    live: true,
    data: {
      users: { total: (profiles.data ?? []).length, byRole: countBy((profiles.data ?? []) as Record<string, unknown>[], 'role') },
      opportunities: { total: (opps.data ?? []).length, byStatus: countBy((opps.data ?? []) as Record<string, unknown>[], 'status') },
      applications: { total: (apps.data ?? []).length, byStatus: countBy((apps.data ?? []) as Record<string, unknown>[], 'status') },
      mentors: {
        total: mentorRows.length,
        verified: mentorRows.filter((m) => m.verified).length,
        pending: mentorRows.filter((m) => !m.verified).length,
      },
      requests: { total: reqRows.length, pending: reqRows.filter((r) => r.status === 'pending').length },
      recentActivity: (audit.data ?? []) as AnalyticsData['recentActivity'],
    },
  }
}
