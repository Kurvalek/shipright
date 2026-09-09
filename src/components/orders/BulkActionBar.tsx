import { Boxes, Check, Truck, UserPlus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Menu } from '@/components/ui/Menu'
import type { OrderStatus, User } from '@/lib/types'

/* The single biggest fulfillment-time lever: one action for a whole selection
   instead of opening N modals. */
export function BulkActionBar({
  count,
  users,
  onStatus,
  onAssign,
  onClear,
}: {
  count: number
  users: User[]
  onStatus: (status: OrderStatus) => void
  onAssign: (assigneeId: string) => void
  onClear: () => void
}) {
  if (count === 0) return null

  return (
    <div className="pointer-events-none fixed bottom-6 left-60 z-40 flex w-[calc(100%-15rem)] justify-center px-8">
      <div
        role="region"
        aria-label="Bulk actions"
        className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-hairline bg-surface py-2 pr-2 pl-4 shadow-lg motion-safe:animate-[lift_160ms_ease-out]"
      >
        <p aria-live="polite" className="tnum mr-1 text-[13px] font-medium whitespace-nowrap text-ink">
          {count} selected
        </p>

        <span className="mr-1 h-5 w-px bg-hairline" />

        <Button size="sm" variant="ghost" icon={<Boxes size={14} />} onClick={() => onStatus('packed')}>
          Mark packed
        </Button>
        <Button size="sm" variant="ghost" icon={<Truck size={14} />} onClick={() => onStatus('shipped')}>
          Mark shipped
        </Button>
        <Button
          size="sm"
          variant="ghost"
          icon={<Check size={14} />}
          onClick={() => onStatus('completed')}
        >
          Complete
        </Button>

        <Menu
          header="Assign to"
          align="right"
          items={users.map((user) => ({
            label: user.name,
            onSelect: () => onAssign(user.id),
          }))}
          trigger={({ toggle }) => (
            <Button size="sm" variant="primary" icon={<UserPlus size={14} />} onClick={toggle}>
              Assign to...
            </Button>
          )}
        />

        <button
          type="button"
          onClick={onClear}
          aria-label="Clear selection"
          className="ml-0.5 grid size-7 place-items-center rounded-full text-ink-muted transition-colors hover:bg-neutral-fill hover:text-ink"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  )
}
