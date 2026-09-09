import { ChevronRight, MoreHorizontal } from 'lucide-react'
import { Checkbox } from '@/components/ui/Checkbox'
import { Button } from '@/components/ui/Button'
import { Menu } from '@/components/ui/Menu'
import { AssigneeCell, DueCell, Mono, PriorityFlag, StatusSteps, StockIndicator } from './cells'
import { LineStockTable } from './LineStockTable'
import { STATUS_META, dueLabel, nextAction, orderStock } from '@/lib/derive'
import type { SkuIndex } from '@/lib/derive'
import type { Order, OrderStatus, User } from '@/lib/types'
import { cn } from '@/lib/cn'

export const ORDER_COLUMN_COUNT = 10

export function OrderRow({
  order,
  users,
  skus,
  now,
  selected,
  expanded,
  onToggleSelect,
  onToggleExpand,
  onOpen,
  onStatus,
  onAssign,
}: {
  order: Order
  users: User[]
  skus: SkuIndex
  now: Date
  selected: boolean
  expanded: boolean
  onToggleSelect: () => void
  onToggleExpand: () => void
  onOpen: () => void
  onStatus: (status: OrderStatus) => void
  onAssign: (assigneeId: string | null) => void
}) {
  const stock = orderStock(order, skus)
  const due = dueLabel(order, now)
  const assignee = users.find((u) => u.id === order.assigneeId)
  const advance = nextAction(order.status)
  const itemCount = order.lines.reduce((sum, line) => sum + line.qty, 0)

  return (
    <>
      <tr
        onClick={onToggleExpand}
        className={cn(
          'group cursor-pointer border-b border-hairline-subtle transition-colors last:border-0',
          selected ? 'bg-brand-tint' : 'hover:bg-surface-sunken',
          expanded && !selected && 'bg-surface-sunken',
        )}
      >
        <td className="w-10 pl-5">
          <Checkbox
            checked={selected}
            onChange={onToggleSelect}
            label={`Select ${order.id}`}
          />
        </td>

        <td className="py-2.5 pr-4">
          {/* A real button so the expansion is reachable without a pointer.
              Clicking anywhere on the row does the same thing. */}
          <button
            type="button"
            aria-expanded={expanded}
            aria-label={`${expanded ? 'Hide' : 'Show'} line items for ${order.id}`}
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpand()
            }}
            className="flex items-center gap-1.5"
          >
            <ChevronRight
              size={13}
              className={cn(
                'shrink-0 text-ink-muted transition-transform',
                expanded && 'rotate-90',
              )}
            />
            <Mono className="font-medium text-ink">{order.id}</Mono>
          </button>
        </td>

        <td className="max-w-[220px] truncate py-2.5 pr-4 text-[13px] text-ink">{order.customer}</td>

        <td className="py-2.5 pr-4">
          <DueCell due={due} />
        </td>

        <td className="py-2.5 pr-4">
          <StatusSteps status={order.status} />
        </td>

        <td className="py-2.5 pr-4">
          <PriorityFlag priority={order.priority} />
        </td>

        <td className="py-2.5 pr-4">
          <AssigneeCell user={assignee} />
        </td>

        <td className="tnum py-2.5 pr-4 text-[13px] whitespace-nowrap text-ink-secondary">
          {order.lines.length} {order.lines.length === 1 ? 'line' : 'lines'}
          <span className="text-ink-muted"> · {itemCount}</span>
        </td>

        <td className="py-2.5 pr-4">
          <StockIndicator state={stock.state} lowCount={stock.lowCount} outCount={stock.outCount} />
        </td>

        <td className="py-2 pr-4 pl-2">
          <div
            className="flex items-center justify-end gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Reserved space, revealed on hover or keyboard focus, so the row
                does not reflow as the pointer moves down the table. */}
            {advance && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onStatus(advance.next)}
                className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              >
                {advance.label}
              </Button>
            )}

            <Button size="sm" variant="ghost" onClick={onOpen}>
              View
            </Button>

            <Menu
              header="Move to"
              items={[
                ...(['new', 'in_progress', 'packed', 'shipped', 'completed'] as OrderStatus[])
                  .filter((s) => s !== order.status)
                  .map((s) => ({
                    label: STATUS_META[s].label,
                    onSelect: () => onStatus(s),
                  })),
                ...(order.assigneeId
                  ? [{ label: 'Unassign', onSelect: () => onAssign(null) }]
                  : []),
              ]}
              trigger={({ toggle, open }) => (
                <button
                  type="button"
                  aria-label={`More actions for ${order.id}`}
                  onClick={toggle}
                  className={cn(
                    'grid size-7 place-items-center rounded-md text-ink-muted transition-colors hover:bg-neutral-fill hover:text-ink',
                    open && 'bg-neutral-fill text-ink',
                  )}
                >
                  <MoreHorizontal size={15} />
                </button>
              )}
            />
          </div>
        </td>
      </tr>

      {expanded && (
        <tr className="border-b border-hairline-subtle bg-surface-sunken last:border-0">
          <td colSpan={ORDER_COLUMN_COUNT} className="p-5">
            <div className="rounded-table border border-hairline bg-surface p-4">
              <div className="mb-3 flex items-center justify-end">
                <div className="flex items-center gap-2">
                  {order.assigneeId === null && (
                    <Menu
                      header="Assign to"
                      items={users.map((user) => ({
                        label: user.name,
                        onSelect: () => onAssign(user.id),
                      }))}
                      trigger={({ toggle }) => (
                        <Button size="sm" onClick={toggle}>
                          Assign
                        </Button>
                      )}
                    />
                  )}
                  <Button size="sm" variant="ghost" onClick={onOpen}>
                    Open full details
                  </Button>
                </div>
              </div>

              <LineStockTable lines={stock.lines} />

              {/* The label and the note now share a size, so the note takes
                  full ink to stay the thing being read. */}
              {order.notes && (
                <p className="mt-3 border-t border-hairline-subtle pt-3 text-[13px] text-ink">
                  <span className="label-text mr-2">Note</span>
                  {order.notes}
                </p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
