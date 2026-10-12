import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { TextArea, TextInput } from '../../components/ui/fields'
import { EmptyState, SectionHeading, Spinner } from '../../components/ui/states'
import { useAuth } from '../../context/AuthContext'
import { deleteCV, EMPTY_CV, fetchCVs, saveCV, type CVData, type SavedCV } from '../../lib/cv'
import { TEMPLATES, TEMPLATE_IDS } from '../../lib/cvTemplates'

export function CVBuilder() {
  const { user, loading: authLoading } = useAuth()
  const [cvs, setCvs] = useState<SavedCV[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [data, setData] = useState<CVData>(EMPTY_CV)
  const [template, setTemplate] = useState('classic')
  const [title, setTitle] = useState('My CV')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    fetchCVs(user.id).then((list) => {
      setCvs(list)
      if (list[0]) {
        setActiveId(list[0].id)
        setData(list[0].data)
        setTemplate(list[0].template)
        setTitle(list[0].title)
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user])

  const set = (patch: Partial<CVData>) => setData({ ...data, ...patch })

  async function handleSave() {
    if (!user) return
    setSaving(true)
    try {
      const saved = await saveCV(user.id, title || 'My CV', template, data, activeId ?? undefined)
      setActiveId(saved.id)
      setCvs((prev) => {
        const rest = prev.filter((c) => c.id !== saved.id)
        return [saved, ...rest]
      })
      setSavedMsg('✓ Saved')
      setTimeout(() => setSavedMsg(''), 2000)
    } catch {
      setSavedMsg('Save failed')
    }
    setSaving(false)
  }

  function newCV() {
    setActiveId(null)
    setData(EMPTY_CV)
    setTemplate('classic')
    setTitle('My CV')
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this CV?')) return
    await deleteCV(id)
    setCvs((prev) => prev.filter((c) => c.id !== id))
    if (activeId === id) newCV()
  }

  function printCV() {
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`<html><head><title>${title}</title></head><body>${TEMPLATES[template].render(data)}</body></html>`)
    w.document.close()
    w.print()
  }

  if (authLoading || loading) return <Spinner />
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <Card><EmptyState title="Log in to build your CV" message="Your CVs are saved to your account." action={<Link to="/login"><Button>Log in</Button></Link>} /></Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <SectionHeading kicker="📄 CV Atelier" title="Build your CV" subtitle="ATS-friendly templates. Live preview. Honest guidance." />

      {/* Saved CVs */}
      <div className="flex gap-2 mb-6 flex-wrap items-center">
        <Button size="sm" variant="outline" onClick={newCV}>+ New CV</Button>
        {cvs.map((c) => (
          <div key={c.id} className="flex items-center gap-1">
            <Button size="sm" variant={c.id === activeId ? undefined : 'ghost'} onClick={() => { setActiveId(c.id); setData(c.data); setTemplate(c.template); setTitle(c.title) }}>
              {c.title}
            </Button>
            <button onClick={() => handleDelete(c.id)} className="text-xs text-error px-1" title="Delete">✕</button>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-bold mb-3">Basic info</h3>
            <div className="grid grid-cols-2 gap-3">
              <TextInput id="cv-name" label="Full name" value={data.fullName} onChange={(e) => set({ fullName: e.target.value })} />
              <TextInput id="cv-email" label="Email" value={data.email} onChange={(e) => set({ email: e.target.value })} />
              <TextInput id="cv-phone" label="Phone" value={data.phone} onChange={(e) => set({ phone: e.target.value })} />
              <TextInput id="cv-city" label="City" value={data.city} onChange={(e) => set({ city: e.target.value })} />
            </div>
            <div className="mt-3">
              <TextArea id="cv-obj" label="Objective (2-3 lines)" value={data.objective} onChange={(e) => set({ objective: e.target.value })} placeholder="CS graduate seeking..." />
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-bold mb-3">Education</h3>
            {data.education.map((ed, i) => (
              <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                <TextInput id={`ed-d-${i}`} label="Degree" value={ed.degree} onChange={(e) => { const arr = [...data.education]; arr[i] = { ...arr[i], degree: e.target.value }; set({ education: arr }) }} />
                <TextInput id={`ed-i-${i}`} label="Institution" value={ed.institution} onChange={(e) => { const arr = [...data.education]; arr[i] = { ...arr[i], institution: e.target.value }; set({ education: arr }) }} />
                <TextInput id={`ed-y-${i}`} label="Year" value={ed.year} onChange={(e) => { const arr = [...data.education]; arr[i] = { ...arr[i], year: e.target.value }; set({ education: arr }) }} />
              </div>
            ))}
            <Button size="sm" variant="ghost" onClick={() => set({ education: [...data.education, { degree: '', institution: '', year: '' }] })}>+ Add education</Button>
          </Card>

          <Card className="p-5">
            <h3 className="font-bold mb-3">Skills (comma separated)</h3>
            <TextInput id="cv-skills" label="Skills" value={data.skills.join(', ')} onChange={(e) => set({ skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} placeholder="Python, JavaScript, SQL" />
          </Card>

          <Card className="p-5">
            <h3 className="font-bold mb-3">Projects</h3>
            {data.projects.map((p, i) => (
              <div key={i} className="grid grid-cols-2 gap-2 mb-2">
                <TextInput id={`pr-n-${i}`} label="Project name" value={p.name} onChange={(e) => { const arr = [...data.projects]; arr[i] = { ...arr[i], name: e.target.value }; set({ projects: arr }) }} />
                <TextInput id={`pr-d-${i}`} label="Description" value={p.description} onChange={(e) => { const arr = [...data.projects]; arr[i] = { ...arr[i], description: e.target.value }; set({ projects: arr }) }} />
              </div>
            ))}
            <Button size="sm" variant="ghost" onClick={() => set({ projects: [...data.projects, { name: '', description: '' }] })}>+ Add project</Button>
          </Card>

          <Card className="p-5">
            <h3 className="font-bold mb-3">Template</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TEMPLATE_IDS.map((id) => (
                <button
                  key={id}
                  onClick={() => setTemplate(id)}
                  className={`p-3 rounded-lg border text-left ${template === id ? 'border-primary bg-primary/5' : 'border-line'}`}
                >
                  <p className="font-semibold text-sm">{TEMPLATES[id].name}</p>
                  <p className="text-xs text-muted">{TEMPLATES[id].desc}</p>
                </button>
              ))}
            </div>
          </Card>

          <div className="flex gap-3 items-center">
            <TextInput id="cv-title" label="CV title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <div className="pt-7 flex gap-2">
              <Button loading={saving} onClick={handleSave}>Save</Button>
              <Button variant="outline" onClick={printCV}>🖨️ Print / PDF</Button>
            </div>
          </div>
          {savedMsg && <p className="text-sm text-green-600">{savedMsg}</p>}
        </div>

        {/* Live preview */}
        <div>
          <div className="sticky top-4">
            <Card className="p-6 bg-white">
              <div ref={previewRef} dangerouslySetInnerHTML={{ __html: TEMPLATES[template].render(data) }} />
            </Card>
            <p className="text-xs text-muted mt-2 text-center">Live preview — updates as you type. Print for PDF.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
