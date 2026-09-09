import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function PageHeader({
  title,
  meta,
  stats,
  actions,
}: {
  title: string
  meta?: ReactNode
  /** Numbers worth reading before the list. Sits beside the title. */
  stats?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 pb-6">
      <div className="flex flex-wrap items-end gap-x-7 gap-y-3">
        <div>
          <h1 className="display text-[30px] leading-none text-ink">{title}</h1>
          {meta && (
            <div className="mt-2 flex items-center gap-2 text-[13px] text-ink-secondary">{meta}</div>
          )}
        </div>

        {stats && (
          <div className="flex items-end gap-6 border-l border-hairline pl-7">{stats}</div>
        )}
      </div>

      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}

/* Sized to be read before anything else on the page, but laid out beside the
   title rather than in a card, so it costs no vertical room out of the list. */
export function HeaderStat({
  label,
  value,
  tone = 'neutral',
}: {
  label: string
  value: number
  tone?: 'neutral' | 'risk'
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span
        className={cn(
          'display tnum text-[26px] leading-none',
          tone === 'risk' && value > 0 ? 'text-risk-text' : 'text-ink',
        )}
      >
        {value}
      </span>
      <span className="text-[13px] whitespace-nowrap text-ink-secondary">{label}</span>
    </div>
  )
}
