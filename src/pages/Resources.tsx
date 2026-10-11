import { useEffect, useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { Select, TextInput } from '../components/ui/fields'
import { EmptyState, SectionHeading, Spinner } from '../components/ui/states'
import { fetchResources, type Resource } from '../lib/resources'

const typeTone: Record<string, 'info' | 'verified' | 'pending' | 'neutral'> = {
  guide: 'info', template: 'verified', video: 'pending', link: 'neutral',
}

export function Resources() {
  const [items, setItems] = useState<Resource[]>([])
  const [live, setLive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [type, setType] = useState('All')

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
        subtitle={live ? 'Curated guides, templates, and videos.' : 'Free guides and learning paths.'}
      />

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
