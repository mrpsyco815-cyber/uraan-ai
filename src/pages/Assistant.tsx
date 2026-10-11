import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { TextInput } from '../components/ui/fields'
import { SectionHeading } from '../components/ui/states'
import { sendMessage, type ChatMessage } from '../lib/assistant'
import { checkRateLimit, LIMITS, rateLimitError } from '../lib/rateLimit'

/** Minimal safe markdown: **bold** only. No HTML injection. */
function renderRich(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}

const STARTERS = [
  'Help me plan my study week',
  'How do I write a strong SOP?',
  'Mock interview for a scholarship',
  'Explain a concept simply',
]

export function Assistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        "Hello! I'm your URAAN AI study helper. I can explain concepts, build study plans, review SOP drafts, and prep you for interviews.\n\nI never invent scholarships or deadlines — for verified opportunities, check the Opportunities directory.",
    },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    const rl = checkRateLimit('ai-assistant', LIMITS.ai.max, LIMITS.ai.windowMs)
    if (!rl.allowed) {
      setError(rateLimitError(rl.retryAfterMs))
      return
    }
    setError(null)
    const next = [...messages, { role: 'user' as const, content: trimmed }]
    setMessages(next)
    setInput('')
    setSending(true)
    try {
      const reply = await sendMessage(next)
      setMessages([...next, { role: 'assistant', content: reply }])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    }
    setSending(false)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <SectionHeading
        kicker="AI Helper"
        title="Study assistant"
        subtitle="Real AI — study help, SOP feedback, interview prep."
      />

      <div className="mb-6 flex items-center gap-2">
        <Badge tone="verified">● Live AI</Badge>
        <p className="text-xs text-muted">
          Powered by real AI — ask anything about studying, SOPs, or interviews.
        </p>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="h-[480px] overflow-y-auto p-6 space-y-4 bg-surface-2">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-line ${
                  m.role === 'user' ? 'bg-primary-teal text-white' : 'bg-white border border-line text-ink'
                }`}
              >
                {renderRich(m.content)}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-white border border-line rounded-2xl px-4 py-3 text-sm text-muted animate-pulse">
                Thinking…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <p className="px-6 pt-3 text-sm text-error" role="alert">{error}</p>
        )}

        <div className="p-4 border-t border-line">
          <div className="flex flex-wrap gap-2 mb-3">
            {STARTERS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-xs px-3 py-1.5 rounded-full border border-line text-muted hover:border-primary-teal hover:text-primary-teal transition"
              >
                {s}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); send(input) }}
            className="flex gap-2"
          >
            <div className="flex-1">
              <TextInput id="chat" label="Ask anything" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your question…" />
            </div>
            <div className="pt-7">
              <Button type="submit" loading={sending}>Send</Button>
            </div>
          </form>
        </div>
      </Card>

      <p className="text-xs text-muted mt-4 text-center">
        AI can be wrong — verify important details. It will never invent scholarships, deadlines, or official links.
      </p>
      <p className="text-[11px] text-muted mt-2 text-center max-w-xl mx-auto">
        🔒 Privacy: your messages are sent to an AI service to generate responses. Don't share sensitive personal information like CNIC numbers, passwords, or bank details.
      </p>
    </div>
  )
}
