import { useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { TextArea, TextInput } from '../components/ui/fields'
import { SectionHeading } from '../components/ui/states'

const SOP_SYSTEM = `You are an expert SOP (Statement of Purpose) coach for Pakistani students applying to international scholarships. Review the student's SOP draft and program name. Give structured feedback:

1. **Overall score** (1-10) with one-line verdict
2. **Strengths** (2-3 specific things done well)
3. **Weaknesses** (2-3 specific issues — be honest but kind)
4. **Line-by-line suggestions** for the weakest paragraph
5. **Rewritten hook** — show a stronger opening paragraph as an example

Rules: Never invent facts about the student. Be specific, not generic. Keep it under 400 words. Be encouraging — these students are brave for applying.`

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
    try {
      const prompt = encodeURIComponent(
        `Program: ${program || 'Not specified'}\n\nSOP Draft:\n${draft}\n\nPlease review my SOP.`
      )
      const res = await fetch(`https://text.pollinations.ai/${prompt}?model=openai&system=${encodeURIComponent(SOP_SYSTEM)}`)
      if (!res.ok) throw new Error('AI service unavailable.')
      setFeedback(await res.text())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed.')
    }
    setLoading(false)
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
