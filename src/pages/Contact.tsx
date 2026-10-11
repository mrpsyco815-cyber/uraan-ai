import { useState } from 'react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Select, TextArea, TextInput } from '../components/ui/fields'
import { SectionHeading } from '../components/ui/states'

export function Contact() {
  const [sent, setSent] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({})

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const next: typeof errors = {}
    if (!String(data.get('name')).trim()) next.name = 'Please enter your name.'
    if (!/^\S+@\S+\.\S+$/.test(String(data.get('email')))) next.email = 'Please enter a valid email.'
    if (String(data.get('message')).trim().length < 10) next.message = 'Please write at least 10 characters.'
    setErrors(next)
    if (Object.keys(next).length === 0) {
      // Phase 8 wires this to the real support queue. For now, local confirmation.
      setSent(true)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <SectionHeading kicker="Support" title="Contact us" subtitle="We read every message. Replies within 2 working days." />
      <Card className="p-8">
        {sent ? (
          <div className="text-center py-8" role="status">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center text-3xl">✓</div>
            <h3 className="text-lg font-bold text-ink mb-2">Message received!</h3>
            <p className="text-muted text-sm">Shukriya! We'll get back to you soon. (Support queue wiring arrives in Phase 8.)</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5" noValidate>
            <TextInput id="name" name="name" label="Your name" placeholder="Ayesha Khan" error={errors.name} />
            <TextInput id="email" name="email" label="Email" type="email" placeholder="you@example.com" error={errors.email} />
            <Select id="topic" name="topic" label="Topic">
              <option>General question</option>
              <option>Scholarship help</option>
              <option>Technical problem</option>
              <option>Feedback</option>
            </Select>
            <TextArea id="message" name="message" label="Message" placeholder="How can we help?" error={errors.message} />
            <Button type="submit" size="lg" className="w-full">Send message</Button>
          </form>
        )}
      </Card>
    </div>
  )
}
