import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Pale tint on tint, never saturated, so a full table of them stays calm. */
export function Pill({
  children,
  className,
  dot,
}: {
  children: ReactNode
  className?: string
  dot?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
        className,
      )}
    >
      {dot && <span className={cn('size-1.5 shrink-0 rounded-full', dot)} />}
      {children}
    </span>
  )
}
