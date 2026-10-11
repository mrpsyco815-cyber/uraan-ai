import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { TextInput } from '../components/ui/fields'
import { useAuth } from '../context/AuthContext'

export function ForgotPassword() {
  const { resetPassword, mockMode } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const email = String(new FormData(e.currentTarget).get('email')).trim()
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Please enter a valid email.')
    setLoading(true)
    const { error: err } = await resetPassword(email)
    setLoading(false)
    if (err) setError(err)
    else setDone(true)
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <Card className="p-8">
        <h1 className="text-2xl font-bold text-ink mb-1">Reset password</h1>
        <p className="text-muted text-sm mb-6">We'll email you a reset link.</p>
        {mockMode && (
          <p className="text-xs bg-warning/10 text-warning font-medium rounded-xl px-4 py-3 mb-5">
            Demo mode — Supabase connect hote hi live hoga.
          </p>
        )}
        {done ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-success/10 flex items-center justify-center text-2xl">✓</div>
            <p className="text-ink font-medium">Check your inbox for the reset link.</p>
            <Link to="/login" className="text-primary-teal font-medium text-sm mt-3 inline-block">Back to login</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4" noValidate>
            <TextInput id="email" name="email" label="Email" type="email" placeholder="you@example.com" />
            {error && <p className="text-sm text-error" role="alert">{error}</p>}
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Send reset link
            </Button>
          </form>
        )}
      </Card>
    </div>
  )
}
