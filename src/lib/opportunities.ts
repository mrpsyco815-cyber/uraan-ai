import { isSupabaseConfigured, supabase } from './supabase'
import { sampleOpportunities, type Opportunity as SampleOpportunity } from '../data/opportunities'

export interface Opportunity {
  id: string
  title: string
  type: string
  country: string
  level: string
  funding: string
  deadline: string | null
  summary: string
  official_url: string
  status: 'draft' | 'pending_review' | 'published' | 'expired' | 'closed'
  sample?: boolean
}

function toApp(o: SampleOpportunity): Opportunity {
  return {
    id: o.id, title: o.title, type: o.type, country: o.country, level: o.level,
    funding: o.funding, deadline: o.deadline, summary: o.summary,
    official_url: '', status: o.status === 'verified' ? 'published' : o.status === 'pending' ? 'pending_review' : 'expired',
    sample: true,
  }
}

/** Published opportunities — live from Supabase when configured, sample data otherwise. */
export async function fetchPublished(): Promise<{ data: Opportunity[]; live: boolean }> {
  if (!isSupabaseConfigured) {
    return { data: sampleOpportunities.map(toApp), live: false }
  }
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('status', 'published')
    .order('deadline', { ascending: true, nullsFirst: false })
  if (error || !data || data.length === 0) {
    return { data: sampleOpportunities.map(toApp), live: false }
  }
  return { data: data as Opportunity[], live: true }
}

/** Admin: all opportunities regardless of status. */
export async function fetchAllAdmin(): Promise<Opportunity[]> {
  const { data, error } = await supabase.from('opportunities').select('*').order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as Opportunity[]
}

export async function setStatus(id: string, status: Opportunity['status'], actorId: string): Promise<void> {
  const { error } = await supabase
    .from('opportunities')
    .update({ status, verified_at: status === 'published' ? new Date().toISOString() : null, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
  await supabase.from('audit_logs').insert({
    actor_id: actorId, action: `opportunity.${status}`, entity: 'opportunity', entity_id: id, meta: { status },
  })
}

export async function saveOpportunity(o: Partial<Opportunity> & { title: string }, actorId: string): Promise<void> {
  const payload = {
    title: o.title, type: o.type ?? 'Scholarship', country: o.country ?? '', level: o.level ?? '',
    funding: o.funding ?? '', deadline: o.deadline || null, summary: o.summary ?? '',
    official_url: o.official_url ?? '', status: o.status ?? 'draft',
    updated_at: new Date().toISOString(),
  }
  let entityId = o.id
  if (o.id) {
    const { error } = await supabase.from('opportunities').update(payload).eq('id', o.id)
    if (error) throw new Error(error.message)
  } else {
    const { data, error } = await supabase.from('opportunities').insert({ ...payload, created_by: actorId }).select('id').single()
    if (error) throw new Error(error.message)
    entityId = data.id
  }
  await supabase.from('audit_logs').insert({
    actor_id: actorId, action: o.id ? 'opportunity.update' : 'opportunity.create',
    entity: 'opportunity', entity_id: entityId, meta: { title: o.title },
  })
}
