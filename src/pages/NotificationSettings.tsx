import { useEffect, useState } from 'react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { SectionHeading, Spinner } from '../components/ui/states'
import { useAuth } from '../context/AuthContext'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

interface Prefs {
  deadline_reminders: boolean
  mentorship_updates: boolean
  opportunity_alerts: boolean
  system_updates: boolean
}

const DEFAULTS: Prefs = {
  deadline_reminders: true,
  mentorship_updates: true,
  opportunity_alerts: true,
  system_updates: true,
}

const LABELS: { key: keyof Prefs; title: string; desc: string }[] = [
  { key: 'deadline_reminders', title: 'Deadline reminders', desc: 'Alerts when your application reminders are approaching.' },
  { key: 'mentorship_updates', title: 'Mentorship updates', desc: 'When mentors accept, decline, or message you.' },
  { key: 'opportunity_alerts', title: 'New opportunities', desc: 'When new scholarships matching your profile are published.' },
  { key: 'system_updates', title: 'System updates', desc: 'Important announcements from the URAAN AI team.' },
]

const memPrefs: Record<string, Prefs> = {}

export function NotificationSettings() {
  const { user } = useAuth()
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    if (!isSupabaseConfigured) {
      setPrefs(memPrefs[user.id] ?? DEFAULTS)
      setLoading(false)
      return
    }
    supabase.from('notification_preferences').select('*').eq('user_id', user.id).single().then(({ data }) => {
      if (data) {
        setPrefs({
          deadline_reminders: data.deadline_reminders,
          mentorship_updates: data.mentorship_updates,
          opportunity_alerts: data.opportunity_alerts,
          system_updates: data.system_updates,
        })
      }
      setLoading(false)
    })
  }, [user])

  async function save() {
    if (!user) return
    setSaving(true)
    if (!isSupabaseConfigured) {
      memPrefs[user.id] = prefs
    } else {
      const { error } = await supabase.from('notification_preferences').upsert(
        { user_id: user.id, ...prefs, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      )
      if (error) {
        setSaving(false)
        return
      }
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <Spinner />

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <SectionHeading kicker="Settings" title="Notification preferences" subtitle="Choose what you want to hear about." />
      <Card className="p-6">
        <div className="space-y-4">
          {LABELS.map(({ key, title, desc }) => (
            <label key={key} className="flex items-start gap-3 p-4 rounded-lg border border-line cursor-pointer hover:bg-surface-2">
              <input
                type="checkbox"
                checked={prefs[key]}
                onChange={(e) => setPrefs({ ...prefs, [key]: e.target.checked })}
                className="w-5 h-5 mt-0.5 accent-primary"
              />
              <div>
                <p className="font-medium text-ink">{title}</p>
                <p className="text-sm text-muted">{desc}</p>
              </div>
            </label>
          ))}
        </div>
        <div className="mt-6 flex items-center gap-3">
          <Button loading={saving} onClick={save}>Save preferences</Button>
          {saved && <span className="text-sm text-green-600">✓ Saved</span>}
        </div>
      </Card>
    </div>
  )
}
