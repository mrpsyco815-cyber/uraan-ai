import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variants: Record<Variant, string> = {
  primary: 'bg-primary-teal text-white hover:bg-deep-teal',
  secondary: 'bg-soft-blue text-deep-teal hover:bg-bright-teal/20',
  outline: 'border border-primary-teal text-primary-teal hover:bg-soft-blue',
  ghost: 'text-muted hover:text-ink hover:bg-soft-blue',
  danger: 'bg-error text-white hover:opacity-90',
}

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
}

export function Button({ variant = 'primary', size = 'md', loading, disabled, className = '', children, ...rest }: Props) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {loading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden />}
      {children}
    </button>
  )
}
