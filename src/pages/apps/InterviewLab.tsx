import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { SectionHeading } from '../../components/ui/states'

interface IQ {
  q: string
  tip: string
  model: string
  category: string
}

const QUESTIONS: IQ[] = [
  {
    q: 'Tell me about yourself.',
    tip: 'Keep it to 2 minutes: past → present → future. End with why you\'re here.',
    model: '"I\'m a Computer Science graduate from [university]. During my degree I built [project], which taught me [skill]. I\'m now looking to [goal] because [specific reason related to this opportunity]."',
    category: 'General',
  },
  {
    q: 'Why do you want this scholarship / position?',
    tip: 'Be SPECIFIC — name the program, professor, or unique feature. Generic answers fail.',
    model: '"Your [program/lab] stood out because of [specific detail]. Professor [name]\'s work on [topic] aligns directly with my project on [your work], and I want to contribute to [specific goal]."',
    category: 'General',
  },
  {
    q: 'What is your greatest weakness?',
    tip: 'Name a REAL weakness + what you\'re doing about it. Never say "I\'m a perfectionist."',
    model: '"I used to struggle with [real weakness, e.g. public speaking]. I\'ve been working on it by [concrete action], and recently [small win]. It\'s still a work in progress, but I\'m improving."',
    category: 'General',
  },
  {
    q: 'Describe a challenge you overcame.',
    tip: 'Use STAR: Situation → Task → Action → Result. Quantify the result if possible.',
    model: '"In my final year, our team\'s [situation]. I was responsible for [task]. I [specific actions]. The result was [measurable outcome] — we [achievement]."',
    category: 'Behavioral',
  },
  {
    q: 'Where do you see yourself in 5 years?',
    tip: 'Show ambition + realism. Connect it to THIS opportunity.',
    model: '"In 5 years I see myself [specific role] working on [field], having [concrete milestone]. This [program/position] is the right step because [connection]."',
    category: 'General',
  },
  {
    q: 'Why should we select you over other candidates?',
    tip: 'Don\'t trash others. Highlight your UNIQUE combination.',
    model: '"What sets me apart is the combination of [skill 1] and [skill 2] — for example, [concrete proof]. I\'m also [genuine quality] which I demonstrated when [brief story]."',
    category: 'General',
  },
  {
    q: 'Tell me about a time you worked in a team.',
    tip: 'STAR method again. Show YOUR contribution, not just "we did".',
    model: '"During [project], our team of [n] had to [goal]. My role was [specific]. When [conflict/challenge] came up, I [action]. We delivered [result]."',
    category: 'Behavioral',
  },
  {
    q: 'What are your strengths?',
    tip: 'Pick 2-3 relevant strengths. Back EACH with proof.',
    model: '"First, [strength] — for example, [proof]. Second, [strength] — I demonstrated this when [story]. Both are directly relevant because [connection to role]."',
    category: 'General',
  },
  {
    q: 'Do you have any questions for us?',
    tip: 'ALWAYS ask 2-3 questions. It shows genuine interest.',
    model: 'Good questions: "What does success look like in the first 6 months?" / "What\'s the biggest challenge facing the team right now?" / "How would you describe the culture here?"',
    category: 'General',
  },
  {
    q: 'Explain a technical concept simply.',
    tip: 'Pick something you know deeply. Use an analogy. Check understanding.',
    model: 'Structure: "Think of [concept] like [everyday analogy]. In simple terms, [explanation]. For example, [concrete example]." Then ask: "Does that make sense?"',
    category: 'Technical',
  },
]

const CATS = ['All', ...Array.from(new Set(QUESTIONS.map((q) => q.category)))]

export function InterviewLab() {
  const [cat, setCat] = useState('All')
  const [open, setOpen] = useState<number | null>(null)
  const [practiced, setPracticed] = useState<Set<number>>(new Set())

  const filtered = QUESTIONS.filter((q) => cat === 'All' || q.category === cat)

  function markPracticed(i: number) {
    setPracticed((prev) => new Set(prev).add(i))
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <SectionHeading kicker="🎤 Interview Lab" title="Mock interview practice" subtitle={`${practiced.size}/${QUESTIONS.length} questions practiced`} />

      <div className="flex gap-2 mb-6">
        {CATS.map((c) => (
          <Button key={c} size="sm" variant={cat === c ? undefined : 'ghost'} onClick={() => setCat(c)}>{c}</Button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((iq) => {
          const idx = QUESTIONS.indexOf(iq)
          const isOpen = open === idx
          const done = practiced.has(idx)
          return (
            <Card key={idx} className={`p-5 ${done ? 'border-green-200' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {done && <span className="text-green-600">✓</span>}
                    <h3 className="font-bold">{iq.q}</h3>
                  </div>
                  <p className="text-xs text-muted mt-1">{iq.category}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setOpen(isOpen ? null : idx)}>
                  {isOpen ? 'Hide' : 'Practice →'}
                </Button>
              </div>
              {isOpen && (
                <div className="mt-4 space-y-3 border-t border-line pt-4">
                  <div>
                    <p className="text-sm font-semibold text-primary-teal">💡 How to answer:</p>
                    <p className="text-sm mt-1">{iq.tip}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary-teal">🗣️ Model answer framework:</p>
                    <p className="text-sm mt-1 italic bg-surface p-3 rounded-lg">{iq.model}</p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm font-semibold">🎯 Your turn:</p>
                    <p className="text-sm">Say your answer OUT LOUD (or write it down), then compare with the framework above.</p>
                  </div>
                  {!done && (
                    <Button size="sm" onClick={() => markPracticed(idx)}>✓ Mark as practiced</Button>
                  )}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {practiced.size === QUESTIONS.length && (
        <Card className="p-6 mt-6 text-center bg-green-50">
          <div className="text-4xl mb-2">🏆</div>
          <p className="font-bold">All questions practiced! You're interview-ready!</p>
        </Card>
      )}
    </div>
  )
}
