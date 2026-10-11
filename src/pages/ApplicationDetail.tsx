import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { TextArea, TextInput } from '../components/ui/fields'
import { ErrorState, SectionHeading, Spinner } from '../components/ui/states'
import { useAuth } from '../context/AuthContext'
import { CLOSED, deleteApplication, fetchApplications, PIPELINE, updateApplication, type Application, type AppStatus } from '../lib/applications'

const DEFAULT_CHECKLIST = ['Transcript / degrees', 'Statement of purpose', 'Recommendation letters', 'Passport copy', 'CV / resume']

export function ApplicationDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [app, setApp] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [newItem, setNewItem] = useState('')

  useEffect(() => {
    if (!user || !id) {
      setLoading(false)
      return
    }
    fetchApplications(user.id)
      .then((apps) => {
        const found = apps.find((a) => a.id === id)
        if (!found) setError('Application not found.')
        else {
          if (found.checklist.length === 0) {
            found.checklist = DEFAULT_CHECKLIST.map((label) => ({ label, done: false }))
          }
          setApp(found)
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load.'))
      .finally(() => setLoading(false))
  }, [user, id])

  async function save(patch: Partial<Application>) {
    if (!app) return
    setSaving(true)
    try {
      await updateApplication(app.id, patch)
      setApp({ ...app, ...patch })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.')
    }
    setSaving(false)
  }

  async function remove() {
    if (!app || !confirm('Stop tracking this application?')) return
    await deleteApplication(app.id)
    navigate('/applications')
  }

  if (loading) return <Spinner />
  if (error || !app) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <ErrorState message={error ?? 'Not found.'} onRetry={() => navigate('/applications')} />
      </div>
    )
  }

  const checklist = app.checklist

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <SectionHeading kicker="Application" title={app.opportunity_title} />

      <div className="grid gap-6">
        <Card className="p-6">
          <h3 className="font-bold text-ink mb-4">Pipeline stage</h3>
          <div className="flex flex-wrap gap-2">
            {[...PIPELINE, ...CLOSED].map((s) => (
              <Button
                key={s.key}
                size="sm"
                variant={app.status === s.key ? 'primary' : 'outline'}
                disabled={saving}
                onClick={() => save({ status: s.key as AppStatus })}
              >
                {s.label}
              </Button>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <span className="text-sm text-muted">Current:</span>
            <Badge tone="info">{app.status}</Badge>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-bold text-ink mb-4">Document checklist</h3>
          <div className="space-y-2">
            {checklist.map((item, i) => (
              <label key={i} className="flex items-center gap-3 p-3 rounded-lg border border-line cursor-pointer hover:bg-surface-2">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => {
                    const next = checklist.map((c, j) => (j === i ? { ...c, done: !c.done } : c))
                    save({ checklist: next })
                  }}
                  className="w-5 h-5 accent-primary"
                />
                <span className={item.done ? 'line-through text-muted' : 'text-ink'}>{item.label}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <TextInput id="new-item" label="Add item" value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="e.g. English test score" />
            <div className="pt-7">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (!newItem.trim()) return
                  save({ checklist: [...checklist, { label: newItem.trim(), done: false }] })
                  setNewItem('')
                }}
              >
                Add
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-bold text-ink mb-4">Notes & reminder</h3>
          <div className="space-y-4">
            <TextArea id="notes" label="Private notes" value={app.notes} onChange={(e) => setApp({ ...app, notes: e.target.value })} placeholder="Deadlines, contacts, tips…" />
            <TextInput id="reminder" label="Reminder date" type="date" value={app.reminder_date ?? ''} onChange={(e) => setApp({ ...app, reminder_date: e.target.value || null })} />
            <Button size="sm" loading={saving} onClick={() => save({ notes: app.notes, reminder_date: app.reminder_date })}>
              Save notes
            </Button>
          </div>
        </Card>

        <div className="flex gap-3">
          <Link to="/applications"><Button variant="outline">← All applications</Button></Link>
          <Button variant="ghost" onClick={remove}>Stop tracking</Button>
        </div>
      </div>
    </div>
  )
}
