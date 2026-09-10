import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowRight, X } from 'lucide-react'
import { SidePanel } from '@/components/ui/SidePanel'
import { Button } from '@/components/ui/Button'
import { Select, Textarea } from '@/components/ui/Field'
import { Mono, DueCell, PriorityFlag, StatusPill, StockIndicator } from './cells'
import { ORDER_FLOW, STATUS_META, dueLabel, formatTimestamp, nextAction, orderStock } from '@/lib/derive'
import type { SkuIndex } from '@/lib/derive'
import type { LineStock, Order, OrderStatus, User } from '@/lib/types'
import { DetailDock } from '@/lib/shell'
import { useMediaQuery } from '@/lib/useMediaQuery'
import { cn } from '@/lib/cn'

/* Detail and notes, not the only way to move an order forward. Status still
   lives here, but the row and the bulk bar are the fast paths.

   Everything below is sized to be read in one look. Where the panel used to
   stack a numbered timeline, a four-cell grid and a six-column line table and
   let the reader scroll through them, each is now compressed to the shape that
   carries the same fact in a fraction of the height. Only the line items keep
   a scroll of their own, because an order can hold any number of them; the
   rest is fixed, so opening a record never hides part of it. */
export function OrderDetailsPanel({
  order,
  users,
  skus,
  now,
  onClose,
  onStatus,
  onAssign,
  onNotes,
}: {
  order: Order | null
  users: User[]
  skus: SkuIndex
  now: Date
  onClose: () => void
  onStatus: (id: string, status: OrderStatus) => void
  onAssign: (id: string, assigneeId: string | null) => void
  onNotes: (id: string, notes: string) => void
}) {
  const [notes, setNotes] = useState('')

  /* Two panes side by side need a window wide enough to hold a readable list
     next to them. Under that the record goes back to floating over the list. */
  const docked = useMediaQuery('(min-width: 1100px)')

  useEffect(() => {
    setNotes(order?.notes ?? '')
  }, [order?.id, order?.notes])

  if (!order) return null

  const dirty = notes !== (order.notes ?? '')
  const save = () => onNotes(order.id, notes)

  const body = (
    <DetailBody
      order={order}
      users={users}
      skus={skus}
      now={now}
      notes={notes}
      onNotesChange={setNotes}
      onStatus={onStatus}
      onAssign={onAssign}
    />
  )

  const actions = (
    <>
      <Button variant="ghost" onClick={onClose}>
        Close
      </Button>
      <Button variant="primary" disabled={!dirty} onClick={save}>
        Save notes
      </Button>
    </>
  )

  if (!docked) {
    return (
      <SidePanel
        open
        onClose={onClose}
        title={order.customer}
        eyebrow={<Eyebrow order={order} />}
        footer={actions}
        bodyClassName="flex flex-col px-6 py-5"
      >
        {body}
      </SidePanel>
    )
  }

  return (
    <DetailDock>
      <div className="shadow-pane flex h-full flex-col overflow-hidden rounded-shell bg-surface ring-1 ring-hairline/70">
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-hairline px-5 py-4">
          <div className="min-w-0">
            <h2 className="display truncate text-[22px] leading-tight text-ink">
              {order.customer}
            </h2>
            <div className="mt-1.5 flex items-center gap-2.5">
              <Eyebrow order={order} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="-mr-1.5 grid size-8 shrink-0 place-items-center rounded-md text-ink-muted transition-colors hover:bg-neutral-fill hover:text-ink"
          >
            <X size={16} />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col px-5 py-4">{body}</div>

        <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-hairline bg-surface-sunken px-5 py-3">
          {actions}
        </footer>
      </div>
    </DetailDock>
  )
}

function Eyebrow({ order }: { order: Order }) {
  return (
    <>
      <Mono className="font-bold text-ink-secondary">{order.id}</Mono>
      {/* No separator: the flag's own rule already divides it from the ID. */}
      <PriorityFlag priority={order.priority} />
    </>
  )
}

function DetailBody({
  order,
  users,
  skus,
  now,
  notes,
  onNotesChange,
  onStatus,
  onAssign,
}: {
  order: Order
  users: User[]
  skus: SkuIndex
  now: Date
  notes: string
  onNotesChange: (next: string) => void
  onStatus: (id: string, status: OrderStatus) => void
  onAssign: (id: string, assigneeId: string | null) => void
}) {
  const stock = orderStock(order, skus)
  const due = dueLabel(order, now)
  const advance = nextAction(order.status)
  const units = order.lines.reduce((sum, line) => sum + line.qty, 0)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3 flex items-center justify-between gap-3">
        <StatusPill status={order.status} />
        {advance ? (
          <Button
            variant="primary"
            size="sm"
            iconRight={<ArrowRight size={13} />}
            onClick={() => onStatus(order.id, advance.next)}
          >
            {advance.label}
          </Button>
        ) : (
          <span className="text-[12px] text-ink-muted">Closed out</span>
        )}
      </div>

      <StageMeter status={order.status} onChange={(next) => onStatus(order.id, next)} />

      <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3.5 border-t border-hairline-subtle pt-4">
        <Fact label="Ship by">
          <DueCell due={due} />
        </Fact>
        <Fact label="Placed">
          <p className="tnum text-[14px] text-ink">{formatTimestamp(order.placedAt)}</p>
        </Fact>
        <Fact label="Fulfillment">
          <StockIndicator
            state={stock.state}
            lowCount={stock.lowCount}
            outCount={stock.outCount}
          />
        </Fact>
        <Fact label="Assigned to" htmlFor="assignee">
          <Select
            id="assignee"
            value={order.assigneeId ?? ''}
            placeholder="Unassigned"
            className="h-8 text-[13.5px]"
            onChange={(e) => onAssign(order.id, e.target.value || null)}
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </Select>
        </Fact>
      </div>

      {/* The one region allowed to scroll, so a twenty-line order cannot push
          the notes off the bottom of the panel. It takes only the height its
          lines need and gives the rest to the notes below. */}
      <div className="mt-5 flex min-h-0 flex-col border-t border-hairline-subtle pt-4">
        <div className="mb-2.5 flex shrink-0 items-baseline justify-between gap-3">
          <span className="label-text">
            Order items
            <span className="ml-1.5 text-ink-muted">
              {order.lines.length} {order.lines.length === 1 ? 'line' : 'lines'} · {units} units
            </span>
          </span>
          <span className="text-[11px] whitespace-nowrap text-ink-muted">need / on hand</span>
        </div>

        <ul className="min-h-0 space-y-3 overflow-y-auto">
          {stock.lines.map((line) => (
            <LineItem key={line.sku} line={line} />
          ))}
        </ul>
      </div>

      {/* Takes whatever the record above it did not need, rather than leaving a
          short order with a band of empty panel under it. */}
      <div className="mt-4 flex min-h-[104px] flex-1 flex-col border-t border-hairline-subtle pt-4">
        <label htmlFor="notes" className="label-text mb-1.5 block shrink-0">
          Notes
        </label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Gift notes, delivery instructions, anything the packer should know..."
          className="min-h-0 flex-1 text-[13.5px]"
        />
      </div>
    </div>
  )
}

function Fact({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={htmlFor} className="mb-1 block text-[11.5px] text-ink-muted">
        {label}
      </label>
      {children}
    </div>
  )
}

/* The five stages as a single band rather than a row of numbered circles with
   a rule threaded between them. Same reading — how far along, and how far is
   left — and same reach, since every segment is still the button that moves the
   order to that stage, including backwards to undo a move made too early. */
function StageMeter({
  status,
  onChange,
}: {
  status: OrderStatus
  onChange: (next: OrderStatus) => void
}) {
  const currentIndex = ORDER_FLOW.indexOf(status)

  return (
    <ol className="flex gap-1">
      {ORDER_FLOW.map((step, i) => {
        const reached = i <= currentIndex
        const isCurrent = i === currentIndex

        return (
          <li key={step} className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => onChange(step)}
              disabled={isCurrent}
              aria-current={isCurrent ? 'step' : undefined}
              title={isCurrent ? undefined : `Move to ${STATUS_META[step].label}`}
              className="group block w-full text-left disabled:cursor-default"
            >
              <span
                className={cn(
                  'block h-[5px] rounded-full transition-colors',
                  reached ? 'bg-brand' : 'bg-mauve group-hover:bg-ink-muted/50',
                )}
              />
              <span
                className={cn(
                  'mt-1.5 block truncate text-[10.5px] transition-colors',
                  isCurrent ? 'font-medium text-ink' : 'text-ink-muted group-hover:text-ink',
                )}
              >
                {STATUS_META[step].label}
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

const lineTone = {
  ok: { text: 'text-ink', fill: 'bg-mauve' },
  low: { text: 'text-risk-text font-medium', fill: 'bg-risk-edge' },
  out: { text: 'text-danger-text font-medium', fill: 'bg-danger-dot' },
} as const

/* A bar per line rather than a row in a six-column table. The fill is how much
   of what the order needs is actually on the shelf, so a short line is visible
   as a gap without having to compare two numbers. */
function LineItem({ line }: { line: LineStock }) {
  const tone = lineTone[line.state]
  const coverage = Math.max(0, Math.min(1, line.onHand / Math.max(1, line.required)))

  return (
    <li>
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-[13.5px] text-ink">{line.name}</span>
        <span className={cn('tnum shrink-0 text-[13px]', tone.text)}>
          {line.required} / {line.onHand}
        </span>
      </div>

      <div className="mt-1.5 flex items-center gap-2.5">
        <Mono className="shrink-0 text-[11.5px] text-ink-muted">{line.sku}</Mono>
        <span className="h-[4px] min-w-0 flex-1 overflow-hidden rounded-full bg-mauve-soft">
          <span
            className={cn('block h-full rounded-full', tone.fill)}
            style={{ width: `${coverage * 100}%` }}
          />
        </span>
        <span className="shrink-0 text-[11.5px] text-ink-muted">{line.location}</span>
      </div>
    </li>
  )
}
