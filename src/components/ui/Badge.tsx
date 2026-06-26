import { clsx } from 'clsx'

type BadgeVariant = 'default' | 'accent' | 'success' | 'danger' | 'warning'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border)]',
  accent: 'bg-[var(--accent)]/15 text-[var(--accent)] border-[var(--accent)]/30',
  success: 'bg-[var(--success)]/15 text-[var(--success)] border-[var(--success)]/30',
  danger: 'bg-[var(--danger)]/15 text-[var(--danger)] border-[var(--danger)]/30',
  warning: 'bg-[var(--warning)]/15 text-[var(--warning)] border-[var(--warning)]/30',
}

export function Badge({ variant = 'default', className, ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}
