import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { TextArea, TextInput } from '../../components/ui/fields'
import { EmptyState, SectionHeading, Spinner } from '../../components/ui/states'
import { useAuth } from '../../context/AuthContext'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'

interface SchApp {
  id: string
  name: string
  deadline: string | null
  status: string
  documents: string[]
  notes: string
}

const STATUSES = ['researching', 'preparing', 'applied', 'interview', 'accepted', 'rejected']
const STATUS_EMOJI: Record<string, string> = {
  researching: '🔍', preparing: '📝', applied: '📨', interview: '🎤', accepted: '🎉', rejected: '💪',
}

const memApps: (SchApp & { user_id: string })[] = []

async function fetchApps(userId: string): Promise<SchApp[]> {
  if (!isSupabaseConfigured) return memApps.filter((a) => a.user_id === userId)
  const { data } = await supabase.from('user_scholarship_apps').select('*').eq('user_id', userId).order('deadline', { ascending: true, nullsFirst: false })
  return (data ?? []) as SchApp[]
}

export function ScholarshipTracker() {
  const { user, loading: authLoading } = useAuth()
  const [apps, setApps] = useState<SchApp[]>([])
  const [name, setName] = useState('')
  const [deadline, setDeadline] = useState('')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<SchApp | null>(null)
  const [editDocs, setEditDocs] = useState('')
  const [editNotes, setEditNotes] = useState('')

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    fetchApps(user.id).then((a) => {
      setApps(a)
      setLoading(false)
    })
  }, [user])

  async function handleAdd() {
    if (!name.trim() || !user) return
    const payload = { user_id: user.id, name: name.trim(), deadline: deadline || null, status: 'researching', documents: [], notes: '' }
    if (!isSupabaseConfigured) {
      const a = { ...payload, id: `mem-${Date.now()}` }
      memApps.push(a)
      setApps((prev) => [...prev, a])
    } else {
      const { data } = await supabase.from('user_scholarship_apps').insert(payload).select().single()
      if (data) setApps((prev) => [...prev, data as SchApp])
    }
    setName('')
    setDeadline('')
  }

  async function updateStatus(app: SchApp, status: string) {
    if (!isSupabaseConfigured) {
      const a = memApps.find((x) => x.id === app.id)
      if (a) a.status = status
    } else {
      await supabase.from('user_scholarship_apps').update({ status }).eq('id', app.id)
    }
    setApps((prev) => prev.map((x) => (x.id === app.id ? { ...x, status } : x)))
  }

  async function saveDetails() {
    if (!editing) return
    const documents = editDocs.split(',').map((d) => d.trim()).filter(Boolean)
    if (!isSupabaseConfigured) {
      const a = memApps.find((x) => x.id === editing.id)
      if (a) {
        a.documents = documents
        a.notes = editNotes
      }
    } else {
      await supabase.from('user_scholarship_apps').update({ documents, notes: editNotes }).eq('id', editing.id)
    }
    setApps((prev) => prev.map((x) => (x.id === editing.id ? { ...x, documents, notes: editNotes } : x)))
    setEditing(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this application?')) return
    if (!isSupabaseConfigured) {
      const i = memApps.findIndex((x) => x.id === id)
      if (i >= 0) memApps.splice(i, 1)
    } else {
      await supabase.from('user_scholarship_apps').delete().eq('id', id)
    }
    setApps((prev) => prev.filter((x) => x.id !== id))
  }

  if (authLoading || loading) return <Spinner />
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <Card><EmptyState title="Log in for Scholarship Tracker" message="Track your applications privately." action={<Link to="/login"><Button>Log in</Button></Link>} /></Card>
      </div>
    )
  }

  const daysLeft = (d: string | null) => {
    if (!d) return null
    const days = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
    return days
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <SectionHeading kicker="🎓 Scholarship Tracker" title="Applications pipeline" subtitle={`${apps.length} applications tracked`} />

      <Card className="p-5 mb-6">
        <div className="flex gap-2">
          <div className="flex-1">
            <TextInput id="sch-name" label="Scholarship / program name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. DAAD EPOS" />
          </div>
          <div className="w-44">
            <TextInput id="sch-deadline" label="Deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
          <div className="pt-7"><Button onClick={handleAdd}>Add</Button></div>
        </div>
      </Card>

      <div className="space-y-3">
        {apps.map((app) => {
          const dl = daysLeft(app.deadline)
          return (
            <Card key={app.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-bold">{app.name}</h3>
                  <div className="flex gap-3 mt-1 text-sm">
                    {app.deadline && (
                      <span className={dl !== null && dl < 14 ? 'text-red-600 font-semibold' : 'text-muted'}>
                        📅 {app.deadline}{dl !== null && (dl < 0 ? ' (passed)' : ` (${dl}d left)`)}
                      </span>
                    )}
                    <span>{STATUS_EMOJI[app.status]} {app.status}</span>
                    {app.documents.length > 0 && <span className="text-muted">📎 {app.documents.length} docs</span>}
                  </div>
                  {app.notes && <p className="text-sm text-muted mt-2">{app.notes}</p>}
                </div>
                <button onClick={() => handleDelete(app.id)} className="text-xs text-error px-1">✕</button>
              </div>
              <div className="flex gap-1 mt-3 flex-wrap">
                {STATUSES.map((s) => (
                  <Button key={s} size="sm" variant={app.status === s ? undefined : 'ghost'} onClick={() => updateStatus(app, s)}>
                    {STATUS_EMOJI[s]} {s}
                  </Button>
                ))}
                <Button size="sm" variant="outline" onClick={() => { setEditing(app); setEditDocs(app.documents.join(', ')); setEditNotes(app.notes) }}>
                  📝 Details
                </Button>
              </div>
            </Card>
          )
        })}
        {apps.length === 0 && (
          <p className="text-center text-muted py-8">No applications yet. Add your first target above! 🎯</p>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setEditing(null)}>
          <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <Card className="p-6 w-full max-w-md">
            <h3 className="font-bold mb-4">{editing.name} — details</h3>
            <TextInput id="edit-docs" label="Documents (comma separated)" value={editDocs} onChange={(e) => setEditDocs(e.target.value)} placeholder="SOP, transcripts, IELTS…" />
            <div className="mt-3">
              <TextArea id="edit-notes" label="Notes" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Requirements, contacts…" />
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={saveDetails}>Save</Button>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
          </Card>
          </div>
        </div>
      )}

      <Card className="p-4 mt-6 bg-blue-50">
        <p className="text-sm">💡 <b>Tip:</b> Find verified scholarships in the app's <b>Opportunities</b> section, then track them here!</p>
      </Card>
    </div>
  )
}
