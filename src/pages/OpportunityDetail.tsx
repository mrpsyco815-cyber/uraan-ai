import { Link, useParams } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/states'
import { sampleOpportunities } from '../data/opportunities'

export function OpportunityDetail() {
  const { id } = useParams()
  const o = sampleOpportunities.find((x) => x.id === id)

  if (!o) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card>
          <EmptyState
            title="Opportunity not found"
            message="This listing may have been removed or the link is incorrect."
            action={<Link to="/opportunities"><Button>Back to directory</Button></Link>}
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link to="/opportunities" className="text-primary-teal text-sm font-medium mb-6 inline-block">
        ← Back to opportunities
      </Link>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Badge tone={o.status === 'verified' ? 'verified' : o.status === 'pending' ? 'pending' : 'expired'}>
          {o.status === 'verified' ? '✓ Verified' : o.status === 'pending' ? 'Pending review' : 'Expired'}
        </Badge>
        <Badge tone="info">{o.type}</Badge>
        <span className="text-xs text-muted bg-warning/10 px-2.5 py-0.5 rounded-full font-medium">
          Sample record — verify on the official site
        </span>
      </div>
      <h1 className="text-3xl font-bold text-ink mb-4">{o.title}</h1>
      <p className="text-muted mb-8">{o.summary}</p>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {[
          ['Country', o.country],
          ['Level', o.level],
          ['Funding', o.funding],
          ['Deadline', o.deadline],
        ].map(([k, v]) => (
          <Card key={k} className="p-5">
            <p className="text-xs text-muted uppercase tracking-wide mb-1">{k}</p>
            <p className="font-semibold text-ink">{v}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6 mb-6">
        <h2 className="font-bold text-ink mb-2">How to apply</h2>
        <p className="text-muted text-sm">
          Real application instructions, official source links, and verification history will
          appear here in Phase 5. Always apply through the official program website.
        </p>
      </Card>

      <div className="flex gap-3">
        <Button>Save opportunity</Button>
        <Button variant="outline">Compare</Button>
      </div>
    </div>
  )
}
