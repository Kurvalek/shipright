import type {
  DueLabel,
  Fulfillment,
  InventoryItem,
  LaneId,
  Order,
  OrderStatus,
  OrderStock,
  Priority,
} from './types'

export const ORDER_FLOW: OrderStatus[] = ['new', 'in_progress', 'packed', 'shipped', 'completed']

/** An order still needs work from the floor. */
export function isActive(order: Order): boolean {
  return order.status !== 'shipped' && order.status !== 'completed'
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function isOverdue(order: Order, now: Date): boolean {
  return isActive(order) && new Date(order.dueAt).getTime() < now.getTime()
}

/* Ship today and Overdue overlap on purpose: Ship today is the whole day's
   workload, Overdue is the subset that has already slipped and needs a
   decision. An order due at 08:00 that is still unpacked belongs in both. */
export const LANES: Array<{ id: LaneId; label: string; description: string; empty: string }> = [
  {
    id: 'ship_today',
    label: 'Ship today',
    description: 'Due before the day is out and still open',
    empty: "Nothing left due today. The floor is clear.",
  },
  {
    id: 'at_risk',
    label: 'Overdue / at risk',
    description: 'Past its due time and still open',
    empty: 'Nothing overdue. Everything is inside its window.',
  },
  {
    id: 'unassigned',
    label: 'Unassigned',
    description: 'Nobody has picked these up yet',
    empty: 'Every open order has a name on it.',
  },
  {
    id: 'in_progress',
    label: 'In progress',
    description: 'Being picked right now',
    empty: 'Nothing is being picked at the moment.',
  },
  {
    id: 'ready_to_ship',
    label: 'Ready to ship',
    description: 'Packed and waiting on a carrier',
    empty: 'No packed orders waiting. Nothing is backing up.',
  },
  {
    id: 'all',
    label: 'All orders',
    description: 'Everything, newest due first',
    empty: 'No orders yet.',
  },
]

export function matchesLane(order: Order, lane: LaneId, now: Date): boolean {
  switch (lane) {
    case 'ship_today':
      return isActive(order) && isSameDay(new Date(order.dueAt), now)
    case 'at_risk':
      return isOverdue(order, now)
    case 'unassigned':
      return order.assigneeId === null && order.status !== 'completed'
    case 'in_progress':
      return order.status === 'in_progress'
    case 'ready_to_ship':
      return order.status === 'packed'
    case 'all':
      return true
  }
}

export function laneCounts(orders: Order[], now: Date): Record<LaneId, number> {
  const counts = {
    ship_today: 0,
    at_risk: 0,
    unassigned: 0,
    in_progress: 0,
    ready_to_ship: 0,
    all: 0,
  } satisfies Record<LaneId, number>

  for (const order of orders) {
    for (const lane of LANES) {
      if (matchesLane(order, lane.id, now)) counts[lane.id] += 1
    }
  }
  return counts
}

/** Joins an order's lines against live inventory to answer "can we fulfil it". */
export function orderStock(order: Order, inventory: InventoryItem[]): OrderStock {
  const bySku = new Map(inventory.map((item) => [item.sku, item]))

  const lines = order.lines.map((line) => {
    const item = bySku.get(line.sku)
    const onHand = item?.quantity ?? 0
    const reorderPoint = item?.reorderPoint ?? 0

    let state: Fulfillment = 'ok'
    if (onHand < line.qty) {
      // Not enough on the shelf to complete the pick.
      state = 'out'
    } else if (onHand - line.qty <= reorderPoint) {
      // Fulfillable, but shipping it drops the SKU to or below its reorder point.
      state = 'low'
    }

    return {
      sku: line.sku,
      name: item?.name ?? 'Unknown item',
      required: line.qty,
      onHand,
      reorderPoint,
      location: item?.location ?? '—',
      state,
    }
  })

  const outCount = lines.filter((l) => l.state === 'out').length
  const lowCount = lines.filter((l) => l.state === 'low').length
  const state: Fulfillment = outCount > 0 ? 'out' : lowCount > 0 ? 'low' : 'ok'

  return { state, lines, lowCount, outCount }
}

export function itemStockState(item: InventoryItem): Fulfillment {
  if (item.quantity === 0) return 'out'
  if (item.quantity <= item.reorderPoint) return 'low'
  return 'ok'
}

const WEEKDAY = new Intl.DateTimeFormat('en-US', { weekday: 'short' })
const TIME = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
const SHORT_DATE = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })

/* Raw timestamps make you do arithmetic in your head. These read as urgency. */
export function dueLabel(order: Order, now: Date): DueLabel {
  const due = new Date(order.dueAt)

  if (!isActive(order)) {
    return { text: SHORT_DATE.format(due), tone: 'done' }
  }

  const diffMs = due.getTime() - now.getTime()

  if (diffMs < 0) {
    const lateMs = -diffMs
    const hours = Math.floor(lateMs / 3_600_000)
    if (hours < 1) return { text: `${Math.max(1, Math.floor(lateMs / 60_000))}m overdue`, tone: 'overdue' }
    if (hours < 24) return { text: `${hours}h overdue`, tone: 'overdue' }
    return { text: `${Math.floor(hours / 24)}d overdue`, tone: 'overdue' }
  }

  if (isSameDay(due, now)) {
    return { text: `Today ${TIME.format(due)}`, tone: 'today' }
  }

  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (isSameDay(due, tomorrow)) {
    return { text: `Tomorrow ${TIME.format(due)}`, tone: 'upcoming' }
  }

  if (diffMs < 7 * 86_400_000) {
    return { text: `${WEEKDAY.format(due)} ${TIME.format(due)}`, tone: 'upcoming' }
  }

  return { text: SHORT_DATE.format(due), tone: 'upcoming' }
}

export function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  return `${SHORT_DATE.format(d)}, ${TIME.format(d)}`
}

export function formatRelative(iso: string, now: Date): string {
  const diff = now.getTime() - new Date(iso).getTime()
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'Yesterday' : `${days}d ago`
}

export const STATUS_META: Record<
  OrderStatus,
  { label: string; fill: string; text: string; dot: string }
> = {
  new: { label: 'New', fill: 'bg-neutral-fill', text: 'text-neutral-text', dot: 'bg-ink-muted' },
  in_progress: {
    label: 'In progress',
    fill: 'bg-progress-fill',
    text: 'text-progress-text',
    dot: 'bg-progress-text',
  },
  packed: { label: 'Packed', fill: 'bg-packed-fill', text: 'text-packed-text', dot: 'bg-packed-text' },
  shipped: {
    label: 'Shipped',
    fill: 'bg-shipped-fill',
    text: 'text-shipped-text',
    dot: 'bg-shipped-text',
  },
  completed: {
    label: 'Completed',
    fill: 'bg-neutral-fill',
    text: 'text-neutral-text',
    dot: 'bg-shipped-text',
  },
}

export const PRIORITY_META: Record<Priority, { label: string; className: string }> = {
  // Rush is the only priority that should catch the eye across a full table.
  rush: { label: 'Rush', className: 'bg-risk-fill text-risk-text' },
  standard: { label: 'Standard', className: 'bg-neutral-fill text-neutral-text' },
  bulk: { label: 'Bulk', className: 'bg-transparent text-ink-secondary ring-1 ring-hairline' },
}

/** The single most likely next step for an order, surfaced inline on the row. */
export function nextAction(status: OrderStatus): { label: string; next: OrderStatus } | null {
  switch (status) {
    case 'new':
      return { label: 'Start', next: 'in_progress' }
    case 'in_progress':
      return { label: 'Mark packed', next: 'packed' }
    case 'packed':
      return { label: 'Mark shipped', next: 'shipped' }
    case 'shipped':
      return { label: 'Complete', next: 'completed' }
    case 'completed':
      return null
  }
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
}

export function sortForLane(orders: Order[], lane: LaneId): Order[] {
  const byDueAsc = (a: Order, b: Order) =>
    new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()

  // Closed work reads best newest-first; open work reads best most-urgent-first.
  if (lane === 'all') {
    return [...orders].sort((a, b) => {
      if (isActive(a) !== isActive(b)) return isActive(a) ? -1 : 1
      return isActive(a) ? byDueAsc(a, b) : -byDueAsc(a, b)
    })
  }
  return [...orders].sort(byDueAsc)
}
