/**
 * File download card: shows validated generated files with a working download button.
 * Only rendered for files the engine actually built — never a fake button.
 */
import { useState } from 'react'
import type { GeneratedFileMeta } from '../../lib/ai/types'
import { downloadGeneratedFile } from '../../lib/ai/engine'

const KIND_ICON: Record<string, string> = {
  pdf: '📕', docx: '📘', pptx: '📙', xlsx: '📗',
  csv: '📊', txt: '📝', md: '📝', json: '🧾', code: '💻',
}

export function FileCard({ file }: { file: GeneratedFileMeta }) {
  const [state, setState] = useState<'ready' | 'done' | 'missing'>('ready')

  function handleDownload() {
    const ok = downloadGeneratedFile(file.id)
    if (ok) {
      setState('done')
      setTimeout(() => setState('ready'), 3000)
    } else {
      setState('missing')
    }
  }

  return (
    <div
      className="mt-3 rounded-2xl border p-3.5 flex items-center gap-3"
      style={{ borderColor: 'var(--chat-border)', background: 'var(--chat-bg-soft)' }}
      role="group"
      aria-label={`Download ${file.filename}`}
    >
      <div className="text-3xl shrink-0" aria-hidden="true">
        {KIND_ICON[file.kind] ?? '📁'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate" style={{ color: 'var(--chat-text)' }}>
          {file.filename}
        </div>
        <div className="text-[11px]" style={{ color: 'var(--chat-text-3)' }}>
          {file.kind.toUpperCase()} · {file.sizeBytes} · validated ✓
        </div>
        {state === 'missing' && (
          <div className="text-[11px] mt-1" role="alert" style={{ color: 'var(--color-error)' }}>
            File expired ho gayi — dobara generate karo.
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={handleDownload}
        className="shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition min-h-11"
        style={{ background: 'var(--chat-accent)' }}
        aria-label={`Download ${file.filename}`}
      >
        {state === 'done' ? '✓ Downloaded' : '⬇ Download'}
      </button>
    </div>
  )
}
