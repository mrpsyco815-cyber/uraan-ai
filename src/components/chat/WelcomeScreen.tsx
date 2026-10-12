/**
 * Welcome screen: greeting, composer anchor, working suggestion cards.
 * Every card populates the composer — nothing decorative.
 */
import type { AttachedDoc } from '../../lib/ai/types'

interface Props {
  onSuggest: (text: string, docs: AttachedDoc[]) => void
  userName?: string
}

const SUGGESTIONS: { icon: string; title: string; prompt: string; hint: string }[] = [
  {
    icon: '🔍', title: 'Research a scholarship',
    prompt: 'search: DAAD scholarship 2026 deadline and requirements',
    hint: 'Live web research with sources',
  },
  {
    icon: '💻', title: 'Debug my code',
    prompt: 'Mera Python code IndexError de raha hai. List ke bahar access kaise theek karun?',
    hint: 'Error bhejke step-by-step fix',
  },
  {
    icon: '✍️', title: 'SOP guidance',
    prompt: 'How do I write a strong SOP for a masters scholarship?',
    hint: 'Structure + golden rules',
  },
  {
    icon: '📐', title: 'Explain a concept',
    prompt: 'Explain photosynthesis simply with a real-life example',
    hint: 'Simple, clear explanations',
  },
  {
    icon: '📄', title: 'Analyze a document',
    prompt: 'Maine ek PDF attach ki hai — is ka khulasa batao',
    hint: 'PDF/text upload karo, phir poocho',
  },
  {
    icon: '⚡', title: 'Study plan',
    prompt: 'Help me plan my study week — I have 3 hours daily',
    hint: 'Realistic routine banao',
  },
]

export function WelcomeScreen(p: Props) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Subah bakhair' : hour < 17 ? 'Dopahar bakhair' : hour < 21 ? 'Shaam bakhair' : 'Shab bakhair'
  return (
    <div className="flex flex-col items-center text-center max-w-2xl mx-auto px-4 pt-10 md:pt-16">
      <div
        className="w-16 h-16 rounded-3xl flex items-center justify-center text-white text-3xl font-bold mb-5"
        style={{ background: 'linear-gradient(135deg, #078b8c, #063b46)', boxShadow: 'var(--chat-shadow-lg)' }}
        aria-hidden
      >
        U
      </div>
      <h1 className="text-2xl md:text-[28px] font-bold tracking-tight mb-2" style={{ color: 'var(--chat-text)' }}>
        {greeting}{p.userName ? `, ${p.userName}` : ''}! 👋
      </h1>
      <p className="text-[15px] leading-relaxed mb-8 max-w-lg" style={{ color: 'var(--chat-text-2)' }}>
        Main <strong>URAAN AI</strong> hun — tumhara apna study companion. Live web research, documents,
        coding help aur study plans — <strong>free, private, hamesha</strong>.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 w-full text-left">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.title}
            type="button"
            onClick={() => p.onSuggest(s.prompt, [])}
            className="rounded-2xl border p-3.5 text-left transition hover:-translate-y-0.5"
            style={{ borderColor: 'var(--chat-border)', background: 'var(--chat-bg)', boxShadow: 'var(--chat-shadow)' }}
          >
            <div className="text-xl mb-1.5" aria-hidden>{s.icon}</div>
            <div className="text-sm font-semibold mb-0.5" style={{ color: 'var(--chat-text)' }}>{s.title}</div>
            <div className="text-xs leading-relaxed" style={{ color: 'var(--chat-text-3)' }}>{s.hint}</div>
          </button>
        ))}
      </div>
      <p className="text-[11px] mt-6" style={{ color: 'var(--chat-text-3)' }}>
        🔒 Tumhara data tumhare browser mein rehta hai · Koi paid API nahi · Kabhi expire nahi
      </p>
    </div>
  )
}
