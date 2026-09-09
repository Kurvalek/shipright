import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function StatCard({
  icon,
  label,
  value,
  footnote,
  tone = 'neutral',
}: {
  icon: ReactNode
  label: string
  value: string | number
  footnote?: string
  tone?: 'neutral' | 'risk'
}) {
  return (
    <div className="rounded-card border border-hairline bg-surface px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <p className="label-micro">{label}</p>
        <span
          className={cn(
            'grid size-7 shrink-0 place-items-center rounded-md',
            tone === 'risk' ? 'bg-risk-fill text-risk-text' : 'bg-neutral-fill text-ink-secondary',
          )}
        >
          {icon}
        </span>
      </div>
      <p
        className={cn(
          'display tnum mt-2 text-[28px] leading-none',
          tone === 'risk' ? 'text-risk-text' : 'text-ink',
        )}
      >
        {value}
      </p>
      {footnote && <p className="mt-1.5 text-[12px] text-ink-muted">{footnote}</p>}
    </div>
  )
}
