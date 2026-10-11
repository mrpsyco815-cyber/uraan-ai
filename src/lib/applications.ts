import { isSupabaseConfigured, supabase } from './supabase'

export type AppStatus = 'interested' | 'applied' | 'documents' | 'interview' | 'offered' | 'accepted' | 'rejected' | 'withdrawn'

export interface Application {
  id: string
  user_id: string
  opportunity_id: string | null
  opportunity_title: string
  status: AppStatus
  notes: string
  checklist: { label: string; done: boolean }[]
  reminder_date: string | null
  created_at: string
  updated_at: string
}

export const PIPELINE: { key: AppStatus; label: string }[] = [
  { key: 'interested', label: 'Interested' },
  { key: 'applied', label: 'Applied' },
  { key: 'documents', label: 'Documents' },
  { key: 'interview', label: 'Interview' },
  { key: 'offered', label: 'Offered' },
  { key: 'accepted', label: 'Accepted' },
]

export const CLOSED: { key: AppStatus; label: string }[] = [
  { key: 'rejected', label: 'Rejected' },
  { key: 'withdrawn', label: 'Withdrawn' },
]

const memStore: Application[] = []

export async function fetchApplications(userId: string): Promise<Application[]> {
  if (!isSupabaseConfigured) return memStore.filter((a) => a.user_id === userId)
  const { data, error } = await supabase.from('applications').select('*').order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as Application[]
}

export async function trackOpportunity(userId: string, opportunityId: string | null, title: string): Promise<Application> {
  if (!isSupabaseConfigured) {
    const existing = memStore.find((a) => a.user_id === userId && a.opportunity_id === opportunityId)
    if (existing) return existing
    const app: Application = {
      id: `mem-${Date.now()}`, user_id: userId, opportunity_id: opportunityId,
      opportunity_title: title, status: 'interested', notes: '', checklist: [],
      reminder_date: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }
    memStore.push(app)
    return app
  }
  const { data, error } = await supabase
    .from('applications')
    .upsert(
      { user_id: userId, opportunity_id: opportunityId, opportunity_title: title, status: 'interested', updated_at: new Date().toISOString() },
      { onConflict: 'user_id,opportunity_id' },
    )
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Application
}

export async function updateApplication(id: string, patch: Partial<Pick<Application, 'status' | 'notes' | 'checklist' | 'reminder_date'>>): Promise<void> {
  if (!isSupabaseConfigured) {
    const app = memStore.find((a) => a.id === id)
    if (app) Object.assign(app, patch, { updated_at: new Date().toISOString() })
    return
  }
  const { error } = await supabase.from('applications').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteApplication(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const i = memStore.findIndex((a) => a.id === id)
    if (i >= 0) memStore.splice(i, 1)
    return
  }
  const { error } = await supabase.from('applications').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function isTracked(userId: string, opportunityId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return memStore.some((a) => a.user_id === userId && a.opportunity_id === opportunityId)
  const { count, error } = await supabase.from('applications').select('id', { count: 'exact', head: true }).eq('opportunity_id', opportunityId)
  if (error) return false
  return (count ?? 0) > 0
}
