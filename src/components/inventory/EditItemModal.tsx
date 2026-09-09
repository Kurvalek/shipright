import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Label, ReadOnlyField, Select } from '@/components/ui/Field'
import { Pill } from '@/components/ui/Pill'
import { Mono } from '@/components/orders/cells'
import { formatTimestamp, itemStockState } from '@/lib/derive'
import type { InventoryItem, StorageLocation } from '@/lib/types'

export function EditItemModal({
  item,
  locations,
  onClose,
  onSave,
}: {
  item: InventoryItem | null
  locations: StorageLocation[]
  onClose: () => void
  onSave: (sku: string, patch: Partial<InventoryItem>) => void
}) {
  const [quantity, setQuantity] = useState('')
  const [reorderPoint, setReorderPoint] = useState('')
  const [location, setLocation] = useState('')

  useEffect(() => {
    if (!item) return
    setQuantity(String(item.quantity))
    setReorderPoint(String(item.reorderPoint))
    setLocation(item.location)
  }, [item])

  if (!item) return null

  const state = itemStockState(item)

  return (
    <Modal
      open
      onClose={onClose}
      title={item.name}
      width="max-w-xl"
      eyebrow={
        <>
          <Mono className="text-ink-secondary">{item.sku}</Mono>
          <span className="text-ink-muted">·</span>
          <span className="text-[13px] text-ink-secondary">{item.category}</span>
          {state === 'low' && <Pill className="bg-risk-fill text-risk-text">Low stock</Pill>}
          {state === 'out' && <Pill className="bg-danger-fill text-danger-text">Out of stock</Pill>}
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
              onSave(item.sku, {
                quantity: Math.max(0, Number(quantity) || 0),
                reorderPoint: Math.max(0, Number(reorderPoint) || 0),
                location,
              })
              onClose()
            }}
          >
            Save changes
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <p className="text-[13px] text-ink-secondary">{item.description}</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="quantity">Quantity on hand</Label>
            <Input
              id="quantity"
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="tnum"
            />
          </div>
          <div>
            <Label htmlFor="reorder">Reorder point</Label>
            <Input
              id="reorder"
              type="number"
              min={0}
              value={reorderPoint}
              onChange={(e) => setReorderPoint(e.target.value)}
              className="tnum"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="location">Warehouse location</Label>
          <Select
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="font-mono text-[12px]"
          >
            {/* The item's current bin may predate the configured list. */}
            {!locations.some((l) => l.code === item.location) && (
              <option value={item.location}>{item.location}</option>
            )}
            {locations.map((l) => (
              <option key={l.code} value={l.code}>
                {l.code}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-hairline-subtle pt-4">
          <ReadOnlyField label="Category" value={item.category} />
          <ReadOnlyField
            label="Last updated"
            value={<span className="tnum">{formatTimestamp(item.updatedAt)}</span>}
          />
        </div>
      </div>
    </Modal>
  )
}
