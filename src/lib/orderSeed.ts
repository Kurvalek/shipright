import type { InventoryItem, Order, OrderStatus, Priority } from './types'

/* Orders are generated rather than hand-written, because the point of the
   stage tabs is volume: a worker clearing 84 packed orders in one action only
   reads as a win if there really are 84 of them. Generation is seeded, so the
   board is byte-identical between reloads. */

/** Mulberry32. Small, fast, and stable across engines. */
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const CUSTOMERS = [
  'Northport Logistics', 'FastShip Retail', 'BoxWorks Fulfilment', 'Meridian Supply Co',
  'Harbor Point Traders', 'Acme Corporation', 'Tech Solutions Inc', 'Global Retail Co',
  'StartUp Ventures', 'Enterprise Systems', 'Digital Dynamics', 'Pacific Trading',
  'Coastal Enterprises', 'Summit Solutions', 'Ironvale Industrial', 'Lakeside Distribution',
  'Redwood Office Group', 'Innovative Tech Labs', 'Metro Office Supply', 'Horizon Industries',
  'Cedar Grove Supply', 'Blue Harbor Foods', 'Vertex Manufacturing', 'Prairie Wholesale',
  'Stonebridge Partners', 'Atlas Freight', 'Copper Creek Retail', 'Fairview Health',
  'Granite Peak Outfitters', 'Riverside Commerce', 'Oakfield Trading', 'Silverline Media',
  'Trailhead Equipment', 'Westgate Interiors', 'Juniper Systems', 'Bayside Electronics',
  'Crestview Supply', 'Aspen Retail Group', 'Kingsley Wholesale', 'Duneside Trading',
  'Elmwood Partners', 'Foxglove Design', 'Ridgeway Logistics', 'Seabright Imports',
  'Thornbury Group', 'Umberland Supply', 'Valebrook Retail', 'Wynfield Trading',
  'Yarrow Distribution', 'Zenith Office Co', 'Alderman Freight', 'Brightwater Supply',
  'Calder & Sons', 'Dunmore Industrial', 'Eastvale Wholesale', 'Fenwick Retail Group',
  'Glenmoor Trading', 'Hollybrook Foods', 'Inglewood Systems', 'Jarrow Logistics',
  'Kestrel Office Supply', 'Larkspur Distribution', 'Marchmont Partners', 'Netherfield Retail',
  'Oakhurst Equipment', 'Pemberton Supply', 'Quarrydale Trading', 'Rosslyn Commerce',
  'Saltmarsh Imports', 'Tidewater Logistics', 'Ullswater Group', 'Vinehall Retail',
  'Wexford Manufacturing', 'Yardley Supply Co', 'Ashcombe Freight', 'Bexley Wholesale',
  'Corrigan Retail', 'Denholm Trading', 'Ellerby Systems', 'Fairhaven Distribution',
]

/** SKUs that are low or out, so the can-fulfill signal has real work to do. */
const CONSTRAINED_SKUS = ['SKU-205', 'SKU-702', 'SKU-103', 'SKU-302', 'SKU-504', 'SKU-601']

const HEALTHY_SKUS = [
  'SKU-101', 'SKU-102', 'SKU-104', 'SKU-105', 'SKU-106', 'SKU-107', 'SKU-108',
  'SKU-201', 'SKU-202', 'SKU-203', 'SKU-204', 'SKU-206', 'SKU-207',
  'SKU-301', 'SKU-303', 'SKU-304', 'SKU-305', 'SKU-306', 'SKU-307',
  'SKU-401', 'SKU-402', 'SKU-403', 'SKU-404', 'SKU-405', 'SKU-406', 'SKU-407',
  'SKU-501', 'SKU-502', 'SKU-503', 'SKU-505', 'SKU-506', 'SKU-507', 'SKU-508',
  'SKU-602', 'SKU-603', 'SKU-604', 'SKU-605',
  'SKU-701', 'SKU-703', 'SKU-704', 'SKU-705',
  'SKU-801', 'SKU-802', 'SKU-803',
]

const WORKER_IDS = ['u-bahar', 'u-mike', 'u-sarah', 'u-robert']

/* Every attribute is an exact count rather than a probability, so the numbers
   on the tabs are a design decision and not a roll of the dice. */
interface Bucket {
  status: OrderStatus
  count: number
  /** How many are left with nobody's name on them. */
  unassigned: number
  rush: number
  /** How many are already past their ship-by time. */
  overdue: number
  /** How many pull a SKU that cannot be picked complete. */
  constrained: number
}

const BUCKETS: Bucket[] = [
  // New / unassigned. Rush-heavy on purpose: this is the BoxWorks scenario,
  // where 52 rush orders need to land on one worker in a single action.
  { status: 'new', count: 86, unassigned: 86, rush: 52, overdue: 6, constrained: 10 },
  { status: 'in_progress', count: 41, unassigned: 0, rush: 14, overdue: 5, constrained: 6 },
  // Ready to ship. The 84 that get cleared in one click.
  { status: 'packed', count: 84, unassigned: 0, rush: 25, overdue: 6, constrained: 6 },
  { status: 'shipped', count: 22, unassigned: 0, rush: 6, overdue: 0, constrained: 2 },
  { status: 'completed', count: 17, unassigned: 0, rush: 4, overdue: 0, constrained: 2 },
]

/* Exactly `trueCount` of `size` flags are true, in a stable scattered order —
   so Rush orders are spread through the list rather than clumped at the top. */
function flags(size: number, trueCount: number, random: () => number): boolean[] {
  const out = Array.from({ length: size }, (_, i) => i < trueCount)
  for (let i = size - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

const NOTES = [
  'Customer called twice. Dock 3 closes at 16:00, needs to go out on the afternoon run.',
  'Tape is short — check the overflow pallet in E2 before ordering more.',
  'Wrap is out of stock. Hold or substitute with the 400mm roll if customer approves.',
  'Fragile. Double-box and mark the carton.',
  'Consolidate with the other order for this customer if both are still open.',
  'Customer requested a specific carrier. Check the account notes before booking.',
  'Partial shipment approved. Send what is on the shelf and back-order the rest.',
]

export function generateOrders(now: Date, inventory: InventoryItem[]): Order[] {
  const random = rng(20260909)
  const out: Order[] = []
  const bySku = new Map(inventory.map((item) => [item.sku, item]))

  /* Quantities are chosen against live stock rather than at random, so that
     whether an order is fulfillable is a decision this generator makes, not an
     accident of a bulk order happening to exceed a shelf. */
  function quantityFor(sku: string, want: 'ok' | 'short'): number {
    const item = bySku.get(sku)
    if (!item) return 1

    if (want === 'short') {
      // Two ways to need a human: nothing like enough on the shelf, or enough
      // to pick but not enough to stay above the reorder point.
      return random() < 0.6
        ? item.quantity + 1 + Math.floor(random() * 40)
        : Math.max(1, item.quantity - Math.floor(random() * (item.reorderPoint + 1)))
    }

    // Headroom is what we can ship while staying above the reorder point.
    const headroom = item.quantity - item.reorderPoint - 1
    if (headroom < 1) return 1
    return 1 + Math.floor(random() * headroom)
  }

  const dueOffsetMs = (overdue: boolean): number => {
    if (overdue) {
      // Between 1 hour and 3 days late.
      return -(1 + random() * 71) * 3_600_000
    }
    // Between now and 5 days out, weighted toward the next 24 hours so the
    // urgency column is not uniformly calm.
    const skewed = random() ** 2
    return (0.5 + skewed * 119) * 3_600_000
  }

  let n = 0

  for (const bucket of BUCKETS) {
    const rushFlags = flags(bucket.count, bucket.rush, random)
    const overdueFlags = flags(bucket.count, bucket.overdue, random)
    const constrainedFlags = flags(bucket.count, bucket.constrained, random)
    const unassignedFlags = flags(bucket.count, bucket.unassigned, random)

    for (let i = 0; i < bucket.count; i++) {
      n += 1

      const isOverdue = overdueFlags[i]!
      const dueAt = new Date(now.getTime() + dueOffsetMs(isOverdue))
      // Snap to the quarter hour, the way dock slots are actually booked.
      dueAt.setMinutes(Math.round(dueAt.getMinutes() / 15) * 15, 0, 0)

      const priority: Priority = rushFlags[i]
        ? 'rush'
        : random() < 0.72
          ? 'standard'
          : 'bulk'

      const assigneeId = unassignedFlags[i]
        ? null
        : WORKER_IDS[Math.floor(random() * WORKER_IDS.length)]!

      const lineCount = 1 + Math.floor(random() * 3)
      const useConstrained = constrainedFlags[i]!
      const lines: Order['lines'] = []
      const taken = new Set<string>()

      for (let l = 0; l < lineCount; l++) {
        const short = useConstrained && l === 0
        const pool = short ? CONSTRAINED_SKUS : HEALTHY_SKUS
        const sku = pool[Math.floor(random() * pool.length)]!
        if (taken.has(sku)) continue
        taken.add(sku)

        lines.push({ sku, qty: quantityFor(sku, short ? 'short' : 'ok') })
      }

      out.push({
        id: `ORD-${String(n).padStart(4, '0')}`,
        customer: CUSTOMERS[Math.floor(random() * CUSTOMERS.length)]!,
        placedAt: new Date(dueAt.getTime() - (24 + random() * 72) * 3_600_000).toISOString(),
        dueAt: dueAt.toISOString(),
        status: bucket.status,
        priority,
        assigneeId,
        lines,
        // Only a few orders carry a note, the way they do in practice.
        notes: random() < 0.09 ? NOTES[Math.floor(random() * NOTES.length)]! : '',
      })
    }
  }

  return out
}
