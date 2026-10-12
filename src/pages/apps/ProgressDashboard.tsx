import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState, SectionHeading, Spinner } from '../../components/ui/states'
import { MINI_APPS } from '../../lib/apps'
import { useAuth } from '../../context/AuthContext'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'

interface Stats {
  cvs: number
  notes: number
  quizzes: number
  avgScore: number
  tasksDone: number
  snippets: number
  scholarships: number
  decks: number
  vocabLearned: number
}

const EMPTY: Stats = { cvs: 0, notes: 0, quizzes: 0, avgScore: 0, tasksDone: 0, snippets: 0, scholarships: 0, decks: 0, vocabLearned: 0 }

export function ProgressDashboard() {
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<Stats>(EMPTY)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    (async () => {
      const uid = user.id
      const [
        cvs, notes, quizzes, tasks, snippets, schapps, decks, vocab,
      ] = await Promise.all([
        supabase.from('user_cvs').select('id', { count: 'exact', head: true }).eq('user_id', uid),
        supabase.from('user_notes').select('id', { count: 'exact', head: true }).eq('user_id', uid),
        supabase.from('user_quiz_attempts').select('total,correct').eq('user_id', uid),
        supabase.from('user_study_tasks').select('id', { count: 'exact', head: true }).eq('user_id', uid).eq('done', true),
        supabase.from('user_code_snippets').select('id', { count: 'exact', head: true }).eq('user_id', uid),
        supabase.from('user_scholarship_apps').select('id', { count: 'exact', head: true }).eq('user_id', uid),
        supabase.from('user_flashcard_decks').select('id', { count: 'exact', head: true }).eq('user_id', uid),
        supabase.from('user_vocab').select('id', { count: 'exact', head: true }).eq('user_id', uid).eq('learned', true),
      ])
      const qData = (quizzes.data ?? []) as { total: number; correct: number }[]
      const avg = qData.length > 0 ? Math.round((qData.reduce((a, q) => a + q.correct / q.total, 0) / qData.length) * 100) : 0
      setStats({
        cvs: cvs.count ?? 0,
        notes: notes.count ?? 0,
        quizzes: qData.length,
        avgScore: avg,
        tasksDone: tasks.count ?? 0,
        snippets: snippets.count ?? 0,
        scholarships: schapps.count ?? 0,
        decks: decks.count ?? 0,
        vocabLearned: vocab.count ?? 0,
      })
      setLoading(false)
    })()
  }, [user])

  if (authLoading || loading) return <Spinner />
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <Card><EmptyState title="Log in for Progress" message="See all your activity in one place." action={<Link to="/login"><Button>Log in</Button></Link>} /></Card>
      </div>
    )
  }

  const cards = [
    { icon: '📄', label: 'CVs built', value: stats.cvs, route: '/apps/cv-builder' },
    { icon: '📝', label: 'Notes written', value: stats.notes, route: '/apps/notes' },
    { icon: '🎯', label: 'Quizzes taken', value: stats.quizzes, route: '/apps/test-arena' },
    { icon: '📊', label: 'Avg quiz score', value: `${stats.avgScore}%`, route: '/apps/test-arena' },
    { icon: '✅', label: 'Tasks completed', value: stats.tasksDone, route: '/apps/study-planner' },
    { icon: '💻', label: 'Code snippets', value: stats.snippets, route: '/apps/code-playground' },
    { icon: '🎓', label: 'Scholarships tracked', value: stats.scholarships, route: '/apps/scholarship-tracker' },
    { icon: '🃏', label: 'Flashcard decks', value: stats.decks, route: '/apps/flashcards' },
    { icon: '🗣️', label: 'Words learned', value: stats.vocabLearned, route: '/apps/english-coach' },
  ]

  const total = stats.cvs + stats.notes + stats.quizzes + stats.tasksDone + stats.snippets + stats.scholarships + stats.decks + stats.vocabLearned

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <SectionHeading kicker="📊 Progress Dashboard" title="Your journey" subtitle={`${total} total activities across all apps`} />

      {total === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-5xl mb-3">🌱</div>
          <p className="font-bold">Your journey starts here!</p>
          <p className="text-sm text-muted mt-2">Use any mini-app below and watch your progress grow.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {cards.map((c) => (
            <Link key={c.label} to={c.route}>
              <Card className="p-5 text-center hover:shadow-lg transition">
                <div className="text-3xl mb-1">{c.icon}</div>
                <div className="text-2xl font-bold">{c.value}</div>
                <div className="text-xs text-muted">{c.label}</div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <h3 className="font-bold mb-4">🚀 All mini-apps</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MINI_APPS.map((app) => (
          <Link key={app.id} to={app.route}>
            <Card className="p-4 hover:shadow-lg transition h-full">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{app.icon}</span>
                <div>
                  <p className="font-bold text-sm">{app.name}</p>
                  <p className="text-xs text-muted">{app.tagline}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
