import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Select, TextInput } from '../components/ui/fields'
import { EmptyState, SectionHeading, Spinner } from '../components/ui/states'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../context/ProfileContext'

export function Profile() {
  const { user, signOut } = useAuth()
  const { profile, loading, mockMode, saveProfile } = useProfile()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

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
          </div>
        )}
      </Card>
    </div>
  )
}
