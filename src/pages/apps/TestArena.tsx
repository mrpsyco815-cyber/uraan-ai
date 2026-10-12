import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Select } from '../../components/ui/fields'
import { EmptyState, SectionHeading, Spinner } from '../../components/ui/states'
import { useAuth } from '../../context/AuthContext'
import { QUESTION_BANK, SUBJECTS, type Question } from '../../lib/quizBank'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'

interface Attempt {
  subject: string
  total: number
  correct: number
  created_at: string
}

const memAttempts: Attempt[] = []

async function saveAttempt(userId: string, subject: string, total: number, correct: number) {
  if (!isSupabaseConfigured) {
    memAttempts.push({ subject, total, correct, created_at: new Date().toISOString() })
    return
  }
  await supabase.from('user_quiz_attempts').insert({ user_id: userId, subject, total, correct })
}

async function fetchAttempts(userId: string): Promise<Attempt[]> {
  if (!isSupabaseConfigured) return [...memAttempts].reverse()
  const { data } = await supabase.from('user_quiz_attempts').select('subject,total,correct,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(20)
  return (data ?? []) as Attempt[]
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function TestArena() {
  const { user, loading: authLoading } = useAuth()
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [phase, setPhase] = useState<'setup' | 'quiz' | 'result'>('setup')
  const [questions, setQuestions] = useState<Question[]>([])
  const [qi, setQi] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [, setAnswers] = useState<boolean[]>([])
  const [history, setHistory] = useState<Attempt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    fetchAttempts(user.id).then((h) => {
      setHistory(h)
      setLoading(false)
    })
  }, [user])

  function startQuiz() {
    setQuestions(shuffle(QUESTION_BANK[subject]))
    setQi(0)
    setPicked(null)
    setScore(0)
    setAnswers([])
    setPhase('quiz')
  }

  function answer(idx: number) {
    if (picked !== null) return
    setPicked(idx)
    const correct = idx === questions[qi].answer
    if (correct) setScore((s) => s + 1)
    setAnswers((a) => [...a, correct])
  }

  function next() {
    if (qi + 1 >= questions.length) {
      setPhase('result')
      if (user) saveAttempt(user.id, subject, questions.length, score).then(() => {
        fetchAttempts(user.id).then(setHistory)
      })
    } else {
      setQi(qi + 1)
      setPicked(null)
    }
  }

  if (authLoading || loading) return <Spinner />
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <Card><EmptyState title="Log in for Test Arena" message="Your quiz history is saved to your account." action={<Link to="/login"><Button>Log in</Button></Link>} /></Card>
      </div>
    )
  }

  const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <SectionHeading kicker="🎯 Test Arena" title="Practice & test yourself" subtitle="Real questions, instant feedback, progress tracking." />

      {phase === 'setup' && (
        <>
          <Card className="p-6 mb-6">
            <Select id="quiz-subject" label="Choose subject" value={subject} onChange={(e) => setSubject(e.target.value)}>
              {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
            </Select>
            <p className="text-sm text-muted mt-2">{QUESTION_BANK[subject].length} questions · instant explanations</p>
            <Button className="mt-4" onClick={startQuiz}>Start quiz →</Button>
          </Card>

          {history.length > 0 && (
            <Card className="p-6">
              <h3 className="font-bold mb-3">📊 Your history</h3>
              <div className="space-y-2">
                {history.slice(0, 10).map((h, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{h.subject}</span>
                    <span className={h.correct / h.total >= 0.7 ? 'text-green-600 font-semibold' : 'text-ink'}>
                      {h.correct}/{h.total} ({Math.round((h.correct / h.total) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {phase === 'quiz' && questions[qi] && (
        <Card className="p-6">
          <div className="flex justify-between text-sm text-muted mb-4">
            <span>Question {qi + 1} of {questions.length}</span>
            <span>Score: {score}</span>
          </div>
          <h3 className="font-bold text-lg mb-4">{questions[qi].q}</h3>
          <div className="space-y-2">
            {questions[qi].options.map((opt, i) => {
              const isCorrect = i === questions[qi].answer
              const isPicked = i === picked
              let cls = 'border-line hover:border-primary'
              if (picked !== null) {
                if (isCorrect) cls = 'border-green-500 bg-green-50'
                else if (isPicked) cls = 'border-red-500 bg-red-50'
                else cls = 'border-line opacity-60'
              }
              return (
                <button key={i} onClick={() => answer(i)} disabled={picked !== null}
                  className={`w-full text-left p-3 rounded-lg border-2 transition ${cls}`}>
                  {opt}
                </button>
              )
            })}
          </div>
          {picked !== null && (
            <div className="mt-4">
              <p className={`font-semibold ${picked === questions[qi].answer ? 'text-green-600' : 'text-red-600'}`}>
                {picked === questions[qi].answer ? '✓ Correct!' : '✗ Not quite'}
              </p>
              <p className="text-sm text-muted mt-1">💡 {questions[qi].explanation}</p>
              <Button className="mt-4" onClick={next}>
                {qi + 1 >= questions.length ? 'See results →' : 'Next →'}
              </Button>
            </div>
          )}
        </Card>
      )}

      {phase === 'result' && (
        <Card className="p-8 text-center">
          <div className="text-6xl mb-4">{pct >= 80 ? '🏆' : pct >= 60 ? '👍' : '💪'}</div>
          <h3 className="text-2xl font-bold">{score}/{questions.length} ({pct}%)</h3>
          <p className="text-muted mt-2">
            {pct >= 80 ? 'Excellent! You\'ve mastered this.' : pct >= 60 ? 'Good job! Review the ones you missed.' : 'Keep practicing — every attempt makes you stronger!'}
          </p>
          <div className="flex gap-3 justify-center mt-6">
            <Button onClick={startQuiz}>Try again</Button>
            <Button variant="outline" onClick={() => setPhase('setup')}>Change subject</Button>
          </div>
        </Card>
      )}
    </div>
  )
}
