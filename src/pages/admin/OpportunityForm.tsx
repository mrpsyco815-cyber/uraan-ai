import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Select, TextArea, TextInput } from '../../components/ui/fields'
import { SectionHeading, Spinner } from '../../components/ui/states'
import { useAuth } from '../../context/AuthContext'
import { saveOpportunity, type Opportunity } from '../../lib/opportunities'
import { supabase } from '../../lib/supabase'

const TYPES = ['Scholarship', 'Fellowship', 'Internship', 'Exchange', 'Course']

export function OpportunityForm() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(!!id)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Opportunity>>({ type: 'Scholarship', status: 'draft' })

  useEffect(() => {
    if (!id) return
    supabase.from('opportunities').select('*').eq('id', id).single().then(({ data, error: e }) => {
      if (e) setError(e.message)
      else setForm(data as Opportunity)
      setLoading(false)
    })
  }, [id])

  function set<K extends keyof Opportunity>(k: K, v: Opportunity[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (!form.title?.trim()) return setError('Title is required.')
    if (!user) return setError('Not logged in.')
    setSaving(true)
    try {
      await saveOpportunity({ ...form, title: form.title!.trim(), id }, user.id)
      navigate('/admin/opportunities')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.')
    }
    setSaving(false)
  }

  if (loading) return <Spinner />

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <SectionHeading kicker="Admin" title={id ? 'Edit opportunity' : 'Add opportunity'} />
      <Card className="p-8">
        <form onSubmit={submit} className="space-y-4" noValidate>
          <TextInput id="title" label="Title" value={form.title ?? ''} onChange={(e) => set('title', e.target.value)} placeholder="DAAD Scholarship — Germany" />
          <div className="grid sm:grid-cols-2 gap-4">
            <Select id="type" label="Type" value={form.type ?? 'Scholarship'} onChange={(e) => set('type', e.target.value)}>
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </Select>
            <Select id="status" label="Status" value={form.status ?? 'draft'} onChange={(e) => set('status', e.target.value as Opportunity['status'])}>
              <option value="draft">Draft</option>
              <option value="pending_review">Pending review</option>
              <option value="published">Published</option>
              <option value="expired">Expired</option>
              <option value="closed">Closed</option>
            </Select>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <TextInput id="country" label="Country" value={form.country ?? ''} onChange={(e) => set('country', e.target.value)} placeholder="Germany" />
            <TextInput id="level" label="Level" value={form.level ?? ''} onChange={(e) => set('level', e.target.value)} placeholder="Masters" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <TextInput id="funding" label="Funding" value={form.funding ?? ''} onChange={(e) => set('funding', e.target.value)} placeholder="Fully funded" />
            <TextInput id="deadline" label="Deadline" type="date" value={form.deadline ?? ''} onChange={(e) => set('deadline', e.target.value)} />
          </div>
          <TextInput id="url" label="Official URL" value={form.official_url ?? ''} onChange={(e) => set('official_url', e.target.value)} placeholder="https://…" />
          <TextArea id="summary" label="Summary" value={form.summary ?? ''} onChange={(e) => set('summary', e.target.value)} placeholder="What this opportunity offers…" />
          {error && <p className="text-sm text-error" role="alert">{error}</p>}
          <div className="flex gap-3">
            <Button type="submit" loading={saving}>Save</Button>
            <Link to="/admin/opportunities"><Button variant="ghost">Cancel</Button></Link>
          </div>
        </form>
      </Card>
    </div>
  )
}
