import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { TextArea } from '../components/ui/fields'
import { EmptyState, Spinner } from '../components/ui/states'
import { useAuth } from '../context/AuthContext'
import { fetchMentor, requestMentorship, type Mentor } from '../lib/mentors'
import { checkRateLimit, LIMITS, rateLimitError } from '../lib/rateLimit'

export function MentorDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [mentor, setMentor] = useState<Mentor | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) fetchMentor(id).then((m) => { setMentor(m); setLoading(false) })
  }, [id])

  async function send() {
    if (!user) return navigate('/login')
    if (!mentor || !message.trim()) return setError('Please write a short message.')
    const rl = checkRateLimit(`mreq-${user.id}`, LIMITS.mentorshipRequest.max, LIMITS.mentorshipRequest.windowMs)
    if (!rl.allowed) return setError(rateLimitError(rl.retryAfterMs))
    setSending(true)
    setError(null)
    try {
      await requestMentorship(user.id, mentor.user_id, message.trim())
      setSent(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed.')
    }
    setSending(false)
  }

  if (loading) return <Spinner />
  if (!mentor) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card><EmptyState title="Mentor not found" message="This profile may have been removed." action={<Link to="/mentors"><Button>Back to mentors</Button></Link>} /></Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link to="/mentors" className="text-primary-teal text-sm font-medium mb-6 inline-block">← Back to mentors</Link>

      <Card className="p-8 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-primary-teal/10 text-primary-teal flex items-center justify-center font-bold text-2xl">
            {mentor.display_name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ink">{mentor.display_name}</h1>
            <p className="text-sm text-muted">{mentor.country} · {mentor.years_experience} years experience</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge tone="verified">✓ Verified mentor</Badge>
          {mentor.available ? <Badge tone="info">Available</Badge> : <Badge tone="neutral">Busy</Badge>}
          {mentor.expertise.map((e) => <Badge key={e} tone="neutral">{e}</Badge>)}
        </div>
        <p className="text-muted whitespace-pre-line">{mentor.bio}</p>
        <p className="text-xs text-muted mt-4">Languages: {mentor.languages.join(', ')}</p>
      </Card>

      <Card className="p-8">
        <h2 className="font-bold text-ink mb-2">Request mentorship</h2>
        {sent ? (
          <div className="text-center py-6">
            <p className="text-4xl mb-3">✅</p>
            <p className="font-medium text-ink">Request sent!</p>
            <p className="text-sm text-muted mt-1">The mentor will see your message in their inbox.</p>
            <Link to="/my-mentorship" className="inline-block mt-4"><Button variant="outline" size="sm">View my requests</Button></Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted mb-4">Introduce yourself — what are you studying, and what guidance do you need?</p>
            <TextArea id="req-msg" label="Your message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Assalam-o-Alaikum! I'm applying for…" />
            {error && <p className="text-sm text-error mt-2" role="alert">{error}</p>}
            <Button className="mt-4" loading={sending} disabled={!mentor.available} onClick={send}>
              {mentor.available ? 'Send request' : 'Currently unavailable'}
            </Button>
          </>
        )}
      </Card>
    </div>
  )
}
