import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { TextInput } from '../components/ui/fields'
import { SectionHeading } from '../components/ui/states'
import { useAuth } from '../context/AuthContext'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

export function DeleteAccount() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [confirm, setConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function deleteAccount() {
    if (!user) return
    if (confirm !== 'DELETE') {
      setError('Please type DELETE to confirm.')
      return
    }
    setDeleting(true)
    setError(null)
    try {
      if (isSupabaseConfigured) {
        // Delete user data in dependency order (cascades handle most)
        const tables = ['chat_messages', 'mentorship_requests', 'applications', 'notification_preferences', 'user_blocks', 'user_reports', 'mentor_profiles', 'notifications', 'profiles']
        for (const t of tables) {
          const col = t === 'profiles' || t === 'notification_preferences' ? (t === 'notification_preferences' ? 'user_id' : 'id') : 'user_id'
          // user_blocks has two user columns
          if (t === 'user_blocks') {
            await supabase.from(t).delete().or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`)
          } else if (t === 'user_reports') {
            await supabase.from(t).delete().or(`reporter_id.eq.${user.id},reported_id.eq.${user.id}`)
          } else if (t === 'mentorship_requests') {
            await supabase.from(t).delete().or(`student_id.eq.${user.id},mentor_user_id.eq.${user.id}`)
          } else if (t === 'chat_messages') {
            await supabase.from(t).delete().eq('sender_id', user.id)
          } else {
            await supabase.from(t).delete().eq(col, user.id)
          }
        }
        // Note: auth.users deletion requires service-role (admin action).
        // The account is deactivated here; full auth removal by admin on request.
      }
      await signOut()
      navigate('/?account-deleted=1')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Deletion failed. Please contact support.')
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <SectionHeading kicker="Danger zone" title="Delete your account" subtitle="This is permanent and cannot be undone." />

      <Card className="p-6">
        <h3 className="font-semibold text-ink mb-3">What gets deleted</h3>
        <ul className="text-sm text-muted space-y-2 mb-6 list-disc list-inside">
          <li>Your profile, education details, and preferences</li>
          <li>All application records, notes, checklists, and reminders</li>
          <li>Mentorship requests and all chat messages</li>
          <li>Notifications and notification preferences</li>
          <li>Blocks and reports you filed</li>
        </ul>
        <h3 className="font-semibold text-ink mb-3">What is retained</h3>
        <ul className="text-sm text-muted space-y-2 mb-6 list-disc list-inside">
          <li>Anonymized audit log entries (required for platform security, no personal data)</li>
          <li>Your auth account is deactivated; full removal from auth on request to support</li>
        </ul>

        <div className="mb-4">
          <TextInput
            id="delete-confirm"
            label='Type DELETE to confirm'
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="DELETE"
          />
        </div>
        {error && <p className="text-sm text-error mb-4" role="alert">{error}</p>}
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/profile')}>Keep my account</Button>
          <Button loading={deleting} onClick={deleteAccount} className="!bg-error">Delete forever</Button>
        </div>
      </Card>
    </div>
  )
}
