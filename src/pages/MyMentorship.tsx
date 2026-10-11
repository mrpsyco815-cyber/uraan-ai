import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState, ErrorState, SectionHeading, Spinner } from '../components/ui/states'
import { useAuth } from '../context/AuthContext'
import { fetchMyRequests, setRequestStatus, type MentorshipRequest } from '../lib/mentors'

const toneMap: Record<string, 'verified' | 'pending' | 'expired' | 'info' | 'neutral'> = {
  pending: 'pending', accepted: 'verified', declined: 'expired', completed: 'info',
}

export function MyMentorship() {
  const { user, loading: authLoading } = useAuth()
  const [asStudent, setAsStudent] = useState<MentorshipRequest[]>([])
  const [asMentor, setAsMentor] = useState<MentorshipRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    if (!user) return
    setLoading(true)
    try {
      const { asStudent: s, asMentor: m } = await fetchMyRequests(user.id)
      setAsStudent(s)
      setAsMentor(m)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load.')
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!authLoading) {
      if (user) load()
      else setLoading(false)
    }
  }, [user, authLoading])

  async function act(id: string, status: MentorshipRequest['status']) {
    await setRequestStatus(id, status)
    await load()
  }

  if (authLoading || loading) return <Spinner />
  if (error) return <div className="max-w-4xl mx-auto px-4 py-12"><ErrorState message={error} onRetry={load} /></div>
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <Card><EmptyState title="Log in" message="Your mentorship requests live here." action={<Link to="/login"><Button>Log in</Button></Link>} /></Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <SectionHeading kicker="Mentorship" title="My mentorship" />

      {asMentor.length > 0 && (
        <div className="mb-10">
          <h2 className="font-bold text-ink text-lg mb-4">Requests received ({asMentor.length})</h2>
          <div className="space-y-3">
            {asMentor.map((r) => (
              <Card key={r.id} className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <Badge tone={toneMap[r.status]}>{r.status}</Badge>
                  <span className="text-xs text-muted">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-ink whitespace-pre-line mb-3">{r.message}</p>
                {r.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => act(r.id, 'accepted')}>Accept</Button>
                    <Button size="sm" variant="outline" onClick={() => act(r.id, 'declined')}>Decline</Button>
                  </div>
                )}
                {r.status === 'accepted' && (
                  <Button size="sm" variant="outline" onClick={() => act(r.id, 'completed')}>Mark completed</Button>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      <h2 className="font-bold text-ink text-lg mb-4">My requests ({asStudent.length})</h2>
      {asStudent.length === 0 ? (
        <Card>
          <EmptyState
            title="No requests yet"
            message="Find a mentor and send your first request."
            action={<Link to="/mentors"><Button>Browse mentors</Button></Link>}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {asStudent.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex items-center justify-between mb-2">
                <Badge tone={toneMap[r.status]}>{r.status}</Badge>
                <span className="text-xs text-muted">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-muted whitespace-pre-line">{r.message}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
