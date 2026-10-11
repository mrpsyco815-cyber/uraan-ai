import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

export interface StudentProfile {
  full_name: string
  education_level: string
  field_of_study: string
  interests: string[]
  goals: string
  preferred_countries: string[]
  preferred_language: 'en' | 'ur' | 'roman'
  financial_need: string
  onboarding_done: boolean
}

export const emptyProfile: StudentProfile = {
  full_name: '',
  education_level: '',
  field_of_study: '',
  interests: [],
  goals: '',
  preferred_countries: [],
  preferred_language: 'en',
  financial_need: '',
  onboarding_done: false,
}

interface ProfileState {
  profile: StudentProfile | null
  loading: boolean
  mockMode: boolean
  saveProfile: (p: StudentProfile) => Promise<{ error: string | null }>
}

const ProfileContext = createContext<ProfileState | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const mockMode = !isSupabaseConfigured

  useEffect(() => {
    if (mockMode || !user) {
      setLoading(false)
      return
    }
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setProfile({
            full_name: data.full_name ?? '',
            education_level: data.education_level ?? '',
            field_of_study: data.field_of_study ?? '',
            interests: data.interests ?? [],
            goals: data.goals ?? '',
            preferred_countries: data.preferred_countries ?? [],
            preferred_language: data.preferred_language ?? 'en',
            financial_need: data.financial_need ?? '',
            onboarding_done: data.onboarding_done ?? false,
          })
        }
        setLoading(false)
      })
  }, [user, mockMode])

  async function saveProfile(p: StudentProfile) {
    if (mockMode || !user) {
      // Offline: keep in memory so the UI flow is testable; real save happens on Supabase connect.
      setProfile(p)
      return { error: null }
    }
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: p.full_name,
      education_level: p.education_level,
      field_of_study: p.field_of_study,
      preferred_countries: p.preferred_countries,
      preferred_language: p.preferred_language,
      updated_at: new Date().toISOString(),
    })
    if (!error) setProfile(p)
    return { error: error?.message ?? null }
  }

  return (
    <ProfileContext.Provider value={{ profile, loading, mockMode, saveProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile(): ProfileState {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used inside ProfileProvider')
  return ctx
}
