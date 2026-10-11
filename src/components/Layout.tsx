import { Link, Outlet } from 'react-router-dom'
import { LanguageSwitcher } from './LanguageSwitcher'
import { NotificationBell } from './NotificationBell'
import { useLang } from '../i18n/LanguageContext'

/** Shared application shell: header nav + footer. */
export function Layout() {
  const { t } = useLang()
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
            <Link to="/" className="text-ink hover:text-primary-teal">{t('nav.home')}</Link>
            <Link to="/opportunities" className="text-ink hover:text-primary-teal">{t('nav.opportunities')}</Link>
            <Link to="/assistant" className="text-ink hover:text-primary-teal">{t('nav.assistant')}</Link>
            <Link to="/mentors" className="text-ink hover:text-primary-teal">{t('nav.mentors')}</Link>
            <Link to="/how-it-works" className="text-ink hover:text-primary-teal">{t('nav.how')}</Link>
            <Link to="/resources" className="text-ink hover:text-primary-teal">{t('nav.resources')}</Link>
            <Link to="/faq" className="text-ink hover:text-primary-teal">{t('nav.faq')}</Link>
            <Link to="/contact" className="text-ink hover:text-primary-teal">{t('nav.contact')}</Link>
            <LanguageSwitcher />
            <NotificationBell />
            <Link to="/login" className="text-primary-teal font-medium">
              {t('nav.login')}
            </Link>
          </div>
          <div className="md:hidden flex items-center gap-3">
            <LanguageSwitcher />
            <Link to="/login" className="text-primary-teal font-medium text-sm">
              {t('nav.login')}
            </Link>
          </div>
        </nav>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-deep-teal text-white/80 text-sm">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row justify-between gap-4">
          <p className="font-semibold text-white">{t('footer.tagline')}</p>
          <p>© 2026 Uraan AI. {t('footer.made')}</p>
        </div>
      </footer>
    </div>
  )
}
