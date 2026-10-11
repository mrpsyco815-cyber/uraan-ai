import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { EmptyState, Spinner } from '../../components/ui/states'
import { useAuth } from '../../context/AuthContext'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'

/** Renders children only for admin-role users. Role is enforced server-side by RLS. */
export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user || !isSupabaseConfigured) {
      setLoading(false)
      return
    }
    supabase.from('profiles').select('role').eq('id', user.id).single().then(({ data }) => {
      setRole(data?.role ?? 'student')
      setLoading(false)
    })
  }, [user, authLoading])

  if (authLoading || loading) return <Spinner />

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <Card>
          <EmptyState title="Admins only" message="Please log in with an admin account." action={<Link to="/login"><Button>Log in</Button></Link>} />
        </Card>
      </div>
    )
  }

  if (role !== 'admin') {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <Card>
          <EmptyState title="Access denied" message="Your account doesn't have admin permissions." action={<Link to="/"><Button variant="outline">Back home</Button></Link>} />
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
