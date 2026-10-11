import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { SectionHeading } from '../components/ui/states'
import { sampleOpportunities } from '../data/opportunities'
import { useLang } from '../i18n/LanguageContext'
import { fetchPublished } from '../lib/opportunities'
import { fetchMentors } from '../lib/mentors'

export function Home() {
  const { t } = useLang()
  const featured = sampleOpportunities.slice(0, 3)
  const [stats, setStats] = useState({ opps: 0, mentors: 0 })

  useEffect(() => {
    Promise.all([fetchPublished(), fetchMentors()]).then(([{ data: o }, { data: m }]) => {
      setStats({ opps: o.length, mentors: m.length })
    }).catch(() => {})
  }, [])
  const features = [
    { t: t('home.features.d1t'), d: t('home.features.d1d') },
    { t: t('home.features.d2t'), d: t('home.features.d2d') },
    { t: t('home.features.d3t'), d: t('home.features.d3d') },
    { t: t('home.features.d4t'), d: t('home.features.d4d') },
  ]
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-deep-teal via-primary-teal to-bright-teal text-white">
        <div className="max-w-6xl mx-auto px-4 py-20 sm:py-28 text-center">
          <Badge tone="info">
            <span className="text-white">✈ {t('home.kicker')}</span>
          </Badge>
          <h1 className="text-4xl sm:text-6xl font-bold mt-6 mb-4 leading-tight">
            {t('home.title')}
          </h1>
          <p className="text-white/85 text-lg mb-8 max-w-2xl mx-auto">
            {t('home.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/opportunities">
              <Button size="lg" className="bg-white !text-deep-teal hover:!bg-soft-blue w-full sm:w-auto">
                {t('home.cta.browse')}
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="lg" variant="outline" className="!border-white/60 !text-white hover:!bg-white/10 w-full sm:w-auto">
                {t('home.cta.signup')}
              </Button>
            </Link>
          </div>

          {/* Live stats */}
          {(stats.opps > 0 || stats.mentors > 0) && (
            <div className="flex justify-center gap-8 mt-12 text-white">
              <div className="text-center">
                <p className="text-3xl font-bold">{stats.opps}</p>
                <p className="text-white/70 text-sm">{t('nav.opportunities')}</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{stats.mentors}</p>
                <p className="text-white/70 text-sm">{t('nav.mentors')}</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">100%</p>
                <p className="text-white/70 text-sm">Free</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <SectionHeading kicker={t('home.kicker')} title={t('home.features.title')} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <Card key={f.t} className="p-6">
              <h3 className="font-bold text-ink mb-2">{f.t}</h3>
              <p className="text-muted text-sm">{f.d}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Featured opportunities */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <SectionHeading
          kicker={t('nav.opportunities')}
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
                  <Button size="sm">{t('common.view')}</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <Card className="bg-gradient-to-br from-deep-teal to-primary-teal !border-0 p-10 sm:p-14 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">{t('home.cta.signup')}</h2>
          <p className="text-white/85 mb-8 max-w-xl mx-auto">
            {t('home.subtitle')}
          </p>
          <Link to="/signup">
            <Button size="lg" className="bg-white !text-deep-teal hover:!bg-soft-blue">
              {t('home.cta.signup')}
            </Button>
          </Link>
        </Card>
      </section>
    </>
  )
}
