import { useState } from 'react'
import { Card } from '../components/ui/Card'
import { SectionHeading } from '../components/ui/states'

const faqs = [
  { q: 'Is Uraan AI really free for students?', a: 'Yes. The platform is free forever for students. We never charge for browsing opportunities or using core features.' },
  { q: 'Are the scholarships verified?', a: 'Every published opportunity is checked by a human reviewer against the official source before it goes live. Sample data shown during development is clearly marked.' },
  { q: 'Can the AI coach write my application for me?', a: 'The AI coach helps you learn, practice, and improve your own writing — but your application must be your own honest work. We never fabricate qualifications.' },
  { q: 'Which languages are supported?', a: 'English, Urdu, and Roman Urdu — switch anytime from your settings.' },
  { q: 'Does it work on slow internet?', a: 'Yes. Uraan AI is designed mobile-first for low-bandwidth environments common across Pakistan.' },
  { q: 'How do mentors get verified?', a: 'Mentors submit credentials which our team reviews manually. Only approved mentors appear in the directory.' },
]

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <SectionHeading kicker="Help" title="Frequently asked questions" />
      <div className="space-y-3">
        {faqs.map((f, i) => (
          <Card key={f.q} className="overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full text-left p-5 flex justify-between items-center gap-4"
              aria-expanded={open === i}
            >
              <span className="font-semibold text-ink">{f.q}</span>
              <span className="text-primary-teal text-xl shrink-0">{open === i ? '−' : '+'}</span>
            </button>
            {open === i && <p className="px-5 pb-5 text-muted text-sm leading-relaxed">{f.a}</p>}
          </Card>
        ))}
      </div>
    </div>
  )
}
