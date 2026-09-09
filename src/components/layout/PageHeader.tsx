import type { ReactNode } from 'react'

export function PageHeader({
  title,
  meta,
  actions,
}: {
  title: string
  meta?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 pb-6">
      <div>
        <h1 className="display text-[30px] leading-none text-ink">{title}</h1>
        {meta && <div className="mt-2 flex items-center gap-2 text-[13px] text-ink-secondary">{meta}</div>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}
