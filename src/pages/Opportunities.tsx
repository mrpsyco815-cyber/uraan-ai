import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Select, TextInput } from '../components/ui/fields'
import { EmptyState, SectionHeading, Spinner } from '../components/ui/states'
import { fetchPublished, type Opportunity } from '../lib/opportunities'

const toneMap: Record<string, 'verified' | 'pending' | 'expired' | 'info' | 'neutral'> = {
  published: 'verified', pending_review: 'pending', draft: 'neutral', expired: 'expired', closed: 'expired',
}

type SortKey = 'deadline' | 'title' | 'newest'

export function Opportunities() {
  const [items, setItems] = useState<Opportunity[]>([])
  const [live, setLive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [type, setType] = useState('All')
  const [country, setCountry] = useState('All')
  const [funding, setFunding] = useState('All')
  const [closingSoon, setClosingSoon] = useState(false)
  const [sort, setSort] = useState<SortKey>('deadline')

  useEffect(() => {
    fetchPublished().then(({ data, live: isLive }) => {
      setItems(data)
      setLive(isLive)
      setLoading(false)
    })
  }, [])

  const countries = ['All', ...Array.from(new Set(items.map((o) => o.country).filter(Boolean))).sort()]
  const fundings = ['All', ...Array.from(new Set(items.map((o) => o.funding).filter(Boolean))).sort()]

  const filtered = items
    .filter((o) => {
      if (type !== 'All' && o.type !== type) return false
      if (country !== 'All' && o.country !== country) return false
      if (funding !== 'All' && o.funding !== funding) return false
      if (query && !(o.title + o.summary + o.country).toLowerCase().includes(query.toLowerCase())) return false
      if (closingSoon) {
        if (!o.deadline) return false
        const days = (new Date(o.deadline).getTime() - Date.now()) / 86400000
        if (days < 0 || days > 30) return false
      }
      return true
    })
    .sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title)
      if (sort === 'newest') return 0 // insertion order from query
      // deadline: soonest first, no-deadline last
      if (!a.deadline) return 1
      if (!b.deadline) return -1
      return a.deadline.localeCompare(b.deadline)
    })

  function clearAll() {
    setQuery('')
    setType('All')
    setCountry('All')
    setFunding('All')
    setClosingSoon(false)
    setSort('deadline')
  }

  const hasFilters = query || type !== 'All' || country !== 'All' || funding !== 'All' || closingSoon

  if (loading) return <Spinner />

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <SectionHeading
        kicker="Directory"
        title="Browse opportunities"
        subtitle={live ? 'Verified live listings.' : 'Sample records for design — real listings arrive when an admin publishes them.'}
      />

      <Card className="p-5 mb-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <TextInput id="search" label="Search" placeholder="Scholarship name or keyword…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <Select id="type" label="Type" value={type} onChange={(e) => setType(e.target.value)}>
            <option>All</option>
            <option>Scholarship</option>
            <option>Fellowship</option>
            <option>Internship</option>
            <option>Exchange</option>
            <option>Course</option>
          </Select>
          <Select id="country" label="Country" value={country} onChange={(e) => setCountry(e.target.value)}>
            {countries.map((c) => <option key={c}>{c}</option>)}
          </Select>
          <Select id="funding" label="Funding" value={funding} onChange={(e) => setFunding(e.target.value)}>
            {fundings.map((f) => <option key={f}>{f}</option>)}
          </Select>
          <Select id="sort" label="Sort by" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            <option value="deadline">Deadline (soonest)</option>
            <option value="title">Title (A–Z)</option>
            <option value="newest">Newest</option>
          </Select>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
              <input type="checkbox" checked={closingSoon} onChange={(e) => setClosingSoon(e.target.checked)} className="w-4 h-4 accent-primary" />
              Closing soon (30 days)
            </label>
          </div>
        </div>
        {hasFilters && (
          <Button size="sm" variant="ghost" onClick={clearAll}>Clear all filters</Button>
        )}
      </Card>

      <p className="text-sm text-muted mb-4">{filtered.length} result{filtered.length === 1 ? '' : 's'}</p>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            title="No opportunities found"
            message="Try widening your filters."
            action={<Button variant="outline" onClick={clearAll}>Clear filters</Button>}
          />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((o) => (
            <Card key={o.id} className="p-6 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <Badge tone={toneMap[o.status] ?? 'neutral'}>
                  {o.status === 'published' ? '✓ Verified' : o.status.replace('_', ' ')}
                </Badge>
                <span className="text-xs text-muted">{o.type}</span>
              </div>
              <h3 className="font-bold text-ink text-lg mb-2">{o.title}</h3>
              <p className="text-muted text-sm mb-4 flex-1 line-clamp-3">{o.summary}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge tone="neutral">{o.level || '—'}</Badge>
                <Badge tone="neutral">{o.country || '—'}</Badge>
                <Badge tone="neutral">{o.funding || '—'}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">
                  Deadline: <strong className="text-ink">{o.deadline ?? '—'}</strong>
                </span>
                <Link to={`/opportunities/${o.id}`}>
                  <Button size="sm">View</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
