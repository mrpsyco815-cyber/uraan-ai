/**
 * URAAN AI — document understanding (client-side, private).
 * Supports: PDF (via pdf.js), .txt / .md text files.
 * Text is extracted locally; nothing is uploaded anywhere.
 */

import type { AttachedDoc } from './types'

const MAX_CHARS = 24000

async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist')
  // Use the bundled worker via CDN-free local worker
  const workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc
  const buf = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: buf }).promise
  const parts: string[] = []
  const pages = Math.min(pdf.numPages, 30)
  for (let i = 1; i <= pages; i++) {
    const page = await pdf.getPage(i)
    const tc = await page.getTextContent()
    const text = (tc.items as { str?: string }[]).map((it) => it.str ?? '').join(' ')
    parts.push(text)
    if (parts.join(' ').length > MAX_CHARS) break
  }
  try { await pdf.cleanup() } catch { /* noop */ }
  return parts.join('\n\n').replace(/\s+/g, ' ').trim()
}

export async function extractDocument(file: File): Promise<AttachedDoc> {
  const name = file.name.toLowerCase()
  let text = ''
  if (name.endsWith('.pdf')) {
    text = await extractPdf(file)
  } else if (/\.(txt|md|markdown|csv)$/.test(name)) {
    text = (await file.text()).replace(/\s+/g, ' ').trim()
  } else {
    throw new Error(`"${file.name}" supported nahi hai. Sirf PDF ya text files (.txt, .md) upload karo.`)
  }
  if (!text) throw new Error(`"${file.name}" se koi text nahi mila. Ye scanned/image PDF ho sakti hai.`)
  const truncated = text.length > MAX_CHARS
  return { name: file.name, text: text.slice(0, MAX_CHARS), truncated }
}

/** Keyword-based retrieval: find the most relevant chunks for a question. */
export function relevantChunks(doc: AttachedDoc, question: string, k = 3): string[] {
  const words = question.toLowerCase().split(/[^a-z0-9\u0600-\u06FF]+/).filter((w) => w.length > 3)
  const paras = doc.text.split(/(?<=[.!?])\s+/).filter((p) => p.length > 40)
  const scored = paras.map((p) => {
    const pl = p.toLowerCase()
    let s = 0
    for (const w of words) if (pl.includes(w)) s += w.length
    return { p, s }
  })
  return scored
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, k)
    .map((x) => x.p)
}
