import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { TextInput } from '../../components/ui/fields'
import { EmptyState, SectionHeading, Spinner } from '../../components/ui/states'
import { useAuth } from '../../context/AuthContext'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'

interface Course {
  name: string
  credits: number
  grade: string // letter grade
}

interface Semester {
  id: string
  name: string
  courses: Course[]
}

const GRADE_POINTS: Record<string, number> = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'F': 0.0,
}

const GRADES = Object.keys(GRADE_POINTS)

const memSemesters: (Semester & { user_id: string })[] = []

function calcGPA(courses: Course[]): number {
  let points = 0
  let credits = 0
  for (const c of courses) {
    const gp = GRADE_POINTS[c.grade] ?? 0
    points += gp * c.credits
    credits += c.credits
  }
  return credits > 0 ? points / credits : 0
}

export function GPACalculator() {
  const { user, loading: authLoading } = useAuth()
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    if (!isSupabaseConfigured) {
      const list = memSemesters.filter((s) => s.user_id === user.id)
      setSemesters(list)
      if (list[0]) setActiveId(list[0].id)
      setLoading(false)
      return
    }
    supabase.from('user_semesters').select('id,name,courses').eq('user_id', user.id).order('created_at').then(({ data }) => {
      const list = (data ?? []) as Semester[]
      setSemesters(list)
      if (list[0]) setActiveId(list[0].id)
      setLoading(false)
    })
  }, [user])

  const active = semesters.find((s) => s.id === activeId)

  async function persist(sem: Semester) {
    if (!isSupabaseConfigured) {
      const i = memSemesters.findIndex((s) => s.id === sem.id)
      if (i >= 0) memSemesters[i] = { ...sem, user_id: user!.id }
      return
    }
    await supabase.from('user_semesters').update({ name: sem.name, courses: sem.courses, updated_at: new Date().toISOString() }).eq('id', sem.id)
  }

  function updateActive(patch: Partial<Semester>) {
    if (!active) return
    const updated = { ...active, ...patch }
    setSemesters((prev) => prev.map((s) => (s.id === active.id ? updated : s)))
    persist(updated)
  }

  async function addSemester() {
    if (!user) return
    const sem: Semester = { id: `mem-${Date.now()}`, name: `Semester ${semesters.length + 1}`, courses: [{ name: '', credits: 3, grade: 'A' }] }
    if (!isSupabaseConfigured) {
      memSemesters.push({ ...sem, user_id: user.id })
      setSemesters((prev) => [...prev, sem])
    } else {
      const { data } = await supabase.from('user_semesters').insert({ user_id: user.id, name: sem.name, courses: sem.courses }).select('id,name,courses').single()
      if (data) {
        setSemesters((prev) => [...prev, data as Semester])
        setActiveId((data as Semester).id)
        return
      }
    }
    setActiveId(sem.id)
  }

  async function deleteSemester(id: string) {
    if (!confirm('Delete this semester?')) return
    if (!isSupabaseConfigured) {
      const i = memSemesters.findIndex((s) => s.id === id)
      if (i >= 0) memSemesters.splice(i, 1)
    } else {
      await supabase.from('user_semesters').delete().eq('id', id)
    }
    setSemesters((prev) => prev.filter((s) => s.id !== id))
    if (activeId === id) setActiveId(semesters.find((s) => s.id !== id)?.id ?? null)
  }

  if (authLoading || loading) return <Spinner />
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <Card><EmptyState title="Log in for GPA Calculator" message="Your grades are private and saved." action={<Link to="/login"><Button>Log in</Button></Link>} /></Card>
      </div>
    )
  }

  const gpa = active ? calcGPA(active.courses) : 0
  const allCourses = semesters.flatMap((s) => s.courses)
  const cgpa = calcGPA(allCourses)
  const totalCredits = allCourses.reduce((a, c) => a + c.credits, 0)

  const gpaColor = gpa >= 3.5 ? 'text-green-600' : gpa >= 3.0 ? 'text-blue-600' : gpa >= 2.0 ? 'text-yellow-600' : 'text-red-600'

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <SectionHeading kicker="🎓 GPA Calculator" title="Track your grades" subtitle="Semester GPA + overall CGPA" />

      {/* CGPA Hero */}
      <Card className="p-8 mb-6 text-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <p className="text-xs text-muted uppercase tracking-widest">Overall CGPA</p>
        <p className={`text-6xl font-bold my-2 ${cgpa >= 3.5 ? 'text-green-600' : cgpa >= 3.0 ? 'text-blue-600' : 'text-ink'}`}>
          {cgpa.toFixed(2)}
        </p>
        <p className="text-sm text-muted">{totalCredits} total credits · {semesters.length} semesters</p>
      </Card>

      {/* Semester tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Button size="sm" variant="outline" onClick={addSemester}>+ Semester</Button>
        {semesters.map((s) => (
          <div key={s.id} className="flex items-center">
            <Button size="sm" variant={s.id === activeId ? undefined : 'ghost'} onClick={() => setActiveId(s.id)}>
              {s.name} ({calcGPA(s.courses).toFixed(2)})
            </Button>
            <button onClick={() => deleteSemester(s.id)} className="text-xs text-error px-1">✕</button>
          </div>
        ))}
      </div>

      {active ? (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <TextInput id="sem-name" label="Semester name" value={active.name} onChange={(e) => updateActive({ name: e.target.value })} />
            <div className="text-right ml-4">
              <p className="text-xs text-muted">Semester GPA</p>
              <p className={`text-3xl font-bold ${gpaColor}`}>{gpa.toFixed(2)}</p>
            </div>
          </div>

          <div className="space-y-2">
            {active.courses.map((c, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-6">
                  <TextInput id={`c-name-${i}`} label="Course" value={c.name} onChange={(e) => {
                    const courses = [...active.courses]
                    courses[i] = { ...courses[i], name: e.target.value }
                    updateActive({ courses })
                  }} placeholder="e.g. Data Structures" />
                </div>
                <div className="col-span-2">
                  <TextInput id={`c-cred-${i}`} label="Credits" type="number" value={String(c.credits)} onChange={(e) => {
                    const courses = [...active.courses]
                    courses[i] = { ...courses[i], credits: parseInt(e.target.value) || 0 }
                    updateActive({ courses })
                  }} />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-medium mb-1">Grade</label>
                  <select value={c.grade} onChange={(e) => {
                    const courses = [...active.courses]
                    courses[i] = { ...courses[i], grade: e.target.value }
                    updateActive({ courses })
                  }} className="w-full border border-line rounded-lg px-3 py-2 text-sm">
                    {GRADES.map((g) => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div className="col-span-1">
                  <button onClick={() => updateActive({ courses: active.courses.filter((_, j) => j !== i) })} className="text-error text-sm pb-2">✕</button>
                </div>
              </div>
            ))}
          </div>
          <Button size="sm" variant="ghost" className="mt-3" onClick={() => updateActive({ courses: [...active.courses, { name: '', credits: 3, grade: 'A' }] })}>
            + Add course
          </Button>

          {/* What-if */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-semibold mb-1">💡 What-if calculator</p>
            <p className="text-sm text-muted">Change any grade above to see how your GPA would change — plan which courses to focus on!</p>
          </div>
        </Card>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-muted">No semesters yet. Add your first one! 🎓</p>
        </Card>
      )}
    </div>
  )
}
