import { isSupabaseConfigured, supabase } from './supabase'

export type ResourceType = 'guide' | 'template' | 'video' | 'link'

export interface Resource {
  id: string
  title: string
  description: string
  type: ResourceType
  category: string
  url: string
  published: boolean
}

const memResources: Resource[] = [
  { id: 'mem-r1', title: 'English Learning Path', description: 'From basics to IELTS-ready, step by step.', type: 'guide', category: 'Language', url: '', published: true },
  { id: 'mem-r2', title: 'Programming Learning Path', description: 'Python, web development, and CS fundamentals.', type: 'guide', category: 'Skills', url: '', published: true },
  { id: 'mem-r3', title: 'Mathematics Resources', description: 'Concept videos, practice sets, and exam prep.', type: 'guide', category: 'Academics', url: '', published: true },
  { id: 'mem-r4', title: 'SOP Writing Guide', description: 'How to write a statement of purpose that stands out.', type: 'guide', category: 'Applications', url: '', published: true },
  { id: 'mem-r5', title: 'CV Builder Guide', description: 'Build a clean, honest academic CV.', type: 'template', category: 'Career', url: '', published: true },
  { id: 'mem-r6', title: 'Interview Preparation', description: 'Common questions and how to answer them well.', type: 'guide', category: 'Career', url: '', published: true },
]

export async function fetchResources(): Promise<{ data: Resource[]; live: boolean }> {
  if (!isSupabaseConfigured) return { data: memResources, live: false }
  const { data, error } = await supabase.from('resources').select('*').eq('published', true).order('category')
  if (error || !data || data.length === 0) return { data: memResources, live: false }
  return { data: data as Resource[], live: true }
}

export async function fetchAllResourcesAdmin(): Promise<Resource[]> {
  const { data, error } = await supabase.from('resources').select('*').order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as Resource[]
}

export async function saveResource(r: Partial<Resource> & { title: string }, actorId: string): Promise<void> {
  const payload = {
    title: r.title, description: r.description ?? '', type: r.type ?? 'guide',
    category: r.category ?? 'General', url: r.url ?? '', published: r.published ?? false,
    updated_at: new Date().toISOString(),
  }
  if (r.id && !r.id.startsWith('mem-')) {
    const { error } = await supabase.from('resources').update(payload).eq('id', r.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase.from('resources').insert({ ...payload, created_by: actorId })
    if (error) throw new Error(error.message)
  }
}

export async function deleteResource(id: string): Promise<void> {
  const { error } = await supabase.from('resources').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
