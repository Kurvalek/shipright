import { useCallback, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { PaneDock } from '@/components/layout/PaneDock'
import { Button } from '@/components/ui/Button'
import { StageTabs } from '@/components/orders/StageTabs'
import { OrderStatCards } from '@/components/orders/OrderStatCards'
import type { Callout } from '@/components/orders/OrderStatCards'
import { NO_FILTERS, OrdersToolbar, normalizeFilters, sameFilters } from '@/components/orders/OrdersToolbar'
import type { Filters } from '@/components/orders/OrdersToolbar'
import { OrdersTable } from '@/components/orders/OrdersTable'
import { BulkActionBar } from '@/components/orders/BulkActionBar'
import { UndoToast } from '@/components/orders/UndoToast'
import { OrderDetailsPanel } from '@/components/orders/OrderDetailsPanel'
import type { OrderGroup } from '@/components/orders/OrdersTable'
import {
  ATTENTION_REASONS,
  LANES,
  STATUS_META,
  attentionReason,
  buildSkuIndex,
  isActive,
  isOverdue,
  laneCounts,
  matchesLane,
  orderStock,
  sortForLane,
} from '@/lib/derive'
import { useStore } from '@/lib/store'
import { useShell } from '@/lib/shell'
import { useMediaQuery } from '@/lib/useMediaQuery'
import { useTopBarSearch } from '@/lib/topbarSearch'
import { usePersistentState } from '@/lib/usePersistentState'
import type { LaneId, Order, OrderStatus } from '@/lib/types'

const DEFAULT_LANE: LaneId = 'needs_attention'

export default function Orders() {
  const { orders, inventory, users, workers, setStatus, assign, restore, setNotes } = useStore()

  /* The detail pane costs the list about four hundred pixels. Above the width
     below there is still room for every column once it has, so the list only
     gives up the two the pane repeats when it would otherwise be squeezed. */
  const { dockOpen } = useShell()
  const roomForEveryColumn = useMediaQuery('(min-width: 1580px)')
  const compactTable = dockOpen && !roomForEveryColumn

  // Stage and filters persist. Selection and expansion are per-session,
  // because they describe a task in progress, not a preference.
  const [storedLane, setLane] = usePersistentState<LaneId>('orders.lane', DEFAULT_LANE)
  const [storedFilters, setFilters] = usePersistentState<Filters>('orders.filters', NO_FILTERS)

  /* Guards against filters saved by a build that held one value per question
     rather than a list. Keyed on the stored object, so this runs when a filter
     changes and not on every render. */
  const filters = useMemo(() => normalizeFilters(storedFilters), [storedFilters])

  /* Which groups are folded away is a preference too. Held as a list rather
     than a Set because a Set does not survive the trip through JSON. */
  const [collapsedList, setCollapsedList] = usePersistentState<string[]>(
    'orders.collapsedGroups',
    [],
  )

  // Guards against a stage name persisted by an older build.
  const lane = LANES.some((l) => l.id === storedLane) ? storedLane : DEFAULT_LANE

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [openId, setOpenId] = useState<string | null>(null)
  const [undo, setUndo] = useState<{ message: string; snapshots: Order[] } | null>(null)
  const [landed, setLanded] = useState<{ lane: LaneId; token: number } | null>(null)

  // A single clock for the whole render, so stage membership and every ship-by
  // label agree with each other.
  const now = useMemo(() => new Date(), [orders])

  // Built once per inventory change rather than once per row, which matters at
  // a couple of hundred orders.
  const skus = useMemo(() => buildSkuIndex(inventory), [inventory])

  const counts = useMemo(() => laneCounts(orders, now, skus), [orders, now, skus])

  /* Drawn from the whole board rather than the open stage. A list that lost the
     name you were about to pick because that customer has nothing in Packed
     would be answering a question nobody asked it. */
  const customers = useMemo(
    () => [...new Set(orders.map((order) => order.customer))].sort((a, b) => a.localeCompare(b)),
    [orders],
  )

  const visible = useMemo(() => {
    const needle = filters.search.trim().toLowerCase()

    const filtered = orders.filter((order) => {
      if (!matchesLane(order, lane, now, skus)) return false

      // An empty list is every value, and a list of several is any of them.
      if (filters.status.length && !filters.status.includes(order.status)) return false
      if (filters.priority.length && !filters.priority.includes(order.priority)) return false

      // Nobody assigned is a choice you can make alongside named workers, so
      // it travels as an id of its own rather than as a separate flag.
      if (filters.assignee.length && !filters.assignee.includes(order.assigneeId ?? 'none')) {
        return false
      }

      if (filters.customer.length && !filters.customer.includes(order.customer)) return false

      if (needle) {
        const haystack = [order.id, order.customer, ...order.lines.map((line) => line.sku)]
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(needle)) return false
      }

      return true
    })

    return sortForLane(filtered, lane)
  }, [orders, lane, filters, now, skus])

  /* Counted across the whole board, not the open stage, because these sit above
     the tabs: a number that changed every time you switched tabs would be
     reporting on the control directly beneath it. Shipped and completed orders
     carry no pressure, so they are excluded.

     Overdue takes an order out of the running for the other two counts, the
     same way it takes precedence in the Needs attention groups. That is what
     makes overdue plus blocked come to the tab's own total. */
  const urgency = useMemo(() => {
    let overdue = 0
    let blocked = 0
    for (const order of orders) {
      if (!isActive(order)) continue
      if (isOverdue(order, now)) {
        overdue += 1
        continue
      }
      if (orderStock(order, skus).state === 'out') blocked += 1
    }
    return { overdue, blocked }
  }, [orders, now, skus])

  /* Needs attention is the one stage that collects orders for two unrelated
     reasons, so it is the one stage that reads better split. Everywhere else a
     single run of rows is the whole story. */
  const groups = useMemo<OrderGroup[] | undefined>(() => {
    if (lane !== 'needs_attention') return undefined

    return ATTENTION_REASONS.map((reason) => ({
      ...reason,
      orders: visible.filter((order) => attentionReason(order, now, skus) === reason.id),
    }))
  }, [lane, visible, now, skus])

  const collapsedGroups = useMemo(() => new Set(collapsedList), [collapsedList])

  const toggleGroup = useCallback(
    (id: string) => {
      setCollapsedList((prev) =>
        prev.includes(id) ? prev.filter((held) => held !== id) : [...prev, id],
      )
    },
    [setCollapsedList],
  )

  const clearSelection = useCallback(() => setSelected(new Set()), [])

  // Normalising the previous value on the way in, rather than only on the way
  // out, is what retires an old-shape record from storage the first time the
  // reader touches a filter.
  const patchFilters = useCallback(
    (patch: Partial<Filters>) => setFilters((prev) => ({ ...normalizeFilters(prev), ...patch })),
    [setFilters],
  )

  const setSearch = useCallback(
    (search: string) => patchFilters({ search }),
    [patchFilters],
  )

  useTopBarSearch(filters.search, setSearch, 'Search orders by ID, customer or SKU')

  /* The three numbers that decide what a shift does next: what is already late,
     what has not been picked up yet, and what cannot be picked at all. Overdue
     keeps the only colour — with three cards up here, two alarms would leave
     nothing for the eye to land on first. */
  const callouts = useMemo<Callout[]>(
    () => [
      {
        label: 'Overdue',
        value: urgency.overdue,
        footnote: 'Past its ship-by time',
        icon: 'truck-clock',
        lane: 'needs_attention',
        group: 'overdue',
        tone: 'risk',
      },
      {
        label: 'Missing stock',
        value: urgency.blocked,
        footnote: 'Short on the shelf',
        icon: 'out-of-stock',
        lane: 'needs_attention',
        group: 'stock',
      },
      /* Last, because the first two are problems and this one is only work
         waiting. The row now reads worst to ordinary from left to right. */
      {
        label: 'New',
        value: counts.new,
        footnote: 'Nobody assigned yet',
        icon: 'new',
        lane: 'new',
      },
    ],
    [urgency.overdue, urgency.blocked, counts.new],
  )

  const changeLane = useCallback(
    (next: LaneId) => {
      setLane(next)
      // A selection made in one stage rarely means the same thing in another,
      // and the open record has probably just left the list behind it.
      clearSelection()
      setOpenId(null)
    },
    [setLane, clearSelection],
  )

  /* Two of the cards count one group of Needs attention each, so they open that
     group and fold the other away. Landing on the right tab with the section
     you asked for collapsed would be worse than not linking at all. */
  const openCallout = useCallback(
    (card: Callout) => {
      changeLane(card.lane)
      if (card.group) {
        const focus = card.group
        setCollapsedList(
          ATTENTION_REASONS.filter((reason) => reason.id !== focus).map((reason) => reason.id),
        )
      }
    },
    [changeLane, setCollapsedList],
  )

  const isFiltered = !sameFilters(filters, NO_FILTERS)

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelected(new Set(visible.map((order) => order.id)))
  }, [visible])

  /* Takes the ids the header speaks for rather than a bare flag, because Needs
     attention is two tables and a box at the top of Overdue that also swept up
     Missing stock would be selecting rows the reader cannot see from it. */
  const toggleAll = useCallback((ids: string[], checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      for (const id of ids) {
        if (checked) next.add(id)
        else next.delete(id)
      }
      return next
    })
  }, [])

  const selectedOrders = useMemo(
    () => visible.filter((order) => selected.has(order.id)),
    [visible, selected],
  )

  const selectedIds = useMemo(
    () => selectedOrders.map((order) => order.id),
    [selectedOrders],
  )

  /* One order is worth naming; a hundred are worth counting. "ORD-0130 marked
     shipped" is the sentence a picker would say about their own click. */
  const subject = (moved: Order[]) =>
    moved.length === 1 ? moved[0]!.id : `${moved.length} orders`

  const snapshot = useCallback(
    (ids: string[]) => {
      const wanted = new Set(ids)
      return orders.filter((order) => wanted.has(order.id)).map((order) => ({ ...order }))
    },
    [orders],
  )

  /* Every move goes through here, whichever control started it — the square on
     a row, the overflow menu, the pane, or the selection bar. They all used to
     reach past this to the store, so a single order could change stage with no
     word about it and no way back. */
  const moveStatus = useCallback(
    (ids: string[], status: OrderStatus) => {
      const moved = snapshot(ids)
      if (moved.length === 0) return

      setStatus(ids, status)
      setUndo({
        // Same word the tab and the pill use, so the report matches the action.
        message: `${subject(moved)} marked ${STATUS_META[status].label.toLowerCase()}`,
        snapshots: moved,
      })
      setLanded({ lane: status, token: Date.now() })
    },
    [snapshot, setStatus],
  )

  const moveAssign = useCallback(
    (ids: string[], assigneeId: string | null) => {
      const moved = snapshot(ids)
      if (moved.length === 0) return

      const name = users.find((user) => user.id === assigneeId)?.name ?? 'worker'
      assign(ids, assigneeId)
      setUndo({
        message: assigneeId
          ? `${subject(moved)} assigned to ${name}`
          : `${subject(moved)} unassigned`,
        snapshots: moved,
      })

      /* Handing over a new order is a move between stages as much as any
         other, so it gets pointed at the same way. */
      const from: OrderStatus = assigneeId ? 'new' : 'assigned'
      const to: OrderStatus = assigneeId ? 'assigned' : 'new'
      if (moved.some((order) => order.status === from)) {
        setLanded({ lane: to, token: Date.now() })
      }
    },
    [snapshot, assign, users],
  )

  const bulkStatus = useCallback(
    (status: OrderStatus) => {
      moveStatus(selectedIds, status)
      clearSelection()
    },
    [moveStatus, selectedIds, clearSelection],
  )

  const bulkAssign = useCallback(
    (assigneeId: string) => {
      moveAssign(selectedIds, assigneeId)
      clearSelection()
    },
    [moveAssign, selectedIds, clearSelection],
  )

  const runUndo = useCallback(() => {
    if (undo) restore(undo.snapshots)
    setUndo(null)
  }, [undo, restore])

  const openOrder: Order | null = openId
    ? (orders.find((order) => order.id === openId) ?? null)
    : null

  const laneMeta = LANES.find((l) => l.id === lane)!

  /* An empty stage and an over-filtered stage mean different things. Telling a
     picker "nothing is stuck" when they simply mistyped a SKU is worse than
     saying nothing. */
  const empty = isFiltered
    ? {
        title: 'No matches in this view',
        body: `Nothing in ${laneMeta.label} matches these filters. Clear them, or try another stage.`,
        action: <Button onClick={() => setFilters(NO_FILTERS)}>Clear filters</Button>,
      }
    : { title: 'Nothing here', body: laneMeta.empty }

  return (
    <>
      <PageHeader
        title="Orders"
        actions={
          <Button variant="primary" icon={<Plus size={15} />}>
            New order
          </Button>
        }
      />

      <OrderStatCards cards={callouts} onSelect={openCallout} />

      <OrdersToolbar
        filters={filters}
        onChange={patchFilters}
        users={workers}
        customers={customers}
      >
        <StageTabs active={lane} counts={counts} landed={landed} onChange={changeLane} />
      </OrdersToolbar>

      <OrdersTable
        orders={visible}
        groups={groups}
        collapsedGroups={collapsedGroups}
        onToggleGroup={toggleGroup}
        users={users}
        skus={skus}
        now={now}
        selected={selected}
        openId={openId}
        compact={compactTable}
        empty={empty}
        onToggleSelect={toggleSelect}
        onToggleAll={toggleAll}
        onOpen={setOpenId}
        onStatus={moveStatus}
        onAssign={moveAssign}
      />

      {/* Leaves room for the docked bar so it never covers the last row. */}
      {selectedIds.length > 0 && <div className="h-14" />}

      <PaneDock>
        <BulkActionBar
          count={selectedIds.length}
          totalInStage={visible.length}
          lane={lane}
          users={workers}
          onStatus={bulkStatus}
          onAssign={bulkAssign}
          onSelectAll={selectAll}
          onClear={clearSelection}
        />

        {/* Never both at once: clearing the selection retires the bar first. */}
        {selectedIds.length === 0 && (
          <UndoToast
            message={undo?.message ?? null}
            onUndo={runUndo}
            onDismiss={() => setUndo(null)}
          />
        )}
      </PaneDock>

      <OrderDetailsPanel
        order={openOrder}
        users={workers}
        skus={skus}
        now={now}
        onClose={() => setOpenId(null)}
        onStatus={(id, status) => moveStatus([id], status)}
        onAssign={(id, assigneeId) => moveAssign([id], assigneeId)}
        onNotes={setNotes}
      />
    </>
  )
}
