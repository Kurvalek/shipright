import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AlertTriangle, ArrowRight, MapPin, X } from 'lucide-react'
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

  const orderId = order?.id ?? null
  const storedNotes = order?.notes ?? ''

  /* Keystrokes not yet written to the store, tagged with the record they belong
     to so a note committed late still lands on the right order. */
  const unsaved = useRef<{ id: string; notes: string } | null>(null)
  const commit = useRef(onNotes)
  commit.current = onNotes

  const flush = useCallback(() => {
    const pending = unsaved.current
    if (!pending) return
    unsaved.current = null
    commit.current(pending.id, pending.notes)
  }, [])

  const changeNotes = useCallback(
    (next: string) => {
      setNotes(next)
      if (orderId) unsaved.current = { id: orderId, notes: next }
    },
    [orderId],
  )

  /* Only when the record changes, never when the store echoes back a write of
     our own — that would clobber whatever has been typed since. Anything still
     pending belongs to the record being left, so it goes in first. */
  useEffect(() => {
    flush()
    setNotes(storedNotes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, flush])

  /* The pause is only there to keep a keystroke from rewriting a store a couple
     of hundred orders deep on every character. Closing or switching records
     does not wait for it. */
  useEffect(() => {
    if (!unsaved.current) return
    const timer = setTimeout(flush, 400)
    return () => clearTimeout(timer)
  }, [notes, flush])

  if (!order) return null

  const advance = nextAction(order.status)
  const saving = notes !== storedNotes

  const body = (
    <DetailBody
      order={order}
      users={users}
      skus={skus}
      now={now}
      notes={notes}
      saving={saving}
      onNotesChange={changeNotes}
      onStatus={onStatus}
      onAssign={onAssign}
    />
  )

  /* The move, not a save. Notes write themselves, so the one thing left worth
     committing from down here is the step the order takes next. */
  const actions = (
    <>
      <Button variant="ghost" onClick={onClose}>
        Close
      </Button>
      {advance ? (
        <Button
          variant="primary"
          iconRight={<ArrowRight size={14} />}
          onClick={() => onStatus(order.id, advance.next)}
        >
          {advance.long}
        </Button>
      ) : (
        <span className="px-1 text-[12px] text-ink-muted">
          {order.status === 'new' ? 'Assign it to start' : 'Closed out'}
        </span>
      )}
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
  saving,
  onNotesChange,
  onStatus,
  onAssign,
}: {
  order: Order
  users: User[]
  skus: SkuIndex
  now: Date
  notes: string
  /** Keystrokes the store has not caught up with yet. */
  saving: boolean
  onNotesChange: (next: string) => void
  onStatus: (id: string, status: OrderStatus) => void
  onAssign: (id: string, assigneeId: string | null) => void
}) {
  const stock = orderStock(order, skus)
  const due = dueLabel(order, now)
  const units = order.lines.reduce((sum, line) => sum + line.qty, 0)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* The next step is the panel's one committing action, so it sits in the
          footer with the rest of them rather than up here beside the stage it
          is about to change. */}
      <div className="mb-3">
        <StatusPill status={order.status} />
      </div>

      <StageMeter status={order.status} onChange={(next) => onStatus(order.id, next)} />

      {/* Said once, up here, before any of the fields. Short stock is the only
          thing in this panel that stops the order rather than describing it,
          and it was being reported in the same voice as the placed date. */}
      {stock.state === 'out' && (
        <p className="mt-4 flex items-start gap-2 rounded-md bg-danger-fill px-3 py-2 text-[13px] font-medium text-danger-text">
          <AlertTriangle size={14} className="mt-px shrink-0" />
          <span>
            {stock.outCount === 1
              ? '1 item cannot be picked'
              : `${stock.outCount} items cannot be picked`}
            <span className="font-normal"> — not enough on the shelf to fill this order.</span>
          </span>
        </p>
      )}

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
        <div className="mb-1 flex shrink-0 items-baseline justify-between gap-3">
          <h3 className="text-[14px] font-medium text-ink">
            Order items
            <span className="ml-1.5 text-[12.5px] font-normal text-ink-muted">
              {order.lines.length} {order.lines.length === 1 ? 'line' : 'lines'} · {units} units
            </span>
          </h3>
          {/* Names down one side, quantities down the other. One label over the
              column is what lets the numbers stand on their own. */}
          <span className="label-text shrink-0 text-ink-muted">On hand</span>
        </div>

        <ul className="-mx-3 min-h-0 divide-y divide-hairline-subtle overflow-y-auto">
          {stock.lines.map((line) => (
            <LineItem key={line.sku} line={line} />
          ))}
        </ul>
      </div>

      {/* Takes whatever the record above it did not need, rather than leaving a
          short order with a band of empty panel under it. */}
      <div className="mt-4 flex min-h-[104px] flex-1 flex-col border-t border-hairline-subtle pt-4">
        {/* There is no save button for notes, so the only thing that says they
            are being kept is this, the first time you type into the field. */}
        <div className="mb-1.5 flex shrink-0 items-baseline justify-between gap-3">
          <label htmlFor="notes" className="label-text">
            Notes
          </label>
          {saving && (
            <span aria-live="polite" className="text-[11px] text-ink-muted">
              Saving…
            </span>
          )}
        </div>
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

/* Only the two states worth stopping for. A line that is fine says so by having
   nothing to say, which is what keeps the exceptions visible.

   Ruled down the edge rather than filled: the same mark the inventory table
   uses for a short SKU. A wash of colour across the whole row shouts loud
   enough to be the first thing read on a panel where the name should be, and
   there are only ever a handful of lines for it to pick out. */
const lineFlag = {
  ok: null,
  low: {
    rule: 'shadow-[inset_2px_0_0_var(--color-risk-edge)]',
    text: 'text-risk-text',
    note: () => 'Low',
  },
  out: {
    rule: 'shadow-[inset_2px_0_0_var(--color-danger-dot)]',
    text: 'text-danger-text',
    /* The number the picker is actually missing, which "1 / 0" never said
       outright. Nothing at all needs no arithmetic and no sentence: the 0 above
       has already said it, and the word only has to name the state. */
    note: (line: LineStock) =>
      line.onHand === 0 ? 'Out' : `${line.required - line.onHand} short`,
  },
} as const

/* Two columns and nothing between them: what the thing is on the left, how much
   of it there is on the right. Both run straight down the list, so the panel is
   read by dropping the eye down one side rather than across every row.

   What used to be here was a ratio — "2 / 165" — under a caption explaining
   which number was which, and a bar whose fill was capped at what the order
   needed. Two on the shelf and two hundred both drew the bar full, so it only
   ever carried anything on a line that was short, and even then the shortfall
   is a sentence, not a length. */
function LineItem({ line }: { line: LineStock }) {
  const flag = lineFlag[line.state]

  return (
    <li className={cn('flex items-start gap-3 px-3 py-2.5', flag?.rule)}>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2">
          <span className="truncate text-[14px] font-medium text-ink">{line.name}</span>
          {/* How many to pick, kept beside the thing being picked rather than in
              the column of shelf counts it would be read against. Set in a chip
              like every other count in the app: it is the number the packer acts
              on, and as plain muted text it was the quietest thing on the row. */}
          <span className="tnum shrink-0 rounded bg-neutral-fill px-1.5 py-0.5 text-[12px] font-medium text-ink-secondary">
            ×{line.required}
          </span>
        </p>

        {/* The bin first and in the darker ink: it is where the picker walks.
            The SKU trails it as the identifier to check once they are there. */}
        <p className="mt-1 flex items-center gap-1.5 whitespace-nowrap">
          <MapPin size={12} className="shrink-0 text-ink-muted" />
          <Mono className="text-[12px] font-medium text-ink-secondary">{line.location}</Mono>
          <Mono className="truncate text-[12px] text-ink-muted">{line.sku}</Mono>
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className={cn('tnum text-[16px] leading-none', flag ? flag.text : 'text-ink')}>
          {line.onHand}
        </p>
        {flag && (
          <p className={cn('mt-1.5 text-[11.5px] font-medium whitespace-nowrap', flag.text)}>
            {flag.note(line)}
          </p>
        )}
      </div>
    </li>
  )
}
