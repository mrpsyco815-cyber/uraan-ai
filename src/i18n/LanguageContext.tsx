import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { LANGS, translate, type Lang } from './dictionaries'
import { useAuth } from '../context/AuthContext'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

interface LangState {
  lang: Lang
  dir: 'ltr' | 'rtl'
  t: (key: string) => string
  setLang: (l: Lang) => void
}

const LangContext = createContext<LangState | null>(null)

const STORAGE_KEY = 'uraan-lang'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === 'ur' || saved === 'roman' || saved === 'en' ? saved : 'en'
  })

  // Load preference from profile when logged in
  useEffect(() => {
    if (!user || !isSupabaseConfigured) return
    supabase.from('profiles').select('preferred_language').eq('id', user.id).single().then(({ data }) => {
      const pl = (data as { preferred_language?: string } | null)?.preferred_language
      if (pl === 'ur' || pl === 'roman' || pl === 'en') {
        setLangState(pl)
        localStorage.setItem(STORAGE_KEY, pl)
      }
    })
  }, [user])

  // Apply RTL to document
  useEffect(() => {
    const dir = LANGS.find((l) => l.key === lang)?.dir ?? 'ltr'
    document.documentElement.dir = dir
    document.documentElement.lang = lang === 'ur' ? 'ur' : 'en'
  }, [lang])

  async function setLang(l: Lang) {
    setLangState(l)
    localStorage.setItem(STORAGE_KEY, l)
    if (user && isSupabaseConfigured) {
      await supabase.from('profiles').update({ preferred_language: l }).eq('id', user.id)
    }
  }

  const dir = LANGS.find((l) => l.key === lang)?.dir ?? 'ltr'

  return (
    <LangContext.Provider value={{ lang, dir, t: (key: string) => translate(lang, key), setLang }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang(): LangState {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used inside LanguageProvider')
  return ctx
}
