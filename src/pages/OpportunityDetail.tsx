import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState, Spinner } from '../components/ui/states'
import { useAuth } from '../context/AuthContext'
import { isTracked, trackOpportunity } from '../lib/applications'
import { fetchPublished, type Opportunity } from '../lib/opportunities'

export function OpportunityDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [o, setO] = useState<Opportunity | null>(null)
  const [loading, setLoading] = useState(true)
  const [tracked, setTracked] = useState(false)
  const [tracking, setTracking] = useState(false)

  useEffect(() => {
    fetchPublished().then(({ data }) => {
      setO(data.find((x) => x.id === id) ?? null)
      setLoading(false)
    })
  }, [id])

  useEffect(() => {
    if (user && id) isTracked(user.id, id).then(setTracked)
  }, [user, id])

  async function handleTrack() {
    if (!user) return navigate('/login')
    if (!o || !id) return
    setTracking(true)
    try {
      await trackOpportunity(user.id, o.sample ? null : id, o.title)
      setTracked(true)
    } catch {
      // non-fatal; user can retry from applications page
    }
    setTracking(false)
  }

  if (loading) return <Spinner />

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
        <Badge tone={o.status === 'published' ? 'verified' : o.status === 'pending_review' ? 'pending' : 'expired'}>
          {o.status === 'published' ? '✓ Verified' : o.status.replace('_', ' ')}
        </Badge>
        <Badge tone="info">{o.type}</Badge>
        {o.sample && (
          <span className="text-xs text-muted bg-warning/10 px-2.5 py-0.5 rounded-full font-medium">
            Sample record — verify on the official site
          </span>
        )}
      </div>
      <h1 className="text-3xl font-bold text-ink mb-4">{o.title}</h1>
      <p className="text-muted mb-8">{o.summary}</p>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {[
          ['Country', o.country || '—'],
          ['Level', o.level || '—'],
          ['Funding', o.funding || '—'],
          ['Deadline', o.deadline ?? '—'],
        ].map(([k, v]) => (
          <Card key={k} className="p-5">
            <p className="text-xs text-muted uppercase tracking-wide mb-1">{k}</p>
            <p className="font-semibold text-ink">{v}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6 mb-6">
        <h2 className="font-bold text-ink mb-2">How to apply</h2>
        <p className="text-muted text-sm mb-3">
          Always apply through the official program website. Track your progress here step by step.
        </p>
        {o.official_url && (
          <a href={o.official_url} target="_blank" rel="noreferrer" className="text-primary-teal text-sm font-medium underline">
            Official website ↗
          </a>
        )}
      </Card>

      <div className="flex gap-3">
        {tracked ? (
          <Link to="/applications"><Button variant="outline">✓ Tracking — view applications</Button></Link>
        ) : (
          <Button loading={tracking} onClick={handleTrack}>Track application</Button>
        )}
      </div>
    </div>
  )
}
