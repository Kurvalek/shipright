import { Fragment } from 'react'
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

   They are shares rather than pixels, though. Fixing eight columns and leaving
   Customer and Assignee to divide the remainder meant those two absorbed every
   spare pixel on the page: on a wide window they ran past 300px each to hold a
   name that wants 120, and the gap after each one was wider than the name
   itself. The surplus belongs to the table, not to whichever columns happen to
   be flexible, so every column takes the same fraction of it that it takes of
   the whole.

   Every column, including the two holding controls, because a percentage is
   the only thing the fixed layout algorithm will honour here: a `calc()` of a
   percentage minus the pixels those two need parses fine and is then ignored,
   and the columns fall back to equal thirds of the remainder. The numbers below
   are read as pixels at the narrowest the table goes and as shares above it, so
   the checkbox and the buttons are exact where it is tight and a little loose
   where there is room to spare.

   `secondary` marks the columns the detail pane repeats. With the pane open
   they are the ones to give up, since the reader is looking at a fuller
   version of the same fact a few hundred pixels to the right. */
/* The box plus the gutter it is set in. The table bleeds a little past the page
   column so a hovered row reads as a band rather than a panel, and without a
   gutter of its own the checkbox landed on the page's own edge with only that
   bleed beside it — closer to the rule under the tabs than to the ID it
   belongs to. */
const CHECKBOX_WEIGHT = 38
/* An advance square and an overflow button, plus the matching gutter on the far
   side. The "View" link that used to sit between them is gone: the row itself
   opens the record now. */
const ACTIONS_WEIGHT = 80

const allColumns = [
  // No disclosure triangle in front of the ID any more, so it needs less room.
  { label: 'Order', weight: 84, secondary: false },
  { label: 'Customer', weight: 132, secondary: false },
  { label: 'Ship by', weight: 96, secondary: false },
  { label: 'Status', weight: 100, secondary: false },
  { label: 'Priority', weight: 80, secondary: true },
  { label: 'Assignee', weight: 116, secondary: false },
  { label: 'Items', weight: 72, secondary: true },
  { label: 'Stock', weight: 96, secondary: false },
] as const

/* Column labels, shared with the inventory grid. Secondary ink rather than
   muted: sitting on a fill, muted grey was the faintest thing on the page and
   it is the one row that has to be read before any of the others. */
export const HEADER_CELL = 'py-2.5 pr-4 text-[12.5px] font-medium text-ink-secondary'

/** Everything a run of rows needs, whether it is the whole stage or one group. */
interface RowProps {
  users: User[]
  skus: SkuIndex
  now: Date
  selected: Set<string>
  /** The order the detail pane is showing, marked so the two stay tied together. */
  openId?: string | null
  /** Drops the columns the detail pane repeats, to survive the narrower page. */
  compact: boolean
  onToggleSelect: (id: string) => void
  /** Takes the ids it covers, since a header now speaks for its own table. */
  onToggleAll: (ids: string[], next: boolean) => void
  onOpen: (id: string) => void
  onStatus: (ids: string[], status: OrderStatus) => void
  onAssign: (ids: string[], assigneeId: string | null) => void
}

export function OrdersTable({
  orders,
  groups,
  collapsedGroups,
  empty,
  onToggleGroup,
  ...rows
}: RowProps & {
  orders: Order[]
  /** Splits `orders` into named sections. Omit for a single flat run of rows. */
  groups?: OrderGroup[]
  collapsedGroups?: Set<string>
  empty: { title: string; body: string; action?: ReactNode }
  onToggleGroup?: (id: string) => void
}) {
  /* A grouped stage is two tables, not one table with dividers in it. Overdue
     and Missing stock are answers to different questions — one is late, the
     other cannot be picked — and a heading spanning a row of a shared grid made
     them look like two halves of one list. Each has its own column headers now,
     which is what lets the second one be read without scrolling back up.

     With nothing in the stage at all the headings drop out entirely, so the
     empty state speaks for the whole thing rather than appearing underneath a
     stack of zeroed titles. */
  if (groups && orders.length > 0) {
    return (
      <div>
        {groups.map((group, index) => {
          const collapsed = collapsedGroups?.has(group.id) ?? false

          return (
            <Fragment key={group.id}>
              {/* Space alone left it ambiguous whether the second title
                  belonged to the table above or the one below it. Drawn to the
                  width of the tables rather than the pane, like the rule under
                  the tabs. */}
              {index > 0 && <div aria-hidden className="-mx-2 my-7 border-t border-hairline" />}

              <section>
                <GroupTitle
                  label={group.label}
                  count={group.orders.length}
                  collapsed={collapsed}
                  onToggle={() => onToggleGroup?.(group.id)}
                />

                {/* Folded on a grid track rather than by being taken out of the
                    tree, so the sections below slide instead of jumping the
                    depth of a table. A transition rather than a keyframe: the
                    table stays mounted either way, and a transition reverses
                    from wherever it has got to when somebody changes their
                    mind halfway. */}
                {group.orders.length > 0 && (
                  <div
                    // Still rendered while folded, so still tabbable without
                    // this — a table nobody can see is not one to land in.
                    inert={collapsed}
                    className={cn(
                      'grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none',
                      collapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]',
                    )}
                  >
                    <div className="overflow-hidden">
                      <Grid orders={group.orders} {...rows} />
                    </div>
                  </div>
                )}
              </section>
            </Fragment>
          )
        })}
      </div>
    )
  }

  return <Grid orders={orders} empty={empty} {...rows} />
}

function Grid({
  orders,
  empty,
  users,
  skus,
  now,
  selected,
  openId,
  compact,
  onToggleSelect,
  onToggleAll,
  onOpen,
  onStatus,
  onAssign,
}: RowProps & { orders: Order[]; empty?: { title: string; body: string; action?: ReactNode } }) {
  const ids = orders.map((order) => order.id)
  const selectedHere = ids.filter((id) => selected.has(id)).length
  const allSelected = orders.length > 0 && selectedHere === orders.length

  const columns = compact ? allColumns.filter((column) => !column.secondary) : allColumns
  const columnCount = orderColumnCount(compact)

  /* Dropping two columns redistributes their share across the rest rather than
     pooling it in whichever ones happen to be flexible, so the compact grid is
     the full one scaled down and not a different set of proportions. */
  const totalWeight =
    CHECKBOX_WEIGHT + ACTIONS_WEIGHT + columns.reduce((sum, column) => sum + column.weight, 0)

  const share = (weight: number) => `${((weight / totalWeight) * 100).toFixed(4)}%`

  return (
    /* No frame around the grid. A border and a fill were drawing a box around
       something the white pane already contains, and the rules between rows are
       the only lines the eye needs to track one across. */
    <div className="-mx-2 overflow-x-auto">
      <table
        className="w-full table-fixed border-collapse"
        style={{ minWidth: totalWeight }}
      >
        <colgroup>
          <col style={{ width: share(CHECKBOX_WEIGHT) }} />
          {columns.map((column) => (
            <col key={column.label} style={{ width: share(column.weight) }} />
          ))}
          <col style={{ width: share(ACTIONS_WEIGHT) }} />
        </colgroup>

        {/* A band rather than bare labels over the first row. The rules between
            rows read as the table, and without something separating the labels
            from them the top row of data started one line below a line of the
            same weight.

            The shell colour, so the band reads as the one place the pane is
            thin enough to see through. The sunken white a step above it is 2%
            off the pane and disappeared; the chip fill a step below is doing
            hover and badge duty everywhere else, and a band of it would tie
            the header to controls it has nothing to do with. */}
        <thead className="bg-canvas">
          <tr className="border-b border-hairline">
            <th className="py-2.5 pl-4">
              <Checkbox
                checked={allSelected}
                indeterminate={selectedHere > 0 && !allSelected}
                onChange={(next) => onToggleAll(ids, next)}
                label="Select all orders in this table"
              />
            </th>
            {columns.map((column) => (
              <th key={column.label} className={cn(HEADER_CELL, 'text-left')}>
                {column.label}
              </th>
            ))}
            <th className={cn(HEADER_CELL, 'pr-4 text-right')}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((order) => (
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

          {orders.length === 0 && empty && (
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
          )}
        </tbody>
      </table>
    </div>
  )
}

/* A title over its own table rather than a row inside a shared one, so it is
   set like a heading: the size of the page's own subheads, in full ink, with
   the count trailing it in plain type. A chip around the number would make a
   heading look like a badge, and the tabs above gave theirs up for the same
   reason. */
function GroupTitle({
  label,
  count,
  collapsed,
  onToggle,
}: {
  label: string
  count: number
  collapsed: boolean
  onToggle: () => void
}) {
  // Nothing to hide, so there is nothing to collapse. The count still reports.
  const empty = count === 0

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={empty}
      aria-expanded={empty ? undefined : !collapsed}
      className={cn(
        '-ml-1.5 mb-2 flex items-center gap-1.5 rounded-md py-1 pr-2.5 pl-1.5 text-left transition-colors',
        !empty && 'hover:bg-surface-sunken',
      )}
    >
      <ChevronRight
        size={17}
        className={cn(
          'shrink-0 text-ink-muted transition-transform',
          empty && 'opacity-0',
          !collapsed && !empty && 'rotate-90',
        )}
      />

      <span className={cn('text-[16px] font-medium', empty ? 'text-ink-muted' : 'text-ink')}>
        {label}
      </span>

      <span className="tnum text-[13px] text-ink-muted">{count}</span>
    </button>
  )
}
