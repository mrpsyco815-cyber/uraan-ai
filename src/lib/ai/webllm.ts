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
const VISION_MODEL_ID = 'Phi-3.5-vision-instruct-q4f16_1-MLC'

let engine: import('@mlc-ai/web-llm').MLCEngine | null = null
let visionEngine: import('@mlc-ai/web-llm').MLCEngine | null = null
let loading: Promise<void> | null = null
let visionLoading: Promise<void> | null = null
let loadError: string | null = null
let visionLoadError: string | null = null

export function isSmartReady(): boolean { return engine !== null }
export function smartLoadError(): string | null { return loadError }
export function isVisionReady(): boolean { return visionEngine !== null }
export function visionLoadErrorMsg(): string | null { return visionLoadError }

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

/** Load the vision model (idempotent). ~4GB, cached after first download. */
export function loadVisionMode(onProgress: (p: LoadProgress) => void): Promise<void> {
  if (visionEngine) return Promise.resolve()
  if (visionLoading) return visionLoading
  visionLoadError = null
  visionLoading = (async () => {
    try {
      const webllm: WebLLM = await import('@mlc-ai/web-llm')
      const eng = await webllm.CreateMLCEngine(VISION_MODEL_ID, {
        initProgressCallback: (report) => {
          onProgress({ progress: report.progress, text: report.text })
        },
        logLevel: 'SILENT',
      })
      visionEngine = eng
    } catch (e) {
      visionLoadError = e instanceof Error ? e.message : 'Vision model load failed.'
      visionLoading = null
      throw e
    }
  })()
  return visionLoading
}

/** Analyze an image with the vision model. imageDataUrl: base64 data URL. */
export async function visionAnalyze(
  imageDataUrl: string,
  question: string,
  onToken: (t: string) => void,
  isCancelled: () => boolean,
): Promise<string> {
  if (!visionEngine) throw new Error('Vision Mode is not loaded.')
  const messages = [
    {
      role: 'user' as const,
      content: [
        { type: 'image_url' as const, image_url: { url: imageDataUrl } },
        { type: 'text' as const, text: question || 'Is image mein kya hai? Detail se batao.' },
      ],
    },
  ]
  const stream = await visionEngine.chat.completions.create({ messages, stream: true, temperature: 0.5 })
  let full = ''
  for await (const chunk of stream) {
    if (isCancelled()) {
      try { await visionEngine.interruptGenerate() } catch { /* noop */ }
      break
    }
    const delta = chunk.choices[0]?.delta?.content ?? ''
    if (delta) { full += delta; onToken(delta) }
  }
  return full
}
export async function unloadSmartMode(): Promise<void> {
  if (engine) {
    try { await engine.unload() } catch { /* noop */ }
    engine = null
    loading = null
  }
}
