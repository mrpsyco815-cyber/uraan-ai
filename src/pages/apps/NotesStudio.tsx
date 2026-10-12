import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Select, TextArea, TextInput } from '../../components/ui/fields'
import { EmptyState, SectionHeading, Spinner } from '../../components/ui/states'
import { useAuth } from '../../context/AuthContext'
import { deleteNote, fetchNotes, saveNote, type Note } from '../../lib/notes'

const CATEGORIES = ['general', 'academics', 'scholarships', 'coding', 'career', 'ideas']

export function NotesStudio() {
  const { user, loading: authLoading } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('general')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    fetchNotes(user.id).then((list) => {
      setNotes(list)
      if (list[0]) openNote(list[0])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user])

  function openNote(n: Note) {
    setActiveId(n.id)
    setTitle(n.title)
    setContent(n.content)
    setCategory(n.category)
    setDirty(false)
  }

  function newNote() {
    setActiveId(null)
    setTitle('')
    setContent('')
    setCategory('general')
    setDirty(false)
  }

  // Autosave (debounced)
  useEffect(() => {
    if (!dirty || !user) return
    const t = setTimeout(async () => {
      setSaving(true)
      try {
        const saved = await saveNote(user.id, title || 'Untitled note', content, category, activeId ?? undefined)
        setActiveId(saved.id)
        setNotes((prev) => {
          const rest = prev.filter((n) => n.id !== saved.id)
          return [saved, ...rest]
        })
        setDirty(false)
      } catch {
        // keep dirty, retry on next change
      }
      setSaving(false)
    }, 1500)
    return () => clearTimeout(t)
  }, [dirty, title, content, category, user, activeId])

  async function handleDelete(id: string) {
    if (!confirm('Delete this note?')) return
    await deleteNote(id)
    setNotes((prev) => prev.filter((n) => n.id !== id))
    if (activeId === id) newNote()
  }

  const filtered = notes.filter((n) =>
    (n.title + n.content).toLowerCase().includes(query.toLowerCase()),
  )

  if (authLoading || loading) return <Spinner />
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <Card><EmptyState title="Log in for notes" message="Your notes are private and saved to your account." action={<Link to="/login"><Button>Log in</Button></Link>} /></Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <SectionHeading kicker="📝 Notes Studio" title="Your learning workspace" subtitle="Auto-saved. Private. Searchable." />

      <div className="grid md:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div>
          <div className="flex gap-2 mb-4">
            <Button size="sm" onClick={newNote}>+ New note</Button>
            {saving && <span className="text-xs text-muted self-center">Saving…</span>}
            {!saving && !dirty && activeId && <span className="text-xs text-green-600 self-center">✓ Saved</span>}
          </div>
          <div className="mb-3">
            <TextInput id="note-search" label="Search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search notes…" />
          </div>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {filtered.map((n) => (
              <div key={n.id} onClick={() => openNote(n)} className="cursor-pointer">
              <Card className={`p-3 ${n.id === activeId ? 'border-primary' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{n.title}</p>
                    <p className="text-xs text-muted truncate">{n.content.slice(0, 60)}</p>
                    <p className="text-[10px] text-muted mt-1">{n.category} · {new Date(n.updated_at).toLocaleDateString()}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(n.id) }} className="text-xs text-error px-1" title="Delete">✕</button>
                </div>
              </Card>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-sm text-muted text-center py-8">No notes yet. Create one!</p>}
          </div>
        </div>

        {/* Editor */}
        <div className="md:col-span-2">
          <Card className="p-5">
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="col-span-2">
                <TextInput id="note-title" label="Title" value={title} onChange={(e) => { setTitle(e.target.value); setDirty(true) }} placeholder="Note title…" />
              </div>
              <Select id="note-cat" label="Category" value={category} onChange={(e) => { setCategory(e.target.value); setDirty(true) }}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <TextArea id="note-content" label="Content" value={content} onChange={(e) => { setContent(e.target.value); setDirty(true) }} placeholder="Write your notes here… (auto-saves)" />
            <p className="text-xs text-muted mt-2">{content.split(/\s+/).filter(Boolean).length} words</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
