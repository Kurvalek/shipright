import type { ReactNode } from 'react'
import { PackageOpen } from 'lucide-react'
import { Checkbox } from '@/components/ui/Checkbox'
import { EmptyState } from '@/components/ui/EmptyState'
import { ORDER_COLUMN_COUNT, OrderRow } from './OrderRow'
import type { Order, OrderStatus, User } from '@/lib/types'
import type { SkuIndex } from '@/lib/derive'

/* Widths are declared rather than derived. Left to itself the browser sizes
   each column to whatever happens to be in it, so switching stages shifted
   every boundary — Completed has no advance button and Shipped has no "2d
   overdue", and the whole grid slid sideways to suit. Fixed columns cost a few
   pixels of fit and buy a table that stays still.

   Customer is the one column left flexible, because it is also the only one
   already set to truncate. */
const CHECKBOX_WIDTH = 40
const ACTIONS_WIDTH = 250

const columns = [
  { label: 'Order', width: 104 },
  // Takes whatever is left over.
  { label: 'Customer', width: null },
  { label: 'Ship by', width: 118 },
  { label: 'Status (step)', width: 124 },
  { label: 'Priority', width: 98 },
  { label: 'Assignee', width: 166 },
  { label: 'Items', width: 90 },
  { label: 'Stock', width: 108 },
] as const

export function OrdersTable({
  orders,
  users,
  skus,
  now,
  selected,
  expandedId,
  empty,
  onToggleSelect,
  onToggleAll,
  onToggleExpand,
  onOpen,
  onStatus,
  onAssign,
}: {
  orders: Order[]
  users: User[]
  skus: SkuIndex
  now: Date
  selected: Set<string>
  expandedId: string | null
  empty: { title: string; body: string; action?: ReactNode }
  onToggleSelect: (id: string) => void
  onToggleAll: (next: boolean) => void
  onToggleExpand: (id: string) => void
  onOpen: (id: string) => void
  onStatus: (ids: string[], status: OrderStatus) => void
  onAssign: (ids: string[], assigneeId: string | null) => void
}) {
  const selectedHere = orders.filter((o) => selected.has(o.id)).length
  const allSelected = orders.length > 0 && selectedHere === orders.length

  return (
    <div className="overflow-hidden rounded-table border border-hairline bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] table-fixed border-collapse">
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

          <tbody>
            {orders.map((order) => (
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

            {orders.length === 0 && (
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
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
