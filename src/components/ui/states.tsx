import { Button } from './Button'

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-12" role="status" aria-label={label}>
      <span className="w-8 h-8 border-3 border-soft-blue border-t-primary-teal rounded-full animate-spin" />
    </div>
  )
}

export function EmptyState({ title, message, action }: { title: string; message: string; action?: React.ReactNode }) {
  return (
    <div className="text-center py-16 px-4">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-soft-blue flex items-center justify-center text-3xl">
        📭
      </div>
      <h3 className="text-lg font-bold text-ink mb-1">{title}</h3>
      <p className="text-muted text-sm mb-5 max-w-sm mx-auto">{message}</p>
      {action}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="text-center py-16 px-4" role="alert">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-error/10 flex items-center justify-center text-3xl">
        ⚠️
      </div>
      <h3 className="text-lg font-bold text-ink mb-1">Kuch ghalat ho gaya</h3>
      <p className="text-muted text-sm mb-5 max-w-sm mx-auto">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Dobara koshish karein (Retry)
        </Button>
      )}
    </div>
  )
}

export function SectionHeading({ kicker, title, subtitle }: { kicker?: string; title: string; subtitle?: string }) {
  return (
    <div className="text-center mb-10">
      {kicker && <p className="text-primary-teal font-semibold text-sm uppercase tracking-wide mb-2">{kicker}</p>}
      <h2 className="text-3xl font-bold text-ink mb-2">{title}</h2>
      {subtitle && <p className="text-muted max-w-xl mx-auto">{subtitle}</p>}
    </div>
  )
}
