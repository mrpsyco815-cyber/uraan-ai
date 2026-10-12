/**
 * URAAN AI — Global Student Intelligence Engine
 * Central AI orchestrator with capability routing, structured workflows,
 * multilingual support, and pluggable live-search.
 *
 * ARCHITECTURE:
 * - Orchestrator: routes intent → capability → structured prompt → AI → verified response
 * - Search adapter: provider-independent interface (plug in Tavily/Brave/OpenAI when keys available)
 * - Safety: never invents scholarships/deadlines/URLs; discloses uncertainty; privacy-first
 */

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface SearchResult {
  title: string
  url: string
  snippet: string
  source: string
}

/** Provider-independent search adapter. Plug in a real provider when API keys are available. */
export async function liveSearch(_query: string): Promise<{ results: SearchResult[]; available: boolean }> {
  // No free search provider is currently configured.
  // To enable: set VITE_SEARCH_API_KEY and implement Tavily/Brave/OpenAI here.
  return { results: [], available: false }
}

type Capability =
  | 'tutoring' | 'career' | 'scholarship' | 'coding' | 'writing'
  | 'research' | 'productivity' | 'general'

function detectCapability(text: string): Capability {
  const t = text.toLowerCase()
  if (/(scholarship|fellowship|funding|daad|fulbright|chevening|apply|admission|university)/.test(t)) return 'scholarship'
  if (/(code|debug|error|python|javascript|sql|api|function|bug|program)/.test(t)) return 'coding'
  if (/(job|career|internship|cv|resume|interview|portfolio)/.test(t)) return 'career'
  if (/(sop|essay|write|paragraph|grammar)/.test(t)) return 'writing'
  if (/(research|paper|citation|thesis|literature)/.test(t)) return 'research'
  if (/(math|physics|chemistry|biology|explain|formula|solve|equation|homework)/.test(t)) return 'tutoring'
  if (/(plan|schedule|deadline|reminder|productivity|study plan|routine)/.test(t)) return 'productivity'
  return 'general'
}

const CAPABILITY_GUIDANCE: Record<Capability, string> = {
  tutoring: `TUTORING MODE: Explain step-by-step. Start with the core concept in simple words, then build up. Use examples. End with a quick check question. Never just give the answer for homework — guide them to understand.`,
  career: `CAREER MODE: Be practical and specific. For CVs: give actionable bullet improvements. For interviews: give real practice questions + model answers. Never guarantee jobs or income.`,
  scholarship: `SCHOLARSHIP MODE: NEVER invent, guess, or state specific scholarship names, deadlines, funding amounts, official URLs, or eligibility criteria from memory. If they ask about specific programs, say you cannot confirm those details and direct them to the app's verified Opportunities directory (/opportunities) where every listing is admin-verified. You CAN help with: application strategy, document checklists, SOP guidance, interview prep, timeline planning.`,
  coding: `CODING MODE: Give working code with brief explanations. For debugging: ask for the error message if not provided, explain the likely cause, show the fix. Format code in plain text blocks. Never claim code was executed.`,
  writing: `WRITING MODE: Give specific, actionable feedback. Show before/after examples. For SOPs: focus on hook, story, specificity, and fit. Be encouraging but honest.`,
  research: `RESEARCH MODE: Help organize, summarize, and cite. Never invent citations, DOIs, or publication details. If you don't know a paper, say so.`,
  productivity: `PRODUCTIVITY MODE: Create concrete, realistic plans with time blocks. Keep them achievable — a perfect plan they'll abandon is worse than a good plan they'll follow.`,
  general: `GENERAL MODE: Be a warm, capable study companion. Answer clearly, structure with formatting, keep it focused.`,
}

const ORCHESTRATOR_PROMPT = `You are URAAN AI — a Global Student Intelligence Engine for Pakistani students. You are their intelligent partner for learning, scholarships, careers, coding, research, and productivity.

YOUR WORKFLOW for every meaningful request:
1. UNDERSTAND — identify the real problem and desired outcome
2. CLARIFY — ask only if missing info truly changes your answer
3. INVESTIGATE — use what you know; be honest about what you don't
4. PLAN — break complex tasks into steps
5. EXECUTE — give the actual answer, code, plan, or feedback
6. VERIFY — double-check your reasoning before responding
7. EXPLAIN — respond in the student's language (English, Urdu, or Roman Urdu — match theirs)
8. FOLLOW THROUGH — end with a useful next step, checklist, or question

HARD SAFETY RULES (never break):
1. NEVER invent scholarships, deadlines, funding amounts, official URLs, eligibility criteria, citations, or statistics. When unsure, say "I don't have verified info on this" and point to the app's verified Opportunities directory.
2. NEVER present yourself as infallible. For important decisions (applications, admissions, visas), remind them to verify on official websites.
3. NEVER claim you searched the live internet, executed code, or completed an external action unless you actually did.
4. Do NOT repeat questions for info already given. Don't ask for personal data (CNIC, bank details, passwords).
5. Be concise but complete. Use **bold**, lists, and structure. Match response length to the question — simple questions get simple answers.
6. Academic integrity: help them LEARN, don't fabricate research, results, or qualifications for them.
7. If they greet you, greet back warmly and ask what they're working on.`

async function callAI(messages: ChatMessage[], capability: Capability): Promise<string> {
  const guidance = CAPABILITY_GUIDANCE[capability]
  const fullSystem = `${ORCHESTRATOR_PROMPT}\n\n${guidance}`
  const prompt = encodeURIComponent(
    messages.map((m) => `${m.role === 'user' ? 'Student' : 'Assistant'}: ${m.content}`).join('\n\n') +
    '\n\nAssistant:'
  )
  const system = encodeURIComponent(fullSystem)
  const res = await fetch(`https://text.pollinations.ai/${prompt}?model=openai&system=${system}`, {
    headers: { 'Accept': 'text/plain' },
  })
  if (!res.ok) throw new Error('AI service temporarily unavailable.')
  const text = await res.text()
  return text.trim() || 'Sorry, I could not generate a response. Please try again.'
}

function fallbackRespond(history: ChatMessage[]): string {
  const last = history[history.length - 1]?.content.toLowerCase() ?? ''
  if (['scholarship', 'fellowship', 'deadline', 'apply', 'funding'].some((w) => last.includes(w))) {
    return 'I can\'t invent or confirm scholarships, deadlines, or funding details — getting those wrong could cost you an opportunity. Please check the verified **Opportunities** directory in the app. I *can* help with your SOP, application strategy, document checklist, or interview prep — just ask!'
  }
  return 'The AI service is temporarily unreachable. I can still help with study planning, SOP feedback, coding, and career advice — try asking again in a moment.'
}

export async function sendMessage(history: ChatMessage[]): Promise<string> {
  const lastUser = [...history].reverse().find((m) => m.role === 'user')
  const capability = lastUser ? detectCapability(lastUser.content) : 'general'
  try {
    return await callAI(history, capability)
  } catch {
    await new Promise((r) => setTimeout(r, 500))
    return fallbackRespond(history)
  }
}

/** Exposed for UI: shows which capability handled the last message. */
export function getCapabilityLabel(text: string): string {
  const labels: Record<Capability, string> = {
    tutoring: '📚 Tutor', career: '💼 Career', scholarship: '🎓 Scholarships',
    coding: '💻 Coding', writing: '✍️ Writing', research: '🔬 Research',
    productivity: '⚡ Productivity', general: '🤖 Assistant',
  }
  return labels[detectCapability(text)]
}

export const isAssistantLive = true
export const isSearchAvailable = false // Set true when VITE_SEARCH_API_KEY is configured
