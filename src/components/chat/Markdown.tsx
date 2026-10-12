/**
 * Safe markdown renderer for assistant messages.
 * Supports: headings, bold, italic, lists, tables, blockquotes,
 * inline code, fenced code blocks (with copy button), links, hr.
 * No dangerouslySetInnerHTML — everything is React elements.
 */
import { useState, type ReactNode } from 'react'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      aria-label={copied ? 'Copied' : 'Copy code'}
      onClick={async () => {
        try { await navigator.clipboard.writeText(text) } catch { /* clipboard unavailable */ }
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className="text-[11px] px-2 py-0.5 rounded-md border transition"
      style={{ borderColor: 'var(--chat-border)', color: 'var(--chat-text-2)', background: 'transparent' }}
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

/** Inline formatting: **bold**, *italic*, `code`, [link](url) */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g
  let last = 0
  let m: RegExpExecArray | null
  let k = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(<span key={`${keyPrefix}-t${k++}`}>{text.slice(last, m.index)}</span>)
    const tok = m[0]
    if (tok.startsWith('**')) out.push(<strong key={`${keyPrefix}-b${k++}`}>{tok.slice(2, -2)}</strong>)
    else if (tok.startsWith('`')) out.push(<code key={`${keyPrefix}-c${k++}`}>{tok.slice(1, -1)}</code>)
    else if (tok.startsWith('[')) {
      const lm = tok.match(/\[([^\]]+)\]\(([^)]+)\)/)
      if (lm) {
        const href = lm[2]
        const safe = /^https?:\/\//i.test(href)
        out.push(
          safe
            ? <a key={`${keyPrefix}-a${k++}`} href={href} target="_blank" rel="noopener noreferrer">{lm[1]}</a>
            : <span key={`${keyPrefix}-a${k++}`}>{lm[1]}</span>,
        )
      }
    } else out.push(<em key={`${keyPrefix}-i${k++}`}>{tok.slice(1, -1)}</em>)
    last = m.index + tok.length
  }
  if (last < text.length) out.push(<span key={`${keyPrefix}-t${k++}`}>{text.slice(last)}</span>)
  return out
}

interface Block {
  type: 'p' | 'h' | 'ul' | 'ol' | 'quote' | 'code' | 'table' | 'hr'
  level?: number
  items?: string[]
  ordered?: boolean
  lang?: string
  code?: string
  head?: string[]
  rows?: string[][]
  text?: string
}

function parse(src: string): Block[] {
  const blocks: Block[] = []
  // Extract fenced code blocks first
  const codeBlocks: { lang: string; code: string }[] = []
  const noCode = src.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang: string, code: string) => {
    codeBlocks.push({ lang: lang || 'code', code: code.replace(/\n$/, '') })
    return `\u0000CODE${codeBlocks.length - 1}\u0000`
  })

  const lines = noCode.split('\n')
  let i = 0
  const para: string[] = []
  const flushPara = () => {
    if (para.length > 0) {
      const t = para.join(' ').trim()
      if (t) {
        const cm = t.match(/^\u0000CODE(\d+)\u0000$/)
        if (cm) {
          const cb = codeBlocks[parseInt(cm[1], 10)]
          blocks.push({ type: 'code', lang: cb.lang, code: cb.code })
        } else blocks.push({ type: 'p', text: t })
      }
      para.length = 0
    }
  }

  while (i < lines.length) {
    const line = lines[i]
    const trim = line.trim()

    if (!trim) { flushPara(); i++; continue }
    if (/^---+$/.test(trim)) { flushPara(); blocks.push({ type: 'hr' }); i++; continue }

    const h = trim.match(/^(#{1,4})\s+(.*)/)
    if (h) { flushPara(); blocks.push({ type: 'h', level: h[1].length, text: h[2] }); i++; continue }

    if (/^>\s?/.test(trim)) {
      flushPara()
      const items: string[] = []
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^>\s?/, '')); i++
      }
      blocks.push({ type: 'quote', text: items.join(' ') })
      continue
    }

    if (/^(\*|-)\s+/.test(trim)) {
      flushPara()
      const items: string[] = []
      while (i < lines.length && /^(\*|-)\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^(\*|-)\s+/, '')); i++
      }
      blocks.push({ type: 'ul', items })
      continue
    }

    const olm = trim.match(/^\d+[.)]\s+(.*)/)
    if (olm) {
      flushPara()
      const items: string[] = []
      while (i < lines.length) {
        const mm = lines[i].trim().match(/^\d+[.)]\s+(.*)/)
        if (!mm) break
        items.push(mm[1]); i++
      }
      blocks.push({ type: 'ol', items, ordered: true })
      continue
    }

    if (/^\|.*\|$/.test(trim) && i + 1 < lines.length && /^\|[\s:|-]+\|$/.test(lines[i + 1].trim())) {
      flushPara()
      const head = trim.split('|').map((c) => c.trim()).filter(Boolean)
      i += 2
      const rows: string[][] = []
      while (i < lines.length && /^\|.*\|$/.test(lines[i].trim())) {
        rows.push(lines[i].trim().split('|').map((c) => c.trim()).filter(Boolean)); i++
      }
      blocks.push({ type: 'table', head, rows })
      continue
    }

    para.push(trim)
    i++
  }
  flushPara()
  return blocks
}

export function Markdown({ text }: { text: string }) {
  const blocks = parse(text)
  return (
    <div className="chat-md">
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'h': {
            const Tag = `h${b.level}` as 'h1' | 'h2' | 'h3' | 'h4'
            return <Tag key={i}>{renderInline(b.text ?? '', `h${i}`)}</Tag>
          }
          case 'ul':
            return <ul key={i}>{b.items?.map((it, j) => <li key={j}>{renderInline(it, `u${i}-${j}`)}</li>)}</ul>
          case 'ol':
            return <ol key={i}>{b.items?.map((it, j) => <li key={j}>{renderInline(it, `o${i}-${j}`)}</li>)}</ol>
          case 'quote':
            return <blockquote key={i}>{renderInline(b.text ?? '', `q${i}`)}</blockquote>
          case 'hr':
            return <hr key={i} />
          case 'table':
            return (
              <table key={i}>
                <thead><tr>{b.head?.map((h, j) => <th key={j}>{renderInline(h, `th${i}-${j}`)}</th>)}</tr></thead>
                <tbody>{b.rows?.map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k}>{renderInline(c, `td${i}-${j}-${k}`)}</td>)}</tr>)}</tbody>
              </table>
            )
          case 'code':
            return (
              <div key={i} className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--chat-border)' }}>
                <div className="flex items-center justify-between px-3 py-1.5" style={{ background: 'var(--chat-bg-soft)', borderBottom: '1px solid var(--chat-border)' }}>
                  <span className="text-[11px] font-mono" style={{ color: 'var(--chat-text-3)' }}>{b.lang}</span>
                  <CopyButton text={b.code ?? ''} />
                </div>
                <pre className="!m-0 !rounded-none !border-0"><code>{b.code}</code></pre>
              </div>
            )
          default:
            return <p key={i}>{renderInline(b.text ?? '', `p${i}`)}</p>
        }
      })}
    </div>
  )
}
