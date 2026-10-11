import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { SectionHeading } from '../components/ui/states'
import { sampleOpportunities } from '../data/opportunities'

export function Home() {
  const featured = sampleOpportunities.slice(0, 3)
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-deep-teal via-primary-teal to-bright-teal text-white">
        <div className="max-w-6xl mx-auto px-4 py-20 sm:py-28 text-center">
          <Badge tone="info">
            <span className="text-white">✈ Learn | Grow | Succeed</span>
          </Badge>
          <h1 className="text-4xl sm:text-6xl font-bold mt-6 mb-4 leading-tight">
            Your future shouldn't depend
            <br className="hidden sm:block" /> on who you know.
          </h1>
          <p className="text-white/85 text-lg mb-8 max-w-2xl mx-auto">
            Uraan AI helps Pakistani students discover verified scholarships, get AI-powered
            guidance, and connect with real mentors — from Lahore to Karachi to Peshawar.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/opportunities">
              <Button size="lg" className="bg-white !text-deep-teal hover:!bg-soft-blue w-full sm:w-auto">
                Browse opportunities
              </Button>
            </Link>
            <Link to="/how-it-works">
              <Button size="lg" variant="outline" className="!border-white/60 !text-white hover:!bg-white/10 w-full sm:w-auto">
                How it works
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured opportunities */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <SectionHeading
          kicker="Opportunities"
          title="Featured openings"
          subtitle="Sample records shown for design purposes — always verify on official program sites."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featured.map((o) => (
            <Card key={o.id} className="p-6 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <Badge tone={o.status === 'verified' ? 'verified' : o.status === 'pending' ? 'pending' : 'expired'}>
                  {o.status === 'verified' ? '✓ Verified' : o.status === 'pending' ? 'Pending review' : 'Expired'}
                </Badge>
                <span className="text-xs text-muted">{o.type}</span>
              </div>
              <h3 className="font-bold text-ink text-lg mb-2">{o.title}</h3>
              <p className="text-muted text-sm mb-4 flex-1">{o.summary}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge tone="neutral">{o.level}</Badge>
                <Badge tone="neutral">{o.country}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">
                  Deadline: <strong className="text-ink">{o.deadline}</strong>
                </span>
                <Link to={`/opportunities/${o.id}`}>
                  <Button size="sm">View</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-y border-soft-blue">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <SectionHeading title="How it works" subtitle="From signup to submission in four simple steps." />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { n: '1', t: 'Build your profile', d: 'Tell us your education, goals and interests.' },
              { n: '2', t: 'Get matched', d: 'AI matches you with opportunities you actually qualify for.' },
              { n: '3', t: 'Prepare with AI coach', d: 'Essays, SOPs and interview prep, step by step.' },
              { n: '4', t: 'Apply with mentors', d: 'Real humans review your application before you submit.' },
            ].map((s) => (
              <div key={s.n} className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary-teal text-white flex items-center justify-center font-bold text-lg">
                  {s.n}
                </div>
                <h3 className="font-bold text-ink mb-1">{s.t}</h3>
                <p className="text-muted text-sm">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <Card className="bg-gradient-to-br from-deep-teal to-primary-teal !border-0 p-10 sm:p-14 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Ready to take flight?</h2>
          <p className="text-white/85 mb-8 max-w-xl mx-auto">
            Join Pakistani students building their future with Uraan AI. Free forever for students.
          </p>
          <Link to="/login">
            <Button size="lg" className="bg-white !text-deep-teal hover:!bg-soft-blue">
              Create free account
            </Button>
          </Link>
        </Card>
      </section>
    </>
  )
}
