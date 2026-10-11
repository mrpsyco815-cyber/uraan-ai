import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState, SectionHeading, Spinner } from '../components/ui/states'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../context/ProfileContext'
import { fetchApplications, type Application } from '../lib/applications'
import { computeDeadlineReminders, fetchNotifications } from '../lib/notifications'
import { fetchPublished } from '../lib/opportunities'

export function Dashboard() {
  const { user, loading: authLoading } = useAuth()
  const { profile } = useProfile()
  const [apps, setApps] = useState<Application[]>([])
  const [reminders, setReminders] = useState(0)
  const [unread, setUnread] = useState(0)
  const [oppCount, setOppCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    Promise.all([
      fetchApplications(user.id),
      computeDeadlineReminders(user.id),
      fetchNotifications(user.id),
      fetchPublished(),
    ]).then(([a, r, n, o]) => {
      setApps(a)
      setReminders(r.length)
      setUnread(n.filter((x) => !x.read).length)
      setOppCount(o.data.length)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user])

  if (authLoading || loading) return <Spinner />

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <Card><EmptyState title="Welcome!" message="Log in to see your dashboard." action={<Link to="/login"><Button>Log in</Button></Link>} /></Card>
      </div>
    )
  }

  const active = apps.filter((a) => !['rejected', 'withdrawn', 'accepted'].includes(a.status))
  const name = profile?.full_name || 'Student'

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <SectionHeading kicker="Dashboard" title={`Assalam-o-Alaikum, ${name}! 👋`} subtitle="Your scholarship journey at a glance." />

      {/* Alert banners */}
      {reminders > 0 && (
        <Card className="p-4 mb-6 !border-warning bg-warning/5">
          <p className="text-sm font-medium text-ink">⏰ {reminders} deadline reminder{reminders > 1 ? 's' : ''} need{reminders === 1 ? 's' : ''} your attention!</p>
          <Link to="/notifications" className="text-sm text-primary-teal font-medium">View →</Link>
        </Card>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link to="/applications">
          <Card className="p-6 hover:shadow-lg transition text-center">
            <p className="text-3xl font-bold text-primary-teal">{active.length}</p>
            <p className="text-sm text-muted">Active applications</p>
          </Card>
        </Link>
        <Link to="/opportunities">
          <Card className="p-6 hover:shadow-lg transition text-center">
            <p className="text-3xl font-bold text-primary-teal">{oppCount}</p>
            <p className="text-sm text-muted">Opportunities</p>
          </Card>
        </Link>
        <Link to="/my-mentorship">
          <Card className="p-6 hover:shadow-lg transition text-center">
            <p className="text-3xl font-bold text-primary-teal">💬</p>
            <p className="text-sm text-muted">Mentorship</p>
          </Card>
        </Link>
        <Link to="/notifications">
          <Card className="p-6 hover:shadow-lg transition text-center">
            <p className="text-3xl font-bold text-primary-teal">{unread}</p>
            <p className="text-sm text-muted">Unread alerts</p>
          </Card>
        </Link>
      </div>

      {/* Quick actions */}
      <h2 className="font-bold text-ink text-lg mb-4">⚡ Quick actions</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link to="/matched"><Card className="p-5 hover:shadow-lg transition"><p className="font-semibold text-ink">🎯 AI Matches</p><p className="text-xs text-muted mt-1">Scholarships picked for you</p></Card></Link>
        <Link to="/sop-coach"><Card className="p-5 hover:shadow-lg transition"><p className="font-semibold text-ink">✍️ SOP Coach</p><p className="text-xs text-muted mt-1">AI feedback on your essay</p></Card></Link>
        <Link to="/assistant"><Card className="p-5 hover:shadow-lg transition"><p className="font-semibold text-ink">🤖 AI Assistant</p><p className="text-xs text-muted mt-1">Ask anything, anytime</p></Card></Link>
        <Link to="/mentors"><Card className="p-5 hover:shadow-lg transition"><p className="font-semibold text-ink">👥 Find Mentor</p><p className="text-xs text-muted mt-1">Connect with alumni</p></Card></Link>
      </div>

      {/* Recent applications */}
      <h2 className="font-bold text-ink text-lg mb-4">📋 Recent applications</h2>
      {apps.length === 0 ? (
        <Card><EmptyState title="No applications yet" message="Track your first opportunity to see it here." action={<Link to="/opportunities"><Button>Browse opportunities</Button></Link>} /></Card>
      ) : (
        <div className="space-y-3">
          {apps.slice(0, 3).map((a) => (
            <Card key={a.id} className="p-4 flex items-center justify-between">
              <div>
                <Badge tone="info">{a.status}</Badge>
                <p className="font-medium text-ink mt-1">{a.opportunity_title}</p>
              </div>
              <Link to={`/applications/${a.id}`}><Button size="sm" variant="outline">Open</Button></Link>
            </Card>
          ))}
          {apps.length > 3 && (
            <Link to="/applications" className="block text-center text-sm text-primary-teal font-medium py-2">View all {apps.length} →</Link>
          )}
        </div>
      )}
    </div>
  )
}
