/**
 * URAAN AI — shared AI engine types.
 * Free-first: no API keys, no paid services.
 */

export interface ChatMsg {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface Citation {
  /** 1-based index shown as [1], [2] … */
  index: number
  title: string
  url: string
  /** hostname, e.g. "en.wikipedia.org" */
  domain: string
  /** short excerpt supporting the claim */
  snippet: string
  publishedAt?: string
}

export interface ToolEvent {
  /** machine id: 'search' | 'read_page' | 'document' | 'calculate' | 'model' */
  tool: string
  /** human-readable status, e.g. "Searching the web…" */
  label: string
  state: 'start' | 'done' | 'error'
  detail?: string
}

export interface AssistantResult {
  text: string
  citations: Citation[]
  /** which engine produced it: 'webllm' | 'local' */
  engine: 'webllm' | 'local'
  /** tools that actually ran */
  toolsUsed: string[]
  /** generated downloadable file, if any */
  file?: GeneratedFileMeta
}

/** Serialisable file reference (blob lives in a registry). */
export interface GeneratedFileMeta {
  id: string
  kind: string
  filename: string
  mime: string
  sizeBytes: string
}

export interface StreamCallbacks {
  onToken: (token: string) => void
  onToolEvent: (ev: ToolEvent) => void
  onDone: (result: AssistantResult) => void
  onError: (message: string) => void
  /** polled by the engine to support Stop */
  isCancelled: () => boolean
}

export interface AttachedDoc {
  name: string
  /** extracted plain text (truncated) */
  text: string
  truncated: boolean
}

export interface AttachedImage {
  name: string
  /** base64 data URL for the vision model */
  dataUrl: string
  /** object URL for display */
  displayUrl: string
}

export interface EngineContext {
  history: ChatMsg[]
  docs: AttachedDoc[]
  images: AttachedImage[]
  signal: { cancelled: boolean }
}
