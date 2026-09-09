import type { ReactNode } from 'react'
import { Boxes, Check, PlayCircle, Truck, UserPlus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Menu } from '@/components/ui/Menu'
import type { LaneId, OrderStatus, User } from '@/lib/types'
import { LANES } from '@/lib/derive'
import type { BulkAction } from '@/lib/derive'

/* The single biggest fulfillment-time lever: one action for a whole selection
   instead of opening N modals. The move the current stage exists to perform is
   promoted to the primary button, so "Ready to ship → select all → Mark
   shipped" is three clicks whether the selection is 3 orders or 84. */
export function BulkActionBar({
  count,
  totalInStage,
  lane,
  users,
  onStatus,
  onAssign,
  onSelectAll,
  onClear,
}: {
  count: number
  /** Rows in the stage after filters, so the bar can offer to take the rest. */
  totalInStage: number
  lane: LaneId
  users: User[]
  onStatus: (status: OrderStatus) => void
  onAssign: (assigneeId: string) => void
  onSelectAll: () => void
  onClear: () => void
}) {
  if (count === 0) return null

  const [primary, ...secondary] = LANES.find((l) => l.id === lane)?.bulkActions ?? []

  const statusFor: Record<Exclude<BulkAction, 'assign'>, OrderStatus> = {
    start: 'in_progress',
    packed: 'packed',
    shipped: 'shipped',
    completed: 'completed',
  }

  const meta: Record<BulkAction, { label: string; icon: ReactNode }> = {
    assign: { label: 'Assign to...', icon: <UserPlus size={14} /> },
    start: { label: 'Start picking', icon: <PlayCircle size={14} /> },
    packed: { label: 'Mark packed', icon: <Boxes size={14} /> },
    shipped: { label: 'Mark shipped', icon: <Truck size={14} /> },
    completed: { label: 'Complete', icon: <Check size={14} /> },
  }

  function renderAction(action: BulkAction, variant: 'primary' | 'ghost') {
    if (action === 'assign') {
      return (
        <Menu
          key="assign"
          header="Assign to"
          align="right"
          side="top"
          items={users.map((user) => ({
            label: user.name,
            onSelect: () => onAssign(user.id),
          }))}
          trigger={({ toggle }) => (
            <Button size="sm" variant={variant} icon={meta.assign.icon} onClick={toggle}>
              {meta.assign.label}
            </Button>
          )}
        />
      )
    }

    return (
      <Button
        key={action}
        size="sm"
        variant={variant}
        icon={meta[action].icon}
        onClick={() => onStatus(statusFor[action])}
      >
        {meta[action].label}
      </Button>
    )
  }

  return (
    <div className="pointer-events-none fixed bottom-6 left-60 z-40 flex w-[calc(100%-15rem)] justify-center px-8">
      <div
        role="region"
        aria-label="Bulk actions"
        className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-hairline bg-surface py-2 pr-2 pl-4 shadow-lg motion-safe:animate-[lift_160ms_ease-out]"
      >
        <p
          aria-live="polite"
          className="tnum mr-1 text-[13px] font-medium whitespace-nowrap text-ink"
        >
          {count} selected
        </p>

        {/* Only offered when it would actually change the selection. */}
        {count < totalInStage && (
          <button
            onClick={onSelectAll}
            className="tnum mr-1 rounded-full px-1.5 py-0.5 text-[12.5px] whitespace-nowrap text-brand transition-colors hover:bg-brand/10"
          >
            Select all {totalInStage}
          </button>
        )}

        <span className="mr-1 h-5 w-px bg-hairline" />

        {primary && renderAction(primary, 'primary')}
        {secondary.map((action) => renderAction(action, 'ghost'))}

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
