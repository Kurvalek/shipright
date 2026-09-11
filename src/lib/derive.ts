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

export const ORDER_FLOW: OrderStatus[] = ['new', 'assigned', 'packed', 'shipped', 'completed']

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

/* One vocabulary. Each tab is named after the status it holds, so the tab, the
   pill in the row and the button that moves an order there all use the same
   word — nobody has to learn that "Ready to ship" means "Packed". Needs
   attention is the one tab that is not a status, because it cuts across them to
   collect the orders that will not move on their own. */
/** Bulk actions offered in a stage. The first is promoted to primary. */
export type BulkAction = 'assign' | Exclude<OrderStatus, 'new'>

export const LANES: Array<{
  id: LaneId
  label: string
  description: string
  empty: string
  /* Only the moves that make sense from where these orders already are. A
     packed order has no business being offered "Mark as packed" again. */
  bulkActions: BulkAction[]
}> = [
  {
    id: 'needs_attention',
    label: 'Needs attention',
    description: 'Overdue, or blocked by stock, and will not move on its own',
    empty: 'Nothing is stuck. Everything is inside its window and fulfillable.',
    // Mixed statuses land here, so the full set stays available.
    bulkActions: ['assign', 'packed', 'shipped'],
  },
  {
    id: 'new',
    label: 'New',
    description: 'Just in, nobody has picked them up yet',
    empty: 'No new orders waiting.',
    // Handing one over is the only way out of here, so it is the only move.
    bulkActions: ['assign'],
  },
  {
    id: 'assigned',
    label: 'Assigned',
    description: 'Picked up by somebody, waiting to be boxed',
    empty: 'Nothing is being worked on.',
    bulkActions: ['packed', 'assign'],
  },
  {
    id: 'packed',
    label: 'Packed',
    description: 'Boxed and waiting on a carrier',
    empty: 'No packed orders waiting. Nothing is backing up.',
    bulkActions: ['shipped', 'assign'],
  },
  {
    id: 'shipped',
    label: 'Shipped',
    description: 'With the carrier, not yet closed out',
    empty: 'Nothing has shipped yet.',
    bulkActions: ['completed'],
  },
  {
    id: 'completed',
    label: 'Completed',
    description: 'Closed out, newest first',
    empty: 'Nothing has been closed out yet.',
    // The end of the flow. There is no move left to offer.
    bulkActions: [],
  },
]

/** Fast SKU lookup, built once per inventory change rather than once per row. */
export type SkuIndex = Map<string, InventoryItem>

export function buildSkuIndex(inventory: InventoryItem[]): SkuIndex {
  return new Map(inventory.map((item) => [item.sku, item]))
}

/* The two things that stop an order moving on its own. Needs attention shows
   them as separate groups, so every order in that tab has exactly one of these
   as its reason for being there. */
export type AttentionReason = 'overdue' | 'stock'

export const ATTENTION_REASONS: Array<{ id: AttentionReason; label: string }> = [
  { id: 'overdue', label: 'Overdue' },
  { id: 'stock', label: 'Missing stock' },
]

/* Overdue wins when an order is both. A late order is late whether or not the
   shelf is short, and lateness is what you act on first — so it is listed once,
   under Overdue, with its stock reading still visible in the row. Keeping the
   two reasons exclusive is what lets the groups add up to the tab. */
export function attentionReason(
  order: Order,
  now: Date,
  skus: SkuIndex,
): AttentionReason | null {
  if (!isActive(order)) return null
  if (isOverdue(order, now)) return 'overdue'
  if (orderStock(order, skus).state === 'out') return 'stock'
  return null
}

export function matchesLane(order: Order, lane: LaneId, now: Date, skus: SkuIndex): boolean {
  if (lane === 'needs_attention') {
    // Late, or cannot be picked complete off the shelf. Either way a person has
    // to make a call before it ships.
    return attentionReason(order, now, skus) !== null
  }
  // Every other tab is its status, which is why they share a name.
  return order.status === lane
}

export function laneCounts(orders: Order[], now: Date, skus: SkuIndex): Record<LaneId, number> {
  const counts = {
    needs_attention: 0,
    new: 0,
    assigned: 0,
    packed: 0,
    shipped: 0,
    completed: 0,
  } satisfies Record<LaneId, number>

  for (const order of orders) {
    for (const lane of LANES) {
      if (matchesLane(order, lane.id, now, skus)) counts[lane.id] += 1
    }
  }
  return counts
}

/** Joins an order's lines against live inventory to answer "can we fulfil it". */
export function orderStock(order: Order, skus: SkuIndex): OrderStock {
  const lines = order.lines.map((line) => {
    const item = skus.get(line.sku)
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
  assigned: {
    label: 'Assigned',
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

/* A rule and a word rather than a filled chip. Weighted so Rush is the only
   priority that carries across a full table: amber, then the muted violet that
   already means "in flight" elsewhere, then grey for the default case. The bars
   run brighter than the labels, which have to hold their contrast on white. */
export const PRIORITY_META: Record<Priority, { label: string; bar: string; text: string }> = {
  rush: { label: 'Rush', bar: 'bg-risk-edge', text: 'text-risk-text' },
  standard: { label: 'Standard', bar: 'bg-mauve', text: 'text-ink-secondary' },
  bulk: { label: 'Bulk', bar: 'bg-progress-text', text: 'text-progress-text' },
}

/* The single most likely next step for an order. `label` is for the row, where
   a column of buttons has to stay narrow; `long` is for the detail panel, which
   has the room to name the move in full.

   One word on the row, and the verb rather than the stage it lands in. A button
   reading "Packed" names a state and leaves you to work out that pressing it
   causes one; "Pack" is the thing you are about to do. The full phrase stays in
   the tooltip and the accessible name, so the short form never has to be the
   only account of the move.

   Nothing is offered for a new order. Its next step is to be handed to
   somebody, and that is not a status move — the status follows from it. */
export function nextAction(
  status: OrderStatus,
): { label: string; long: string; next: OrderStatus } | null {
  switch (status) {
    case 'new':
      return null
    case 'assigned':
      return { label: 'Pack', long: 'Mark as packed', next: 'packed' }
    case 'packed':
      return { label: 'Ship', long: 'Mark as shipped', next: 'shipped' }
    case 'shipped':
      return { label: 'Complete', long: 'Mark as completed', next: 'completed' }
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
  if (lane === 'shipped' || lane === 'completed') {
    return [...orders].sort((a, b) => -byDueAsc(a, b))
  }
  return [...orders].sort(byDueAsc)
}
