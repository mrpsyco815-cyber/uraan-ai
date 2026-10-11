import { Card } from '../components/ui/Card'

export function Privacy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-ink mb-2">Privacy Policy</h1>
      <p className="text-sm text-warning bg-warning/10 rounded-xl px-4 py-3 mb-8 font-medium">
        Draft — this policy will be finalized with legal review before public launch (Phase 18).
      </p>
      <Card className="p-8 space-y-4 text-muted text-sm leading-relaxed">
        <p><strong className="text-ink">1. Data we collect:</strong> account details you provide (name, email, education info), and usage data needed to run the platform.</p>
        <p><strong className="text-ink">2. What we never do:</strong> we never sell student data, never share private records without consent, and never store third-party portal passwords.</p>
        <p><strong className="text-ink">3. Your control:</strong> you can view, correct, and request deletion of your data at any time.</p>
        <p><strong className="text-ink">4. Security:</strong> data is protected with encryption in transit and strict access controls (row-level security).</p>
      </Card>
    </div>
  )
}

export function Terms() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-ink mb-2">Terms of Service</h1>
      <p className="text-sm text-warning bg-warning/10 rounded-xl px-4 py-3 mb-8 font-medium">
        Draft — these terms will be finalized with legal review before public launch (Phase 18).
      </p>
      <Card className="p-8 space-y-4 text-muted text-sm leading-relaxed">
        <p><strong className="text-ink">1. Honest use:</strong> provide truthful information in your profile and applications. Fabricated credentials lead to account removal.</p>
        <p><strong className="text-ink">2. AI assistance:</strong> AI output is guidance, not guaranteed truth. Review everything before submitting to officials.</p>
        <p><strong className="text-ink">3. No guarantees:</strong> we guide and verify listings, but admissions and funding decisions belong to the official programs.</p>
        <p><strong className="text-ink">4. Respectful community:</strong> harassment or misuse of mentor/support features results in suspension.</p>
      </Card>
    </div>
  )
}
