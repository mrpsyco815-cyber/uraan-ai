import { isSupabaseConfigured, supabase } from './supabase'

export interface Note {
  id: string
  user_id: string
  title: string
  content: string
  category: string
  updated_at: string
}

const memNotes: Note[] = []

export async function fetchNotes(userId: string): Promise<Note[]> {
  if (!isSupabaseConfigured) return memNotes.filter((n) => n.user_id === userId).sort((a, b) => b.updated_at.localeCompare(a.updated_at))
  const { data, error } = await supabase.from('user_notes').select('*').eq('user_id', userId).order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as Note[]
}

export async function saveNote(userId: string, title: string, content: string, category: string, id?: string): Promise<Note> {
  if (!isSupabaseConfigured) {
    if (id) {
      const i = memNotes.findIndex((n) => n.id === id)
      if (i >= 0) {
        memNotes[i] = { ...memNotes[i], title, content, category, updated_at: new Date().toISOString() }
        return memNotes[i]
      }
    }
    const note: Note = { id: `mem-${Date.now()}`, user_id: userId, title, content, category, updated_at: new Date().toISOString() }
    memNotes.push(note)
    return note
  }
  if (id) {
    const { data, error } = await supabase.from('user_notes')
      .update({ title, content, category, updated_at: new Date().toISOString() })
      .eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return data as Note
  }
  const { data, error } = await supabase.from('user_notes')
    .insert({ user_id: userId, title, content, category })
    .select().single()
  if (error) throw new Error(error.message)
  return data as Note
}

export async function deleteNote(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const i = memNotes.findIndex((n) => n.id === id)
    if (i >= 0) memNotes.splice(i, 1)
    return
  }
  const { error } = await supabase.from('user_notes').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
