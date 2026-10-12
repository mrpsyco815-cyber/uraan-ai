/**
 * URAAN AI — Smart Mode: real generative AI running 100% in the browser.
 * Powered by WebLLM (MLC). No API key. No server. No expiry. No cost.
 *
 * Model: Llama-3.2-1B-Instruct (~1GB, downloaded once, cached forever).
 * The user opts in explicitly — we never download silently.
 */

import type { ChatMsg } from './types'

// Lazy import so the heavy runtime only loads when Smart Mode is enabled.
type WebLLM = typeof import('@mlc-ai/web-llm')

const MODEL_ID = 'Llama-3.2-1B-Instruct-q4f16_1-MLC'

let engine: import('@mlc-ai/web-llm').MLCEngine | null = null
let loading: Promise<void> | null = null
let loadError: string | null = null

export function isSmartReady(): boolean { return engine !== null }
export function smartLoadError(): string | null { return loadError }

export interface LoadProgress {
  /** 0..1 */
  progress: number
  text: string
}

/** Load the model (idempotent). Reports real download progress. */
export function loadSmartMode(onProgress: (p: LoadProgress) => void): Promise<void> {
  if (engine) return Promise.resolve()
  if (loading) return loading
  loadError = null
  loading = (async () => {
    try {
      const webllm: WebLLM = await import('@mlc-ai/web-llm')
      const eng = await webllm.CreateMLCEngine(MODEL_ID, {
        initProgressCallback: (report) => {
          onProgress({ progress: report.progress, text: report.text })
        },
        logLevel: 'SILENT',
      })
      engine = eng
    } catch (e) {
      loadError = e instanceof Error ? e.message : 'Model load failed.'
      loading = null
      throw e
    }
  })()
  return loading
}

const SYSTEM = `You are URAAN AI, a helpful study companion for Pakistani students. Answer in the same language the user writes in (English, Urdu, or Roman Urdu). Be concise, warm, and practical. Use markdown formatting (headings, lists, bold) where it helps. If you don't know something, say so honestly. Never invent scholarships, deadlines, or facts.`

/** Stream a real AI response. Calls onToken per chunk. */
export async function smartStream(
  history: ChatMsg[],
  onToken: (t: string) => void,
  isCancelled: () => boolean,
): Promise<string> {
  if (!engine) throw new Error('Smart Mode is not loaded.')
  const messages = [
    { role: 'system' as const, content: SYSTEM },
    ...history.slice(-12).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content.slice(0, 3000) })),
  ]
  const stream = await engine.chat.completions.create({ messages, stream: true, temperature: 0.7 })
  let full = ''
  for await (const chunk of stream) {
    if (isCancelled()) {
      try { await engine.interruptGenerate() } catch { /* noop */ }
      break
    }
    const delta = chunk.choices[0]?.delta?.content ?? ''
    if (delta) { full += delta; onToken(delta) }
  }
  return full
}

/** Unload to free memory (rarely needed). */
export async function unloadSmartMode(): Promise<void> {
  if (engine) {
    try { await engine.unload() } catch { /* noop */ }
    engine = null
    loading = null
  }
}
