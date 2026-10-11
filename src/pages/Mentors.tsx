import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { TextInput } from '../components/ui/fields'
import { EmptyState, SectionHeading, Spinner } from '../components/ui/states'
import { useAuth } from '../context/AuthContext'
import { fetchMentors, matchScore, type Mentor } from '../lib/mentors'
import { supabase } from '../lib/supabase'

export function Mentors() {
  const { user } = useAuth()
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [live, setLive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [interests, setInterests] = useState<string[]>([])

  useEffect(() => {
    fetchMentors().then(({ data, live: isLive }) => {
      setMentors(data)
      setLive(isLive)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('field_of_study').eq('id', user.id).single().then(({ data }) => {
      const f = (data as { field_of_study?: string } | null)?.field_of_study
      if (f) setInterests(f.split(/[,\s]+/).filter(Boolean))
    })
  }, [user])

  const filtered = mentors
    .filter((m) => (m.display_name + m.bio + m.expertise.join(' ')).toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => matchScore(b, interests) - matchScore(a, interests))

  if (loading) return <Spinner />

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <SectionHeading
        kicker="Mentorship"
        title="Find a mentor"
        subtitle={live ? 'Verified mentors ready to guide you.' : 'Sample mentor profiles — real verified mentors appear here.'}
      />

      <Card className="p-5 mb-8">
        <TextInput id="msearch" label="Search mentors" placeholder="Name, country, or expertise…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </Card>

      {filtered.length === 0 ? (
        <Card><EmptyState title="No mentors found" message="Try a different search." /></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((m) => {
            const score = matchScore(m, interests)
            return (
              <Card key={m.id} className="p-6 flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-primary-teal/10 text-primary-teal flex items-center justify-center font-bold text-lg">
                    {m.display_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-ink">{m.display_name}</h3>
                    <p className="text-xs text-muted">{m.country} · {m.years_experience}y exp</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <Badge tone="verified">✓ Verified</Badge>
                  {score > 0 && <Badge tone="info">{score} match{score > 1 ? 'es' : ''}</Badge>}
                  {m.expertise.slice(0, 3).map((e) => <Badge key={e} tone="neutral">{e}</Badge>)}
                </div>
                <p className="text-muted text-sm mb-4 flex-1 line-clamp-3">{m.bio}</p>
                <Link to={`/mentors/${m.id}`}><Button size="sm" className="w-full">View profile</Button></Link>
              </Card>
            )
          })}
        </div>
      )}

      <div className="mt-12 text-center">
        <p className="text-muted text-sm mb-3">Are you a scholarship alum who wants to give back?</p>
        <Link to="/become-mentor"><Button variant="outline">Become a mentor</Button></Link>
      </div>
    </div>
  )
}
