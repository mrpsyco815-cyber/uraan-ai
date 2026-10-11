import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** True when Supabase credentials are configured (real project connected). */
export const isSupabaseConfigured = Boolean(url && anonKey && !url.includes('your-project'))

if (!isSupabaseConfigured) {
  console.warn(
    '[Uraan AI] Supabase not configured — auth runs in offline/mock mode. ' +
      'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env to connect.',
  )
}

export const supabase = createClient(
  url ?? 'https://placeholder.supabase.co',
  anonKey ?? 'placeholder-anon-key',
)
