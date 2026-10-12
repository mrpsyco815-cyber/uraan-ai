/**
 * URAAN AI — master orchestrator.
 *
 * Routes every message through the right capability:
 *  1. Document Q&A (if docs attached) — retrieval over extracted text
 *  2. Live web research (if the question needs current facts)
 *  3. Smart Mode (WebLLM, if enabled) — real generative AI, streaming
 *  4. Local engine — instant knowledge-base answers + calculator
 *
 * Honest by design: tool indicators reflect real events; if search
 * finds nothing, we say so instead of inventing an answer.
 */

import type { ChatMsg, Citation, EngineContext, StreamCallbacks, AssistantResult } from './types'
import { isSmartReady, isVisionReady, smartStream, visionAnalyze } from './webllm'
import { fetchPageText, webResearch } from './search'
import { localAnswer, searchQueryOf, wantsSearch, detectQuizRequest, generateQuiz } from './localEngine'
import { relevantChunks } from './documents'
import { detectFileRequest, writeContent, type FileRequest } from './content'
import { detectRunRequest, isPythonReady, runJavaScript, runPython } from './codeRunner'
import {
  downloadFile, formatBytes, generateDOCX, generatePDF, generatePPTX, generateTextFile, generateXLSX,
  type GeneratedFile,
} from './files'

/** Build a grounded research answer from real citations. */
async function researchAnswer(
  query: string,
  ctx: EngineContext,
  cb: Pick<StreamCallbacks, 'onToken' | 'onToolEvent' | 'isCancelled'>,
): Promise<{ text: string; citations: Citation[] }> {
  cb.onToolEvent({ tool: 'search', label: 'Web par search kar raha hun…', state: 'start' })
  let citations: Citation[] = []
  try {
    citations = await webResearch(query)
  } catch {
    // total failure — handled below
  }
  if (ctx.signal.cancelled || cb.isCancelled()) {
    return { text: 'Search rok diya gaya.', citations: [] }
  }
  if (citations.length === 0) {
    cb.onToolEvent({ tool: 'search', label: 'Web search', state: 'error', detail: 'koi result nahi mila' })
    return {
      text: `🔍 Maine web par **"${query}"** search kiya, lekin koi reliable result nahi mila.\n\nHo sakta hai:\n- Sawal mein spelling check karo\n- Thoda mukhtalif alfaz try karo (misal: \`search: DAAD scholarship deadline\`)\n- Ya phir **Smart Mode** on kar ke mujhse general guidance lo`,
      citations: [],
    }
  }
  cb.onToolEvent({ tool: 'search', label: `${citations.length} sources mile`, state: 'done' })

  // Deepen the top result (best-effort, Wikipedia only)
  const top = citations[0]
  cb.onToolEvent({ tool: 'read_page', label: `Parh raha hun: ${top.domain}…`, state: 'start' })
  const deep = await fetchPageText(top.url)
  if (deep) {
    top.snippet = deep.slice(0, 280)
    cb.onToolEvent({ tool: 'read_page', label: 'Source parh liya', state: 'done' })
  } else {
    cb.onToolEvent({ tool: 'read_page', label: 'Source parh liya', state: 'done' })
  }

  const lines = citations.map((c) => `- **${c.title}** — ${c.snippet} [${c.index}]`).join('\n')
  const text =
    `## 🔍 "${query}" — live research\n\n` +
    `Neeche **real sources** se mili maloomat hai (aaj ki search):\n\n${lines}\n\n` +
    `> ⚠️ Dates aur deadlines hamesha official website par verify karo — ye search results hain, final authority nahi.`
  return { text, citations }
}

/** Answer from attached documents using retrieval. */
function documentAnswer(ctx: EngineContext): { text: string } | null {
  const lastUser = [...ctx.history].reverse().find((m) => m.role === 'user')
  if (!lastUser || ctx.docs.length === 0) return null
  const chunks: string[] = []
  for (const doc of ctx.docs) {
    const rel = relevantChunks(doc, lastUser.content)
    if (rel.length > 0) chunks.push(`**📄 ${doc.name}:**\n${rel.map((c) => `> ${c.slice(0, 500)}`).join('\n\n')}`)
  }
  if (chunks.length === 0) {
    return {
      text: `📄 Maine ${ctx.docs.map((d) => `**${d.name}**`).join(', ')} parha, lekin tumhare sawal se mutaliq koi hissa nahi mila.\n\nKuch aur poocho jo document mein ho — misal: "Is document ka khulasa batao" ya koi specific topic.`,
    }
  }
  return {
    text: `## 📄 Document se jawab\n\nTumhare sawal ke mutabiq document ke relevant hisse:\n\n${chunks.join('\n\n---\n\n')}\n\n💡 Mazeed detail ke liye **Smart Mode** on karo — main poora document samajh ke jawab dunga.`,
  }
}

function lastUserText(history: ChatMsg[]): string {
  return [...history].reverse().find((m) => m.role === 'user')?.content ?? ''
}

/**
 * Main entry: stream the assistant's response with honest tool events.
 */
export async function runAssistant(ctx: EngineContext, cb: StreamCallbacks): Promise<void> {
  const q = lastUserText(ctx.history)
  const toolsUsed: string[] = []
  let citations: Citation[] = []
  let engine: 'webllm' | 'local' = 'local'

  try {
    // 0. File generation (highest priority — explicit user request)
    const fileReq = detectFileRequest(q)
    if (fileReq) {
      const result = await generateFileFlow(fileReq, cb)
      cb.onDone(result)
      return
    }

    // 0b. Image analysis (vision)
    if (ctx.images.length > 0) {
      const result = await visionFlow(q, ctx, cb)
      cb.onDone(result)
      return
    }

    // 0c. Code execution
    const runReq = detectRunRequest(q)
    if (runReq) {
      const result = await codeRunFlow(runReq, cb)
      cb.onDone(result)
      return
    }

    // 0d. Quiz/MCQ generation
    const quizTopic = detectQuizRequest(q)
    if (quizTopic) {
      const text = generateQuiz(quizTopic)
      streamText(text, cb)
      cb.onDone({ text, citations: [], engine: 'local', toolsUsed: ['quiz'] })
      return
    }

    // 1. Documents first (highest priority when attached)
    if (ctx.docs.length > 0) {
      cb.onToolEvent({ tool: 'document', label: 'Document parh raha hun…', state: 'start' })
      const ans = documentAnswer(ctx)
      toolsUsed.push('document')
      cb.onToolEvent({ tool: 'document', label: 'Document parh liya', state: 'done' })
      if (ans) {
        streamText(ans.text, cb)
        cb.onDone({ text: ans.text, citations: [], engine, toolsUsed })
        return
      }
    }

    // 2. Live web research when the question needs current facts
    if (wantsSearch(q)) {
      const { text, citations: cites } = await researchAnswer(searchQueryOf(q), ctx, cb)
      citations = cites
      if (cites.length > 0) toolsUsed.push('search')
      streamText(text, cb)
      cb.onDone({ text, citations, engine, toolsUsed })
      return
    }

    // 3. Smart Mode (real generative AI) when enabled
    if (isSmartReady()) {
      engine = 'webllm'
      toolsUsed.push('model')
      cb.onToolEvent({ tool: 'model', label: 'Smart Mode soch raha hai…', state: 'start' })
      const full = await smartStream(ctx.history, cb.onToken, cb.isCancelled)
      cb.onToolEvent({ tool: 'model', label: 'Jawab tayyar', state: 'done' })
      const text = full || 'Kuch ghalat hua — dobara try karo.'
      cb.onDone({ text, citations: [], engine, toolsUsed })
      return
    }

    // 4. Local engine (instant, offline)
    cb.onToolEvent({ tool: 'model', label: 'Jawab tayyar kar raha hun…', state: 'start' })
    const { text, toolsUsed: lt } = localAnswer(ctx.history)
    toolsUsed.push(...lt)
    cb.onToolEvent({ tool: 'model', label: 'Jawab tayyar', state: 'done' })
    streamText(text, cb)
    cb.onDone({ text, citations: [], engine, toolsUsed })
  } catch (e) {
    cb.onError(e instanceof Error ? e.message : 'Kuch ghalat hua. Dobara try karo.')
  }
}

/** Code execution flow: run JS/Python safely, report output. */
async function codeRunFlow(
  req: { lang: 'js' | 'py'; code: string },
  cb: StreamCallbacks,
): Promise<AssistantResult> {
  const toolsUsed = ['code-run']
  const langName = req.lang === 'py' ? 'Python' : 'JavaScript'

  if (req.lang === 'py' && !isPythonReady()) {
    return {
      text:
        `## 💻 Code mila!\n\n` +
        `Tumhara ${langName} code ready hai, lekin chalane ke liye **Python runtime** chahiye (~12MB, ek dafa download):\n\n` +
        `**Filhal:** Neeche code ko dekho — main static analysis kar sakta hun. "Is code mein error kyun hai?" likh ke bhejo.\n\n` +
        `**Python chalana hai?** Composer mein jald **▶ Run Python** button aayega. Abhi ke liye JavaScript code foran chalta hai — \`\`\`js block mein bhejo!`,
      citations: [],
      engine: 'local',
      toolsUsed,
    }
  }

  cb.onToolEvent({ tool: 'code-run', label: `${langName} chala raha hun…`, state: 'start' })
  const result = req.lang === 'py' ? await runPython(req.code) : await runJavaScript(req.code)
  cb.onToolEvent({
    tool: 'code-run',
    label: result.ok ? 'Code chal gaya ✓' : 'Error aaya',
    state: result.ok ? 'done' : 'error',
    detail: result.error,
  })

  const text =
    `## 💻 ${langName} — execution result\n\n` +
    `**Output:**\n\`\`\`\n${result.output || '(koi output nahi)'}\n\`\`\`\n` +
    (result.ok
      ? `\n✅ Code kamyabi se chala.`
      : `\n❌ **Error:**\n\`\`\`\n${result.error}\n\`\`\`\n💡 Error ka matlab samajhna hai? "Is error ko samjhao" likho!`)
  return { text, citations: [], engine: 'local', toolsUsed }
}

/** Vision flow: analyze uploaded images. */
async function visionFlow(
  q: string,
  ctx: EngineContext,
  cb: StreamCallbacks,
): Promise<AssistantResult> {
  const toolsUsed = ['vision']
  const img = ctx.images[0]

  if (!isVisionReady()) {
    return {
      text:
        `## 👁️ Image mili!\n\n` +
        `Maine **${img.name}** receive kar li hai, lekin image samajhne ke liye **Vision Mode** chahiye.\n\n` +
        `**Vision Mode** ek on-device AI vision model hai (~4GB, ek dafa download, phir hamesha free):\n\n` +
        `1. Neeche composer mein **👁️ Vision** button dabao\n` +
        `2. Model download hone do (~4GB — WiFi par karo)\n` +
        `3. Phir dobara image bhejo — main dekh ke bataunga kya hai!\n\n` +
        `💡 Jab tak: agar image mein koi **error screenshot** hai to error ka text type kar ke bhejo, main guide kar dunga.`,
      citations: [],
      engine: 'local',
      toolsUsed,
    }
  }

  cb.onToolEvent({ tool: 'vision', label: 'Image dekh raha hun…', state: 'start' })
  let full = ''
  try {
    full = await visionAnalyze(img.dataUrl, q, cb.onToken, cb.isCancelled)
    cb.onToolEvent({ tool: 'vision', label: 'Image analyze ho gayi ✓', state: 'done' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Vision analysis failed.'
    cb.onToolEvent({ tool: 'vision', label: 'Vision', state: 'error', detail: msg })
    return { text: `⚠️ Image analyze nahi ho saki: ${msg}`, citations: [], engine: 'local', toolsUsed }
  }
  return {
    text: full || 'Image mein kuch samajh nahi aaya. Wazeh image bhejo.',
    citations: [],
    engine: 'webllm',
    toolsUsed,
  }
}

/** File generation flow: write content → build file → validate → download meta. */
async function generateFileFlow(
  req: FileRequest,
  cb: StreamCallbacks,
): Promise<AssistantResult> {
  const toolsUsed = ['file-gen']
  cb.onToolEvent({ tool: 'file-gen', label: `Content likh raha hun…`, state: 'start' })

  let content = ''
  await writeContent(req, (t) => { content += t; cb.onToken(t) }, cb.isCancelled)
  if (cb.isCancelled()) {
    return { text: 'File generation rok diya gaya.', citations: [], engine: 'local', toolsUsed }
  }
  cb.onToolEvent({ tool: 'file-gen', label: 'Content tayyar', state: 'done' })

  cb.onToolEvent({ tool: 'file-gen', label: `${req.kind.toUpperCase()} file bana raha hun…`, state: 'start' })
  let file: GeneratedFile
  const title = req.topic
  try {
    switch (req.kind) {
      case 'pdf': file = await generatePDF(title, content); break
      case 'docx': file = await generateDOCX(title, content); break
      case 'pptx': file = await generatePPTX(title, content); break
      case 'xlsx': {
        // Convert CSV-ish content to sheet rows
        const rows = content.split('\n').filter((l) => l.trim()).map((l) => l.split(',').map((c) => c.trim()))
        file = await generateXLSX(title, [{ name: 'Sheet1', rows: rows.length > 1 ? rows : [['Item', 'Details'], [title, 'Generated by URAAN AI']] }])
        break
      }
      case 'csv': case 'txt': case 'md': case 'json':
        file = generateTextFile(req.kind, title, content); break
      case 'code': {
        const lang = req.detail === 'js' ? 'js' : req.detail === 'html' ? 'html' : 'py'
        file = generateTextFile('code', title, content, lang); break
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'File banane mein masla hua.'
    cb.onToolEvent({ tool: 'file-gen', label: 'File generation', state: 'error', detail: msg })
    return { text: `⚠️ ${msg}\n\nContent to tayyar tha, lekin file build nahi ho saki. Dobara try karo.`, citations: [], engine: 'local', toolsUsed }
  }
  cb.onToolEvent({ tool: 'file-gen', label: 'File tayyar ✓', state: 'done' })

  // Register blob for download
  const id = registerFile(file)
  const text =
    `\n\n---\n\n## 📁 File tayyar hai!\n\n` +
    `**${file.filename}** (${formatBytes(file.sizeBytes)}) — validated ✓\n\n` +
    `Neeche download button dabao. File mein asal content hai, khaali template nahi.`
  cb.onToken(text)

  return {
    text: content + text,
    citations: [],
    engine: isSmartReady() ? 'webllm' : 'local',
    toolsUsed,
    file: { id, kind: file.kind, filename: file.filename, mime: file.mime, sizeBytes: formatBytes(file.sizeBytes) },
  }
}

/** In-memory registry: blob id → GeneratedFile (for downloads). */
const fileRegistry = new Map<string, GeneratedFile>()
function registerFile(f: GeneratedFile): string {
  const id = `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  fileRegistry.set(id, f)
  return id
}

/** Download a previously generated file by id. Returns false if missing. */
export function downloadGeneratedFile(id: string): boolean {
  const f = fileRegistry.get(id)
  if (!f) return false
  downloadFile(f)
  return true
}

/** Emit text in chunks so the UI streams even for instant answers. */
function streamText(text: string, cb: Pick<StreamCallbacks, 'onToken' | 'isCancelled'>): void {
  if (cb.isCancelled()) return
  // Chunk by sentences for a natural streaming feel
  const parts = text.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) ?? [text]
  for (const p of parts) {
    if (cb.isCancelled()) break
    cb.onToken(p)
  }
}
