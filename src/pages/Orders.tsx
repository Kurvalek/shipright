import { useCallback, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { LaneTabs } from '@/components/orders/LaneTabs'
import { OrdersToolbar } from '@/components/orders/OrdersToolbar'
import type { Filters } from '@/components/orders/OrdersToolbar'
import { OrdersTable } from '@/components/orders/OrdersTable'
import { BulkActionBar } from '@/components/orders/BulkActionBar'
import { OrderDetailsModal } from '@/components/orders/OrderDetailsModal'
import { LANES, laneCounts, matchesLane, sortForLane } from '@/lib/derive'
import { useStore } from '@/lib/store'
import { usePersistentState } from '@/lib/usePersistentState'
import type { LaneId, Order, OrderStatus } from '@/lib/types'

const NO_FILTERS: Filters = { search: '', status: '', priority: '', assignee: '' }

const DATE = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
})

export default function Orders() {
  const { orders, inventory, users, setStatus, assign, setNotes } = useStore()

  // Lane and filters persist. Selection and expansion are per-session.
  const [lane, setLane] = usePersistentState<LaneId>('orders.lane', 'ship_today')
  const [filters, setFilters] = usePersistentState<Filters>('orders.filters', NO_FILTERS)

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  // A single clock for the whole render, so lane membership and every due
  // label agree with each other.
  const now = useMemo(() => new Date(), [orders])

  const counts = useMemo(() => laneCounts(orders, now), [orders, now])

  const visible = useMemo(() => {
    const needle = filters.search.trim().toLowerCase()

    const filtered = orders.filter((order) => {
      if (!matchesLane(order, lane, now)) return false
      if (filters.status && order.status !== filters.status) return false
      if (filters.priority && order.priority !== filters.priority) return false

      if (filters.assignee === 'none') {
        if (order.assigneeId !== null) return false
      } else if (filters.assignee && order.assigneeId !== filters.assignee) {
        return false
      }

      if (needle) {
        const haystack = [
          order.id,
          order.customer,
          ...order.lines.map((line) => line.sku),
        ]
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(needle)) return false
      }

      return true
    })

    return sortForLane(filtered, lane)
  }, [orders, lane, filters, now])

  const patchFilters = useCallback(
    (patch: Partial<Filters>) => setFilters((prev) => ({ ...prev, ...patch })),
    [setFilters],
  )

  const changeLane = useCallback(
    (next: LaneId) => {
      setLane(next)
      // A selection made in one lane rarely means the same thing in another.
      setSelected(new Set())
      setExpandedId(null)
    },
    [setLane],
  )

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleAll = useCallback(
    (checked: boolean) => {
      setSelected(checked ? new Set(visible.map((order) => order.id)) : new Set())
    },
    [visible],
  )

  const selectedIds = useMemo(
    () => visible.filter((order) => selected.has(order.id)).map((order) => order.id),
    [visible, selected],
  )

  const bulkStatus = useCallback(
    (status: OrderStatus) => {
      setStatus(selectedIds, status)
      setSelected(new Set())
    },
    [selectedIds, setStatus],
  )

  const bulkAssign = useCallback(
    (assigneeId: string) => {
      assign(selectedIds, assigneeId)
      setSelected(new Set())
    },
    [selectedIds, assign],
  )

  const openOrder: Order | null = openId
    ? (orders.find((order) => order.id === openId) ?? null)
    : null

  const laneMeta = LANES.find((l) => l.id === lane)!

  const isFiltered =
    filters.search !== '' ||
    filters.status !== '' ||
    filters.priority !== '' ||
    filters.assignee !== ''

  /* An empty lane and an over-filtered lane mean different things. Telling a
     picker "the floor is clear" when they simply mistyped a SKU is worse than
     saying nothing. */
  const empty = isFiltered
    ? {
        title: 'No matches in this view',
        body: `Nothing in ${laneMeta.label} matches these filters. Clear them, or try another view.`,
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
            <span>{laneMeta.description}</span>
          </>
        }
        actions={
          <Button variant="primary" icon={<Plus size={15} />}>
            New order
          </Button>
        }
      />

      <LaneTabs active={lane} counts={counts} onChange={changeLane} />

      <OrdersToolbar
        filters={filters}
        onChange={patchFilters}
        users={users}
        shown={visible.length}
        total={counts[lane]}
      />

      <OrdersTable
        orders={visible}
        users={users}
        inventory={inventory}
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

      {/* Leaves room for the bulk bar so it never covers the last row. */}
      <div className="h-16" />

      <BulkActionBar
        count={selectedIds.length}
        users={users}
        onStatus={bulkStatus}
        onAssign={bulkAssign}
        onClear={() => setSelected(new Set())}
      />

      <OrderDetailsModal
        order={openOrder}
        users={users}
        inventory={inventory}
        now={now}
        onClose={() => setOpenId(null)}
        onStatus={(id, status) => setStatus([id], status)}
        onAssign={(id, assigneeId) => assign([id], assigneeId)}
        onNotes={setNotes}
      />
    </>
  )
}
