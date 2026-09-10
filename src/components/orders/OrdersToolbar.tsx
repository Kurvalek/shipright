import { useState } from 'react'
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
}

export const NO_FILTERS: Filters = { search: '', status: [], priority: [], assignee: [] }

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
  }
}

export function sameFilters(a: Filters, b: Filters): boolean {
  const same = (x: string[], y: string[]) =>
    x.length === y.length && x.every((held) => y.includes(held))

  return (
    a.search === b.search &&
    same(a.status, b.status) &&
    same(a.priority, b.priority) &&
    same(a.assignee, b.assignee)
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
  children,
}: {
  filters: Filters
  onChange: (patch: Partial<Filters>) => void
  users: User[]
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
  const applied = [filters.status, filters.priority, filters.assignee].filter(
    (chosen) => chosen.length > 0,
  ).length
  const isFiltered = applied > 0 || filters.search !== ''

  const [open, setOpen] = useState(applied > 0)

  const clear = () => onChange(NO_FILTERS)

  return (
    <div className="mb-4">
      {/* Runs the width of the table rather than the width of the pane. The
          rule is the top edge of the list, so it starts and stops where the
          list does — the negative margin matches the table's own. */}
      <div className="relative -mx-2 flex items-center justify-between gap-4 px-2">
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-hairline" />

        {children}

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setOpen((previous) => !previous)}
            aria-expanded={open}
            aria-controls="order-filters"
            className={cn(
              // No ring: sharing a row with the tabs, an outlined button was the
              // heaviest thing in it, and it is the least important.
              'inline-flex h-8 items-center gap-2 rounded-md px-2.5 text-[13px] font-medium transition-colors',
              open || applied > 0
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
              className={cn('text-ink-muted transition-transform', open && 'rotate-180')}
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
          className="flex flex-wrap items-center gap-2 pt-3 motion-safe:animate-[rise_120ms_ease-out]"
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
