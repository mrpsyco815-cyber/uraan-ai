import { useEffect, useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Select, TextArea, TextInput } from '../../components/ui/fields'
import { EmptyState, ErrorState, SectionHeading, Spinner } from '../../components/ui/states'
import { useAuth } from '../../context/AuthContext'
import { deleteResource, fetchAllResourcesAdmin, saveResource, type Resource, type ResourceType } from '../../lib/resources'

const TYPES: ResourceType[] = ['guide', 'template', 'video', 'link']

export function ResourceManager() {
  const { user } = useAuth()
  const [items, setItems] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Partial<Resource> | null>(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setItems(await fetchAllResourcesAdmin())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load.')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function save() {
    if (!editing?.title?.trim() || !user) return
    setSaving(true)
    try {
      await saveResource({ ...editing, title: editing.title.trim() }, user.id)
      setEditing(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.')
    }
    setSaving(false)
  }

  async function remove(id: string) {
    if (!confirm('Delete this resource?')) return
    await deleteResource(id)
    await load()
  }

  if (loading) return <Spinner />
  if (error) return <div className="max-w-4xl mx-auto px-4 py-12"><ErrorState message={error} onRetry={load} /></div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <SectionHeading kicker="Admin" title="Resources library" subtitle={`${items.length} resources`} />
      <div className="mb-6">
        <Button onClick={() => setEditing({ title: '', description: '', type: 'guide', category: 'General', url: '', published: false })}>
          + Add resource
        </Button>
      </div>

      {editing && (
        <Card className="p-6 mb-6">
          <h3 className="font-bold text-ink mb-4">{editing.id ? 'Edit resource' : 'New resource'}</h3>
          <div className="space-y-4">
            <TextInput id="rtitle" label="Title" value={editing.title ?? ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            <TextArea id="rdesc" label="Description" value={editing.description ?? ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            <div className="grid sm:grid-cols-3 gap-4">
              <Select id="rtype" label="Type" value={editing.type ?? 'guide'} onChange={(e) => setEditing({ ...editing, type: e.target.value as ResourceType })}>
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </Select>
              <TextInput id="rcat2" label="Category" value={editing.category ?? ''} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
              <TextInput id="rurl" label="URL (optional)" value={editing.url ?? ''} onChange={(e) => setEditing({ ...editing, url: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={editing.published ?? false} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} className="w-4 h-4 accent-primary" />
              Published (visible to everyone)
            </label>
            <div className="flex gap-2">
              <Button size="sm" loading={saving} onClick={save}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      {items.length === 0 ? (
        <Card><EmptyState title="No resources yet" message="Add the first one." /></Card>
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <Card key={r.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge tone={r.published ? 'verified' : 'neutral'}>{r.published ? 'Published' : 'Draft'}</Badge>
                  <span className="text-xs text-muted">{r.type} · {r.category}</span>
                </div>
                <h3 className="font-bold text-ink">{r.title}</h3>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(r)}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
