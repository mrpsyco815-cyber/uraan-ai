import { Card } from '../components/ui/Card'
import { SectionHeading } from '../components/ui/states'

export function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <SectionHeading kicker="About" title="Uraan AI" subtitle="Learn | Grow | Succeed — for the students of Pakistan." />
      <div className="space-y-6 text-muted leading-relaxed">
        <Card className="p-8">
          <h2 className="text-xl font-bold text-ink mb-3">Our mission</h2>
          <p>
            Too many talented Pakistani students miss life-changing opportunities simply because
            they never hear about them — or don't know how to apply. Uraan AI exists to close
            that gap: verified scholarship listings, AI-powered study help, and real human
            mentors, all in one place.
          </p>
        </Card>
        <Card className="p-8">
          <h2 className="text-xl font-bold text-ink mb-3">Our principles</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-ink">Verified only:</strong> every opportunity is human-checked before it's published.</li>
            <li><strong className="text-ink">Honest AI:</strong> our AI coach is a learning assistant, not an infallible authority.</li>
            <li><strong className="text-ink">Accessible:</strong> mobile-first, works on low bandwidth, in English, Urdu and Roman Urdu.</li>
            <li><strong className="text-ink">Safe:</strong> student data stays private; mentors are verified.</li>
          </ul>
        </Card>
        <Card className="p-8">
          <h2 className="text-xl font-bold text-ink mb-3">What we never do</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>No fake scholarships, fake deadlines, or invented success stories.</li>
            <li>No guaranteed admissions — we guide, officials decide.</li>
            <li>No selling student data. Ever.</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
