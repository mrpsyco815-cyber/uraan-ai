import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Select, TextInput } from '../../components/ui/fields'
import { EmptyState, SectionHeading, Spinner } from '../../components/ui/states'
import { useAuth } from '../../context/AuthContext'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'

interface Task {
  id: string
  title: string
  subject: string
  minutes: number
  done: boolean
}

const memTasks: Task[] = []

async function fetchTasks(userId: string): Promise<Task[]> {
  const today = new Date().toISOString().slice(0, 10)
  if (!isSupabaseConfigured) return memTasks
  const { data } = await supabase.from('user_study_tasks').select('id,title,subject,minutes,done').eq('user_id', userId).eq('task_date', today).order('created_at')
  return (data ?? []) as Task[]
}

async function addTask(userId: string, title: string, subject: string, minutes: number): Promise<Task> {
  if (!isSupabaseConfigured) {
    const t: Task = { id: `mem-${Date.now()}`, title, subject, minutes, done: false }
    memTasks.push(t)
    return t
  }
  const { data } = await supabase.from('user_study_tasks').insert({ user_id: userId, title, subject, minutes }).select('id,title,subject,minutes,done').single()
  return data as Task
}

async function toggleTask(id: string, done: boolean) {
  if (!isSupabaseConfigured) {
    const t = memTasks.find((x) => x.id === id)
    if (t) t.done = done
    return
  }
  await supabase.from('user_study_tasks').update({ done }).eq('id', id)
}

async function removeTask(id: string) {
  if (!isSupabaseConfigured) {
    const i = memTasks.findIndex((x) => x.id === id)
    if (i >= 0) memTasks.splice(i, 1)
    return
  }
  await supabase.from('user_study_tasks').delete().eq('id', id)
}

export function StudyPlanner() {
  const { user, loading: authLoading } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('general')
  const [minutes, setMinutes] = useState('25')
  const [loading, setLoading] = useState(true)

  // Pomodoro
  const [timerSec, setTimerSec] = useState(25 * 60)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerMode, setTimerMode] = useState<'focus' | 'break'>('focus')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    fetchTasks(user.id).then((t) => {
      setTasks(t)
      setLoading(false)
    })
  }, [user])

  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => {
        setTimerSec((s) => {
          if (s <= 1) {
            setTimerRunning(false)
            if (timerMode === 'focus') {
              setTimerMode('break')
              return 5 * 60
            }
            setTimerMode('focus')
            return 25 * 60
          }
          return s - 1
        })
      }, 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [timerRunning, timerMode])

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  async function handleAdd() {
    if (!title.trim() || !user) return
    const t = await addTask(user.id, title.trim(), subject, parseInt(minutes) || 25)
    setTasks((prev) => [...prev, t])
    setTitle('')
  }

  async function handleToggle(t: Task) {
    await toggleTask(t.id, !t.done)
    setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))
  }

  async function handleRemove(id: string) {
    await removeTask(id)
    setTasks((prev) => prev.filter((x) => x.id !== id))
  }

  if (authLoading || loading) return <Spinner />
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <Card><EmptyState title="Log in for Study Planner" message="Your daily tasks are saved to your account." action={<Link to="/login"><Button>Log in</Button></Link>} /></Card>
      </div>
    )
  }

  const done = tasks.filter((t) => t.done).length
  const totalMin = tasks.filter((t) => t.done).reduce((a, t) => a + t.minutes, 0)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <SectionHeading kicker="📅 Study Planner" title="Today's plan" subtitle={`${done}/${tasks.length} done · ${totalMin} min focused`} />

      <div className="grid md:grid-cols-2 gap-6">
        {/* Pomodoro */}
        <Card className="p-6 text-center">
          <h3 className="font-bold mb-2">🍅 Pomodoro Timer</h3>
          <p className="text-xs text-muted mb-4">{timerMode === 'focus' ? 'Focus time — phone away!' : 'Break — stretch, breathe!'}</p>
          <div className={`text-6xl font-bold mb-4 ${timerMode === 'focus' ? 'text-ink' : 'text-green-600'}`}>{fmt(timerSec)}</div>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => setTimerRunning(!timerRunning)}>{timerRunning ? 'Pause' : 'Start'}</Button>
            <Button variant="outline" onClick={() => { setTimerRunning(false); setTimerMode('focus'); setTimerSec(25 * 60) }}>Reset</Button>
          </div>
          <div className="flex gap-2 justify-center mt-3">
            <Button size="sm" variant={timerMode === 'focus' && timerSec === 25 * 60 ? undefined : 'ghost'} onClick={() => { setTimerRunning(false); setTimerMode('focus'); setTimerSec(25 * 60) }}>25m</Button>
            <Button size="sm" variant="ghost" onClick={() => { setTimerRunning(false); setTimerMode('focus'); setTimerSec(50 * 60) }}>50m</Button>
            <Button size="sm" variant="ghost" onClick={() => { setTimerRunning(false); setTimerMode('break'); setTimerSec(5 * 60) }}>5m break</Button>
          </div>
        </Card>

        {/* Tasks */}
        <Card className="p-6">
          <h3 className="font-bold mb-4">✅ Today's tasks</h3>
          <div className="flex gap-2 mb-4">
            <div className="flex-1">
              <TextInput id="task-title" label="Task" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Revise chapter 5…" />
            </div>
            <div className="w-24">
              <TextInput id="task-min" label="Min" value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="25" />
            </div>
          </div>
          <div className="flex gap-2 mb-4">
            <div className="flex-1">
              <Select id="task-subj" label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)}>
                <option value="general">General</option>
                <option value="academics">Academics</option>
                <option value="coding">Coding</option>
                <option value="english">English</option>
                <option value="career">Career</option>
              </Select>
            </div>
            <div className="pt-7">
              <Button onClick={handleAdd}>Add</Button>
            </div>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {tasks.map((t) => (
              <div key={t.id} className={`flex items-center gap-3 p-3 rounded-lg border ${t.done ? 'bg-green-50 border-green-200' : 'border-line'}`}>
                <input type="checkbox" checked={t.done} onChange={() => handleToggle(t)} className="w-5 h-5" />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${t.done ? 'line-through text-muted' : ''}`}>{t.title}</p>
                  <p className="text-xs text-muted">{t.subject} · {t.minutes} min</p>
                </div>
                <button onClick={() => handleRemove(t.id)} className="text-xs text-error px-1">✕</button>
              </div>
            ))}
            {tasks.length === 0 && <p className="text-sm text-muted text-center py-6">No tasks yet. Add your first one! 💪</p>}
          </div>
        </Card>
      </div>
    </div>
  )
}
