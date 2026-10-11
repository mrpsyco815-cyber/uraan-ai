import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Select, TextInput } from '../components/ui/fields'
import { EmptyState, SectionHeading, Spinner } from '../components/ui/states'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../context/ProfileContext'
import { updateVisibility, type Visibility } from '../lib/safety'

const VISIBILITY_OPTIONS: { value: Visibility; label: string; desc: string }[] = [
  { value: 'public', label: '🌐 Public', desc: 'Visible to everyone' },
  { value: 'mentors_only', label: '👥 Mentors only', desc: 'Only verified mentors can see your profile' },
  { value: 'private', label: '🔒 Private', desc: 'Hidden from directories; only you and admins' },
]

export function Profile() {
  const { user, signOut } = useAuth()
  const { profile, loading, mockMode, saveProfile } = useProfile()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [visibility, setVisibility] = useState<Visibility>('public')
  const [visSaving, setVisSaving] = useState(false)

  if (loading) return <Spinner />

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <Card>
          <EmptyState
            title="Please log in"
            message="Your profile lives behind login."
            action={<Link to="/login"><Button>Log in</Button></Link>}
          />
        </Card>
      </div>
    )
  }

  if (!profile?.onboarding_done && !editing) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <Card>
          <EmptyState
            title="Complete your profile"
            message="Tell us about yourself so we can match you with the right opportunities."
            action={<Link to="/onboarding"><Button>Start onboarding</Button></Link>}
          />
        </Card>
      </div>
    )
  }

  async function save() {
    if (!profile) return
    setSaving(true)
    await saveProfile({ ...profile, full_name: name || profile.full_name })
    setSaving(false)
    setEditing(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <SectionHeading kicker="Account" title="My profile" />
      {mockMode && (
        <p className="text-xs bg-warning/10 text-warning font-medium rounded-xl px-4 py-3 mb-5">
          Demo mode — Supabase connect hote hi real data aayega.
        </p>
      )}
      <Card className="p-8">
        {editing ? (
          <div className="space-y-4">
            <TextInput id="edit-name" label="Full name" defaultValue={profile?.full_name} onChange={(e) => setName(e.target.value)} />
            <Select id="edit-level" label="Education level" defaultValue={profile?.education_level}>
              {['Matric', 'Intermediate', 'Bachelor', 'Master', 'PhD'].map((l) => <option key={l}>{l}</option>)}
            </Select>
            <div className="flex gap-3">
              <Button onClick={save} loading={saving}>Save</Button>
              <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div>
            <dl className="text-sm space-y-3 mb-6">
              {[['Name', profile?.full_name || '—'], ['Email', user.email ?? '—'],
                ['Education', profile?.education_level || '—'], ['Field', profile?.field_of_study || '—'],
                ['Interests', profile?.interests.join(', ') || '—']].map(([k, v]) => (
                <div key={k} className="flex gap-3">
                  <dt className="w-24 shrink-0 text-muted">{k}</dt>
                  <dd className="font-medium text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setName(profile?.full_name ?? ''); setEditing(true) }}>
                Edit profile
              </Button>
              <Button variant="ghost" onClick={() => signOut()}>
                Log out
              </Button>
            </div>

            {/* Privacy controls — Phase B */}
            <div className="mt-8 pt-6 border-t border-line">
              <h3 className="font-semibold text-ink mb-1">🔒 Profile visibility</h3>
              <p className="text-sm text-muted mb-4">Control who can discover your profile.</p>
              <div className="space-y-2">
                {VISIBILITY_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-start gap-3 p-3 rounded-lg border border-line cursor-pointer hover:bg-surface-2">
                    <input
                      type="radio"
                      name="visibility"
                      checked={(profile as unknown as { visibility?: Visibility })?.visibility === opt.value || (visibility === opt.value && !(profile as unknown as { visibility?: Visibility })?.visibility)}
                      onChange={async () => {
                        setVisibility(opt.value)
                        setVisSaving(true)
                        try {
                          await updateVisibility(user.id, opt.value)
                        } catch {
                          // offline: keep local
                        }
                        setVisSaving(false)
                      }}
                      className="w-4 h-4 mt-1 accent-primary"
                    />
                    <div>
                      <p className="font-medium text-ink text-sm">{opt.label}</p>
                      <p className="text-xs text-muted">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              {visSaving && <p className="text-xs text-muted mt-2">Saving…</p>}

              <div className="mt-6">
                <Link to="/notification-settings"><Button size="sm" variant="outline">⚙️ Notification preferences</Button></Link>
              </div>

              <div className="mt-6 p-4 rounded-lg border border-error/30 bg-error/5">
                <h4 className="font-semibold text-error text-sm mb-1">Danger zone</h4>
                <p className="text-xs text-muted mb-3">Deleting your account removes your profile, applications, messages, and all personal data. This cannot be undone.</p>
                <Link to="/delete-account"><Button size="sm" variant="outline" className="!border-error !text-error">Delete my account</Button></Link>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
