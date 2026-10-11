import { isSupabaseConfigured, supabase } from './supabase'

export interface Mentor {
  id: string
  user_id: string
  display_name: string
  bio: string
  expertise: string[]
  languages: string[]
  country: string
  years_experience: number
  verified: boolean
  available: boolean
}

export interface MentorshipRequest {
  id: string
  student_id: string
  mentor_user_id: string
  message: string
  status: 'pending' | 'accepted' | 'declined' | 'completed'
  created_at: string
}

const memMentors: Mentor[] = [
  {
    id: 'mem-m1', user_id: 'mem-u1', display_name: 'Dr. Ayesha Rahman',
    bio: 'PhD in Computer Science, TU Munich. DAAD scholar 2019. I help Pakistani students with German university applications and SOPs.',
    expertise: ['Computer Science', 'Germany', 'DAAD', 'SOP Review'], languages: ['en', 'ur'],
    country: 'Germany', years_experience: 6, verified: true, available: true,
  },
  {
    id: 'mem-m2', user_id: 'mem-u2', display_name: 'Bilal Ahmed',
    bio: 'Fulbright alum, MS Electrical Engineering at Georgia Tech. I mentor on US applications, GRE prep, and funding strategies.',
    expertise: ['Electrical Engineering', 'USA', 'Fulbright', 'GRE'], languages: ['en', 'roman'],
    country: 'USA', years_experience: 4, verified: true, available: true,
  },
  {
    id: 'mem-m3', user_id: 'mem-u3', display_name: 'Fatima Khan',
    bio: 'Chevening scholar, MSc Public Policy at LSE. Passionate about helping women in STEM apply to UK universities.',
    expertise: ['Public Policy', 'UK', 'Chevening', 'Women in STEM'], languages: ['en', 'ur'],
    country: 'UK', years_experience: 5, verified: true, available: false,
  },
]
const memRequests: MentorshipRequest[] = []

export async function fetchMentors(): Promise<{ data: Mentor[]; live: boolean }> {
  if (!isSupabaseConfigured) return { data: memMentors.filter((m) => m.verified), live: false }
  const { data, error } = await supabase.from('mentor_profiles').select('*').eq('verified', true).eq('available', true)
  if (error || !data || data.length === 0) return { data: memMentors.filter((m) => m.verified), live: false }
  return { data: data as Mentor[], live: true }
}

export async function fetchMentor(id: string): Promise<Mentor | null> {
  if (!isSupabaseConfigured) return memMentors.find((m) => m.id === id) ?? null
  const { data, error } = await supabase.from('mentor_profiles').select('*').eq('id', id).single()
  if (error) return null
  return data as Mentor
}

/** Simple matching score: overlap between mentor expertise and student interests. */
export function matchScore(mentor: Mentor, interests: string[]): number {
  if (interests.length === 0) return 0
  const exp = mentor.expertise.map((e) => e.toLowerCase())
  return interests.filter((i) => exp.some((e) => e.includes(i.toLowerCase()) || i.toLowerCase().includes(e))).length
}

export async function saveMentorProfile(userId: string, profile: Partial<Mentor>): Promise<void> {
  if (!isSupabaseConfigured) {
    const existing = memMentors.find((m) => m.user_id === userId)
    if (existing) Object.assign(existing, profile)
    else memMentors.push({ id: `mem-${Date.now()}`, user_id: userId, display_name: '', bio: '', expertise: [], languages: ['en'], country: '', years_experience: 0, verified: false, available: true, ...profile })
    return
  }
  const { error } = await supabase.from('mentor_profiles').upsert(
    { user_id: userId, ...profile, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' },
  )
  if (error) throw new Error(error.message)
}

export async function getMyMentorProfile(userId: string): Promise<Mentor | null> {
  if (!isSupabaseConfigured) return memMentors.find((m) => m.user_id === userId) ?? null
  const { data } = await supabase.from('mentor_profiles').select('*').eq('user_id', userId).single()
  return (data as Mentor) ?? null
}

export async function requestMentorship(studentId: string, mentorUserId: string, message: string): Promise<void> {
  if (!isSupabaseConfigured) {
    memRequests.push({ id: `mem-r${Date.now()}`, student_id: studentId, mentor_user_id: mentorUserId, message, status: 'pending', created_at: new Date().toISOString() })
    return
  }
  const { error } = await supabase.from('mentorship_requests').insert({ student_id: studentId, mentor_user_id: mentorUserId, message })
  if (error) throw new Error(error.message)
}

export async function fetchMyRequests(userId: string): Promise<{ asStudent: MentorshipRequest[]; asMentor: MentorshipRequest[] }> {
  if (!isSupabaseConfigured) {
    return {
      asStudent: memRequests.filter((r) => r.student_id === userId),
      asMentor: memRequests.filter((r) => r.mentor_user_id === userId),
    }
  }
  const { data, error } = await supabase.from('mentorship_requests').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  const all = (data ?? []) as MentorshipRequest[]
  return { asStudent: all.filter((r) => r.student_id === userId), asMentor: all.filter((r) => r.mentor_user_id === userId) }
}

export async function setRequestStatus(id: string, status: MentorshipRequest['status']): Promise<void> {
  if (!isSupabaseConfigured) {
    const r = memRequests.find((x) => x.id === id)
    if (r) r.status = status
    return
  }
  const { error } = await supabase.from('mentorship_requests').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
}
