import { Card } from '../components/ui/Card'
import { SectionHeading } from '../components/ui/states'

const steps = [
  { t: 'Create your profile', d: 'Sign up free and tell us your education level, field of study, interests and dream countries. Takes 5 minutes.' },
  { t: 'Discover opportunities', d: 'Browse verified scholarships, internships, exchange programs and free courses — filtered to what you qualify for.' },
  { t: 'Track applications', d: 'Save opportunities, build checklists, and never miss a deadline with reminders.' },
  { t: 'Learn with AI coach', d: 'Get study help, practice quizzes and essay feedback in English, Urdu or Roman Urdu.' },
  { t: 'Meet mentors', d: 'Book sessions with verified mentors and teachers who have walked this path.' },
  { t: 'Get support', d: 'Need a laptop, internet help, or application review? Our support desk connects you to real help.' },
]

export function HowItWorks() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <SectionHeading kicker="Guide" title="How Uraan AI works" subtitle="Six simple steps from signup to success." />
      <div className="space-y-4">
        {steps.map((s, i) => (
          <Card key={s.t} className="p-6 flex gap-5">
            <div className="w-10 h-10 shrink-0 rounded-full bg-primary-teal text-white flex items-center justify-center font-bold">
              {i + 1}
            </div>
            <div>
              <h3 className="font-bold text-ink mb-1">{s.t}</h3>
              <p className="text-muted text-sm">{s.d}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
