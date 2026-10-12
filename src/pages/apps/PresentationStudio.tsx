import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { TextArea, TextInput } from '../../components/ui/fields'
import { EmptyState, SectionHeading, Spinner } from '../../components/ui/states'
import { useAuth } from '../../context/AuthContext'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'

interface Slide {
  title: string
  bullets: string[]
}

interface Presentation {
  id: string
  title: string
  theme: string
  slides: Slide[]
}

const THEMES: Record<string, { bg: string; accent: string; text: string; name: string }> = {
  ocean: { name: 'Ocean', bg: 'linear-gradient(135deg,#0d7377,#14a8a8)', accent: '#ffffff', text: '#ffffff' },
  sunset: { name: 'Sunset', bg: 'linear-gradient(135deg,#e94560,#ff7b54)', accent: '#ffffff', text: '#ffffff' },
  midnight: { name: 'Midnight', bg: 'linear-gradient(135deg,#1a1a2e,#16213e)', accent: '#e94560', text: '#ffffff' },
  forest: { name: 'Forest', bg: 'linear-gradient(135deg,#1b4332,#2d6a4f)', accent: '#d8f3dc', text: '#ffffff' },
  clean: { name: 'Clean', bg: '#ffffff', accent: '#0d7377', text: '#1a1a1a' },
  royal: { name: 'Royal', bg: 'linear-gradient(135deg,#4a1942,#893168)', accent: '#ffd6ff', text: '#ffffff' },
}

const memPres: (Presentation & { user_id: string })[] = []

export function PresentationStudio() {
  const { user, loading: authLoading } = useAuth()
  const [presentations, setPresentations] = useState<Presentation[]>([])
  const [active, setActive] = useState<Presentation | null>(null)
  const [slideIdx, setSlideIdx] = useState(0)
  const [presentMode, setPresentMode] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    if (!isSupabaseConfigured) {
      setPresentations(memPres.filter((p) => p.user_id === user.id))
      setLoading(false)
      return
    }
    supabase.from('user_presentations').select('id,title,theme,slides').eq('user_id', user.id).order('updated_at', { ascending: false }).then(({ data }) => {
      setPresentations((data ?? []) as Presentation[])
      setLoading(false)
    })
  }, [user])

  async function persist(p: Presentation) {
    if (!isSupabaseConfigured) {
      const i = memPres.findIndex((x) => x.id === p.id)
      if (i >= 0) memPres[i] = { ...p, user_id: user!.id }
      return
    }
    await supabase.from('user_presentations').update({ title: p.title, theme: p.theme, slides: p.slides, updated_at: new Date().toISOString() }).eq('id', p.id)
  }

  function updateActive(patch: Partial<Presentation>) {
    if (!active) return
    const updated = { ...active, ...patch }
    setActive(updated)
    setPresentations((prev) => prev.map((p) => (p.id === active.id ? updated : p)))
    persist(updated)
  }

  async function createNew() {
    if (!user) return
    const p: Presentation = {
      id: `mem-${Date.now()}`,
      title: 'Untitled presentation',
      theme: 'ocean',
      slides: [
        { title: 'Title Slide', bullets: ['Your subtitle here'] },
        { title: 'Key Points', bullets: ['Point one', 'Point two', 'Point three'] },
        { title: 'Thank You', bullets: ['Questions?'] },
      ],
    }
    if (!isSupabaseConfigured) {
      memPres.push({ ...p, user_id: user.id })
      setPresentations((prev) => [p, ...prev])
    } else {
      const { data } = await supabase.from('user_presentations').insert({ user_id: user.id, title: p.title, theme: p.theme, slides: p.slides }).select('id,title,theme,slides').single()
      if (data) {
        setPresentations((prev) => [data as Presentation, ...prev])
        setActive(data as Presentation)
        setSlideIdx(0)
        return
      }
    }
    setActive(p)
    setSlideIdx(0)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this presentation?')) return
    if (!isSupabaseConfigured) {
      const i = memPres.findIndex((p) => p.id === id)
      if (i >= 0) memPres.splice(i, 1)
    } else {
      await supabase.from('user_presentations').delete().eq('id', id)
    }
    setPresentations((prev) => prev.filter((p) => p.id !== id))
    if (active?.id === id) setActive(null)
  }

  function updateSlide(i: number, patch: Partial<Slide>) {
    if (!active) return
    const slides = [...active.slides]
    slides[i] = { ...slides[i], ...patch }
    updateActive({ slides })
  }

  if (authLoading || loading) return <Spinner />
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <Card><EmptyState title="Log in for Presentations" message="Your slides are saved to your account." action={<Link to="/login"><Button>Log in</Button></Link>} /></Card>
      </div>
    )
  }

  const theme = active ? THEMES[active.theme] : THEMES.ocean
  const slide = active?.slides[slideIdx]

  // Present mode — fullscreen slides
  if (presentMode && active && slide) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ background: theme.bg }}>
        <div className="flex-1 flex flex-col justify-center px-8 md:px-24" style={{ color: theme.text }}>
          <h1 className="text-4xl md:text-6xl font-bold mb-8">{slide.title}</h1>
          <ul className="space-y-4">
            {slide.bullets.map((b, i) => (
              <li key={i} className="text-xl md:text-3xl flex items-start gap-3">
                <span style={{ color: theme.accent }}>▸</span> {b}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-between items-center p-6">
          <Button variant="outline" onClick={() => setSlideIdx(Math.max(0, slideIdx - 1))} disabled={slideIdx === 0}>← Prev</Button>
          <span style={{ color: theme.text }} className="text-sm">{slideIdx + 1} / {active.slides.length}</span>
          <div className="flex gap-2">
            {slideIdx < active.slides.length - 1 ? (
              <Button onClick={() => setSlideIdx(slideIdx + 1)}>Next →</Button>
            ) : (
              <Button variant="outline" onClick={() => { setPresentMode(false); setSlideIdx(0) }}>✕ Exit</Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <SectionHeading kicker="🎨 Presentation Studio" title="Create stunning slides" subtitle="6 themes · fullscreen present mode" />

      {!active ? (
        <>
          <Button onClick={createNew} className="mb-6">+ New presentation</Button>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {presentations.map((p) => (
              <Card key={p.id} className="overflow-hidden">
                <div className="h-32 flex items-center justify-center p-4" style={{ background: THEMES[p.theme]?.bg ?? THEMES.ocean.bg }}>
                  <p className="font-bold text-center" style={{ color: THEMES[p.theme]?.text ?? '#fff' }}>{p.title}</p>
                </div>
                <div className="p-4 flex justify-between items-center">
                  <span className="text-sm text-muted">{p.slides.length} slides</span>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => { setActive(p); setSlideIdx(0) }}>Edit</Button>
                    <button onClick={() => handleDelete(p.id)} className="text-xs text-error px-1">✕</button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          {presentations.length === 0 && (
            <p className="text-center text-muted py-12">No presentations yet. Create your first one! 🎨</p>
          )}
        </>
      ) : (
        <>
          <div className="flex gap-2 mb-6 flex-wrap items-center">
            <Button size="sm" variant="outline" onClick={() => setActive(null)}>← All</Button>
            <Button size="sm" onClick={() => { setSlideIdx(0); setPresentMode(true) }}>▶ Present</Button>
            <div className="flex gap-1 ml-2">
              {Object.entries(THEMES).map(([id, t]) => (
                <button key={id} title={t.name} onClick={() => updateActive({ theme: id })}
                  className={`w-8 h-8 rounded-full border-2 ${active.theme === id ? 'border-primary' : 'border-transparent'}`}
                  style={{ background: t.bg }} />
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Slide list */}
            <div className="space-y-2">
              <TextInput id="pres-title" label="Title" value={active.title} onChange={(e) => updateActive({ title: e.target.value })} />
              {active.slides.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button onClick={() => setSlideIdx(i)}
                    className={`flex-1 text-left p-3 rounded-lg border text-sm ${i === slideIdx ? 'border-primary bg-primary/5' : 'border-line'}`}>
                    <span className="font-semibold">{i + 1}. {s.title}</span>
                  </button>
                  <button onClick={() => {
                    if (active.slides.length <= 1) return
                    updateActive({ slides: active.slides.filter((_, j) => j !== i) })
                    setSlideIdx(Math.max(0, Math.min(slideIdx, active.slides.length - 2)))
                  }} className="text-xs text-error">✕</button>
                </div>
              ))}
              <Button size="sm" variant="ghost" onClick={() => {
                updateActive({ slides: [...active.slides, { title: 'New Slide', bullets: ['Point one'] }] })
                setSlideIdx(active.slides.length)
              }}>+ Add slide</Button>
            </div>

            {/* Editor + Preview */}
            <div className="lg:col-span-2 space-y-4">
              {slide && (
                <>
                  <Card className="p-6">
                    <TextInput id={`slide-title-${slideIdx}`} label="Slide title" value={slide.title} onChange={(e) => updateSlide(slideIdx, { title: e.target.value })} />
                    <div className="mt-3">
                      <TextArea id={`slide-bullets-${slideIdx}`} label="Bullet points (one per line)" value={slide.bullets.join('\n')} onChange={(e) => updateSlide(slideIdx, { bullets: e.target.value.split('\n') })} />
                    </div>
                  </Card>
                  {/* Live preview */}
                  <div className="rounded-xl p-8 min-h-64" style={{ background: theme.bg }}>
                    <h2 className="text-2xl font-bold mb-4" style={{ color: theme.text }}>{slide.title}</h2>
                    <ul className="space-y-2">
                      {slide.bullets.map((b, i) => (
                        <li key={i} className="flex items-start gap-2" style={{ color: theme.text }}>
                          <span style={{ color: theme.accent }}>▸</span> {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
