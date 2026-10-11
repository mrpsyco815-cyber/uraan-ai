import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { TextArea, TextInput } from '../components/ui/fields'
import { EmptyState, SectionHeading, Spinner } from '../components/ui/states'
import { useAuth } from '../context/AuthContext'
import { getMyMentorProfile, saveMentorProfile } from '../lib/mentors'

export function BecomeMentor() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ display_name: '', bio: '', expertise: '', country: '', years_experience: '0', languages: 'en, ur' })

  useEffect(() => {
    if (authLoading || !user) {
      setLoading(false)
      return
    }
    getMyMentorProfile(user.id).then((p) => {
      if (p) {
        setForm({
          display_name: p.display_name, bio: p.bio, expertise: p.expertise.join(', '),
          country: p.country, years_experience: String(p.years_experience), languages: p.languages.join(', '),
        })
      }
      setLoading(false)
    })
  }, [user, authLoading])

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!user) return
    setError(null)
    if (!form.display_name.trim() || !form.bio.trim()) return setError('Name and bio are required.')
    setSaving(true)
    try {
      await saveMentorProfile(user.id, {
        display_name: form.display_name.trim(),
        bio: form.bio.trim(),
        expertise: form.expertise.split(',').map((s) => s.trim()).filter(Boolean),
        country: form.country.trim(),
        years_experience: parseInt(form.years_experience, 10) || 0,
        languages: form.languages.split(',').map((s) => s.trim()).filter(Boolean),
        available: true,
      })
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.')
    }
    setSaving(false)
  }

  if (authLoading || loading) return <Spinner />

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <Card><EmptyState title="Log in first" message="You need an account to become a mentor." action={<Link to="/login"><Button>Log in</Button></Link>} /></Card>
      </div>
    )
  }

  if (saved) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <Card className="p-8 text-center">
          <p className="text-4xl mb-3">🎉</p>
          <h2 className="font-bold text-ink text-xl mb-2">Profile submitted!</h2>
          <p className="text-sm text-muted mb-6">An admin will verify your profile before it appears publicly.</p>
          <Button onClick={() => navigate('/mentors')}>Browse mentors</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <SectionHeading kicker="Give back" title="Become a mentor" subtitle="Help the next generation of Pakistani students. Admin verification required before going public." />
      <Card className="p-8">
        <form onSubmit={submit} className="space-y-4" noValidate>
          <TextInput id="mname" label="Display name" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} placeholder="Dr. Ayesha Rahman" />
          <TextArea id="mbio" label="Bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Your education, scholarships won, what you help with…" />
          <TextInput id="mexp" label="Expertise (comma-separated)" value={form.expertise} onChange={(e) => setForm({ ...form, expertise: e.target.value })} placeholder="Germany, DAAD, Computer Science" />
          <div className="grid sm:grid-cols-2 gap-4">
            <TextInput id="mcountry" label="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Germany" />
            <TextInput id="mexp2" label="Years of experience" type="number" value={form.years_experience} onChange={(e) => setForm({ ...form, years_experience: e.target.value })} />
          </div>
          <TextInput id="mlang" label="Languages (comma-separated)" value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })} placeholder="en, ur" />
          {error && <p className="text-sm text-error" role="alert">{error}</p>}
          <Button type="submit" loading={saving}>Submit for verification</Button>
        </form>
      </Card>
    </div>
  )
}
