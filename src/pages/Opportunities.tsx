import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Select, TextInput } from '../components/ui/fields'
import { EmptyState, SectionHeading } from '../components/ui/states'
import { sampleOpportunities } from '../data/opportunities'

export function Opportunities() {
  const [query, setQuery] = useState('')
  const [type, setType] = useState('All')

  const filtered = sampleOpportunities.filter(
    (o) =>
      (type === 'All' || o.type === type) &&
      (o.title.toLowerCase().includes(query.toLowerCase()) ||
        o.country.toLowerCase().includes(query.toLowerCase())),
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <SectionHeading kicker="Directory" title="Browse opportunities" subtitle="Sample records for design — real listings arrive in Phase 5." />

      <Card className="p-5 mb-8 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <TextInput
            id="search"
            label="Search"
            placeholder="Scholarship name or country…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="sm:w-56">
          <Select id="type" label="Type" value={type} onChange={(e) => setType(e.target.value)}>
            <option>All</option>
            <option>Scholarship</option>
            <option>Fellowship</option>
            <option>Internship</option>
            <option>Exchange</option>
            <option>Course</option>
          </Select>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            title="No opportunities found"
            message="Try a different search term or filter. New verified listings are added regularly."
            action={<Button variant="outline" onClick={() => { setQuery(''); setType('All') }}>Clear filters</Button>}
          />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((o) => (
            <Card key={o.id} className="p-6 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <Badge tone={o.status === 'verified' ? 'verified' : o.status === 'pending' ? 'pending' : 'expired'}>
                  {o.status === 'verified' ? '✓ Verified' : o.status === 'pending' ? 'Pending review' : 'Expired'}
                </Badge>
                <span className="text-xs text-muted">{o.type}</span>
              </div>
              <h3 className="font-bold text-ink text-lg mb-2">{o.title}</h3>
              <p className="text-muted text-sm mb-4 flex-1">{o.summary}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge tone="neutral">{o.level}</Badge>
                <Badge tone="neutral">{o.country}</Badge>
                <Badge tone="neutral">{o.funding}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">
                  Deadline: <strong className="text-ink">{o.deadline}</strong>
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
