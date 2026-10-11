import { Link, Outlet } from 'react-router-dom'
import { NotificationBell } from './NotificationBell'

/** Shared application shell: header nav + footer. Phase 2 will flesh out pages. */
export function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-soft-blue sticky top-0 z-10">
        <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-deep-teal">
            <span className="w-8 h-8 rounded-full bg-primary-teal text-white flex items-center justify-center text-sm">
              ✈
            </span>
            Uraan AI
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <Link to="/" className="text-ink hover:text-primary-teal">Home</Link>
            <Link to="/opportunities" className="text-ink hover:text-primary-teal">Opportunities</Link>
            <Link to="/assistant" className="text-ink hover:text-primary-teal">AI Assistant</Link>
            <Link to="/mentors" className="text-ink hover:text-primary-teal">Mentors</Link>
            <Link to="/how-it-works" className="text-ink hover:text-primary-teal">How It Works</Link>
            <Link to="/resources" className="text-ink hover:text-primary-teal">Resources</Link>
            <Link to="/faq" className="text-ink hover:text-primary-teal">FAQ</Link>
            <Link to="/contact" className="text-ink hover:text-primary-teal">Contact</Link>
            <NotificationBell />
            <Link to="/login" className="text-primary-teal font-medium">
              Log in
            </Link>
          </div>
          <Link to="/login" className="md:hidden text-primary-teal font-medium text-sm">
            Log in
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-deep-teal text-white/80 text-sm">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row justify-between gap-4">
          <p className="font-semibold text-white">Uraan AI — Learn | Grow | Succeed</p>
          <p>© 2026 Uraan AI. Made for the students of Pakistan.</p>
        </div>
      </footer>
    </div>
  )
}
