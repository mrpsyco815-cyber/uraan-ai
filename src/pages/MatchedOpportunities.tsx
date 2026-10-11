import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState, SectionHeading, Spinner } from '../components/ui/states'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../context/ProfileContext'
import { fetchPublished, type Opportunity } from '../lib/opportunities'

interface Scored extends Opportunity {
  score: number
  reasons: string[]
}

/** AI-style matching: scores opportunities against the student's profile. */
function scoreOpportunity(o: Opportunity, profile: { education_level: string; field_of_study: string; preferred_countries: string[] }): Scored {
  let score = 50
  const reasons: string[] = []

  // Level match (+20)
  if (profile.education_level && o.level.toLowerCase().includes(profile.education_level.toLowerCase())) {
    score += 20
    reasons.push(`Matches your ${profile.education_level} level`)
  }
  // Country preference (+15)
  if (profile.preferred_countries.some((c) => o.country.toLowerCase().includes(c.toLowerCase()))) {
    score += 15
    reasons.push('In your preferred countries')
  }
  // Field relevance (+15) — keyword overlap
  const fieldWords = profile.field_of_study.toLowerCase().split(/\s+/)
  if (fieldWords.some((w) => w.length > 3 && (o.title + o.summary).toLowerCase().includes(w))) {
    score += 15
    reasons.push(`Relevant to ${profile.field_of_study}`)
  }
  // Deadline urgency: sooner = slightly higher (max +10), expired = -30
  if (o.deadline) {
    const days = (new Date(o.deadline).getTime() - Date.now()) / 86400000
    if (days < 0) {
      score -= 30
      reasons.push('Deadline passed')
    } else if (days < 30) {
      score += 10
      reasons.push('Closing soon — act fast')
    } else if (days < 90) {
      score += 5
      reasons.push('Good time to prepare')
    }
  }
  // Fully funded bonus (+10)
  if (o.funding.toLowerCase().includes('fully')) {
    score += 10
    reasons.push('Fully funded')
  }

  return { ...o, score: Math.max(0, Math.min(100, score)), reasons }
}

export function MatchedOpportunities() {
  const { user, loading: authLoading } = useAuth()
  const { profile } = useProfile()
  const [scored, setScored] = useState<Scored[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPublished().then(({ data }) => {
      const s = data
        .map((o) => scoreOpportunity(o, {
          education_level: profile?.education_level ?? '',
          field_of_study: profile?.field_of_study ?? '',
          preferred_countries: profile?.preferred_countries ?? [],
        }))
        .sort((a, b) => b.score - a.score)
      setScored(s)
      setLoading(false)
    })
  }, [profile])

  if (authLoading || loading) return <Spinner />

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <Card><EmptyState title="Log in for matches" message="AI matching needs your profile." action={<Link to="/login"><Button>Log in</Button></Link>} /></Card>
      </div>
    )
  }

  const top = scored.slice(0, 5)

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <SectionHeading
        kicker="🤖 AI Matching"
        title="Your top matches"
        subtitle="Scored against your education, field, and country preferences."
      />
      {top.length === 0 ? (
        <Card><EmptyState title="No matches yet" message="Complete your profile for better matches." action={<Link to="/onboarding"><Button>Complete profile</Button></Link>} /></Card>
      ) : (
        <div className="space-y-4">
          {top.map((o, i) => (
            <Card key={o.id} className="p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${o.score >= 80 ? 'bg-green-100 text-green-700' : o.score >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                    {o.score}
                  </div>
                  <div>
                    <p className="text-xs text-muted">#{i + 1} match</p>
                    <h3 className="font-bold text-ink">{o.title}</h3>
                  </div>
                </div>
                <Link to={`/opportunities/${o.id}`}><Button size="sm">View</Button></Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {o.reasons.map((r) => <Badge key={r} tone="info">{r}</Badge>)}
              </div>
            </Card>
          ))}
        </div>
      )}
      <div className="mt-8 text-center">
        <Link to="/opportunities"><Button variant="outline">Browse all opportunities</Button></Link>
      </div>
    </div>
  )
}
