import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { SectionHeading, Spinner } from '../../components/ui/states'
import { useAuth } from '../../context/AuthContext'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'

interface Vocab {
  word: string
  meaning: string
  example: string
  urdu: string
}

const VOCAB: Vocab[] = [
  { word: 'Ambitious', meaning: 'having a strong desire for success', example: 'She is ambitious and wants to study abroad.', urdu: 'پرعزم' },
  { word: 'Diligent', meaning: 'showing care in one\'s work', example: 'Diligent students revise every day.', urdu: 'محنتی' },
  { word: 'Resilient', meaning: 'able to recover from difficulties', example: 'Resilient people don\'t give up after failure.', urdu: 'مضبوط' },
  { word: 'Eloquent', meaning: 'fluent and persuasive in speaking', example: 'His eloquent speech impressed everyone.', urdu: 'فصیح' },
  { word: 'Meticulous', meaning: 'very careful and precise', example: 'Be meticulous with your SOP — every word counts.', urdu: 'باریک بین' },
  { word: 'Pragmatic', meaning: 'practical rather than idealistic', example: 'Take a pragmatic approach to your study plan.', urdu: 'عملی' },
  { word: 'Ubiquitous', meaning: 'present everywhere', example: 'Smartphones are ubiquitous among students.', urdu: 'ہر جگہ موجود' },
  { word: 'Candid', meaning: 'honest and straightforward', example: 'Let me be candid — your first draft needs work.', urdu: 'کھرا' },
  { word: 'Versatile', meaning: 'able to do many things well', example: 'Python is a versatile language.', urdu: 'ہمہ گیر' },
  { word: 'Empathy', meaning: 'understanding others\' feelings', example: 'Good mentors have empathy for students.', urdu: 'ہمدردی' },
  { word: 'Innovative', meaning: 'introducing new ideas', example: 'Her innovative project won the competition.', urdu: 'جدت پسند' },
  { word: 'Persevere', meaning: 'continue despite difficulty', example: 'Persevere — success takes time.', urdu: 'ثابت قدم رہنا' },
  { word: 'Articulate', meaning: 'able to express ideas clearly', example: 'Articulate your goals in the interview.', urdu: 'واضح گو' },
  { word: 'Candid', meaning: 'truthful and straightforward', example: 'A candid conversation with your mentor helps.', urdu: 'صاف گو' },
  { word: 'Thrive', meaning: 'grow and do well', example: 'Students thrive with the right guidance.', urdu: 'پھلنا پھولنا' },
]

const GRAMMAR_TIPS = [
  { title: 'Present Perfect vs Past Simple', tip: '"I have finished" (result matters now) vs "I finished yesterday" (specific past time). Rule: specific time → Past Simple. No time → Present Perfect.' },
  { title: 'Articles: a / an / the', tip: '"A/an" = first mention, general. "The" = specific, already known. "I saw a dog. The dog was cute."' },
  { title: 'Since vs For', tip: '"Since" + point in time (since 2020, since Monday). "For" + duration (for 3 years, for a week).' },
  { title: 'Much vs Many', tip: '"Much" + uncountable (much water, much time). "Many" + countable (many books, many friends).' },
  { title: 'Conditional: If I were…', tip: 'Unreal situations use "were" for all subjects: "If I were rich…" not "If I was rich…"' },
  { title: 'Active vs Passive', tip: 'Active: "She wrote the essay." Passive: "The essay was written by her." Prefer active — it\'s clearer and stronger.' },
]

const memLearned: string[] = []

export function EnglishCoach() {
  const { user, loading: authLoading } = useAuth()
  const [learned, setLearned] = useState<Set<string>>(new Set())
  const [dayIndex, setDayIndex] = useState(0)
  const [showMeaning, setShowMeaning] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
    setDayIndex(dayOfYear % VOCAB.length)
    if (!user) {
      setLoading(false)
      return
    }
    if (!isSupabaseConfigured) {
      setLearned(new Set(memLearned))
      setLoading(false)
      return
    }
    supabase.from('user_vocab').select('word').eq('user_id', user.id).eq('learned', true).then(({ data }) => {
      setLearned(new Set((data ?? []).map((d: { word: string }) => d.word)))
      setLoading(false)
    })
  }, [user])

  async function toggleLearned(word: string) {
    const isLearned = learned.has(word)
    const next = new Set(learned)
    if (isLearned) next.delete(word)
    else next.add(word)
    setLearned(next)

    if (!user) return
    if (!isSupabaseConfigured) {
      const i = memLearned.indexOf(word)
      if (isLearned && i >= 0) memLearned.splice(i, 1)
      if (!isLearned && i < 0) memLearned.push(word)
      return
    }
    if (isLearned) {
      await supabase.from('user_vocab').delete().eq('user_id', user.id).eq('word', word)
    } else {
      await supabase.from('user_vocab').upsert({ user_id: user.id, word, learned: true }, { onConflict: 'user_id,word' })
    }
  }

  const wordOfDay = VOCAB[dayIndex]

  if (authLoading || loading) return <Spinner />

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <SectionHeading kicker="🗣️ English Coach" title="Daily English" subtitle={`${learned.size}/${VOCAB.length} words learned`} />

      {/* Word of the day */}
      <Card className="p-8 mb-6 text-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <p className="text-xs text-muted uppercase tracking-widest mb-2">📅 Word of the day</p>
        <h2 className="text-4xl font-bold mb-2">{wordOfDay.word}</h2>
        <p className="text-lg text-muted mb-1" dir="rtl">{wordOfDay.urdu}</p>
        {!showMeaning ? (
          <Button className="mt-4" onClick={() => setShowMeaning(true)}>Reveal meaning</Button>
        ) : (
          <div className="mt-4">
            <p className="font-medium">{wordOfDay.meaning}</p>
            <p className="text-sm text-muted italic mt-2">"{wordOfDay.example}"</p>
            <Button size="sm" className="mt-4" variant={learned.has(wordOfDay.word) ? 'outline' : undefined}
              onClick={() => toggleLearned(wordOfDay.word)}>
              {learned.has(wordOfDay.word) ? '✓ Learned' : 'Mark as learned'}
            </Button>
          </div>
        )}
      </Card>

      {/* All words */}
      <h3 className="font-bold mb-3">📖 Vocabulary bank</h3>
      <div className="grid sm:grid-cols-2 gap-3 mb-8">
        {VOCAB.map((v) => (
          <Card key={v.word} className={`p-4 ${learned.has(v.word) ? 'border-green-200 bg-green-50/50' : ''}`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold">{v.word} <span className="font-normal text-muted" dir="rtl">{v.urdu}</span></p>
                <p className="text-sm text-muted">{v.meaning}</p>
                <p className="text-xs italic text-muted mt-1">"{v.example}"</p>
              </div>
              <button onClick={() => toggleLearned(v.word)} className={`text-lg ${learned.has(v.word) ? 'text-green-600' : 'text-gray-300'}`}>
                {learned.has(v.word) ? '✓' : '○'}
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Grammar tips */}
      <h3 className="font-bold mb-3">📝 Grammar clinic</h3>
      <div className="space-y-3">
        {GRAMMAR_TIPS.map((g, i) => (
          <Card key={i} className="p-4">
            <p className="font-semibold text-sm">{g.title}</p>
            <p className="text-sm text-muted mt-1">{g.tip}</p>
          </Card>
        ))}
      </div>

      {!user && (
        <Card className="p-4 mt-6 text-center">
          <p className="text-sm"><Link to="/login" className="text-primary-teal font-semibold">Log in</Link> to track your learned words!</p>
        </Card>
      )}
    </div>
  )
}
