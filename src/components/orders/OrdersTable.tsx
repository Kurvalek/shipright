import type { ReactNode } from 'react'
import { ChevronRight, PackageOpen } from 'lucide-react'
import { Checkbox } from '@/components/ui/Checkbox'
import { EmptyState } from '@/components/ui/EmptyState'
import { ORDER_COLUMN_COUNT, OrderRow } from './OrderRow'
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
   width, and both already truncate. */
const CHECKBOX_WIDTH = 36
const ACTIONS_WIDTH = 138

const columns = [
  { label: 'Order', width: 96 },
  // Splits the surplus with Assignee.
  { label: 'Customer', width: null },
  { label: 'Ship by', width: 100 },
  { label: 'Status (step)', width: 104 },
  { label: 'Priority', width: 84 },
  { label: 'Assignee', width: null },
  { label: 'Items', width: 76 },
  { label: 'Stock', width: 102 },
] as const

/* The declared widths plus enough for a name in each of the two flexible
   columns. Below this the table scrolls rather than crushing them. */
const MIN_TABLE_WIDTH = 944

export function OrdersTable({
  orders,
  groups,
  collapsedGroups,
  users,
  skus,
  now,
  selected,
  expandedId,
  empty,
  onToggleGroup,
  onToggleSelect,
  onToggleAll,
  onToggleExpand,
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
  expandedId: string | null
  empty: { title: string; body: string; action?: ReactNode }
  onToggleGroup?: (id: string) => void
  onToggleSelect: (id: string) => void
  onToggleAll: (next: boolean) => void
  onToggleExpand: (id: string) => void
  onOpen: (id: string) => void
  onStatus: (ids: string[], status: OrderStatus) => void
  onAssign: (ids: string[], assigneeId: string | null) => void
}) {
  const selectedHere = orders.filter((o) => selected.has(o.id)).length
  const allSelected = orders.length > 0 && selectedHere === orders.length

  /* One rendering path either way: an ungrouped stage is a single unnamed
     section, and a null label is what says "no heading for this one". With
     nothing to show the sections drop out, so the empty state speaks for the
     whole stage instead of appearing under a stack of zeroed headings. */
  const sections: Array<Omit<OrderGroup, 'label'> & { label: string | null }> =
    orders.length === 0 ? [] : (groups ?? [{ id: 'all', label: null, orders }])

  return (
    <div className="overflow-hidden rounded-table border border-hairline bg-surface">
      <div className="overflow-x-auto">
        <table
          className="w-full table-fixed border-collapse"
          style={{ minWidth: MIN_TABLE_WIDTH }}
        >
          <colgroup>
            <col style={{ width: CHECKBOX_WIDTH }} />
            {columns.map((column) => (
              <col
                key={column.label}
                style={column.width ? { width: column.width } : undefined}
              />
            ))}
            <col style={{ width: ACTIONS_WIDTH }} />
          </colgroup>

          <thead>
            <tr className="border-b border-hairline bg-surface-sunken">
              <th className="py-2.5 pl-5">
                <Checkbox
                  checked={allSelected}
                  indeterminate={selectedHere > 0 && !allSelected}
                  onChange={onToggleAll}
                  label="Select all orders in this view"
                />
              </th>
              {columns.map((column) => (
                <th key={column.label} className="label-text py-2.5 pr-4 text-left">
                  {column.label}
                </th>
              ))}
              <th className="label-text py-2.5 pr-5 text-right">Actions</th>
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
                      expanded={expandedId === order.id}
                      onToggleSelect={() => onToggleSelect(order.id)}
                      onToggleExpand={() => onToggleExpand(order.id)}
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
                <td colSpan={ORDER_COLUMN_COUNT}>
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
    <tr>
      <td colSpan={ORDER_COLUMN_COUNT} className="border-b border-hairline p-0">
        <button
          type="button"
          onClick={onToggle}
          disabled={empty}
          aria-expanded={empty ? undefined : !collapsed}
          className={cn(
            'flex w-full items-center gap-2.5 py-2.5 pr-5 pl-4 text-left transition-colors',
            !empty && 'hover:bg-surface-sunken',
          )}
        >
          <ChevronRight
            size={15}
            className={cn(
              'shrink-0 text-ink-muted transition-transform',
              empty && 'opacity-0',
              !collapsed && 'rotate-90',
            )}
          />

          <span className={cn('text-[13px] font-medium', empty ? 'text-ink-muted' : 'text-ink')}>
            {label}
          </span>

          <span
            className={cn(
              'tnum grid h-[20px] min-w-[20px] place-items-center rounded px-1.5 text-[12px] font-medium',
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
