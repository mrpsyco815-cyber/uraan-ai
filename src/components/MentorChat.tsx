import { useEffect, useRef, useState } from 'react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { TextInput } from './ui/fields'
import { useAuth } from '../context/AuthContext'
import { fetchMessages, markMessagesRead, sendChatMessage, subscribeToChat, type ChatMessage } from '../lib/chat'
import { checkRateLimit, LIMITS, rateLimitError } from '../lib/rateLimit'

/** Real-time chat for an accepted mentorship. */
export function MentorChat({ requestId, otherName }: { requestId: string; otherName: string }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    fetchMessages(requestId)
      .then((msgs) => {
        if (cancelled) return
        setMessages(msgs)
        markMessagesRead(requestId, user.id).catch(() => {})
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : 'Failed to load messages.'))
    const unsub = subscribeToChat(requestId, (m) => {
      setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]))
      if (m.sender_id !== user.id) markMessagesRead(requestId, user.id).catch(() => {})
    })
    return () => {
      cancelled = true
      unsub()
    }
  }, [requestId, user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    if (!user || !input.trim() || sending) return
    const rl = checkRateLimit(`chat-${user.id}`, LIMITS.chat.max, LIMITS.chat.windowMs)
    if (!rl.allowed) {
      setError(rateLimitError(rl.retryAfterMs))
      return
    }
    setSending(true)
    setError(null)
    try {
      const msg = await sendChatMessage(requestId, user.id, input)
      setMessages((prev) => (prev.some((x) => x.id === msg.id) ? prev : [...prev, msg]))
      setInput('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Send failed.')
    }
    setSending(false)
  }

  return (
    <Card className="p-0 overflow-hidden">
      <div className="px-5 py-3 border-b border-line bg-surface-2">
        <p className="font-semibold text-ink text-sm">💬 Chat with {otherName}</p>
        <p className="text-xs text-muted">Messages are private between you two.</p>
      </div>
      <div className="h-72 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted py-8">
            No messages yet — say salam and introduce yourself! 👋
          </p>
        )}
        {messages.map((m) => {
          const mine = user && m.sender_id === user.id
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${mine ? 'bg-primary-teal text-white' : 'bg-surface-2 text-ink border border-line'}`}>
                <p className="whitespace-pre-line">{m.body}</p>
                <p className={`text-[10px] mt-1 ${mine ? 'text-white/70' : 'text-muted'}`}>
                  {new Date(m.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      {error && <p className="px-4 text-xs text-error" role="alert">{error}</p>}
      <form
        onSubmit={(e) => { e.preventDefault(); send() }}
        className="flex gap-2 p-3 border-t border-line"
      >
        <div className="flex-1">
          <TextInput id={`chat-${requestId}`} label="Message" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message…" />
        </div>
        <div className="pt-7">
          <Button type="submit" size="sm" loading={sending}>Send</Button>
        </div>
      </form>
    </Card>
  )
}
