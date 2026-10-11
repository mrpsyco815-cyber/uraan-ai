import { Card } from '../components/ui/Card'
import { SectionHeading } from '../components/ui/states'

const resources = [
  { t: 'English Learning Path', d: 'From basics to IELTS-ready, step by step.', tag: 'Language' },
  { t: 'Programming Learning Path', d: 'Python, web development, and CS fundamentals.', tag: 'Skills' },
  { t: 'Mathematics Resources', d: 'Concept videos, practice sets, and exam prep.', tag: 'Academics' },
  { t: 'SOP Writing Guide', d: 'How to write a statement of purpose that stands out.', tag: 'Applications' },
  { t: 'CV Builder Guide', d: 'Build a clean, honest academic CV.', tag: 'Career' },
  { t: 'Interview Preparation', d: 'Common questions and how to answer them well.', tag: 'Career' },
]

export function Resources() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <SectionHeading kicker="Library" title="Learning resources" subtitle="Free guides and learning paths. Full library arrives in Phase 9." />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {resources.map((r) => (
          <Card key={r.t} className="p-6">
            <span className="inline-block text-xs font-semibold text-primary-teal bg-soft-blue px-2.5 py-0.5 rounded-full mb-3">
              {r.tag}
            </span>
            <h3 className="font-bold text-ink mb-2">{r.t}</h3>
            <p className="text-muted text-sm">{r.d}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
