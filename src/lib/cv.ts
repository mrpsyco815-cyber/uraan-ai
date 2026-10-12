import { isSupabaseConfigured, supabase } from './supabase'

export interface CVData {
  fullName: string
  email: string
  phone: string
  city: string
  objective: string
  education: { degree: string; institution: string; year: string }[]
  experience: { title: string; org: string; duration: string; details: string }[]
  skills: string[]
  projects: { name: string; description: string }[]
}

export const EMPTY_CV: CVData = {
  fullName: '', email: '', phone: '', city: '', objective: '',
  education: [{ degree: '', institution: '', year: '' }],
  experience: [],
  skills: [],
  projects: [],
}

export interface SavedCV {
  id: string
  user_id: string
  title: string
  template: string
  data: CVData
  updated_at: string
}

const memCVs: SavedCV[] = []

export async function fetchCVs(userId: string): Promise<SavedCV[]> {
  if (!isSupabaseConfigured) return memCVs.filter((c) => c.user_id === userId)
  const { data, error } = await supabase.from('user_cvs').select('*').eq('user_id', userId).order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as SavedCV[]
}

export async function saveCV(userId: string, title: string, template: string, data: CVData, id?: string): Promise<SavedCV> {
  if (!isSupabaseConfigured) {
    if (id) {
      const i = memCVs.findIndex((c) => c.id === id)
      if (i >= 0) {
        memCVs[i] = { ...memCVs[i], title, template, data, updated_at: new Date().toISOString() }
        return memCVs[i]
      }
    }
    const cv: SavedCV = { id: `mem-${Date.now()}`, user_id: userId, title, template, data, updated_at: new Date().toISOString() }
    memCVs.push(cv)
    return cv
  }
  if (id) {
    const { data: updated, error } = await supabase.from('user_cvs')
      .update({ title, template, data, updated_at: new Date().toISOString() })
      .eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return updated as SavedCV
  }
  const { data: created, error } = await supabase.from('user_cvs')
    .insert({ user_id: userId, title, template, data })
    .select().single()
  if (error) throw new Error(error.message)
  return created as SavedCV
}

export async function deleteCV(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const i = memCVs.findIndex((c) => c.id === id)
    if (i >= 0) memCVs.splice(i, 1)
    return
  }
  const { error } = await supabase.from('user_cvs').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
