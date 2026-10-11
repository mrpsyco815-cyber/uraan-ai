import { LANGS, type Lang } from '../i18n/dictionaries'
import { useLang } from '../i18n/LanguageContext'

export function LanguageSwitcher() {
  const { lang, setLang } = useLang()
  return (
    <select
      aria-label="Language"
      value={lang}
      onChange={(e) => setLang(e.target.value as Lang)}
      className="text-sm border border-line rounded-lg px-2 py-1.5 bg-white text-ink focus:outline-none focus:ring-2 focus:ring-primary-teal"
    >
      {LANGS.map((l) => (
        <option key={l.key} value={l.key}>{l.label}</option>
      ))}
    </select>
  )
}
