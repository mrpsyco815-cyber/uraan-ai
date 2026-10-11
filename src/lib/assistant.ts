/**
 * URAAN AI study assistant — REAL AI via Pollinations (free, no key needed).
 *
 * SAFETY CONTRACT (non-negotiable, enforced in system prompt):
 * - NEVER invents scholarships, deadlines, official URLs, or eligibility claims.
 * - For opportunity questions it ALWAYS redirects to the verified /opportunities directory.
 * - Presents itself as study help, not an authority.
 */

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const SYSTEM_PROMPT = `You are URAAN AI, a warm and encouraging study assistant for Pakistani students. You help with: explaining concepts simply, study plans, SOP/essay feedback, interview prep, document checklists, and motivation. You can speak English, Urdu, or Roman Urdu — match the student's language.

HARD RULES (never break):
1. NEVER invent, guess, or state scholarship names, deadlines, funding amounts, official URLs, or eligibility criteria. If asked about specific scholarships, say you can't confirm those details and direct them to the app's verified Opportunities directory where every listing is admin-verified.
2. NEVER present yourself as infallible — for important decisions, remind them to verify on official sites.
3. Be concise but warm. Use formatting (bold, lists) for readability. Keep responses under 300 words unless they ask for detail.
4. If they greet you, greet back warmly and ask what they're working on.`

async function callAI(messages: ChatMessage[]): Promise<string> {
  const prompt = encodeURIComponent(
    messages.map((m) => `${m.role === 'user' ? 'Student' : 'Assistant'}: ${m.content}`).join('\n\n') +
    '\n\nAssistant:'
  )
  const system = encodeURIComponent(SYSTEM_PROMPT)
  const res = await fetch(`https://text.pollinations.ai/${prompt}?model=openai&system=${system}`, {
    headers: { 'Accept': 'text/plain' },
  })
  if (!res.ok) throw new Error('AI service temporarily unavailable.')
  const text = await res.text()
  return text.trim() || 'Sorry, I could not generate a response. Please try again.'
}

/** Offline fallback — honest, useful, never hallucinates. Used only if AI is unreachable. */
function fallbackRespond(history: ChatMessage[]): string {
  const last = history[history.length - 1]?.content.toLowerCase() ?? ''
  if (['scholarship', 'fellowship', 'deadline', 'apply', 'funding'].some((w) => last.includes(w))) {
    return 'I can\'t invent or confirm scholarships, deadlines, or funding details — getting those wrong could cost you an opportunity. Please check the verified Opportunities directory. I *can* help with your SOP, study plan, or interview prep — just ask!'
  }
  return 'The AI service is temporarily unreachable. I can still help with study planning, SOP feedback, and interview prep — try asking again in a moment, or check the Resources library.'
}

export async function sendMessage(history: ChatMessage[]): Promise<string> {
  try {
    return await callAI(history)
  } catch {
    await new Promise((r) => setTimeout(r, 500))
    return fallbackRespond(history)
  }
}

export const isAssistantLive = true
