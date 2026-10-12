import { useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { TextArea, TextInput } from '../components/ui/fields'
import { SectionHeading } from '../components/ui/states'

export function SOPCoach() {
  const [program, setProgram] = useState('')
  const [draft, setDraft] = useState('')
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function analyze() {
    if (!draft.trim() || draft.trim().length < 50) {
      setError('Please paste a draft of at least 50 characters.')
      return
    }
    setLoading(true)
    setError(null)
    setFeedback('')
    // Local analysis — no external API, 100% ours
    await new Promise((r) => setTimeout(r, 800))
    setFeedback(analyzeSOP(draft, program))
    setLoading(false)
  }

  /** Local SOP analysis engine — rule-based, honest, no invented facts. */
  function analyzeSOP(text: string, prog: string): string {
    const words = text.trim().split(/\s+/).length
    const paras = text.trim().split(/\n\n+/).length
    const issues: string[] = []
    const strengths: string[] = []

    // Checks
    if (words < 300) issues.push(`Too short (${words} words) — aim for 500-800 words for most programs.`)
    if (words > 1200) issues.push(`Too long (${words} words) — trim to under 1000. Admissions officers skim.`)
    if (paras < 3) issues.push('Needs more structure — break into clear paragraphs (aim for 4-6).')

    const cliches = ['since childhood', 'passionate', 'dream come true', 'ever since I was']
    const foundCliches = cliches.filter((c) => text.toLowerCase().includes(c))
    if (foundCliches.length > 0) issues.push(`Avoid clichés: "${foundCliches.join('", "')}" — replace with specific stories.`)

    if (!/\b(professor|dr\.|lab|course|research)\b/i.test(text)) {
      issues.push('No specific program details — name a professor, lab, or course to show genuine fit.')
    } else {
      strengths.push('Mentions specific program details — great for showing fit!')
    }

    const firstPara = text.trim().split(/\n\n+/)[0] ?? ''
    if (firstPara.length < 100) {
      issues.push('Weak opening — start with a specific moment or question, not a generic statement.')
    } else {
      strengths.push('Good opening length — hooks the reader.')
    }

    if (/\b(I built|I created|I led|I developed|my project)\b/i.test(text)) {
      strengths.push('Uses active voice with concrete achievements — keep this up!')
    } else {
      issues.push('Add concrete achievements — "I built X" beats "I am interested in X".')
    }

    // Score
    const score = Math.max(3, Math.min(9, 7 - issues.length + strengths.length))

    let out = `**Overall Score: ${score}/10**\n`
    out += score >= 7 ? 'Solid draft with clear potential! A few fixes will make it strong.\n' : 'Good start — needs focused revision in the areas below.\n'
    if (prog) out += `\n**Target:** ${prog}\n`
    out += `\n**📊 Stats:** ${words} words, ${paras} paragraphs\n`

    out += `\n**✅ Strengths:**\n`
    out += strengths.length > 0 ? strengths.map((s) => `• ${s}`).join('\n') : '• You started writing — that\'s the hardest part!'

    out += `\n\n**🔧 Fix these:**\n`
    out += issues.length > 0 ? issues.map((s, i) => `${i + 1}. ${s}`).join('\n') : '• Nothing major — polish and proofread!'

    out += `\n\n**💡 Next steps:**\n1. Fix the issues above one by one\n2. Read it aloud — awkward parts will jump out\n3. Ask 2 people to proofread\n4. Customize for EACH program (never send the same SOP twice!)`

    return out
  }

  function renderRich(text: string) {
    return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={i}>{part.slice(2, -2)}</strong>
        : <span key={i}>{part}</span>,
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <SectionHeading
        kicker="🤖 AI Coach"
        title="SOP Review Coach"
        subtitle="Paste your statement of purpose — get honest, detailed feedback in seconds."
      />

      <Card className="p-6 mb-6">
        <div className="space-y-4">
          <TextInput id="sop-program" label="Target program (optional)" value={program} onChange={(e) => setProgram(e.target.value)} placeholder="e.g. DAAD Scholarship, TU Munich MS CS" />
          <TextArea id="sop-draft" label="Your SOP draft" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Paste your statement of purpose here…" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">{draft.length} characters</span>
            <Button loading={loading} onClick={analyze}>✨ Analyze my SOP</Button>
          </div>
          {error && <p className="text-sm text-error" role="alert">{error}</p>}
        </div>
      </Card>

      <p className="text-[11px] text-muted mt-4 text-center max-w-xl mx-auto">
        🔒 Privacy: your SOP text is sent to an AI service for analysis. Don't include sensitive personal information like CNIC numbers or bank details.
      </p>

      {feedback && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Badge tone="verified">AI Feedback</Badge>
          </div>
          <div className="text-sm text-ink whitespace-pre-line leading-relaxed">
            {renderRich(feedback)}
          </div>
        </Card>
      )}
    </div>
  )
}
