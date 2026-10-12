/**
 * Chat composer: multiline input, send/stop, attachments (PDF/txt/md),
 * Enter-to-send, Shift+Enter newline, smart-mode toggle, doc chips.
 */
import { useEffect, useRef, useState } from 'react'
import type { AttachedDoc } from '../../lib/ai/types'
import { extractDocument } from '../../lib/ai/documents'

interface Props {
  onSend: (text: string, docs: AttachedDoc[]) => void
  onStop: () => void
  sending: boolean
  smartReady: boolean
  smartLoading: boolean
  smartProgress: number
  onToggleSmart: () => void
  disabled?: boolean
}

export function Composer(p: Props) {
  const [text, setText] = useState('')
  const [docs, setDocs] = useState<AttachedDoc[]>([])
  const [docError, setDocError] = useState<string | null>(null)
  const [parsing, setParsing] = useState(false)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Auto-grow
  useEffect(() => {
    const ta = taRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = `${Math.min(ta.scrollHeight, 180)}px`
    }
  }, [text])

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setDocError(null)
    setParsing(true)
    try {
      const next: AttachedDoc[] = []
      for (const f of Array.from(files).slice(0, 3)) {
        if (f.size > 10 * 1024 * 1024) {
          setDocError(`"${f.name}" bohat bari hai (max 10MB).`)
          continue
        }
        next.push(await extractDocument(f))
      }
      setDocs((d) => [...d, ...next].slice(0, 3))
    } catch (e) {
      setDocError(e instanceof Error ? e.message : 'File parhne mein masla hua.')
    }
    setParsing(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  function send() {
    const t = text.trim()
    if ((!t && docs.length === 0) || p.sending || p.disabled) return
    p.onSend(t, docs)
    setText('')
    setDocs([])
    setDocError(null)
  }

  return (
    <div className="w-full">
      {/* Doc chips */}
      {(docs.length > 0 || docError || parsing) && (
        <div className="flex flex-wrap gap-2 mb-2" aria-live="polite">
          {parsing && <span className="text-xs px-2.5 py-1.5 rounded-full" style={{ background: 'var(--chat-bg-sunken)', color: 'var(--chat-text-2)' }}>📄 Parh raha hun…</span>}
          {docs.map((d, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 text-xs pl-2.5 pr-1.5 py-1.5 rounded-full border" style={{ borderColor: 'var(--chat-border)', background: 'var(--chat-bg-soft)', color: 'var(--chat-text)' }}>
              📄 <span className="max-w-40 truncate">{d.name}</span>
              {d.truncated && <span style={{ color: 'var(--chat-text-3)' }}>(trimmed)</span>}
              <button type="button" aria-label={`Remove ${d.name}`} onClick={() => setDocs(docs.filter((_, j) => j !== i))} className="p-0.5 rounded-full" style={{ color: 'var(--chat-text-3)' }}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4l8 8M12 4l-8 8" /></svg>
              </button>
            </span>
          ))}
          {docError && <span className="text-xs px-2.5 py-1.5 rounded-full" role="alert" style={{ background: '#fdecec', color: 'var(--color-error)' }}>{docError}</span>}
        </div>
      )}

      {/* Smart mode toggle */}
      <div className="flex items-center gap-2 mb-2">
        <button
          type="button" onClick={p.onToggleSmart} aria-pressed={p.smartReady}
          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border transition"
          style={p.smartReady
            ? { borderColor: 'var(--chat-accent)', background: 'var(--chat-accent-soft)', color: 'var(--chat-accent-ink)', fontWeight: 600 }
            : { borderColor: 'var(--chat-border)', color: 'var(--chat-text-2)' }}
          title="On-device AI (~1GB download once). Bina is ke bhi tez jawab milte hain."
        >
          🧠 Smart Mode {p.smartReady ? 'on' : 'off'}
        </button>
        {p.smartLoading && (
          <span className="text-xs" style={{ color: 'var(--chat-text-2)' }} aria-live="polite">
            Model download ho raha hai… {Math.round(p.smartProgress * 100)}%
            <span className="inline-block ml-2 w-24 h-1.5 rounded-full align-middle" style={{ background: 'var(--chat-bg-sunken)' }}>
              <span className="block h-full rounded-full transition-all" style={{ width: `${p.smartProgress * 100}%`, background: 'var(--chat-accent)' }} />
            </span>
          </span>
        )}
      </div>

      {/* Input row */}
      <div
        className="flex items-end gap-2 rounded-2xl border p-2 pl-3 transition"
        style={{ borderColor: 'var(--chat-border)', background: 'var(--chat-bg)', boxShadow: 'var(--chat-shadow)' }}
      >
        <input
          ref={fileRef} type="file" accept=".pdf,.txt,.md,.markdown" multiple
          className="hidden" aria-label="Attach PDF or text file"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <button
          type="button" onClick={() => fileRef.current?.click()} aria-label="Attach document (PDF or text)"
          className="p-2.5 rounded-xl shrink-0 transition min-w-11 min-h-11"
          style={{ color: 'var(--chat-text-2)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--chat-bg-sunken)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M10 13V3m0 0L6 7m4-4l4 4" /><path d="M4 13v3a1 1 0 001 1h10a1 1 0 001-1v-3" /></svg>
        </button>
        <textarea
          ref={taRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send() }
          }}
          placeholder="Kuch poocho… (search: likho web research ke liye)"
          aria-label="Message"
          rows={1}
          disabled={p.disabled}
          className="flex-1 resize-none bg-transparent outline-none text-[15px] py-2.5 max-h-44 chat-scroll"
          style={{ color: 'var(--chat-text)' }}
        />
        {p.sending ? (
          <button
            type="button" onClick={p.onStop} aria-label="Stop generating"
            className="p-2.5 rounded-xl shrink-0 text-white min-w-11 min-h-11"
            style={{ background: 'var(--color-error)' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="3" y="3" width="10" height="10" rx="1.5" /></svg>
          </button>
        ) : (
          <button
            type="button" onClick={send} aria-label="Send message"
            disabled={(!text.trim() && docs.length === 0) || p.disabled}
            className="p-2.5 rounded-xl shrink-0 text-white transition min-w-11 min-h-11 disabled:opacity-40"
            style={{ background: 'var(--chat-accent)' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 8l12-5-4 12-3-5-5-2z" strokeLinejoin="round" /></svg>
          </button>
        )}
      </div>
      <p className="text-[11px] mt-1.5 text-center" style={{ color: 'var(--chat-text-3)' }}>
        Enter = bhejo · Shift+Enter = nayi line · 🔍 <code>search:</code> se web research
      </p>
    </div>
  )
}
