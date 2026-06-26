import type { HTMLAttributes } from 'react'
import { clsx } from 'clsx'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
}

export function Card({ className, hover = false, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4',
        hover && 'transition-colors hover:border-[var(--accent)]',
        className,
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx('mb-3 flex items-center justify-between', className)}
      {...props}
    />
  )
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={clsx('font-semibold text-[var(--text-primary)]', className)}
      {...props}
    />
  )
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('text-sm text-[var(--text-secondary)]', className)} {...props} />
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx('mt-3 flex items-center gap-2 border-t border-[var(--border)] pt-3', className)}
      {...props}
    />
  )
}
