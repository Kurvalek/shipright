import type { ReactNode } from 'react'
import { PackageOpen } from 'lucide-react'
import { Checkbox } from '@/components/ui/Checkbox'
import { EmptyState } from '@/components/ui/EmptyState'
import { ORDER_COLUMN_COUNT, OrderRow } from './OrderRow'
import type { Order, OrderStatus, User } from '@/lib/types'
import type { SkuIndex } from '@/lib/derive'

const columns = [
  'Order',
  'Customer',
  'Ship by',
  'Status',
  'Priority',
  'Assignee',
  'Items',
  'Stock',
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
        <table className="w-full min-w-[1080px] border-collapse">
          <thead>
            <tr className="border-b border-hairline bg-surface-sunken">
              <th className="w-10 py-2.5 pl-5">
                <Checkbox
                  checked={allSelected}
                  indeterminate={selectedHere > 0 && !allSelected}
                  onChange={onToggleAll}
                  label="Select all orders in this view"
                />
              </th>
              {columns.map((column) => (
                <th key={column} className="label-micro py-2.5 pr-4 text-left">
                  {column}
                </th>
              ))}
              <th className="label-micro py-2.5 pr-5 text-right">Actions</th>
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
