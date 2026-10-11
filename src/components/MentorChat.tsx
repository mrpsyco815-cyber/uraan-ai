import { useEffect, useRef, useState } from 'react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { TextInput } from './ui/fields'
import { useAuth } from '../context/AuthContext'
import { fetchMessages, markMessagesRead, sendChatMessage, subscribeToChat, type ChatMessage } from '../lib/chat'
import { checkRateLimit, LIMITS, rateLimitError } from '../lib/rateLimit'
import { blockUser, isBlocked, reportUser, unblockUser } from '../lib/safety'

/** Real-time chat for an accepted mentorship. */
export function MentorChat({ requestId, otherName, otherUserId }: { requestId: string; otherName: string; otherUserId?: string }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDone, setReportDone] = useState(false)
  const [blocked, setBlocked] = useState(false)
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

  useEffect(() => {
    if (!user || !otherUserId) return
    isBlocked(user.id, otherUserId).then(setBlocked).catch(() => {})
  }, [user, otherUserId])

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
      <div className="px-5 py-3 border-b border-line bg-surface-2 flex items-center justify-between">
        <div>
          <p className="font-semibold text-ink text-sm">💬 Chat with {otherName}</p>
          <p className="text-xs text-muted">Messages are private between you two.</p>
        </div>
        {otherUserId && user && (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setShowReport(!showReport)}>
              {showReport ? 'Cancel' : '⚠️ Report'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                try {
                  if (blocked) {
                    await unblockUser(user.id, otherUserId)
                    setBlocked(false)
                  } else {
                    await blockUser(user.id, otherUserId)
                    setBlocked(true)
                  }
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Failed.')
                }
              }}
            >
              {blocked ? 'Unblock' : '🚫 Block'}
            </Button>
          </div>
        )}
      </div>

      {showReport && otherUserId && user && (
        <div className="p-4 border-b border-line bg-warning/5">
          {reportDone ? (
            <p className="text-sm text-green-600">✓ Report submitted. Our team will review it.</p>
          ) : (
            <>
              <p className="text-sm font-medium text-ink mb-2">Report {otherName}</p>
              <div className="mb-3">
                <TextInput id="report-reason" label="What happened?" value={reportReason} onChange={(e) => setReportReason(e.target.value)} placeholder="Describe the issue…" />
              </div>
              <Button
                size="sm"
                onClick={async () => {
                  try {
                    await reportUser(user.id, otherUserId, reportReason, requestId)
                    setReportDone(true)
                    setShowReport(false)
                  } catch (e) {
                    setError(e instanceof Error ? e.message : 'Report failed.')
                  }
                }}
              >
                Submit report
              </Button>
            </>
          )}
        </div>
      )}

      {blocked ? (
        <div className="p-8 text-center">
          <p className="text-sm text-muted">You have blocked this user. Unblock to continue chatting.</p>
        </div>
      ) : (
      <>
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
      </>
      )}
    </Card>
  )
}
