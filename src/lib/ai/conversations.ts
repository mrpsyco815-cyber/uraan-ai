/**
 * URAAN AI — conversation persistence.
 * Supabase (ai_conversations / ai_messages) when available,
 * localStorage fallback for guests or when tables are missing.
 * Never exposes another user's data: all queries are user-scoped.
 */

import { isSupabaseConfigured, supabase } from '../supabase'
import type { Citation } from './types'

export interface Conversation {
  id: string
  title: string
  updatedAt: string
}

export interface StoredMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations: Citation[]
  createdAt: string
}

const LS_KEY = 'uraan-ai-conversations-v1'

interface LSStore { conversations: (Conversation & { messages: StoredMessage[] })[] }

function lsLoad(): LSStore {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '{"conversations":[]}')
  } catch { return { conversations: [] } }
}
function lsSave(s: LSStore): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)) } catch { /* quota */ }
}

async function tablesExist(): Promise<boolean> {
  if (!isSupabaseConfigured) return false
  const { error } = await supabase.from('ai_conversations').select('id', { count: 'exact', head: true })
  return !error
}

let useRemote: boolean | null = null
async function remote(): Promise<boolean> {
  if (useRemote === null) {
    try { useRemote = await tablesExist() } catch { useRemote = false }
  }
  return useRemote
}

/** List conversations (newest first). */
export async function listConversations(): Promise<Conversation[]> {
  if (await remote()) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return lsList()
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('id,title,updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(50)
    if (error) return lsList()
    return (data ?? []).map((c) => ({ id: c.id, title: c.title, updatedAt: c.updated_at }))
  }
  return lsList()
}
function lsList(): Conversation[] {
  return lsLoad().conversations
    .map((c) => ({ id: c.id, title: c.title, updatedAt: c.updatedAt }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

/** Create a conversation, returns id. */
export async function createConversation(title = 'New chat'): Promise<string> {
  if (await remote()) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data, error } = await supabase
        .from('ai_conversations').insert({ user_id: user.id, title }).select('id').single()
      if (!error && data) return data.id
    }
  }
  const store = lsLoad()
  const id = `local-${Date.now()}`
  store.conversations.unshift({ id, title, updatedAt: new Date().toISOString(), messages: [] })
  lsSave(store)
  return id
}

/** Load messages for a conversation. */
export async function loadMessages(conversationId: string): Promise<StoredMessage[]> {
  if (conversationId.startsWith('local-') || !(await remote())) {
    return lsLoad().conversations.find((c) => c.id === conversationId)?.messages ?? []
  }
  const { data, error } = await supabase
    .from('ai_messages')
    .select('id,role,content,citations,created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
  if (error) return []
  return (data ?? []).map((m) => ({
    id: m.id, role: m.role, content: m.content,
    citations: (m.citations ?? []) as Citation[], createdAt: m.created_at,
  }))
}

/** Append a message. */
export async function saveMessage(
  conversationId: string, role: 'user' | 'assistant', content: string, citations: Citation[] = [],
): Promise<void> {
  if (conversationId.startsWith('local-') || !(await remote())) {
    const store = lsLoad()
    const conv = store.conversations.find((c) => c.id === conversationId)
    if (conv) {
      conv.messages.push({ id: `m-${Date.now()}`, role, content, citations, createdAt: new Date().toISOString() })
      conv.updatedAt = new Date().toISOString()
      lsSave(store)
    }
    return
  }
  await supabase.from('ai_messages').insert({ conversation_id: conversationId, role, content, citations })
}

/** Rename (owner-only via RLS). */
export async function renameConversation(id: string, title: string): Promise<void> {
  const t = title.trim().slice(0, 80) || 'New chat'
  if (id.startsWith('local-') || !(await remote())) {
    const store = lsLoad()
    const conv = store.conversations.find((c) => c.id === id)
    if (conv) { conv.title = t; lsSave(store) }
    return
  }
  await supabase.from('ai_conversations').update({ title: t }).eq('id', id)
}

/** Delete with all messages (cascade). */
export async function deleteConversation(id: string): Promise<void> {
  if (id.startsWith('local-') || !(await remote())) {
    const store = lsLoad()
    store.conversations = store.conversations.filter((c) => c.id !== id)
    lsSave(store)
    return
  }
  await supabase.from('ai_conversations').delete().eq('id', id)
}

/** Auto-title from the first user message. */
export function autoTitle(text: string): string {
  const t = text.trim().replace(/\s+/g, ' ')
  return t.length > 42 ? `${t.slice(0, 42)}…` : t || 'New chat'
}
