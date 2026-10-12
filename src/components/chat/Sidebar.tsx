/**
 * Chat sidebar: branding, new chat, search, conversation history,
 * rename/delete, theme toggle, collapse (desktop) / drawer (mobile).
 * History comes from real persisted data only.
 */
import { useState } from 'react'
import type { Conversation } from '../../lib/ai/conversations'

interface Props {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onRename: (id: string, title: string) => void
  onDelete: (id: string) => void
  collapsed: boolean
  onToggleCollapse: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  smartReady: boolean
}

function groupLabel(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const days = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return 'Previous 7 days'
  return 'Older'
}

function ConversationRow(props: {
  conv: Conversation
  active: boolean
  onSelect: () => void
  onRename: (title: string) => void
  onDelete: () => void
}) {
  const { conv, active, onSelect, onRename, onDelete } = props
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(conv.title)

  if (editing) {
    return (
      <form
        className="mx-1 mb-0.5"
        onSubmit={(e) => { e.preventDefault(); onRename(title); setEditing(false) }}
      >
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => { if (e.key === 'Escape') setEditing(false) }}
          aria-label="Rename conversation"
          className="w-full px-3 py-2 text-sm rounded-xl border"
          style={{ background: 'var(--chat-bg)', borderColor: 'var(--chat-accent)', color: 'var(--chat-text)' }}
        />
      </form>
    )
  }

  return (
    <div className="mx-1 mb-0.5">
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => { if (e.key === 'Enter') onSelect() }}
        title={conv.title}
        aria-current={active ? true : undefined}
        className="group flex items-center gap-1 px-3 py-2 rounded-xl text-sm cursor-pointer"
        style={active
          ? { background: 'var(--chat-accent-soft)', color: 'var(--chat-text)', fontWeight: 600 }
          : { color: 'var(--chat-text-2)' }}
      >
        <span className="flex-1 truncate">{conv.title}</span>
        <span className="hidden group-hover:flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            aria-label="Rename conversation"
            onClick={(e) => { e.stopPropagation(); setTitle(conv.title); setEditing(true) }}
            className="p-1 rounded-md"
            style={{ color: 'var(--chat-text-3)' }}
          >
            ✎
          </button>
          <button
            type="button"
            aria-label="Delete conversation"
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="p-1 rounded-md"
            style={{ color: 'var(--chat-text-3)' }}
          >
            🗑
          </button>
        </span>
      </div>
    </div>
  )
}

export function Sidebar(p: Props) {
  const [query, setQuery] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filtered = p.conversations.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase()),
  )

  const groups: { label: string; items: Conversation[] }[] = []
  for (const c of filtered) {
    const label = groupLabel(c.updatedAt)
    const g = groups.find((x) => x.label === label)
    if (g) g.items.push(c)
    else groups.push({ label, items: [c] })
  }

  const inner = (
    <div className="flex flex-col h-full" style={{ background: 'var(--chat-bg-soft)' }}>
      <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
          style={{ background: 'linear-gradient(135deg, #078b8c, #063b46)' }}
          aria-hidden="true"
        >
          U
        </div>
        <div className="min-w-0">
          <div className="font-bold text-[15px] leading-tight" style={{ color: 'var(--chat-text)' }}>
            URAAN AI
          </div>
          <div className="text-[11px]" style={{ color: 'var(--chat-text-3)' }}>
            Apna AI 🇵🇰
          </div>
        </div>
        <button
          type="button"
          onClick={p.onToggleCollapse}
          aria-label="Collapse sidebar"
          className="ml-auto p-1.5 rounded-lg hidden md:block"
          style={{ color: 'var(--chat-text-3)' }}
        >
          ‹
        </button>
      </div>

      <div className="px-3 pb-2">
        <button
          type="button"
          onClick={p.onNew}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-white"
          style={{ background: 'var(--chat-accent)' }}
        >
          <span aria-hidden="true">+</span> New chat
        </button>
      </div>

      <div className="px-3 pb-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search chats…"
          aria-label="Search conversations"
          className="w-full px-3 py-2 text-sm rounded-xl border"
          style={{ background: 'var(--chat-bg)', borderColor: 'var(--chat-border)', color: 'var(--chat-text)' }}
        />
      </div>

      <div className="flex-1 overflow-y-auto chat-scroll px-2 pb-2" role="list" aria-label="Conversations">
        {groups.length === 0 && (
          <div className="px-3 py-8 text-center">
            <div className="text-2xl mb-2" aria-hidden="true">💬</div>
            <p className="text-[13px]" style={{ color: 'var(--chat-text-3)' }}>
              {query ? 'Koi chat nahi mili.' : 'Abhi koi chat nahi. "New chat" dabao!'}
            </p>
          </div>
        )}
        {groups.map((g) => (
          <div key={g.label} className="mb-1">
            <div
              className="px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: 'var(--chat-text-3)' }}
            >
              {g.label}
            </div>
            {g.items.map((c) => (
              <ConversationRow
                key={c.id}
                conv={c}
                active={c.id === p.activeId}
                onSelect={() => p.onSelect(c.id)}
                onRename={(t) => p.onRename(c.id, t)}
                onDelete={() => setDeleteId(c.id)}
              />
            ))}
          </div>
        ))}
      </div>

      <div
        className="border-t px-3 py-2.5 flex items-center gap-2"
        style={{ borderColor: 'var(--chat-border)' }}
      >
        <button
          type="button"
          onClick={p.onToggleTheme}
          aria-label={p.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[13px]"
          style={{ color: 'var(--chat-text-2)' }}
        >
          <span aria-hidden="true">{p.theme === 'dark' ? '☀️' : '🌙'}</span>
          {p.theme === 'dark' ? 'Light' : 'Dark'}
        </button>
        <span
          className="ml-auto text-[11px] px-2 py-1 rounded-full font-medium"
          style={p.smartReady
            ? { background: 'var(--chat-accent-soft)', color: 'var(--chat-accent-ink)' }
            : { background: 'var(--chat-bg-sunken)', color: 'var(--chat-text-3)' }}
        >
          {p.smartReady ? '🧠 Smart on' : '🧠 Smart off'}
        </span>
      </div>

      {deleteId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgb(0 0 0 / 0.4)' }}
          role="dialog"
          aria-modal="true"
          aria-label="Delete conversation"
        >
          <div
            className="rounded-2xl p-5 max-w-xs w-full"
            style={{ background: 'var(--chat-bg)', boxShadow: 'var(--chat-shadow-lg)' }}
          >
            <h3 className="font-semibold mb-1" style={{ color: 'var(--chat-text)' }}>
              Chat delete karo?
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--chat-text-2)' }}>
              Ye hamesha ke liye delete ho jayegi.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="px-3.5 py-2 text-sm rounded-xl border"
                style={{ borderColor: 'var(--chat-border)', color: 'var(--chat-text)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => { p.onDelete(deleteId); setDeleteId(null) }}
                className="px-3.5 py-2 text-sm rounded-xl text-white font-medium"
                style={{ background: 'var(--color-error)' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      {!p.collapsed && (
        <aside
          className="hidden md:flex w-72 shrink-0 border-r flex-col"
          style={{ borderColor: 'var(--chat-border)' }}
          aria-label="Chat sidebar"
        >
          {inner}
        </aside>
      )}
      {p.mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Chat menu">
          <div
            className="absolute inset-0"
            style={{ background: 'rgb(0 0 0 / 0.4)' }}
            onClick={p.onCloseMobile}
          />
          <aside
            className="absolute inset-y-0 left-0 w-80 max-w-[85vw] flex flex-col border-r"
            style={{ background: 'var(--chat-bg-soft)', borderColor: 'var(--chat-border)' }}
          >
            <button
              type="button"
              onClick={p.onCloseMobile}
              aria-label="Close menu"
              className="absolute top-3 right-3 p-2 rounded-lg z-10"
              style={{ color: 'var(--chat-text-3)' }}
            >
              ✕
            </button>
            {inner}
          </aside>
        </div>
      )}
    </>
  )
}
