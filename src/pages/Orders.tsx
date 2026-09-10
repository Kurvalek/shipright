import { useCallback, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { HeaderStat, PageHeader } from '@/components/layout/PageHeader'
import { PaneDock } from '@/components/layout/PaneDock'
import { Button } from '@/components/ui/Button'
import { StageTabs } from '@/components/orders/StageTabs'
import { OrderStatCards } from '@/components/orders/OrderStatCards'
import type { Callout } from '@/components/orders/OrderStatCards'
import { OrdersToolbar } from '@/components/orders/OrdersToolbar'
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
  isSameDay,
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

const NO_FILTERS: Filters = { search: '', status: '', priority: '', assignee: '' }

const DEFAULT_LANE: LaneId = 'needs_attention'

function sameFilters(a: Filters, b: Filters): boolean {
  return (
    a.search === b.search &&
    a.status === b.status &&
    a.priority === b.priority &&
    a.assignee === b.assignee
  )
}

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
  const [filters, setFilters] = usePersistentState<Filters>('orders.filters', NO_FILTERS)

  /* Which groups are folded away is a preference too. Held as a list rather
     than a Set because a Set does not survive the trip through JSON. */
  const [collapsedList, setCollapsedList] = usePersistentState<string[]>(
    'orders.collapsedGroups',
    [],
  )

  // Guards against a stage name persisted by an older build.
  const lane = LANES.some((l) => l.id === storedLane) ? storedLane : DEFAULT_LANE

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [undo, setUndo] = useState<{ message: string; snapshots: Order[] } | null>(null)

  // A single clock for the whole render, so stage membership and every ship-by
  // label agree with each other.
  const now = useMemo(() => new Date(), [orders])

  // Built once per inventory change rather than once per row, which matters at
  // a couple of hundred orders.
  const skus = useMemo(() => buildSkuIndex(inventory), [inventory])

  const counts = useMemo(() => laneCounts(orders, now, skus), [orders, now, skus])

  const visible = useMemo(() => {
    const needle = filters.search.trim().toLowerCase()

    const filtered = orders.filter((order) => {
      if (!matchesLane(order, lane, now, skus)) return false
      if (filters.status && order.status !== filters.status) return false
      if (filters.priority && order.priority !== filters.priority) return false

      if (filters.assignee === 'none') {
        if (order.assigneeId !== null) return false
      } else if (filters.assignee && order.assigneeId !== filters.assignee) {
        return false
      }

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
    let today = 0
    let blocked = 0
    for (const order of orders) {
      if (!isActive(order)) continue
      if (isOverdue(order, now)) {
        overdue += 1
        continue
      }
      if (isSameDay(new Date(order.dueAt), now)) today += 1
      if (orderStock(order, skus).state === 'out') blocked += 1
    }
    return { overdue, today, blocked }
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

  const patchFilters = useCallback(
    (patch: Partial<Filters>) => setFilters((prev) => ({ ...prev, ...patch })),
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
        sprite: 'truck-clock',
        lane: 'needs_attention',
        group: 'overdue',
        tone: 'risk',
      },
      {
        label: 'New',
        value: counts.new,
        footnote: 'Nobody assigned yet',
        sprite: 'box-open',
        lane: 'new',
      },
      {
        label: 'Missing stock',
        value: urgency.blocked,
        footnote: 'Short on the shelf',
        sprite: 'truck-loading',
        lane: 'needs_attention',
        group: 'stock',
      },
    ],
    [urgency.overdue, urgency.blocked, counts.new],
  )

  const changeLane = useCallback(
    (next: LaneId) => {
      setLane(next)
      // A selection made in one stage rarely means the same thing in another.
      clearSelection()
      setExpandedId(null)
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

  const toggleAll = useCallback(
    (checked: boolean) => {
      if (checked) selectAll()
      else clearSelection()
    },
    [selectAll, clearSelection],
  )

  const selectedOrders = useMemo(
    () => visible.filter((order) => selected.has(order.id)),
    [visible, selected],
  )

  const selectedIds = useMemo(
    () => selectedOrders.map((order) => order.id),
    [selectedOrders],
  )

  const plural = (n: number) => `${n} ${n === 1 ? 'order' : 'orders'}`

  const bulkStatus = useCallback(
    (status: OrderStatus) => {
      const snapshots = selectedOrders.map((order) => ({ ...order }))
      setStatus(selectedIds, status)
      setUndo({
        // Same word the tab and the pill use, so the report matches the action.
        message: `${plural(snapshots.length)} marked ${STATUS_META[status].label.toLowerCase()}`,
        snapshots,
      })
      clearSelection()
    },
    [selectedOrders, selectedIds, setStatus, clearSelection],
  )

  const bulkAssign = useCallback(
    (assigneeId: string) => {
      const snapshots = selectedOrders.map((order) => ({ ...order }))
      const name = users.find((user) => user.id === assigneeId)?.name ?? 'worker'

      assign(selectedIds, assigneeId)
      setUndo({ message: `${plural(snapshots.length)} assigned to ${name}`, snapshots })
      clearSelection()
    },
    [selectedOrders, selectedIds, assign, users, clearSelection],
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
      {/* Overdue moved onto a card, so the only number left up here is the one
          with neither a card nor a tab of its own. */}
      <PageHeader
        title="Orders"
        stats={<HeaderStat label="Due today" value={urgency.today} />}
        actions={
          <Button variant="primary" icon={<Plus size={15} />}>
            New order
          </Button>
        }
      />

      <OrderStatCards cards={callouts} onSelect={openCallout} />

      <StageTabs active={lane} counts={counts} onChange={changeLane} />

      <OrdersToolbar
        filters={filters}
        onChange={patchFilters}
        users={workers}
        shown={visible.length}
        total={counts[lane]}
      />

      <OrdersTable
        orders={visible}
        groups={groups}
        collapsedGroups={collapsedGroups}
        onToggleGroup={toggleGroup}
        users={users}
        skus={skus}
        now={now}
        selected={selected}
        expandedId={expandedId}
        openId={openId}
        compact={compactTable}
        empty={empty}
        onToggleSelect={toggleSelect}
        onToggleAll={toggleAll}
        onToggleExpand={(id) => setExpandedId((prev) => (prev === id ? null : id))}
        onOpen={setOpenId}
        onStatus={setStatus}
        onAssign={assign}
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
        onStatus={(id, status) => setStatus([id], status)}
        onAssign={(id, assigneeId) => assign([id], assigneeId)}
        onNotes={setNotes}
      />
    </>
  )
}
