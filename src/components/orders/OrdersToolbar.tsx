import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { STATUS_META } from '@/lib/derive'
import { ORDER_FLOW } from '@/lib/derive'
import type { OrderStatus, Priority, User } from '@/lib/types'
import { cn } from '@/lib/cn'

/* Each of the three narrowings holds a list rather than a value, and an empty
   list means "all". "New or In progress" is an ordinary thing to ask this list
   for, and a single value could only answer half of it. */
export interface Filters {
  search: string
  status: OrderStatus[]
  priority: Priority[]
  /** User ids, plus 'none' for orders nobody has picked up. */
  assignee: string[]
  /** Customer names, which are what an order carries in place of an id. */
  customer: string[]
}

export const NO_FILTERS: Filters = {
  search: '',
  status: [],
  priority: [],
  assignee: [],
  customer: [],
}

/* These are persisted, and they were three strings before they were three
   lists. A filter saved by an older build would come back as `''` where an
   array is expected and take the page down on the first render after an
   update, so everything read from storage is put back into shape here. */
export function normalizeFilters(stored: Partial<Filters> | null | undefined): Filters {
  const list = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.filter((held) => typeof held === 'string' && held !== '')
    return typeof value === 'string' && value !== '' ? [value] : []
  }

  return {
    search: typeof stored?.search === 'string' ? stored.search : '',
    status: list(stored?.status) as OrderStatus[],
    priority: list(stored?.priority) as Priority[],
    assignee: list(stored?.assignee),
    customer: list(stored?.customer),
  }
}

/** How long the row is kept mounted past the press that closed it. */
const EXIT_MS = 120

export function sameFilters(a: Filters, b: Filters): boolean {
  const same = (x: string[], y: string[]) =>
    x.length === y.length && x.every((held) => y.includes(held))

  return (
    a.search === b.search &&
    same(a.status, b.status) &&
    same(a.priority, b.priority) &&
    same(a.assignee, b.assignee) &&
    same(a.customer, b.customer)
  )
}

/* Three dropdowns held a full row open above the list at all times, and on most
   shifts all three read "all". They fold behind a button now, and the button
   shares the tabs' row rather than opening a second one — folded away, the
   filters cost the page no height at all.

   What a control like this must not do is hide a filter that is on. The button
   carries a count of the narrowing currently applied, and a stage that opens
   already narrowed opens with the row unfolded, so the reason the list is short
   is never somewhere you have to go looking for it. */
export function OrdersToolbar({
  filters,
  onChange,
  users,
  customers,
  children,
}: {
  filters: Filters
  onChange: (patch: Partial<Filters>) => void
  users: User[]
  /** Every name on the books, sorted, not just the ones in the open stage. */
  customers: string[]
  /** The stage tabs, which lead the row the filter button sits at the end of. */
  children: ReactNode
}) {
  /* Counts the narrowings in force, not the values ticked inside them: picking
     four statuses is one answer to one question, and a badge reading "4" would
     be describing the control rather than the list.

     Search is deliberately not counted either — it lives in the top bar, in
     plain sight, so it is not one of the things being folded away here.
     Clearing still takes it, because "clear" that leaves a search running is a
     lie. */
  const applied = [filters.status, filters.priority, filters.assignee, filters.customer].filter(
    (chosen) => chosen.length > 0,
  ).length
  const isFiltered = applied > 0 || filters.search !== ''

  /* Folding away is a state of its own, because the row cannot animate out of a
     tree it has already left. `open` is what is mounted; `closing` is what it is
     doing while it is still there. */
  const [open, setOpen] = useState(applied > 0)
  const [closing, setClosing] = useState(false)
  const expanded = open && !closing

  useEffect(() => {
    if (!closing) return

    /* Timed rather than waiting on `animationend`, which never fires when the
       animation is the one `motion-safe` withholds — the row would stay on the
       page for good. */
    const wait = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : EXIT_MS
    const timer = window.setTimeout(() => {
      setOpen(false)
      setClosing(false)
    }, wait)

    return () => window.clearTimeout(timer)
  }, [closing])

  const toggle = () => {
    // Caught mid-fold. The row never left, so swapping the keyframe back drops
    // it into place again rather than mounting a second one behind it.
    if (closing) setClosing(false)
    else if (open) setClosing(true)
    else setOpen(true)
  }

  const clear = () => onChange(NO_FILTERS)

  return (
    // The header band below is a shape of its own now rather than a line of
    // labels, so it needs clearing from the rule under the tabs — at 16px the
    // two were reading as one stacked control.
    <div className="mb-6">
      {/* Runs the width of the table rather than the width of the pane. The
          rule is the top edge of the list, so it starts and stops where the
          list does — the negative margin matches the table's own. */}
      <div className="relative -mx-2 flex items-center justify-between gap-4 px-2">
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-hairline" />

        {children}

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={toggle}
            aria-expanded={expanded}
            aria-controls="order-filters"
            className={cn(
              // No ring: sharing a row with the tabs, an outlined button was the
              // heaviest thing in it, and it is the least important.
              'inline-flex h-8 items-center gap-2 rounded-md px-2.5 text-[13px] font-medium transition-colors',
              expanded || applied > 0
                ? 'bg-neutral-fill text-ink'
                : 'text-ink-secondary hover:bg-neutral-fill hover:text-ink',
            )}
          >
            <SlidersHorizontal
              size={14}
              className={applied > 0 ? 'text-brand' : 'text-ink-muted'}
            />
            Filters
            {applied > 0 && (
              <span className="tnum grid size-[18px] place-items-center rounded-full bg-brand text-[11px] font-medium text-white">
                {applied}
              </span>
            )}
            <ChevronDown
              size={14}
              className={cn('text-ink-muted transition-transform', expanded && 'rotate-180')}
            />
          </button>

          {/* Folded away, the badge says a filter is on but leaves no way to
              take it off without opening the row first. Undoing something the
              reader can see should not cost them a trip through the control
              that set it. Only out here while the row is closed — the open row
              carries its own Clear, and two of them is a question about which
              one does more. */}
          {!open && applied > 0 && <ClearButton onClick={clear} />}
        </div>
      </div>

      {open && (
        <div
          id="order-filters"
          className={cn(
            'flex flex-wrap items-center gap-2 pt-3',
            closing
              ? // `forwards`, so the row holds its last frame instead of
                // flashing back to full for the tick before it unmounts.
                'pointer-events-none motion-safe:animate-[ascend_120ms_ease-in_forwards]'
              : 'motion-safe:animate-[descend_140ms_ease-out]',
          )}
        >
          <MultiSelect
            label="Status"
            placeholder="All statuses"
            selected={filters.status}
            onChange={(status) => onChange({ status: status as OrderStatus[] })}
            options={ORDER_FLOW.map((status) => ({
              value: status,
              label: STATUS_META[status].label,
            }))}
            className="w-[150px]"
          />

          <MultiSelect
            label="Priority"
            placeholder="All priorities"
            selected={filters.priority}
            onChange={(priority) => onChange({ priority: priority as Priority[] })}
            options={[
              { value: 'rush', label: 'Rush' },
              { value: 'standard', label: 'Standard' },
              { value: 'bulk', label: 'Bulk' },
            ]}
            className="w-[150px]"
          />

          <MultiSelect
            label="Assignee"
            placeholder="Anyone"
            selected={filters.assignee}
            onChange={(assignee) => onChange({ assignee })}
            options={[
              { value: 'none', label: 'Unassigned' },
              ...users.map((user) => ({ value: user.id, label: user.name })),
            ]}
            className="w-[170px]"
          />

          {/* The only one of the four that cannot be scanned: statuses and
              priorities are a handful of fixed words, but the customer list is
              as long as the book of business and grows with it. */}
          <MultiSelect
            label="Customer"
            placeholder="Any customer"
            searchable
            selected={filters.customer}
            onChange={(customer) => onChange({ customer })}
            options={customers.map((name) => ({ value: name, label: name }))}
            className="w-[180px]"
          />

          {isFiltered && <ClearButton onClick={clear} className="h-9" />}
        </div>
      )}
    </div>
  )
}

function ClearButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2 text-[13px] text-ink-secondary transition-colors hover:bg-neutral-fill hover:text-ink',
        className,
      )}
    >
      <X size={13} />
      Clear
    </button>
  )
}
