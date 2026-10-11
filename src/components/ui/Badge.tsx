type Tone = 'verified' | 'pending' | 'expired' | 'info' | 'neutral'

const tones: Record<Tone, string> = {
  verified: 'bg-success/10 text-success',
  pending: 'bg-warning/15 text-warning',
  expired: 'bg-error/10 text-error',
  info: 'bg-soft-blue text-primary-teal',
  neutral: 'bg-off-white text-muted border border-soft-blue',
}

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  )
}
