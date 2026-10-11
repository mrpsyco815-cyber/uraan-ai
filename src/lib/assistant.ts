/**
 * URAAN AI study assistant client.
 *
 * SAFETY CONTRACT (non-negotiable):
 * - The assistant NEVER invents scholarships, deadlines, official URLs, or eligibility claims.
 * - For opportunity questions it ALWAYS redirects to the verified /opportunities directory.
 * - It presents itself as study help, not an authority — "AI can be wrong, verify important things."
 *
 * Architecture: when VITE_ASSISTANT_ENDPOINT is set, messages go to a server-side
 * Edge Function (which holds the LLM key). Otherwise a transparent offline demo
 * answers with honest study guidance and clearly labels itself as demo mode.
 */

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const ENDPOINT = import.meta.env.VITE_ASSISTANT_ENDPOINT as string | undefined
export const isAssistantLive = Boolean(ENDPOINT)

const SYSTEM_REMINDER =
  'I am URAAN AI study help (demo mode). I can explain concepts, plan study schedules, ' +
  'and help with applications — but I never invent scholarships or deadlines. ' +
  'For verified opportunities, check the Opportunities directory. AI can be wrong; verify important details.'

/** Offline demo responder — honest, useful, never hallucinates opportunities. */
function demoRespond(history: ChatMessage[]): string {
  const last = history[history.length - 1]?.content.toLowerCase() ?? ''

  const opportunityWords = ['scholarship', 'fellowship', 'deadline', 'apply', 'funding', 'stipend']
  if (opportunityWords.some((w) => last.includes(w))) {
    return (
      'I can\'t invent or confirm scholarships, deadlines, or funding details — ' +
      'getting those wrong could cost you an opportunity. Please check the verified ' +
      'Opportunities directory (every listing there is admin-verified with an official link). ' +
      'I *can* help you write your statement of purpose, plan documents, or prepare for interviews — just ask!'
    )
  }

  if (last.includes('study') || last.includes('plan') || last.includes('schedule') || last.includes('exam')) {
    return (
      'Here\'s a study framework that works for most students:\n\n' +
      '1. **Active recall** — close the book and explain the concept aloud.\n' +
      '2. **Spaced repetition** — review after 1 day, 3 days, 1 week.\n' +
      '3. **Past papers** — practice under timed conditions.\n' +
      '4. **Teach it** — if you can teach it simply, you know it.\n\n' +
      'Tell me your subject and exam date and I\'ll help you build a week-by-week plan.'
    )
  }

  if (last.includes('sop') || last.includes('statement') || last.includes('essay') || last.includes('personal statement')) {
    return (
      'A strong statement of purpose has 4 parts:\n\n' +
      '1. **Hook** — a specific moment that sparked your interest (not "I always loved…").\n' +
      '2. **Evidence** — 2–3 concrete achievements with numbers.\n' +
      '3. **Fit** — why THIS program, naming professors or labs.\n' +
      '4. **Future** — what you\'ll do with the degree.\n\n' +
      'Paste a draft and I\'ll give honest feedback on structure and clarity.'
    )
  }

  if (last.includes('interview')) {
    return (
      'Interview prep that actually helps:\n\n' +
      '• Prepare 5 stories using STAR (Situation, Task, Action, Result).\n' +
      '• Research the program — have 3 smart questions ready.\n' +
      '• Do one mock interview aloud (record yourself).\n' +
      '• Common opener: "Tell me about yourself" → 90-second version of your SOP.\n\n' +
      'Want a mock interview? Tell me the program and I\'ll play the interviewer.'
    )
  }

  if (last.includes('hello') || last.includes('hi') || last.includes('salam') || last.includes('assalam')) {
    return (
      'Hello! I\'m your URAAN AI study helper. I can:\n\n' +
      '• Explain study concepts simply\n' +
      '• Build study plans\n' +
      '• Review your SOP drafts\n' +
      '• Prep you for interviews\n\n' +
      'What are you working on today?'
    )
  }

  return (
    'I can help with study planning, concept explanations, SOP feedback, and interview prep. ' +
    'Try asking: "Help me plan my week", "Review my SOP draft", or "Explain photosynthesis simply".\n\n' +
    'Note: I never invent scholarships or deadlines — for those, use the verified Opportunities directory.'
  )
}

export async function sendMessage(history: ChatMessage[]): Promise<string> {
  if (isAssistantLive && ENDPOINT) {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history, system_reminder: SYSTEM_REMINDER }),
    })
    if (!res.ok) throw new Error('Assistant service unavailable.')
    const data = await res.json()
    return data.reply as string
  }
  // Offline demo — clearly labelled, honest, safe
  await new Promise((r) => setTimeout(r, 600))
  return demoRespond(history)
}

export { SYSTEM_REMINDER }
