import { isSupabaseConfigured, supabase } from './supabase'

export interface ChatMessage {
  id: string
  request_id: string
  sender_id: string
  body: string
  read: boolean
  created_at: string
}

const memChats: Record<string, ChatMessage[]> = {}

export async function fetchMessages(requestId: string): Promise<ChatMessage[]> {
  if (!isSupabaseConfigured) return memChats[requestId] ?? []
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('request_id', requestId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as ChatMessage[]
}

export async function sendChatMessage(requestId: string, senderId: string, body: string): Promise<ChatMessage> {
  const trimmed = body.trim()
  if (!trimmed) throw new Error('Message is empty.')
  if (!isSupabaseConfigured) {
    const msg: ChatMessage = {
      id: `mem-c${Date.now()}`, request_id: requestId, sender_id: senderId,
      body: trimmed, read: false, created_at: new Date().toISOString(),
    }
    ;(memChats[requestId] ??= []).push(msg)
    return msg
  }
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ request_id: requestId, sender_id: senderId, body: trimmed })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as ChatMessage
}

export async function markMessagesRead(requestId: string, userId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    for (const m of memChats[requestId] ?? []) {
      if (m.sender_id !== userId) m.read = true
    }
    return
  }
  await supabase.from('chat_messages').update({ read: true }).eq('request_id', requestId).neq('sender_id', userId)
}

/** Subscribe to new messages in real time. Returns an unsubscribe function. */
export function subscribeToChat(requestId: string, onMessage: (m: ChatMessage) => void): () => void {
  if (!isSupabaseConfigured) return () => {}
  const channel = supabase
    .channel(`chat-${requestId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `request_id=eq.${requestId}` },
      (payload) => onMessage(payload.new as ChatMessage),
    )
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}
