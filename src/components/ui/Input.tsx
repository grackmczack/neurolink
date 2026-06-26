import { forwardRef } from 'react'
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { clsx } from 'clsx'

// ─── Input ────────────────────────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-xs font-medium text-[var(--text-secondary)]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={clsx(
            'rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-2 text-sm text-[var(--text-primary)]',
            'placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)] focus:outline-none',
            'transition-colors',
            error && 'border-[var(--danger)]',
            className,
          )}
          {...props}
        />
        {error && <span className="text-xs text-[var(--danger)]">{error}</span>}
      </div>
    )
  },
)
Input.displayName = 'Input'

// ─── Textarea ─────────────────────────────────────────────────────

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-xs font-medium text-[var(--text-secondary)]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={clsx(
            'min-h-[80px] resize-y rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-2 text-sm text-[var(--text-primary)]',
            'placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)] focus:outline-none',
            'transition-colors',
            className,
          )}
          {...props}
        />
      </div>
    )
  },
)
Textarea.displayName = 'Textarea'

// ─── Select ───────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-xs font-medium text-[var(--text-secondary)]">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={clsx(
            'rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-2 text-sm text-[var(--text-primary)]',
            'focus:border-[var(--accent)] focus:outline-none',
            'transition-colors',
            className,
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    )
  },
)
Select.displayName = 'Select'
