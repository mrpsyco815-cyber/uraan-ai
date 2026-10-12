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

import type { ChatMsg, Citation, EngineContext, StreamCallbacks } from './types'
import { isSmartReady, smartStream } from './webllm'
import { fetchPageText, webResearch } from './search'
import { localAnswer, searchQueryOf, wantsSearch } from './localEngine'
import { relevantChunks } from './documents'

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
