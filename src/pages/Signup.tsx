import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { TextInput } from '../components/ui/fields'
import { useAuth } from '../context/AuthContext'

export function Signup() {
  const { signUp, mockMode } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const data = new FormData(e.currentTarget)
    const email = String(data.get('email')).trim()
    const password = String(data.get('password'))
    const confirm = String(data.get('confirm'))
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Please enter a valid email.')
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    if (password !== confirm) return setError('Passwords do not match.')
    setLoading(true)
    const { error: err } = await signUp(email, password)
    setLoading(false)
    if (err) setError(err)
    else navigate('/')
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <Card className="p-8">
        <h1 className="text-2xl font-bold text-ink mb-1">Create your account</h1>
        <p className="text-muted text-sm mb-6">Free forever for students. ✈</p>
        {mockMode && (
          <p className="text-xs bg-warning/10 text-warning font-medium rounded-xl px-4 py-3 mb-5">
            Demo mode — Supabase connect hote hi live hoga.
          </p>
        )}
        <form onSubmit={submit} className="space-y-4" noValidate>
          <TextInput id="email" name="email" label="Email" type="email" placeholder="you@example.com" />
          <TextInput id="password" name="password" label="Password" type="password" placeholder="Min. 8 characters" />
          <TextInput id="confirm" name="confirm" label="Confirm password" type="password" placeholder="••••••••" />
          {error && <p className="text-sm text-error" role="alert">{error}</p>}
          <Button type="submit" loading={loading} className="w-full" size="lg">
            Create free account
          </Button>
        </form>
        <p className="text-sm text-muted mt-5 text-center">
          Already have an account? <Link to="/login" className="text-primary-teal font-medium">Log in</Link>
        </p>
      </Card>
    </div>
  )
}
