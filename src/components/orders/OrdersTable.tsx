import type { ReactNode } from 'react'
import { ChevronRight, PackageOpen } from 'lucide-react'
import { Checkbox } from '@/components/ui/Checkbox'
import { EmptyState } from '@/components/ui/EmptyState'
import { OrderRow, orderColumnCount } from './OrderRow'
import type { Order, OrderStatus, User } from '@/lib/types'
import type { SkuIndex } from '@/lib/derive'
import { cn } from '@/lib/cn'

/** A named run of rows inside one stage, collapsible on its own. */
export interface OrderGroup {
  id: string
  label: string
  orders: Order[]
}

/* Widths are declared rather than derived. Left to itself the browser sizes
   each column to whatever happens to be in it, so switching stages shifted
   every boundary — Completed has no advance button, Shipped has no "2d
   overdue" — and the whole grid slid sideways to suit.

   Everything holding a control or a fixed format is given the pixels its
   content actually needs, so none of them collects spare room and shows it as
   a gap. Customer and Assignee are left to divide whatever is left over: they
   are the two columns that hold names, the only content here with no natural
   width, and both already truncate.

   `secondary` marks the columns the detail pane repeats. With the pane open
   they are the ones to give up, since the reader is looking at a fuller
   version of the same fact a few hundred pixels to the right. */
const CHECKBOX_WIDTH = 36
/* An advance square and an overflow button. The "View" link that used to sit
   between them is gone: the row itself opens the record now. */
const ACTIONS_WIDTH = 84

const allColumns = [
  // No disclosure triangle in front of the ID any more, so it needs less room.
  { label: 'Order', width: 100, compactWidth: null, secondary: false },
  // Splits the surplus with Assignee.
  { label: 'Customer', width: null, compactWidth: null, secondary: false },
  { label: 'Ship by', width: 108, compactWidth: null, secondary: false },
  { label: 'Status (step)', width: 112, compactWidth: null, secondary: false },
  { label: 'Priority', width: 92, compactWidth: null, secondary: true },
  /* Two columns dropping out leaves nearly two hundred pixels to redistribute,
     and split between the two flexible columns it showed up as a canyon either
     side of Assignee. Pinned, the surplus all lands in Customer, where longer
     names actually use it. */
  { label: 'Assignee', width: null, compactWidth: 180, secondary: false },
  { label: 'Items', width: 84, compactWidth: null, secondary: true },
  { label: 'Stock', width: 110, compactWidth: null, secondary: false },
] as const

/* The declared widths plus enough for a name in each of the two flexible
   columns. Below this the table scrolls rather than crushing them. */
const FULL_MIN_WIDTH = 920
const COMPACT_MIN_WIDTH = 640

export function OrdersTable({
  orders,
  groups,
  collapsedGroups,
  users,
  skus,
  now,
  selected,
  openId,
  compact = false,
  empty,
  onToggleGroup,
  onToggleSelect,
  onToggleAll,
  onOpen,
  onStatus,
  onAssign,
}: {
  orders: Order[]
  /** Splits `orders` into named sections. Omit for a single flat run of rows. */
  groups?: OrderGroup[]
  collapsedGroups?: Set<string>
  users: User[]
  skus: SkuIndex
  now: Date
  selected: Set<string>
  /** The order the detail pane is showing, marked so the two stay tied together. */
  openId?: string | null
  /** Drops the columns the detail pane repeats, to survive the narrower page. */
  compact?: boolean
  empty: { title: string; body: string; action?: ReactNode }
  onToggleGroup?: (id: string) => void
  onToggleSelect: (id: string) => void
  onToggleAll: (next: boolean) => void
  onOpen: (id: string) => void
  onStatus: (ids: string[], status: OrderStatus) => void
  onAssign: (ids: string[], assigneeId: string | null) => void
}) {
  const selectedHere = orders.filter((o) => selected.has(o.id)).length
  const allSelected = orders.length > 0 && selectedHere === orders.length

  const columns = compact ? allColumns.filter((column) => !column.secondary) : allColumns
  const columnCount = orderColumnCount(compact)

  /* One rendering path either way: an ungrouped stage is a single unnamed
     section, and a null label is what says "no heading for this one". With
     nothing to show the sections drop out, so the empty state speaks for the
     whole stage instead of appearing under a stack of zeroed headings. */
  const sections: Array<Omit<OrderGroup, 'label'> & { label: string | null }> =
    orders.length === 0 ? [] : (groups ?? [{ id: 'all', label: null, orders }])

  return (
    /* No frame around the grid. A border and a fill were drawing a box around
       something the white pane already contains, and the rules between rows are
       the only lines the eye needs to track one across. */
    <div className="-mx-2 overflow-x-auto">
      <table
        className="w-full table-fixed border-collapse"
        style={{ minWidth: compact ? COMPACT_MIN_WIDTH : FULL_MIN_WIDTH }}
      >
        <colgroup>
          <col style={{ width: CHECKBOX_WIDTH }} />
          {columns.map((column) => {
            const width = (compact ? column.compactWidth : null) ?? column.width
            return <col key={column.label} style={width ? { width } : undefined} />
          })}
          <col style={{ width: ACTIONS_WIDTH }} />
        </colgroup>

        <thead>
          <tr className="border-b border-hairline">
            <th className="pb-2.5 pl-2">
              <Checkbox
                checked={allSelected}
                indeterminate={selectedHere > 0 && !allSelected}
                onChange={onToggleAll}
                label="Select all orders in this view"
              />
            </th>
            {columns.map((column) => (
              <th
                key={column.label}
                className="pr-4 pb-2.5 text-left text-[12.5px] font-medium text-ink-muted"
              >
                {column.label}
              </th>
            ))}
            <th className="pr-2 pb-2.5 text-right text-[12.5px] font-medium text-ink-muted">
              Actions
            </th>
          </tr>
        </thead>

        {sections.map((section) => {
          const collapsed = collapsedGroups?.has(section.id) ?? false

          return (
            <tbody key={section.id}>
              {section.label !== null && (
                <GroupHeaderRow
                  label={section.label}
                  count={section.orders.length}
                  collapsed={collapsed}
                  columnCount={columnCount}
                  onToggle={() => onToggleGroup?.(section.id)}
                />
              )}

              {!collapsed &&
                section.orders.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    users={users}
                    skus={skus}
                    now={now}
                    selected={selected.has(order.id)}
                    open={openId === order.id}
                    compact={compact}
                    onToggleSelect={() => onToggleSelect(order.id)}
                    onOpen={() => onOpen(order.id)}
                    onStatus={(status) => onStatus([order.id], status)}
                    onAssign={(assigneeId) => onAssign([order.id], assigneeId)}
                  />
                ))}
            </tbody>
          )
        })}

        {orders.length === 0 && (
          <tbody>
            <tr>
              <td colSpan={columnCount}>
                <EmptyState
                  icon={<PackageOpen size={18} />}
                  title={empty.title}
                  body={empty.body}
                  action={empty.action}
                />
              </td>
            </tr>
          </tbody>
        )}
      </table>
    </div>
  )
}

/* Sits in the body rather than the head, so it scrolls with the rows it names.
   Kept lighter than the column headings above it: those label the grid, this
   one labels a stretch of it. */
function GroupHeaderRow({
  label,
  count,
  collapsed,
  columnCount,
  onToggle,
}: {
  label: string
  count: number
  collapsed: boolean
  columnCount: number
  onToggle: () => void
}) {
  // Nothing to hide, so there is nothing to collapse. The count still reports.
  const empty = count === 0

  return (
    <tr>
      <td colSpan={columnCount} className="border-b border-hairline p-0">
        <button
          type="button"
          onClick={onToggle}
          disabled={empty}
          aria-expanded={empty ? undefined : !collapsed}
          className={cn(
            'flex w-full items-center gap-2.5 rounded-md py-3 pr-2 pl-1.5 text-left transition-colors',
            !empty && 'hover:bg-surface-sunken',
          )}
        >
          <ChevronRight
            size={16}
            className={cn(
              'shrink-0 text-ink-muted transition-transform',
              empty && 'opacity-0',
              !collapsed && 'rotate-90',
            )}
          />

          <span className={cn('text-[14px] font-medium', empty ? 'text-ink-muted' : 'text-ink')}>
            {label}
          </span>

          <span
            className={cn(
              'tnum grid h-[21px] min-w-[21px] place-items-center rounded px-1.5 text-[12.5px] font-medium',
              empty ? 'text-ink-muted' : 'bg-neutral-fill text-neutral-text',
            )}
          >
            {count}
          </span>
        </button>
      </td>
    </tr>
  )
}
