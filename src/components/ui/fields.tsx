import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface FieldProps {
  label: string
  error?: string
  hint?: string
  id: string
}

function FieldWrapper({ label, error, hint, id, children }: FieldProps & { children: React.ReactNode }) {
  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm font-semibold text-ink mb-1.5">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted mt-1">{hint}</p>}
      {error && (
        <p className="text-xs text-error mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

const inputCls =
  'w-full px-4 py-2.5 rounded-xl border border-soft-blue bg-white text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-bright-teal focus:border-primary-teal'

export function TextInput({ label, error, hint, id, ...rest }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldWrapper label={label} error={error} hint={hint} id={id}>
      <input id={id} className={`${inputCls} ${error ? 'border-error' : ''}`} aria-invalid={!!error} {...rest} />
    </FieldWrapper>
  )
}

export function TextArea({ label, error, hint, id, ...rest }: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldWrapper label={label} error={error} hint={hint} id={id}>
      <textarea id={id} rows={4} className={`${inputCls} ${error ? 'border-error' : ''}`} aria-invalid={!!error} {...rest} />
    </FieldWrapper>
  )
}

export function Select({ label, error, hint, id, children, ...rest }: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <FieldWrapper label={label} error={error} hint={hint} id={id}>
      <select id={id} className={`${inputCls} ${error ? 'border-error' : ''}`} aria-invalid={!!error} {...rest}>
        {children}
      </select>
    </FieldWrapper>
  )
}
