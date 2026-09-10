import { ArrowRight, MoreHorizontal } from 'lucide-react'
import { Checkbox } from '@/components/ui/Checkbox'
import { Button } from '@/components/ui/Button'
import { Menu } from '@/components/ui/Menu'
import { AssigneeCell, DueCell, Mono, PriorityFlag, StatusSteps, StockIndicator } from './cells'
import { STATUS_META, dueLabel, nextAction, orderStock } from '@/lib/derive'
import type { SkuIndex } from '@/lib/derive'
import type { Order, OrderStatus, User } from '@/lib/types'
import { cn } from '@/lib/cn'

/** Checkbox and actions either side of the data columns, two of which drop out
    of the compact layout. */
export function orderColumnCount(compact: boolean): number {
  return compact ? 8 : 10
}

export function OrderRow({
  order,
  users,
  skus,
  now,
  selected,
  open = false,
  compact = false,
  onToggleSelect,
  onOpen,
  onStatus,
  onAssign,
}: {
  order: Order
  users: User[]
  skus: SkuIndex
  now: Date
  selected: boolean
  /** Currently shown in the detail pane. */
  open?: boolean
  compact?: boolean
  onToggleSelect: () => void
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
    /* The whole row opens the record. It used to unfold a strip of line items
       in place and keep a "View" link for the rest, which meant two ways of
       looking at one order and a row that answered a click with the lesser of
       them. The pane holds everything the strip did. */
    <tr
      onClick={onOpen}
      className={cn(
        'group cursor-pointer border-b border-hairline-subtle transition-colors last:border-0',
        selected || open ? 'bg-brand-tint' : 'hover:bg-surface-sunken',
      )}
    >
      {/* A rule down the left edge rather than another fill, so the row the
          pane is describing stays picked out even while it is also selected. */}
      <td className={cn('w-10 pl-2', open && 'shadow-[inset_3px_0_0_0_var(--color-brand)]')}>
        <Checkbox checked={selected} onChange={onToggleSelect} label={`Select ${order.id}`} />
      </td>

      <td className="py-3.5 pr-4">
        {/* A real control on the row's own identifier, so the record is
            reachable by keyboard now that nothing else in the row opens it. */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onOpen()
          }}
          aria-label={`Open ${order.id}`}
          className="block text-left"
        >
          {/* The one thing every conversation about a row starts with, so it
              carries the weight the rest of the row gives up. */}
          <Mono className="text-[14.5px] font-bold text-ink underline decoration-transparent underline-offset-[3px] transition-colors group-hover:decoration-ink-muted">
            {order.id}
          </Mono>
        </button>
      </td>

      {/* The column's own width governs now that the table is fixed, so this
          only needs to say what happens when a name outgrows it. */}
      <td className="truncate py-3.5 pr-4 text-[14px] text-ink">{order.customer}</td>

      <td className="py-3.5 pr-4">
        <DueCell due={due} />
      </td>

      <td className="py-3.5 pr-4">
        <StatusSteps status={order.status} />
      </td>

      {!compact && (
        <td className="py-3.5 pr-4">
          <PriorityFlag priority={order.priority} />
        </td>
      )}

      <td className="py-3.5 pr-4">
        <AssigneeCell user={assignee} />
      </td>

      {!compact && (
        <td className="tnum py-3.5 pr-4 text-[14px] whitespace-nowrap text-ink-secondary">
          {order.lines.length} {order.lines.length === 1 ? 'line' : 'lines'}
          <span className="text-ink-muted"> · {itemCount}</span>
        </td>
      )}

      <td className="py-3.5 pr-4">
        <StockIndicator state={stock.state} lowCount={stock.lowCount} outCount={stock.outCount} />
      </td>

      <td className="py-3 pr-2 pl-2 text-right">
        <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {/* The move itself, down to a square. Spelled out it needed room
              for "Mark in progress" on every row, and reserving that much for
              a button only visible on hover left a void beside every stock
              reading. Standing rather than appearing on hover is also the
              more honest trade: this is the action the floor performs all day,
              so it should not have to be discovered. The words are in the
              tooltip, the overflow menu and the details panel. */}
          {advance && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onStatus(advance.next)}
              title={advance.long}
              aria-label={`${advance.long}: ${order.id}`}
              className="w-7 px-0"
            >
              <ArrowRight size={15} />
            </Button>
          )}

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
            trigger={({ toggle, open: menuOpen }) => (
              <button
                type="button"
                aria-label={`More actions for ${order.id}`}
                onClick={toggle}
                className={cn(
                  'grid size-7 place-items-center rounded-md text-ink-muted transition-colors hover:bg-neutral-fill hover:text-ink',
                  menuOpen && 'bg-neutral-fill text-ink',
                )}
              >
                <MoreHorizontal size={15} />
              </button>
            )}
          />
        </div>
      </td>
    </tr>
  )
}
