import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { TextInput } from '../../components/ui/fields'
import { EmptyState, SectionHeading, Spinner } from '../../components/ui/states'
import { useAuth } from '../../context/AuthContext'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'

interface Habit {
  id: string
  name: string
  icon: string
  color: string
  doneToday: boolean
  streak: number
  weekDots: boolean[] // last 7 days
}

const ICONS = ['⭐', '📚', '💪', '🧘', '💧', '🏃', '🎯', '💻', '🗣️', '😴', '🥗', '✍️']
const COLORS = ['#0d7377', '#e94560', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899']

const memHabits: (Habit & { user_id: string })[] = []
const memLogs: { habit_id: string; log_date: string }[] = []

function todayStr(offset = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

function calcStreak(logDates: Set<string>): number {
  let streak = 0
  let d = 0
  // If today not done, start from yesterday
  if (!logDates.has(todayStr())) d = -1
  while (logDates.has(todayStr(d))) {
    streak++
    d--
  }
  return streak
}

export function HabitTracker() {
  const { user, loading: authLoading } = useAuth()
  const [habits, setHabits] = useState<Habit[]>([])
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('⭐')
  const [color, setColor] = useState(COLORS[0])
  const [loading, setLoading] = useState(true)

  async function loadHabits(uid: string) {
    let rawHabits: { id: string; name: string; icon: string; color: string }[]
    let logs: { habit_id: string; log_date: string }[]

    if (!isSupabaseConfigured) {
      rawHabits = memHabits.filter((h) => h.user_id === uid)
      logs = memLogs
    } else {
      const { data: h } = await supabase.from('user_habits').select('id,name,icon,color').eq('user_id', uid).order('created_at')
      rawHabits = (h ?? []) as typeof rawHabits
      const { data: l } = await supabase.from('user_habit_logs').select('habit_id,log_date').in('habit_id', rawHabits.map((x) => x.id))
      logs = (l ?? []) as typeof logs
    }

    const byHabit = new Map<string, Set<string>>()
    for (const l of logs) {
      if (!byHabit.has(l.habit_id)) byHabit.set(l.habit_id, new Set())
      byHabit.get(l.habit_id)!.add(l.log_date)
    }

    const enriched: Habit[] = rawHabits.map((h) => {
      const dates = byHabit.get(h.id) ?? new Set()
      const weekDots = Array.from({ length: 7 }, (_, i) => dates.has(todayStr(i - 6)))
      return {
        ...h,
        doneToday: dates.has(todayStr()),
        streak: calcStreak(dates),
        weekDots,
      }
    })
    setHabits(enriched)
  }

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    loadHabits(user.id).then(() => setLoading(false))
  }, [user])

  async function handleAdd() {
    if (!name.trim() || !user) return
    if (!isSupabaseConfigured) {
      memHabits.push({ id: `mem-${Date.now()}`, user_id: user.id, name: name.trim(), icon, color, doneToday: false, streak: 0, weekDots: [] })
    } else {
      await supabase.from('user_habits').insert({ user_id: user.id, name: name.trim(), icon, color })
    }
    setName('')
    loadHabits(user.id)
  }

  async function toggleToday(habit: Habit) {
    if (!user) return
    if (!isSupabaseConfigured) {
      const i = memLogs.findIndex((l) => l.habit_id === habit.id && l.log_date === todayStr())
      if (i >= 0) memLogs.splice(i, 1)
      else memLogs.push({ habit_id: habit.id, log_date: todayStr() })
    } else if (habit.doneToday) {
      await supabase.from('user_habit_logs').delete().eq('habit_id', habit.id).eq('log_date', todayStr())
    } else {
      await supabase.from('user_habit_logs').insert({ habit_id: habit.id, log_date: todayStr() })
    }
    loadHabits(user.id)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this habit and its history?')) return
    if (!isSupabaseConfigured) {
      const i = memHabits.findIndex((h) => h.id === id)
      if (i >= 0) memHabits.splice(i, 1)
    } else {
      await supabase.from('user_habits').delete().eq('id', id)
    }
    if (user) loadHabits(user.id)
  }

  if (authLoading || loading) return <Spinner />
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <Card><EmptyState title="Log in for Habit Tracker" message="Build streaks that stick." action={<Link to="/login"><Button>Log in</Button></Link>} /></Card>
      </div>
    )
  }

  const totalStreaks = habits.reduce((a, h) => a + h.streak, 0)
  const doneToday = habits.filter((h) => h.doneToday).length

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <SectionHeading kicker="🔥 Habit Tracker" title="Build streaks" subtitle={`${doneToday}/${habits.length} done today · ${totalStreaks} total streak days`} />

      {/* Add habit */}
      <Card className="p-5 mb-6">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <TextInput id="habit-name" label="New habit" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Read 20 pages" />
          </div>
          <Button onClick={handleAdd}>Add</Button>
        </div>
        <div className="flex gap-1 mt-3 flex-wrap">
          {ICONS.map((ic) => (
            <button key={ic} onClick={() => setIcon(ic)} className={`text-xl p-1 rounded ${icon === ic ? 'bg-primary/10 ring-2 ring-primary' : ''}`}>{ic}</button>
          ))}
        </div>
        <div className="flex gap-1 mt-2">
          {COLORS.map((c) => (
            <button key={c} onClick={() => setColor(c)} className={`w-7 h-7 rounded-full ${color === c ? 'ring-2 ring-offset-2 ring-ink' : ''}`} style={{ background: c }} />
          ))}
        </div>
      </Card>

      {/* Habits */}
      <div className="space-y-3">
        {habits.map((h) => (
          <Card key={h.id} className="p-5">
            <div className="flex items-center gap-4">
              <button
                onClick={() => toggleToday(h)}
                className="w-14 h-14 rounded-2xl text-2xl flex items-center justify-center transition-transform hover:scale-105"
                style={{ background: h.doneToday ? h.color : '#f3f4f6', color: h.doneToday ? '#fff' : '#9ca3af' }}
              >
                {h.doneToday ? '✓' : h.icon}
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{h.icon}</span>
                  <p className="font-bold">{h.name}</p>
                  {h.streak > 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: h.color }}>
                      🔥 {h.streak}
                    </span>
                  )}
                </div>
                {/* Week dots */}
                <div className="flex gap-1.5 mt-2">
                  {h.weekDots.map((done, i) => (
                    <div key={i} className="w-6 h-6 rounded-full flex items-center justify-center text-[10px]"
                      style={{ background: done ? h.color : '#e5e7eb', color: done ? '#fff' : '#9ca3af' }}>
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => handleDelete(h.id)} className="text-xs text-error px-1">✕</button>
            </div>
          </Card>
        ))}
        {habits.length === 0 && (
          <p className="text-center text-muted py-8">No habits yet. Start your first streak! 🔥</p>
        )}
      </div>

      {habits.length > 0 && (
        <Card className="p-4 mt-6 bg-orange-50">
          <p className="text-sm">💡 <b>Tip:</b> Start with 1-2 habits. Small streaks beat big plans that break!</p>
        </Card>
      )}
    </div>
  )
}
