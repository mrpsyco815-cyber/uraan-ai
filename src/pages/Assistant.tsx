/**
 * URAAN AI Assistant — premium chat experience.
 * Sidebar + welcome + composer + streaming + citations + themes + persistence.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Sidebar } from '../components/chat/Sidebar'
import { Composer } from '../components/chat/Composer'
import { MessageList, type UIMessage } from '../components/chat/MessageList'
import { WelcomeScreen } from '../components/chat/WelcomeScreen'
import type { AttachedDoc, ChatMsg, Citation, ToolEvent } from '../lib/ai/types'
import { runAssistant } from '../lib/ai/engine'
import { isSmartReady, loadSmartMode, smartLoadError } from '../lib/ai/webllm'
import {
  autoTitle, createConversation, deleteConversation, listConversations,
  loadMessages, renameConversation, saveMessage, type Conversation,
} from '../lib/ai/conversations'
import { checkRateLimit, LIMITS, rateLimitError } from '../lib/rateLimit'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

type Theme = 'light' | 'dark'

function detectRtl(text: string): boolean {
  const urdu = (text.match(/[\u0600-\u06FF]/g) ?? []).length
  return urdu > text.length * 0.3
}

export function Assistant() {
  const [theme, setTheme] = useState<Theme>(() =>
    (localStorage.getItem('uraan-theme') as Theme) || 'light',
  )
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<UIMessage[]>([])
  const [toolEvents, setToolEvents] = useState<ToolEvent[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [smartReady, setSmartReady] = useState(isSmartReady())
  const [smartLoading, setSmartLoading] = useState(false)
  const [smartProgress, setSmartProgress] = useState(0)
  const [userName, setUserName] = useState<string>()

  const signalRef = useRef({ cancelled: false })
  const bottomRef = useRef<HTMLDivElement>(null)
  const activeIdRef = useRef<string | null>(null)
  activeIdRef.current = activeId

  // Theme
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('uraan-theme', theme)
  }, [theme])

  // Load conversations + user
  useEffect(() => {
    listConversations().then(setConversations).catch(() => {})
    if (isSupabaseConfigured) {
      supabase.auth.getUser().then(({ data }) => {
        const name = data.user?.user_metadata?.full_name ?? data.user?.email?.split('@')[0]
        if (name) setUserName(name.split(' ')[0])
      }).catch(() => {})
    }
  }, [])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, toolEvents])

  const refreshList = useCallback(async () => {
    try { setConversations(await listConversations()) } catch { /* noop */ }
  }, [])

  const openConversation = useCallback(async (id: string) => {
    setActiveId(id)
    setMobileOpen(false)
    setError(null)
    setToolEvents([])
    try {
      const stored = await loadMessages(id)
      setMessages(stored.map((m) => ({
        id: m.id, role: m.role, content: m.content, citations: m.citations,
      })))
    } catch {
      setMessages([])
    }
  }, [])

  const newChat = useCallback(() => {
    signalRef.current.cancelled = true
    setSending(false)
    setActiveId(null)
    setMessages([])
    setToolEvents([])
    setError(null)
    setMobileOpen(false)
  }, [])

  const toggleSmart = useCallback(async () => {
    if (isSmartReady()) return // keep on; toggle off not needed (no cost when idle)
    if (smartLoading) return
    setSmartLoading(true)
    setSmartProgress(0)
    setError(null)
    try {
      await loadSmartMode((p) => setSmartProgress(p.progress))
      setSmartReady(true)
    } catch {
      setError(smartLoadError() ?? 'Smart Mode load nahi hua. Internet check karo aur dobara try karo.')
    }
    setSmartLoading(false)
  }, [smartLoading])

  const send = useCallback(async (text: string, docs: AttachedDoc[]) => {
    const trimmed = text.trim()
    if ((!trimmed && docs.length === 0) || sending) return

    const rl = checkRateLimit('ai-assistant', LIMITS.ai.max, LIMITS.ai.windowMs)
    if (!rl.allowed) { setError(rateLimitError(rl.retryAfterMs)); return }
    setError(null)
    signalRef.current = { cancelled: false }

    // Ensure a conversation exists
    let convId = activeIdRef.current
    const isNew = !convId
    if (!convId) {
      convId = await createConversation(autoTitle(trimmed || docs[0]?.name || 'Document chat'))
      setActiveId(convId)
      refreshList()
    }

    const userMsg: UIMessage = {
      id: `u-${Date.now()}`, role: 'user',
      content: trimmed + (docs.length > 0 ? `\n\n📎 ${docs.map((d) => d.name).join(', ')}` : ''),
      citations: [],
    }
    // History for the engine (without attachment markers)
    const history: ChatMsg[] = [
      ...messages.filter((m) => !m.streaming).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: trimmed || `(document attached: ${docs.map((d) => d.name).join(', ')})` },
    ]

    const assistantMsg: UIMessage = {
      id: `a-${Date.now()}`, role: 'assistant', content: '', citations: [], streaming: true,
    }
    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setToolEvents([])
    setSending(true)

    // Persist user message (don't block streaming)
    saveMessage(convId, 'user', userMsg.content).catch(() => {})

    let acc = ''
    let finalCitations: Citation[] = []
    const isCancelled = () => signalRef.current.cancelled

    try {
      await runAssistant(
        { history, docs, signal: signalRef.current },
        {
          onToken: (t) => {
            acc += t
            setMessages((prev) => prev.map((m) => m.id === assistantMsg.id ? { ...m, content: acc } : m))
          },
          onToolEvent: (ev) => setToolEvents((prev) => [...prev.slice(-9), ev]),
          onDone: (result) => {
            finalCitations = result.citations
            setMessages((prev) => prev.map((m) =>
              m.id === assistantMsg.id
                ? { ...m, content: result.text, citations: result.citations, streaming: false }
                : m,
            ))
            saveMessage(convId!, 'assistant', result.text, result.citations)
              .then(() => { if (isNew) refreshList() })
              .catch(() => {})
          },
          onError: (msg) => {
            setError(msg)
            setMessages((prev) => prev.filter((m) => m.id !== assistantMsg.id))
          },
          isCancelled,
        },
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kuch ghalat hua.')
      setMessages((prev) => prev.filter((m) => m.id !== assistantMsg.id))
    }
    void finalCitations
    setSending(false)
    setToolEvents([])
  }, [messages, sending, refreshList])

  const stop = useCallback(() => {
    signalRef.current.cancelled = true
  }, [])

  const retry = useCallback(() => {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')
    if (!lastUser || sending) return
    // Remove last assistant message, resend
    setMessages((prev) => {
      const idx = prev.map((m) => m.role).lastIndexOf('assistant')
      return idx >= 0 ? prev.slice(0, idx) : prev
    })
    // Resend with same text (docs not retained on retry — honest limitation)
    setTimeout(() => send(lastUser.content.replace(/\n\n📎 .+$/, ''), []), 50)
  }, [messages, sending, send])

  const copyAll = useCallback(async (text: string) => {
    try { await navigator.clipboard.writeText(text) } catch { /* noop */ }
  }, [])

  const showWelcome = messages.length === 0 && !sending

  return (
    <div className="chat-scope flex h-[calc(100dvh-0px)] min-h-[480px] w-full overflow-hidden">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={openConversation}
        onNew={newChat}
        onRename={(id, title) => { renameConversation(id, title).then(refreshList) }}
        onDelete={(id) => {
          deleteConversation(id).then(() => {
            if (id === activeId) newChat()
            refreshList()
          })
        }}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        smartReady={smartReady}
      />

      <main className="flex-1 flex flex-col min-w-0" style={{ background: 'var(--chat-bg)' }}>
        {/* Top bar */}
        <header
          className="flex items-center gap-2 px-3 md:px-5 py-2.5 border-b shrink-0"
          style={{ borderColor: 'var(--chat-border)' }}
        >
          <button
            type="button" onClick={() => setMobileOpen(true)} aria-label="Open chat menu"
            className="md:hidden p-2 rounded-lg" style={{ color: 'var(--chat-text-2)' }}
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 5h14M3 10h14M3 15h14" /></svg>
          </button>
          {collapsed && (
            <button
              type="button" onClick={() => setCollapsed(false)} aria-label="Expand sidebar"
              className="hidden md:block p-2 rounded-lg" style={{ color: 'var(--chat-text-2)' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 3l5 5-5 5" /></svg>
            </button>
          )}
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold truncate" style={{ color: 'var(--chat-text)' }}>
              {conversations.find((c) => c.id === activeId)?.title ?? 'URAAN AI Assistant'}
            </h2>
            <p className="text-[11px]" style={{ color: 'var(--chat-text-3)' }} aria-live="polite">
              {sending ? 'Jawab likh raha hai…' : smartReady ? '🧠 Smart Mode · 🔍 Web research · 📄 Docs' : '🔍 Web research · 📄 Docs · 🧠 Smart Mode available'}
            </p>
          </div>
          <button
            type="button" onClick={newChat} aria-label="New chat"
            className="ml-auto p-2 rounded-lg md:hidden" style={{ color: 'var(--chat-text-2)' }}
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8 3v10M3 8h10" /></svg>
          </button>
        </header>

        {/* Conversation */}
        <div
          className="flex-1 overflow-y-auto chat-scroll"
          dir={detectRtl(messages[messages.length - 1]?.content ?? '') ? 'rtl' : 'ltr'}
        >
          {showWelcome ? (
            <WelcomeScreen onSuggest={send} userName={userName} />
          ) : (
            <div className="max-w-3xl mx-auto px-4 md:px-6 py-6">
              <MessageList
                messages={messages}
                toolEvents={toolEvents}
                sending={sending}
                onCopy={copyAll}
                onRetry={retry}
                canRetry={!sending && messages.some((m) => m.role === 'assistant')}
              />
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 md:px-6 pb-1" role="alert">
            <div className="max-w-3xl mx-auto text-[13px] px-3.5 py-2.5 rounded-xl border flex items-center gap-2"
              style={{ borderColor: 'var(--color-error)', background: '#fdecec', color: '#991b1b' }}>
              <span aria-hidden>⚠️</span>
              <span className="flex-1">{error}</span>
              <button type="button" onClick={() => setError(null)} aria-label="Dismiss" className="font-bold">×</button>
            </div>
          </div>
        )}

        {/* Composer */}
        <footer className="shrink-0 px-4 md:px-6 pt-2 pb-4 md:pb-5" style={{ background: 'var(--chat-bg)' }}>
          <div className="max-w-3xl mx-auto">
            <Composer
              onSend={send}
              onStop={stop}
              sending={sending}
              smartReady={smartReady}
              smartLoading={smartLoading}
              smartProgress={smartProgress}
              onToggleSmart={toggleSmart}
            />
          </div>
        </footer>
      </main>
    </div>
  )
}
