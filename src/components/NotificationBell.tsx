import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchNotifications } from '../lib/notifications'

/** Header bell with unread count. Silent when logged out. */
export function NotificationBell() {
  const { user } = useAuth()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!user) {
      setUnread(0)
      return
    }
    let cancelled = false
    fetchNotifications(user.id)
      .then((items) => { if (!cancelled) setUnread(items.filter((n) => !n.read).length) })
      .catch(() => {})
    const t = setInterval(() => {
      fetchNotifications(user.id)
        .then((items) => { if (!cancelled) setUnread(items.filter((n) => !n.read).length) })
        .catch(() => {})
    }, 60000)
    return () => { cancelled = true; clearInterval(t) }
  }, [user])

  if (!user) return null

  return (
    <Link to="/notifications" className="relative text-ink hover:text-primary-teal" aria-label="Notifications">
      <span className="text-xl">🔔</span>
      {unread > 0 && (
        <span className="absolute -top-1.5 -right-2 bg-error text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  )
}
