import type { ReactNode } from 'react'
import { AlertTriangle, Plus } from 'lucide-react'
import { Pill } from '@/components/ui/Pill'
import { Avatar } from '@/components/ui/Avatar'
import { ORDER_FLOW, PRIORITY_META, STATUS_META } from '@/lib/derive'
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

/* A step bar under the stage name. A name on its own does not say how far along
   an order is, and it asks the reader to have memorised the order of the five
   stages; a filled run says it without being read. */
export function StatusSteps({ status }: { status: OrderStatus }) {
  const reached = ORDER_FLOW.indexOf(status) + 1

  return (
    <span className="inline-flex flex-col gap-1.5">
      {/* Decorative. The stage is named directly underneath, so a screen reader
          gets it from the label rather than from five anonymous segments. */}
      <span aria-hidden className="flex items-center gap-[3px]">
        {ORDER_FLOW.map((step, i) => (
          <span
            key={step}
            className={cn('h-[5px] w-4 rounded-full', i < reached ? 'bg-brand' : 'bg-mauve')}
          />
        ))}
      </span>
      <span className="text-[14px] whitespace-nowrap text-ink">{STATUS_META[status].label}</span>
    </span>
  )
}

export function PriorityFlag({ priority }: { priority: Priority }) {
  const meta = PRIORITY_META[priority]

  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn('h-3.5 w-[3px] shrink-0 rounded-full', meta.bar)} />
      <span
        className={cn(
          'text-[12px] font-semibold tracking-[0.06em] uppercase whitespace-nowrap',
          meta.text,
        )}
      >
        {meta.label}
      </span>
    </span>
  )
}

const dueTone = {
  overdue: 'text-risk-text font-medium',
  today: 'text-ink font-medium',
  upcoming: 'text-ink-secondary',
  done: 'text-ink-muted',
} as const

export function DueCell({ due }: { due: DueLabel }) {
  return (
    <span className={cn('tnum text-[14px] whitespace-nowrap', dueTone[due.tone])}>
      {due.tone === 'overdue' && (
        <AlertTriangle size={13} className="mr-1.5 -mt-0.5 inline-block" strokeWidth={2.25} />
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
    <span className={cn('inline-flex items-center gap-2 text-[14px] whitespace-nowrap', meta.tone)}>
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
      <span className="inline-flex items-center gap-1.5 rounded border border-dashed border-hairline px-1.5 py-1 text-[12.5px] text-ink-muted">
        <Plus size={12} strokeWidth={2.5} />
        Unassigned
      </span>
    )
  }

  return (
    // The initials always fit; the name gives way first when the column is
    // narrow, since the avatar is what you scan the column by.
    <span className="flex items-center gap-2">
      <Avatar name={user.name} />
      <span className="truncate text-[14px] text-ink">{user.name}</span>
    </span>
  )
}

export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('code text-[13px]', className)}>{children}</span>
  )
}
