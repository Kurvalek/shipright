import type { ReactNode } from 'react'

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center px-6 py-20 text-center">
      <div className="grid size-10 place-items-center rounded-full bg-neutral-fill text-ink-muted">
        {icon}
      </div>
      <p className="display mt-4 text-[19px] text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-[13px] text-ink-secondary">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
