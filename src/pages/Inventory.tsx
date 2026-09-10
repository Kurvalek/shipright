import { useCallback, useMemo, useState } from 'react'
import { AlertTriangle, Boxes, Layers, MapPin, PackageOpen, Pencil, X } from 'lucide-react'
import outOfStock from '@/assets/icons/out-of-stock.png'
import { PageHeader } from '@/components/layout/PageHeader'
import { AssetIcon } from '@/components/ui/AssetIcon'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Field'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatCard } from '@/components/inventory/StatCard'
import { EditItemModal } from '@/components/inventory/EditItemModal'
import { HEADER_CELL } from '@/components/orders/OrdersTable'
import { Mono } from '@/components/orders/cells'
import { formatRelative, itemStockState } from '@/lib/derive'
import { useStore } from '@/lib/store'
import { useTopBarSearch } from '@/lib/topbarSearch'
import { usePersistentState } from '@/lib/usePersistentState'
import type { InventoryItem } from '@/lib/types'
import { cn } from '@/lib/cn'

interface InventoryFilters {
  search: string
  category: string
  location: string
  lowOnly: boolean
}

const NO_FILTERS: InventoryFilters = { search: '', category: '', location: '', lowOnly: false }

const columns = ['SKU', 'Product', 'Category', 'On hand', 'Reorder at', 'Location', 'Updated']

export default function Inventory() {
  const { inventory, warehouse, updateItem } = useStore()
  const [filters, setFilters] = usePersistentState<InventoryFilters>('inventory.filters', NO_FILTERS)
  const [editSku, setEditSku] = useState<string | null>(null)

  const now = useMemo(() => new Date(), [inventory])

  const categories = useMemo(
    () => [...new Set(inventory.map((item) => item.category))].sort(),
    [inventory],
  )

  const stats = useMemo(() => {
    const totalStock = inventory.reduce((sum, item) => sum + item.quantity, 0)
    const low = inventory.filter((item) => itemStockState(item) === 'low').length
    const out = inventory.filter((item) => itemStockState(item) === 'out').length
    const locations = new Set(inventory.map((item) => item.location)).size
    return { totalStock, low, out, locations }
  }, [inventory])

  const visible = useMemo(() => {
    const needle = filters.search.trim().toLowerCase()

    return inventory.filter((item) => {
      if (filters.category && item.category !== filters.category) return false
      if (filters.location && item.location !== filters.location) return false
      if (filters.lowOnly && itemStockState(item) === 'ok') return false
      if (needle) {
        const haystack = `${item.sku} ${item.name} ${item.description}`.toLowerCase()
        if (!haystack.includes(needle)) return false
      }
      return true
    })
  }, [inventory, filters])

  const patch = useCallback(
    (next: Partial<InventoryFilters>) => setFilters((prev) => ({ ...prev, ...next })),
    [setFilters],
  )

  const setSearch = useCallback((search: string) => patch({ search }), [patch])

  useTopBarSearch(filters.search, setSearch, 'Search inventory by SKU, name or description')

  const isFiltered =
    filters.search !== '' || filters.category !== '' || filters.location !== '' || filters.lowOnly

  const editItem: InventoryItem | null = editSku
    ? (inventory.find((item) => item.sku === editSku) ?? null)
    : null

  const needsAttention = stats.low + stats.out

  return (
    <>
      <PageHeader
        title="Inventory"
        meta={
          needsAttention > 0 ? (
            <button
              onClick={() => patch({ lowOnly: true, category: '', location: '', search: '' })}
              className="inline-flex items-center gap-1.5 text-risk-text underline decoration-risk-edge/50 underline-offset-2 transition-colors hover:decoration-risk-edge"
            >
              <AlertTriangle size={13} />
              {needsAttention} {needsAttention === 1 ? 'SKU needs' : 'SKUs need'} attention
            </button>
          ) : (
            <span>Every SKU is above its reorder point</span>
          )
        }
      />

      <div className="grid grid-cols-2 gap-4 pb-6 lg:grid-cols-4">
        <StatCard
          icon={<Boxes size={15} />}
          label="Total SKUs"
          value={inventory.length}
          footnote={`Across ${categories.length} categories`}
        />
        <StatCard
          icon={<Layers size={15} />}
          label="Units on hand"
          value={stats.totalStock.toLocaleString()}
          footnote="Sum of all quantities"
        />
        <StatCard
          icon={
            stats.out > 0 ? <AssetIcon src={outOfStock} size={15} /> : <AlertTriangle size={15} />
          }
          label="Low or out"
          value={needsAttention}
          tone={needsAttention > 0 ? 'risk' : 'neutral'}
          footnote={stats.out > 0 ? `${stats.out} fully out of stock` : 'At or below reorder point'}
        />
        <StatCard
          icon={<MapPin size={15} />}
          label="Bins in use"
          value={stats.locations}
          footnote={warehouse.name}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 pb-6">
        <Select
          value={filters.category}
          placeholder="All categories"
          aria-label="Filter by category"
          onChange={(e) => patch({ category: e.target.value })}
          className="w-[160px]"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Select>

        <Select
          value={filters.location}
          placeholder="All locations"
          aria-label="Filter by location"
          onChange={(e) => patch({ location: e.target.value })}
          className="w-[150px]"
        >
          {[...new Set(inventory.map((item) => item.location))].sort().map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </Select>

        <button
          type="button"
          aria-pressed={filters.lowOnly}
          onClick={() => patch({ lowOnly: !filters.lowOnly })}
          className={cn(
            'inline-flex h-9 items-center gap-2 rounded-md px-3 text-[13px] transition-colors',
            filters.lowOnly
              ? 'bg-risk-fill font-medium text-risk-text ring-1 ring-risk-edge/40'
              : 'bg-surface text-ink-secondary ring-1 ring-hairline hover:text-ink',
          )}
        >
          <AlertTriangle size={13} />
          Low stock only
        </button>

        {isFiltered && (
          <button
            type="button"
            onClick={() => setFilters(NO_FILTERS)}
            className="inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-[13px] text-ink-secondary transition-colors hover:bg-neutral-fill hover:text-ink"
          >
            <X size={13} />
            Clear
          </button>
        )}

        <p className="tnum ml-auto pl-2 text-[12px] text-ink-muted">
          {visible.length} of {inventory.length}
        </p>
      </div>

      {/* Unframed, like the orders grid: a border and a fill were drawing a box
          around something the white pane already contains. */}
      <div className="-mx-2 overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse">
          <thead className="bg-canvas">
            <tr className="border-b border-hairline">
              {columns.map((column, i) => (
                <th
                  key={column}
                  className={cn(
                    HEADER_CELL,
                    'text-left',
                    i === 0 && 'pl-2',
                    (column === 'On hand' || column === 'Reorder at') && 'text-right',
                  )}
                >
                  {column}
                </th>
              ))}
              <th className={cn(HEADER_CELL, 'pr-2 text-right')}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {visible.map((item) => {
              const state = itemStockState(item)

              return (
                <tr
                  key={item.sku}
                  className="group border-b border-hairline-subtle transition-colors last:border-0 hover:bg-surface-sunken"
                >
                  {/* Amber edge marks the rows a buyer needs to act on. */}
                  <td
                    className={cn(
                      'py-3.5 pr-4 pl-2',
                      state === 'low' && 'shadow-[inset_2px_0_0_var(--color-risk-edge)]',
                      state === 'out' && 'shadow-[inset_2px_0_0_var(--color-danger-dot)]',
                    )}
                  >
                    {/* The identifier the whole row hangs off, so it carries the
                        weight the rest of the row gives up. */}
                    <Mono className="text-[14.5px] font-bold text-ink">{item.sku}</Mono>
                  </td>

                  <td className="max-w-[320px] py-3.5 pr-4">
                    <p className="truncate text-[14px] text-ink">{item.name}</p>
                    <p className="truncate text-[12.5px] text-ink-muted">{item.description}</p>
                  </td>

                  <td className="py-3.5 pr-4 text-[14px] whitespace-nowrap text-ink-secondary">
                    {item.category}
                  </td>

                  <td className="py-3.5 pr-4 text-right whitespace-nowrap">
                    <span
                      className={cn(
                        'tnum text-[14px]',
                        state === 'out'
                          ? 'font-medium text-danger-text'
                          : state === 'low'
                            ? 'font-medium text-risk-text'
                            : 'text-ink',
                      )}
                    >
                      {item.quantity === 0 ? 'None' : item.quantity.toLocaleString()}
                    </span>
                  </td>

                  <td className="tnum py-3.5 pr-4 text-right text-[14px] text-ink-muted">
                    {item.reorderPoint}
                  </td>

                  <td className="py-3.5 pr-4">
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-ink-secondary">
                      <MapPin size={13} className="text-ink-muted" />
                      <Mono>{item.location}</Mono>
                    </span>
                  </td>

                  <td className="py-3.5 pr-4 text-[14px] whitespace-nowrap text-ink-muted">
                    {formatRelative(item.updatedAt, now)}
                  </td>

                  <td className="py-3 pr-2 text-right">
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<Pencil size={12} />}
                      onClick={() => setEditSku(item.sku)}
                      className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              )
            })}

            {visible.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1}>
                  <EmptyState
                    icon={<PackageOpen size={18} />}
                    title="No matching items"
                    body={
                      filters.lowOnly
                        ? 'Nothing is at or below its reorder point right now.'
                        : 'Nothing matches these filters. Try widening the search.'
                    }
                    action={
                      isFiltered ? (
                        <Button onClick={() => setFilters(NO_FILTERS)}>Clear filters</Button>
                      ) : undefined
                    }
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <EditItemModal
        item={editItem}
        locations={warehouse.locations}
        onClose={() => setEditSku(null)}
        onSave={updateItem}
      />
    </>
  )
}
