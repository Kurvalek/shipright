import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-card border border-hairline bg-surface',
        className,
      )}
    >
      {children}
    </section>
  )
}

/** The faintly grey strip that separates a card's title from its body. */
export function CardHeader({
  title,
  actions,
  className,
}: {
  title: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <header
      className={cn(
        'flex min-h-[52px] items-center justify-between gap-4 border-b border-hairline bg-surface-sunken px-5 py-3',
        className,
      )}
    >
      <h2 className="text-[13px] font-semibold text-ink">{title}</h2>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('p-5', className)}>{children}</div>
}
