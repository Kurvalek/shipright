import type { InventoryItem, Order, OrderStatus, Priority } from './types'

/* Hillside Home Decor ships to individuals, so an order is one person buying a
   couple of things rather than a pallet going to a depot.

   Orders are generated rather than hand-written, because the point of the
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
  'Amelia Hart', 'Daniel Okafor', 'Priya Raman', 'Thomas Whitfield', 'Sofia Marchetti',
  'Jonas Berg', 'Claire Dubois', 'Marcus Bell', 'Yuki Tanaka', 'Eleanor Fitzgerald',
  'Omar Haddad', 'Rebecca Lindqvist', 'Nathan Cole', 'Ingrid Solberg', 'Rafael Duarte',
  'Hannah Whitmore', 'Elias Novak', 'Camille Rousseau', 'Adam Pearce', 'Leila Nasser',
  'Grace Abbott', 'Mateo Rivera', 'Fiona Gallagher', 'Henrik Larsen', 'Naomi Sinclair',
  'Julian Reyes', 'Beatrice Lowe', 'Samuel Adeyemi', 'Clara Vogel', 'Isaac Brennan',
  'Maya Kowalski', 'Oliver Ashworth', 'Zara Malik', 'Theodore Quinn', 'Lucia Ferrer',
  'Benjamin Frost', 'Anouk de Vries', 'Caleb Morrow', 'Simone Laurent', 'Patrick Doyle',
  'Nadia Petrova', 'Vincent Hale', 'Rosa Iglesias', 'Duncan Mackay', 'Tessa Bright',
  'Andrei Popescu', 'Harriet Stone', 'Felix Braun', 'Imogen Clarke', 'Kofi Mensah',
  'Delphine Moreau', 'Ryan Kavanagh', 'Astrid Hansen', 'Miles Sutherland', 'Ana Beltran',
  'Gregory Nash', 'Sinead Murphy', 'Tobias Lang', 'Priscilla Owens', 'Hugo Marchand',
  'Elena Castellanos', 'Warren Blake', 'Freya Nilsson', 'Dominic Sarno', 'Alice Redfern',
  'Noor Rahman', 'Charles Ellery', 'Marta Sokolova', 'Evan Trelawney', 'Bianca Rossi',
  'Joel Ferguson', 'Saoirse Byrne', 'Konrad Adler', 'Ivy Chamberlain', 'Andre Lambert',
  'Robin Ashby', 'Talia Mizrahi', 'Callum Reid', 'Verity Sharpe', 'Emmett Wilde',
]

/* The two SKUs with nothing on the shelf, and the four sitting at or under
   their reorder point. Both sets are read straight off the inventory seed, so
   the can-fulfill signal always agrees with the Inventory screen. */
const OUT_OF_STOCK_SKUS = ['SKU-205', 'SKU-702']
const LOW_STOCK_SKUS = ['SKU-103', 'SKU-302', 'SKU-504', 'SKU-601']

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
  /** How many cannot be picked at all, because a line is out of stock. */
  blocked: number
  /** How many can be picked, but drop a SKU to or below its reorder point. */
  lowStock: number
}

/* Two blocked orders in 250, and both of them in a stage where being short is
   physically possible: one nobody has picked yet, and one where the picker
   found the shelf empty. A packed order is already in a box, so it cannot be
   short of anything, and nothing that shipped can have been unfulfillable.
   Running out is the exception on a well-run floor — at fourteen it stopped
   reading as an exception and started reading as the normal state. */
const BUCKETS: Bucket[] = [
  // New / unassigned. Rush-heavy on purpose: this is the scenario where 52
  // express orders need to land on one packer in a single action.
  { status: 'new', count: 86, unassigned: 86, rush: 52, overdue: 6, blocked: 1, lowStock: 6 },
  { status: 'in_progress', count: 41, unassigned: 0, rush: 14, overdue: 5, blocked: 1, lowStock: 3 },
  // Packed. The 84 that get cleared in one click.
  { status: 'packed', count: 84, unassigned: 0, rush: 25, overdue: 6, blocked: 0, lowStock: 4 },
  { status: 'shipped', count: 22, unassigned: 0, rush: 6, overdue: 0, blocked: 0, lowStock: 2 },
  { status: 'completed', count: 17, unassigned: 0, rush: 4, overdue: 0, blocked: 0, lowStock: 1 },
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
  'Gift — please leave the invoice out of the parcel and add a note card.',
  'Glassware. Double-box it and mark the carton fragile.',
  'Customer is out until Thursday. Hold the dispatch rather than risk a redelivery.',
  'Buzzer is broken. Courier should call on arrival.',
  'Second half of a split order. Consolidate if the first parcel has not gone out.',
  'Customer asked for the pair to arrive together, not as separate parcels.',
  'Leave with a neighbour at number 14 if there is no answer.',
]

export function generateOrders(now: Date, inventory: InventoryItem[]): Order[] {
  const random = rng(20260909)
  const out: Order[] = []
  const bySku = new Map(inventory.map((item) => [item.sku, item]))

  const dueOffsetMs = (overdue: boolean): number => {
    if (overdue) {
      // Between 1 hour and 3 days late.
      return -(1 + random() * 71) * 3_600_000
    }
    // Between now and 5 days out, weighted toward the next 24 hours so the
    // ship-by column is not uniformly calm.
    const skewed = random() ** 2
    return (0.5 + skewed * 119) * 3_600_000
  }

  /* People buy one or two things at a time. Trade orders — an interior
     designer furnishing a room — are the only ones that run to double figures,
     and they are the reason Bulk still means something here. */
  function quantityFor(sku: string, priority: Priority): number {
    const wanted = priority === 'bulk' ? 4 + Math.floor(random() * 9) : 1 + Math.floor(random() * 3)
    const item = bySku.get(sku)
    if (!item) return wanted

    // Never let a healthy SKU tip itself into the low band by accident; that
    // is a decision the bucket makes, not the quantity roll.
    const headroom = item.quantity - item.reorderPoint - 1
    if (headroom >= 1) return Math.min(wanted, headroom)

    // Already at or below its reorder point. Take what is on the shelf so the
    // line reads as low rather than out.
    return item.quantity > 0 ? Math.min(wanted, item.quantity) : wanted
  }

  let n = 0

  for (const bucket of BUCKETS) {
    const rushFlags = flags(bucket.count, bucket.rush, random)
    const overdueFlags = flags(bucket.count, bucket.overdue, random)
    const blockedFlags = flags(bucket.count, bucket.blocked, random)
    const lowFlags = flags(bucket.count, bucket.lowStock, random)
    const unassignedFlags = flags(bucket.count, bucket.unassigned, random)

    for (let i = 0; i < bucket.count; i++) {
      n += 1

      const isOverdue = overdueFlags[i]!
      const dueAt = new Date(now.getTime() + dueOffsetMs(isOverdue))
      // Snap to the quarter hour, the way courier collections are booked.
      dueAt.setMinutes(Math.round(dueAt.getMinutes() / 15) * 15, 0, 0)

      const priority: Priority = rushFlags[i]
        ? 'rush'
        : random() < 0.88
          ? 'standard'
          : 'bulk'

      const assigneeId = unassignedFlags[i]
        ? null
        : WORKER_IDS[Math.floor(random() * WORKER_IDS.length)]!

      // Blocked wins over low: an order that cannot be picked at all is not
      // also a reorder-point warning.
      const constrained = blockedFlags[i]
        ? OUT_OF_STOCK_SKUS
        : lowFlags[i]
          ? LOW_STOCK_SKUS
          : null

      const lineCount = 1 + Math.floor(random() * 3)
      const lines: Order['lines'] = []
      const taken = new Set<string>()

      for (let l = 0; l < lineCount; l++) {
        const pool = constrained && l === 0 ? constrained : HEALTHY_SKUS
        const sku = pool[Math.floor(random() * pool.length)]!
        if (taken.has(sku)) continue
        taken.add(sku)

        lines.push({ sku, qty: quantityFor(sku, priority) })
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
