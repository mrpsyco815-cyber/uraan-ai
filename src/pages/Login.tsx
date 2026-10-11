import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { TextInput } from '../components/ui/fields'
import { useAuth } from '../context/AuthContext'

export function Login() {
  const { signIn, mockMode } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const data = new FormData(e.currentTarget)
    const email = String(data.get('email')).trim()
    const password = String(data.get('password'))
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Please enter a valid email.')
    if (!password) return setError('Please enter your password.')
    setLoading(true)
    const { error: err } = await signIn(email, password)
    setLoading(false)
    if (err) setError(err)
    else navigate('/')
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <Card className="p-8">
        <h1 className="text-2xl font-bold text-ink mb-1">Welcome back</h1>
        <p className="text-muted text-sm mb-6">Log in to your Uraan AI account.</p>
        {mockMode && (
          <p className="text-xs bg-warning/10 text-warning font-medium rounded-xl px-4 py-3 mb-5">
            Demo mode — Supabase connect hote hi live hoga.
          </p>
        )}
        <form onSubmit={submit} className="space-y-4" noValidate>
          <TextInput id="email" name="email" label="Email" type="email" placeholder="you@example.com" />
          <TextInput id="password" name="password" label="Password" type="password" placeholder="••••••••" />
          {error && <p className="text-sm text-error" role="alert">{error}</p>}
          <Button type="submit" loading={loading} className="w-full" size="lg">
            Log in
          </Button>
        </form>
        <div className="flex justify-between text-sm mt-5">
          <Link to="/forgot-password" className="text-primary-teal font-medium">Forgot password?</Link>
          <Link to="/signup" className="text-primary-teal font-medium">Create account</Link>
        </div>
      </Card>
    </div>
  )
}
