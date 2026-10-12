import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Select, TextInput } from '../components/ui/fields'
import { EmptyState, SectionHeading, Spinner } from '../components/ui/states'
import { MINI_APPS } from '../lib/apps'
import { fetchResources, type Resource } from '../lib/resources'

const typeTone: Record<string, 'info' | 'verified' | 'pending' | 'neutral'> = {
  guide: 'info', template: 'verified', video: 'pending', link: 'neutral',
}

const CATEGORY_COLORS: Record<string, string> = {
  Career: '#e94560',
  Learning: '#0d7377',
  Productivity: '#f59e0b',
  Skills: '#8b5cf6',
  Language: '#3b82f6',
  Academics: '#10b981',
}

export function Resources() {
  const [items, setItems] = useState<Resource[]>([])
  const [live, setLive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [type, setType] = useState('All')
  const [appCat, setAppCat] = useState('All')

  useEffect(() => {
    fetchResources().then(({ data, live: isLive }) => {
      setItems(data)
      setLive(isLive)
      setLoading(false)
    })
  }, [])

  const categories = ['All', ...Array.from(new Set(items.map((r) => r.category)))]
  const filtered = items.filter(
    (r) =>
      (category === 'All' || r.category === category) &&
      (type === 'All' || r.type === type) &&
      (r.title + r.description).toLowerCase().includes(query.toLowerCase()),
  )

  if (loading) return <Spinner />

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <SectionHeading
        kicker="Library"
        title="Learning resources"
        subtitle={live ? 'Mini-apps, guides, templates, and videos.' : 'Mini-apps and free guides.'}
      />

      {/* HERO */}
      <div className="rounded-2xl p-8 mb-8 text-white" style={{ background: 'linear-gradient(135deg,#0d7377,#14a8a8 60%,#0ea5e9)' }}>
        <h2 className="text-2xl md:text-3xl font-bold mb-2">🚀 Your Student Super-Apps</h2>
        <p className="text-white/90 max-w-xl">
          13 powerful mini-apps — CV builder, quizzes, flashcards, GPA tracker, presentations, habits and more.
          100% free, 100% yours. No subscriptions, no limits.
        </p>
        <div className="flex gap-4 mt-4">
          <div className="bg-white/20 rounded-lg px-4 py-2">
            <span className="text-2xl font-bold">{MINI_APPS.filter((a) => a.status === 'live').length}</span>
            <span className="text-sm ml-1">live apps</span>
          </div>
          <div className="bg-white/20 rounded-lg px-4 py-2">
            <span className="text-2xl font-bold">100%</span>
            <span className="text-sm ml-1">free forever</span>
          </div>
        </div>
      </div>

      {/* CATEGORY FILTER */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['All', ...Array.from(new Set(MINI_APPS.map((a) => a.category)))].map((c) => (
          <Button key={c} size="sm" variant={appCat === c ? undefined : 'ghost'} onClick={() => setAppCat(c)}>
            {c}
          </Button>
        ))}
      </div>

      {/* MINI APPS */}
      <h2 className="font-bold text-ink text-lg mb-4">🚀 Mini Apps</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {MINI_APPS.filter((a) => appCat === 'All' || a.category === appCat).map((app) => (
          <div key={app.id} className="border-t-4 rounded-xl" style={{ borderTopColor: CATEGORY_COLORS[app.category] ?? '#0d7377' }}>
          <Card className="p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 h-full">
            <div className="flex items-start justify-between mb-2">
              <span className="text-4xl">{app.icon}</span>
              <Badge tone={app.status === 'live' ? 'verified' : 'pending'}>
                {app.status === 'live' ? '● Live' : 'Soon'}
              </Badge>
            </div>
            <h3 className="font-bold text-ink text-lg">{app.name}</h3>
            <p className="text-sm font-medium" style={{ color: CATEGORY_COLORS[app.category] ?? '#0d7377' }}>{app.tagline}</p>
            <p className="text-sm text-muted mt-2 mb-4 min-h-12">{app.description}</p>
            {app.status === 'live' ? (
              <Link to={app.route}><Button size="sm" className="w-full">Open {app.name} →</Button></Link>
            ) : (
              <Button size="sm" variant="ghost" disabled className="w-full">Coming soon</Button>
            )}
          </Card>
          </div>
        ))}
      </div>

      <h2 className="font-bold text-ink text-lg mb-4">📚 Guides & Templates</h2>

      <Card className="p-5 mb-8 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <TextInput id="rsearch" label="Search" placeholder="Search resources…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="sm:w-48">
          <Select id="rcat" label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </Select>
        </div>
        <div className="sm:w-48">
          <Select id="rtype" label="Type" value={type} onChange={(e) => setType(e.target.value)}>
            <option>All</option>
            <option value="guide">Guide</option>
            <option value="template">Template</option>
            <option value="video">Video</option>
            <option value="link">Link</option>
          </Select>
        </div>
      </Card>

      <p className="text-sm text-muted mb-4">{filtered.length} resource{filtered.length === 1 ? '' : 's'}</p>

      {filtered.length === 0 ? (
        <Card><EmptyState title="No resources found" message="Try a different search or category." /></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((r) => (
            <Card key={r.id} className="p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <Badge tone={typeTone[r.type] ?? 'neutral'}>{r.type}</Badge>
                <span className="text-xs text-muted">{r.category}</span>
              </div>
              <h3 className="font-bold text-ink mb-2">{r.title}</h3>
              <p className="text-muted text-sm mb-4 flex-1">{r.description}</p>
              {r.url && (
                <a href={r.url} target="_blank" rel="noreferrer" className="text-primary-teal text-sm font-medium">
                  Open resource ↗
                </a>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
