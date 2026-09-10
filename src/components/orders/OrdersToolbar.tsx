import { useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react'
import { Select } from '@/components/ui/Field'
import { STATUS_META } from '@/lib/derive'
import { ORDER_FLOW } from '@/lib/derive'
import type { OrderStatus, Priority, User } from '@/lib/types'
import { cn } from '@/lib/cn'

export interface Filters {
  search: string
  status: OrderStatus | ''
  priority: Priority | ''
  assignee: string
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
  /* Search is deliberately not counted: it lives in the top bar, in plain
     sight, so it is not one of the things being folded away here. Clearing
     still takes it, because "clear" that leaves a search running is a lie. */
  const applied = [filters.status, filters.priority, filters.assignee].filter(Boolean).length
  const isFiltered = applied > 0 || filters.search !== ''

  const [open, setOpen] = useState(applied > 0)

  return (
    <div className="mb-4">
      {/* Runs the width of the table rather than the width of the pane. The
          rule is the top edge of the list, so it starts and stops where the
          list does — the negative margin matches the table's own. */}
      <div className="relative -mx-2 flex items-center justify-between gap-4 px-2">
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-hairline" />

        {children}

        <button
          type="button"
          onClick={() => setOpen((previous) => !previous)}
          aria-expanded={open}
          aria-controls="order-filters"
          className={cn(
            // No ring: sharing a row with the tabs, an outlined button was the
            // heaviest thing in it, and it is the least important.
            'inline-flex h-8 shrink-0 items-center gap-2 rounded-md px-2.5 text-[13px] font-medium transition-colors',
            open || applied > 0
              ? 'bg-neutral-fill text-ink'
              : 'text-ink-secondary hover:bg-neutral-fill hover:text-ink',
          )}
        >
          <SlidersHorizontal size={14} className={applied > 0 ? 'text-brand' : 'text-ink-muted'} />
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
      </div>

      {open && (
        <div
          id="order-filters"
          className="flex flex-wrap items-center gap-2 pt-3 motion-safe:animate-[rise_120ms_ease-out]"
        >
          <Select
            value={filters.status}
            placeholder="All statuses"
            aria-label="Filter by status"
            onChange={(e) => onChange({ status: e.target.value as OrderStatus | '' })}
            className="w-[150px]"
          >
            {ORDER_FLOW.map((status) => (
              <option key={status} value={status}>
                {STATUS_META[status].label}
              </option>
            ))}
          </Select>

          <Select
            value={filters.priority}
            placeholder="All priorities"
            aria-label="Filter by priority"
            onChange={(e) => onChange({ priority: e.target.value as Priority | '' })}
            className="w-[150px]"
          >
            <option value="rush">Rush</option>
            <option value="standard">Standard</option>
            <option value="bulk">Bulk</option>
          </Select>

          <Select
            value={filters.assignee}
            placeholder="Anyone"
            aria-label="Filter by assignee"
            onChange={(e) => onChange({ assignee: e.target.value })}
            className="w-[160px]"
          >
            <option value="none">Unassigned</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </Select>

          {isFiltered && (
            <button
              type="button"
              onClick={() => onChange({ search: '', status: '', priority: '', assignee: '' })}
              className="inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-[13px] text-ink-secondary transition-colors hover:bg-neutral-fill hover:text-ink"
            >
              <X size={13} />
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  )
}
