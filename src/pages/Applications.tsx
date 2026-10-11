import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState, ErrorState, SectionHeading, Spinner } from '../components/ui/states'
import { useAuth } from '../context/AuthContext'
import { CLOSED, fetchApplications, PIPELINE, type Application } from '../lib/applications'

const toneMap: Record<string, 'verified' | 'pending' | 'expired' | 'info' | 'neutral'> = {
  interested: 'info', applied: 'pending', documents: 'pending', interview: 'pending',
  offered: 'verified', accepted: 'verified', rejected: 'expired', withdrawn: 'neutral',
}

export function Applications() {
  const { user, loading: authLoading } = useAuth()
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    if (authLoading || !user) {
      setLoading(false)
      return
    }
    fetchApplications(user.id)
      .then(setApps)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load.'))
      .finally(() => setLoading(false))
  }, [user, authLoading])

  if (authLoading || loading) return <Spinner />
  if (error) return <div className="max-w-4xl mx-auto px-4 py-12"><ErrorState message={error} onRetry={() => window.location.reload()} /></div>

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <Card><EmptyState title="Log in to track" message="Your applications live here once you're signed in." action={<Link to="/login"><Button>Log in</Button></Link>} /></Card>
      </div>
    )
  }

  const shown = filter === 'all' ? apps : apps.filter((a) => a.status === filter)
  const active = apps.filter((a) => !['rejected', 'withdrawn', 'accepted'].includes(a.status)).length

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <SectionHeading kicker="Tracker" title="My applications" subtitle={`${active} active · ${apps.length} total`} />

      <div className="flex flex-wrap gap-2 mb-8">
        <Button size="sm" variant={filter === 'all' ? 'primary' : 'outline'} onClick={() => setFilter('all')}>All</Button>
        {[...PIPELINE, ...CLOSED].map((s) => (
          <Button key={s.key} size="sm" variant={filter === s.key ? 'primary' : 'outline'} onClick={() => setFilter(s.key)}>
            {s.label}
          </Button>
        ))}
      </div>

      {shown.length === 0 ? (
        <Card>
          <EmptyState
            title="No applications yet"
            message="Browse opportunities and hit “Track application” to start your pipeline."
            action={<Link to="/opportunities"><Button>Browse opportunities</Button></Link>}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {shown.map((a) => (
            <Card key={a.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <Badge tone={toneMap[a.status] ?? 'neutral'}>{a.status}</Badge>
                <h3 className="font-bold text-ink mt-2">{a.opportunity_title}</h3>
                <p className="text-xs text-muted">Updated {new Date(a.updated_at).toLocaleDateString()}</p>
              </div>
              <Link to={`/applications/${a.id}`}><Button size="sm" variant="outline">Open</Button></Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
