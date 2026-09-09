import { useEffect, useState } from 'react'
import { SidePanel } from '@/components/ui/SidePanel'
import { Button } from '@/components/ui/Button'
import { Label, Select, Textarea } from '@/components/ui/Field'
import { Mono, DueCell, PriorityPill, StockIndicator } from './cells'
import { LineStockTable } from './LineStockTable'
import { StatusTimeline } from './StatusTimeline'
import { dueLabel, formatTimestamp, orderStock } from '@/lib/derive'
import type { SkuIndex } from '@/lib/derive'
import type { Order, OrderStatus, User } from '@/lib/types'

/* Detail and notes, not the only way to move an order forward. Status still
   lives here, but the row and the bulk bar are the fast paths. */
export function OrderDetailsPanel({
  order,
  users,
  skus,
  now,
  onClose,
  onStatus,
  onAssign,
  onNotes,
}: {
  order: Order | null
  users: User[]
  skus: SkuIndex
  now: Date
  onClose: () => void
  onStatus: (id: string, status: OrderStatus) => void
  onAssign: (id: string, assigneeId: string | null) => void
  onNotes: (id: string, notes: string) => void
}) {
  const [notes, setNotes] = useState('')

  useEffect(() => {
    setNotes(order?.notes ?? '')
  }, [order?.id, order?.notes])

  if (!order) return null

  const stock = orderStock(order, skus)
  const due = dueLabel(order, now)

  return (
    <SidePanel
      open
      onClose={onClose}
      title={order.customer}
      eyebrow={
        <>
          <Mono className="text-ink-secondary">{order.id}</Mono>
          <span className="text-ink-muted">·</span>
          <PriorityPill priority={order.priority} />
        </>
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              onNotes(order.id, notes)
              onClose()
            }}
          >
            Save changes
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="rounded-lg border border-hairline bg-surface-sunken px-4 py-4">
          <StatusTimeline status={order.status} onChange={(next) => onStatus(order.id, next)} />
        </div>

        {/* Two columns, not four: the panel is narrower than the modal was. */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          <div>
            <Label>Ship by</Label>
            <DueCell due={due} />
          </div>
          <div>
            <Label>Placed</Label>
            <p className="tnum text-[13px] text-ink">{formatTimestamp(order.placedAt)}</p>
          </div>
          <div>
            <Label>Fulfillment</Label>
            <StockIndicator
              state={stock.state}
              lowCount={stock.lowCount}
              outCount={stock.outCount}
            />
          </div>
          <div>
            <Label htmlFor="assignee">Assigned to</Label>
            <Select
              id="assignee"
              value={order.assigneeId ?? ''}
              placeholder="Unassigned"
              onChange={(e) => onAssign(order.id, e.target.value || null)}
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <Label>Order items</Label>
          <div className="overflow-x-auto rounded-table border border-hairline px-4 py-2">
            <LineStockTable lines={stock.lines} />
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Notes and special instructions</Label>
          <Textarea
            id="notes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Gift notes, delivery instructions, anything the packer should know..."
          />
        </div>
      </div>
    </SidePanel>
  )
}
