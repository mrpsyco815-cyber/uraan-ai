import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState, ErrorState, SectionHeading, Spinner } from '../../components/ui/states'
import { useAuth } from '../../context/AuthContext'
import { fetchAllAdmin, setStatus, type Opportunity } from '../../lib/opportunities'

const toneMap: Record<string, 'verified' | 'pending' | 'expired' | 'info' | 'neutral'> = {
  published: 'verified', pending_review: 'pending', draft: 'neutral', expired: 'expired', closed: 'expired',
}

export function ReviewQueue() {
  const { user } = useAuth()
  const [items, setItems] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [acting, setActing] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setItems(await fetchAllAdmin())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load.')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function act(id: string, status: Opportunity['status']) {
    if (!user) return
    if (!confirm(`Set status to "${status}"?`)) return
    setActing(id)
    try {
      await setStatus(id, status, user.id)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed.')
    }
    setActing(null)
  }

  if (loading) return <Spinner />
  if (error) return <div className="max-w-4xl mx-auto px-4 py-12"><ErrorState message={error} onRetry={load} /></div>

  const pending = items.filter((i) => i.status === 'pending_review' || i.status === 'draft')

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <SectionHeading kicker="Admin" title="Opportunity review" subtitle={`${pending.length} awaiting review · ${items.length} total`} />
      <div className="mb-6">
        <Link to="/admin/opportunities/new"><Button>+ Add opportunity</Button></Link>
      </div>
      {items.length === 0 ? (
        <Card><EmptyState title="No opportunities yet" message="Add the first one to start the review pipeline." /></Card>
      ) : (
        <div className="space-y-3">
          {items.map((o) => (
            <Card key={o.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge tone={toneMap[o.status] ?? 'neutral'}>{o.status.replace('_', ' ')}</Badge>
                  <span className="text-xs text-muted">{o.type} · {o.country}</span>
                </div>
                <h3 className="font-bold text-ink">{o.title}</h3>
                <p className="text-xs text-muted">Deadline: {o.deadline ?? '—'}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to={`/admin/opportunities/${o.id}/edit`}><Button size="sm" variant="outline">Edit</Button></Link>
                {o.status !== 'published' && (
                  <Button size="sm" loading={acting === o.id} onClick={() => act(o.id, 'published')}>Verify & publish</Button>
                )}
                {o.status === 'published' && (
                  <Button size="sm" variant="outline" loading={acting === o.id} onClick={() => act(o.id, 'expired')}>Expire</Button>
                )}
                {(o.status === 'draft' || o.status === 'pending_review') && (
                  <Button size="sm" variant="ghost" loading={acting === o.id} onClick={() => act(o.id, 'closed')}>Close</Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
