import { useCallback, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { PaneDock } from '@/components/layout/PaneDock'
import { Button } from '@/components/ui/Button'
import { StageTabs } from '@/components/orders/StageTabs'
import { OrdersToolbar } from '@/components/orders/OrdersToolbar'
import type { Filters } from '@/components/orders/OrdersToolbar'
import { OrdersTable } from '@/components/orders/OrdersTable'
import { BulkActionBar } from '@/components/orders/BulkActionBar'
import { UndoToast } from '@/components/orders/UndoToast'
import { OrderDetailsPanel } from '@/components/orders/OrderDetailsPanel'
import {
  LANES,
  STATUS_META,
  buildSkuIndex,
  isOverdue,
  isSameDay,
  laneCounts,
  matchesLane,
  sortForLane,
} from '@/lib/derive'
import { useStore } from '@/lib/store'
import { useTopBarSearch } from '@/lib/topbarSearch'
import { usePersistentState } from '@/lib/usePersistentState'
import type { LaneId, Order, OrderStatus } from '@/lib/types'

const NO_FILTERS: Filters = { search: '', status: '', priority: '', assignee: '' }

const DEFAULT_LANE: LaneId = 'needs_attention'

const DATE = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
})

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

  // Stage and filters persist. Selection and expansion are per-session,
  // because they describe a task in progress, not a preference.
  const [storedLane, setLane] = usePersistentState<LaneId>('orders.lane', DEFAULT_LANE)
  const [filters, setFilters] = usePersistentState<Filters>('orders.filters', NO_FILTERS)

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

  /* Urgency stated as a number at the top of the stage, so the pressure is
     legible before anyone reads a single row. */
  const urgency = useMemo(() => {
    let overdue = 0
    let today = 0
    for (const order of visible) {
      if (isOverdue(order, now)) overdue += 1
      else if (isSameDay(new Date(order.dueAt), now)) today += 1
    }
    return { overdue, today }
  }, [visible, now])

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

  const changeLane = useCallback(
    (next: LaneId) => {
      setLane(next)
      // A selection made in one stage rarely means the same thing in another.
      clearSelection()
      setExpandedId(null)
    },
    [setLane, clearSelection],
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
      <PageHeader
        title="Orders"
        meta={
          <>
            <span>{DATE.format(now)}</span>
            <span className="text-ink-muted">·</span>
            {urgency.overdue > 0 ? (
              <>
                <span className="font-medium text-risk-text">{urgency.overdue} overdue</span>
                {urgency.today > 0 && (
                  <>
                    <span className="text-ink-muted">·</span>
                    <span>{urgency.today} due today</span>
                  </>
                )}
              </>
            ) : urgency.today > 0 ? (
              <span>{urgency.today} due today</span>
            ) : (
              <span>{laneMeta.description}</span>
            )}
          </>
        }
        actions={
          <Button variant="primary" icon={<Plus size={15} />}>
            New order
          </Button>
        }
      />

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
        users={users}
        skus={skus}
        now={now}
        selected={selected}
        expandedId={expandedId}
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
