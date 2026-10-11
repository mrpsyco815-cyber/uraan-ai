import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-soft-blue shadow-sm ${className}`}>
      {children}
    </div>
  )
}
