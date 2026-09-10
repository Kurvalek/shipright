import type { ReactNode } from 'react'
import { Boxes, Check, PlayCircle, Truck, UserPlus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Menu } from '@/components/ui/Menu'
import type { LaneId, OrderStatus, User } from '@/lib/types'
import { LANES } from '@/lib/derive'
import type { BulkAction } from '@/lib/derive'

/* The single biggest fulfillment-time lever: one action for a whole selection
   instead of opening N modals. The move the current stage exists to perform is
   promoted to the primary button, so "Packed → select all → Mark as
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

  const meta: Record<BulkAction, { label: string; icon: ReactNode }> = {
    assign: { label: 'Assign to...', icon: <UserPlus size={14} /> },
    in_progress: { label: 'Mark as in progress', icon: <PlayCircle size={14} /> },
    packed: { label: 'Mark as packed', icon: <Boxes size={14} /> },
    shipped: { label: 'Mark as shipped', icon: <Truck size={14} /> },
    completed: { label: 'Mark as completed', icon: <Check size={14} /> },
  }

  function renderAction(action: BulkAction, variant: 'inverse' | 'ghost-inverse') {
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
        onClick={() => onStatus(action)}
      >
        {meta[action].label}
      </Button>
    )
  }

  return (
    <div
      role="region"
      aria-label="Bulk actions"
      className="pointer-events-auto flex items-center gap-2 rounded-b-shell bg-ink px-8 py-3 motion-safe:animate-[lift_160ms_ease-out]"
    >
      <p aria-live="polite" className="tnum text-[13px] font-medium whitespace-nowrap text-white">
        {count} selected
      </p>

      {/* Only offered when it would actually change the selection. */}
      {count < totalInStage && (
        <button
          onClick={onSelectAll}
          className="tnum rounded px-1.5 py-0.5 text-[12.5px] whitespace-nowrap text-white/70 underline decoration-white/30 underline-offset-[3px] transition-colors hover:text-white hover:decoration-white"
        >
          Select all {totalInStage}
        </button>
      )}

      {/* Actions sit at the far end, away from the count, so the bar reads
          left to right as "this much selected, now do this". */}
      <div className="ml-auto flex items-center gap-1.5">
        {secondary.map((action) => renderAction(action, 'ghost-inverse'))}
        {primary && renderAction(primary, 'inverse')}

        <span className="mx-1 h-5 w-px bg-white/15" />

        <button
          type="button"
          onClick={onClear}
          aria-label="Clear selection"
          className="grid size-7 place-items-center rounded-md text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  )
}
