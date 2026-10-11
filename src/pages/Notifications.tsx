import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState, ErrorState, SectionHeading, Spinner } from '../components/ui/states'
import { useAuth } from '../context/AuthContext'
import { fetchNotifications, markAllRead, markRead, type Notification } from '../lib/notifications'

const toneMap: Record<string, 'pending' | 'info' | 'verified' | 'neutral'> = {
  deadline_reminder: 'pending', mentorship: 'info', opportunity: 'verified', system: 'neutral',
}

export function Notifications() {
  const { user, loading: authLoading } = useAuth()
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    if (!user) return
    setLoading(true)
    try {
      setItems(await fetchNotifications(user.id))
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

  async function readOne(n: Notification) {
    await markRead(n.id)
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
  }

  async function readAll() {
    if (!user) return
    await markAllRead(user.id)
    setItems((prev) => prev.map((x) => ({ ...x, read: true })))
  }

  if (authLoading || loading) return <Spinner />
  if (error) return <div className="max-w-3xl mx-auto px-4 py-12"><ErrorState message={error} onRetry={load} /></div>
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <Card><EmptyState title="Log in" message="Your notifications live here." action={<Link to="/login"><Button>Log in</Button></Link>} /></Card>
      </div>
    )
  }

  const unread = items.filter((n) => !n.read).length

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <SectionHeading kicker="Inbox" title="Notifications" subtitle={unread > 0 ? `${unread} unread` : 'All caught up 🎉'} />
      {unread > 0 && (
        <div className="mb-6">
          <Button size="sm" variant="outline" onClick={readAll}>Mark all read</Button>
        </div>
      )}
      {items.length === 0 ? (
        <Card>
          <EmptyState title="No notifications" message="Deadline reminders and mentorship updates will appear here." />
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <Card key={n.id} className={`p-5 ${n.read ? 'opacity-70' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge tone={toneMap[n.type] ?? 'neutral'}>{n.type.replace('_', ' ')}</Badge>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-primary-teal" />}
                  </div>
                  <h3 className="font-bold text-ink">{n.title}</h3>
                  {n.message && <p className="text-sm text-muted mt-1">{n.message}</p>}
                  <p className="text-xs text-muted mt-2">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {n.link && <Link to={n.link}><Button size="sm" variant="outline">Open</Button></Link>}
                  {!n.read && <Button size="sm" variant="ghost" onClick={() => readOne(n)}>Mark read</Button>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
