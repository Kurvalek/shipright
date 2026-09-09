import type { ReactNode } from 'react'
import { AlertTriangle, Plus } from 'lucide-react'
import { Pill } from '@/components/ui/Pill'
import { Avatar } from '@/components/ui/Avatar'
import { PRIORITY_META, STATUS_META } from '@/lib/derive'
import type { DueLabel, Fulfillment, OrderStatus, Priority, User } from '@/lib/types'
import { cn } from '@/lib/cn'

export function StatusPill({ status }: { status: OrderStatus }) {
  const meta = STATUS_META[status]
  return (
    <Pill className={cn(meta.fill, meta.text)} dot={meta.dot}>
      {meta.label}
    </Pill>
  )
}

export function PriorityPill({ priority }: { priority: Priority }) {
  const meta = PRIORITY_META[priority]
  return <Pill className={meta.className}>{meta.label}</Pill>
}

const dueTone = {
  overdue: 'text-risk-text font-medium',
  today: 'text-ink font-medium',
  upcoming: 'text-ink-secondary',
  done: 'text-ink-muted',
} as const

export function DueCell({ due }: { due: DueLabel }) {
  return (
    <span className={cn('tnum text-[13px] whitespace-nowrap', dueTone[due.tone])}>
      {due.tone === 'overdue' && (
        <AlertTriangle size={12} className="mr-1.5 -mt-0.5 inline-block" strokeWidth={2.25} />
      )}
      {due.text}
    </span>
  )
}

const stockMeta: Record<Fulfillment, { dot: string; text: string; tone: string }> = {
  ok: { dot: 'bg-shipped-text', text: 'All in stock', tone: 'text-ink-secondary' },
  low: { dot: 'bg-risk-edge', text: 'low', tone: 'text-risk-text font-medium' },
  out: { dot: 'bg-danger-dot', text: 'out of stock', tone: 'text-danger-text font-medium' },
}

/** The can-fulfill signal: inventory joined onto the order, at a glance. */
export function StockIndicator({
  state,
  lowCount,
  outCount,
}: {
  state: Fulfillment
  lowCount: number
  outCount: number
}) {
  const meta = stockMeta[state]
  const label =
    state === 'ok'
      ? meta.text
      : state === 'out'
        ? `${outCount} ${outCount === 1 ? 'item' : 'items'} out`
        : `${lowCount} ${lowCount === 1 ? 'item' : 'items'} low`

  return (
    <span className={cn('inline-flex items-center gap-2 text-[13px] whitespace-nowrap', meta.tone)}>
      <span className={cn('size-[7px] shrink-0 rounded-full', meta.dot)} />
      {label}
    </span>
  )
}

/* Unassigned reads as an empty slot asking to be filled, rather than italic
   grey text that scans as "no data". */
export function AssigneeCell({ user }: { user: User | undefined }) {
  if (!user) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded border border-dashed border-hairline px-1.5 py-1 text-[12px] text-ink-muted">
        <Plus size={11} strokeWidth={2.5} />
        Unassigned
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <Avatar name={user.name} />
      <span className="text-[13px] text-ink">{user.name}</span>
    </span>
  )
}

export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('code text-[12.5px]', className)}>{children}</span>
  )
}
