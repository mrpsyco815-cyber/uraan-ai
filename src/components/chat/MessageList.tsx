/**
 * Message list: user bubbles, assistant responses with markdown,
 * inline citations [1][2] + sources panel, tool activity feed,
 * streaming caret, copy/retry actions.
 */
import { useState } from 'react'
import type { Citation, GeneratedFileMeta, ToolEvent } from '../../lib/ai/types'
import { Markdown } from './Markdown'
import { FileCard } from './FileCard'

export interface UIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations: Citation[]
  streaming?: boolean
  file?: GeneratedFileMeta
}

interface Props {
  messages: UIMessage[]
  toolEvents: ToolEvent[]
  sending: boolean
  onCopy: (text: string) => void
  onRetry: () => void
  canRetry: boolean
}

function Citations({ citations }: { citations: Citation[] }) {
  const [open, setOpen] = useState(false)
  if (citations.length === 0) return null
  return (
    <div className="mt-2.5">
      <button
        type="button" onClick={() => setOpen(!open)} aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full border transition"
        style={{ borderColor: 'var(--chat-border)', color: 'var(--chat-accent-ink)', background: 'var(--chat-accent-soft)' }}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 3H3v10h10v-3M9 3h4v4M13 3L7 9" /></svg>
        {citations.length} sources {open ? '▲' : '▼'}
      </button>
      {open && (
        <ol className="mt-2 space-y-1.5">
          {citations.map((c) => (
            <li key={c.index} className="text-[13px] rounded-xl border p-2.5" style={{ borderColor: 'var(--chat-border-soft)', background: 'var(--chat-bg-soft)' }}>
              <a href={c.url} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline" style={{ color: 'var(--chat-accent)' }}>
                [{c.index}] {c.title}
              </a>
              <div className="text-[11px] mt-0.5" style={{ color: 'var(--chat-text-3)' }}>{c.domain}</div>
              <p className="mt-1 leading-relaxed" style={{ color: 'var(--chat-text-2)' }}>{c.snippet}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function ToolFeed({ events }: { events: ToolEvent[] }) {
  const active = events.filter((e) => e.state !== 'done' || events.indexOf(e) >= events.length - 3).slice(-4)
  if (active.length === 0) return null
  return (
    <div className="flex flex-col gap-1 mb-1" aria-live="polite">
      {active.map((e, i) => (
        <div key={i} className="inline-flex items-center gap-2 text-xs" style={{ color: 'var(--chat-text-2)' }}>
          {e.state === 'start'
            ? <span aria-hidden><span className="chat-dot" /><span className="chat-dot" /><span className="chat-dot" /></span>
            : e.state === 'error'
              ? <span aria-hidden>⚠️</span>
              : <span aria-hidden style={{ color: 'var(--chat-accent)' }}>✓</span>}
          <span>{e.label}</span>
          {e.detail && <span style={{ color: 'var(--chat-text-3)' }}>· {e.detail}</span>}
        </div>
      ))}
    </div>
  )
}

export function MessageList(p: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  function copy(m: UIMessage) {
    p.onCopy(m.content)
    setCopiedId(m.id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  return (
    <div className="flex flex-col gap-5">
      {p.messages.map((m) => m.role === 'user' ? (
        <div key={m.id} className="flex justify-end">
          <div
            className="max-w-[85%] md:max-w-[75%] rounded-2xl rounded-br-md px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap"
            style={{ background: 'var(--chat-user-bg)', color: 'var(--chat-user-text)' }}
          >
            {m.content}
          </div>
        </div>
      ) : (
        <div key={m.id} className="flex gap-3">
          <div
            className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-sm font-bold mt-0.5"
            style={{ background: 'linear-gradient(135deg, #078b8c, #063b46)' }}
            aria-hidden
          >
            U
          </div>
          <div className="flex-1 min-w-0 max-w-[92%] md:max-w-[85%]">
            <div
              className={`rounded-2xl rounded-tl-md px-4 py-3 border ${m.streaming ? 'chat-caret' : ''}`}
              style={{ background: 'var(--chat-bg)', borderColor: 'var(--chat-border)', boxShadow: 'var(--chat-shadow)' }}
            >
              <Markdown text={m.content || ' '} />
              <Citations citations={m.citations} />
              {m.file && <FileCard file={m.file} />}
            </div>
            {!m.streaming && m.content && (
              <div className="flex items-center gap-1 mt-1.5 ml-1">
                <button
                  type="button" onClick={() => copy(m)} aria-label="Copy response"
                  className="text-[11px] px-2 py-1 rounded-md transition"
                  style={{ color: 'var(--chat-text-3)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--chat-bg-sunken)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  {copiedId === m.id ? '✓ Copied' : 'Copy'}
                </button>
                {p.canRetry && (
                  <button
                    type="button" onClick={p.onRetry} aria-label="Retry response"
                    className="text-[11px] px-2 py-1 rounded-md transition"
                    style={{ color: 'var(--chat-text-3)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--chat-bg-sunken)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    ↻ Retry
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
      {p.sending && p.messages[p.messages.length - 1]?.role !== 'assistant' && (
        <div className="flex gap-3" aria-live="polite" aria-label="Assistant is working">
          <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-sm font-bold" style={{ background: 'linear-gradient(135deg, #078b8c, #063b46)' }} aria-hidden>U</div>
          <div className="flex-1">
            <ToolFeed events={p.toolEvents} />
            {p.toolEvents.length === 0 && (
              <span aria-hidden><span className="chat-dot" /><span className="chat-dot" /><span className="chat-dot" /></span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
