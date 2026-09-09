import { MapPin, Pencil, Plus } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Field'
import { Pill } from '@/components/ui/Pill'
import { Mono } from '@/components/orders/cells'
import { itemStockState } from '@/lib/derive'
import { useStore } from '@/lib/store'

export function WarehousePanel() {
  const { warehouse, setWarehouse, inventory } = useStore()

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="Warehouse configuration" />
        <CardBody>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="wh-name">Warehouse name</Label>
              <Input
                id="wh-name"
                value={warehouse.name}
                onChange={(e) => setWarehouse({ name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="wh-address">Address</Label>
              <Input
                id="wh-address"
                value={warehouse.address}
                onChange={(e) => setWarehouse({ address: e.target.value })}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Storage locations"
          actions={
            <Button size="sm" icon={<Plus size={13} />}>
              Add location
            </Button>
          }
        />
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {warehouse.locations.map((location) => {
              // Surfacing what actually sits in a bin makes this list useful
              // rather than decorative.
              const items = inventory.filter((item) => item.location === location.code)
              const flagged = items.filter((item) => itemStockState(item) !== 'ok').length

              return (
                <div
                  key={location.code}
                  className="group rounded-lg border border-hairline bg-surface p-3.5 transition-colors hover:border-ink-muted/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <MapPin size={13} className="text-ink-muted" />
                      <Mono className="font-medium text-ink">{location.code}</Mono>
                    </span>
                    <button
                      type="button"
                      aria-label={`Edit ${location.code}`}
                      className="grid size-6 shrink-0 place-items-center rounded text-ink-muted opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:bg-neutral-fill hover:text-ink"
                    >
                      <Pencil size={12} />
                    </button>
                  </div>

                  <div className="mt-2.5 flex items-center gap-2">
                    <Pill className="bg-neutral-fill text-neutral-text">
                      {location.kind === 'bin' ? 'Bin' : 'Zone'}
                    </Pill>
                    <span className="tnum text-[12px] text-ink-muted">
                      {items.length} {items.length === 1 ? 'SKU' : 'SKUs'}
                    </span>
                    {flagged > 0 && (
                      <Pill className="bg-risk-fill text-risk-text">{flagged} low</Pill>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
