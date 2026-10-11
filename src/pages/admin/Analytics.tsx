import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ErrorState, SectionHeading, Spinner } from '../../components/ui/states'
import { fetchAnalytics, type AnalyticsData } from '../../lib/analytics'

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <Card className="p-6">
      <p className="text-xs text-muted uppercase tracking-wide mb-1">{label}</p>
      <p className="text-3xl font-bold text-ink">{value}</p>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
    </Card>
  )
}

function BarChart({ data, color = 'bg-primary-teal' }: { data: Record<string, number>; color?: string }) {
  const entries = Object.entries(data)
  const max = Math.max(...entries.map(([, v]) => v), 1)
  if (entries.length === 0) return <p className="text-sm text-muted">No data yet.</p>
  return (
    <div className="space-y-2">
      {entries.map(([k, v]) => (
        <div key={k} className="flex items-center gap-3">
          <span className="text-xs text-muted w-28 truncate capitalize">{k.replace('_', ' ')}</span>
          <div className="flex-1 h-6 bg-surface-2 rounded-full overflow-hidden">
            <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${Math.max(4, (v / max) * 100)}%` }} />
          </div>
          <span className="text-xs font-semibold text-ink w-8 text-right">{v}</span>
        </div>
      ))}
    </div>
  )
}

export function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [live, setLive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const { data: d, live: isLive } = await fetchAnalytics()
      setData(d)
      setLive(isLive)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load analytics.')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  if (loading) return <Spinner />
  if (error || !data) {
    return <div className="max-w-6xl mx-auto px-4 py-12"><ErrorState message={error ?? 'Failed.'} onRetry={load} /></div>
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <SectionHeading
        kicker="Admin"
        title="Analytics dashboard"
        subtitle={live ? 'Live platform metrics.' : 'Sample metrics — live data appears when connected.'}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Users" value={data.users.total} sub={Object.entries(data.users.byRole).map(([k, v]) => `${k}: ${v}`).join(' · ')} />
        <StatCard label="Opportunities" value={data.opportunities.total} sub={`${data.opportunities.byStatus.published ?? 0} published`} />
        <StatCard label="Applications" value={data.applications.total} sub="tracked by students" />
        <StatCard label="Mentors" value={data.mentors.total} sub={`${data.mentors.verified} verified · ${data.mentors.pending} pending`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <h3 className="font-bold text-ink mb-4">Opportunities by status</h3>
          <BarChart data={data.opportunities.byStatus} />
        </Card>
        <Card className="p-6">
          <h3 className="font-bold text-ink mb-4">Applications by stage</h3>
          <BarChart data={data.applications.byStatus} color="bg-accent" />
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-bold text-ink mb-4">Users by role</h3>
          <BarChart data={data.users.byRole} color="bg-deep-teal" />
        </Card>
        <Card className="p-6">
          <h3 className="font-bold text-ink mb-4">Recent admin activity</h3>
          {data.recentActivity.length === 0 ? (
            <p className="text-sm text-muted">No activity yet.</p>
          ) : (
            <div className="space-y-2">
              {data.recentActivity.map((a, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-ink font-medium">{a.action}</span>
                  <span className="text-xs text-muted">{new Date(a.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/admin/opportunities"><Button variant="outline" size="sm">Review opportunities</Button></Link>
        <Link to="/admin/resources"><Button variant="outline" size="sm">Manage resources</Button></Link>
      </div>
    </div>
  )
}
