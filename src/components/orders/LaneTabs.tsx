import { LANES } from '@/lib/derive'
import type { LaneId } from '@/lib/types'
import { cn } from '@/lib/cn'

/* Saved views, not a flat pile. The default lands on the most urgent
   actionable set, and the choice persists, so nobody re-applies the same
   filter combination twenty times a day. */
export function LaneTabs({
  active,
  counts,
  onChange,
}: {
  active: LaneId
  counts: Record<LaneId, number>
  onChange: (lane: LaneId) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="Order views"
      className="flex flex-wrap items-center gap-1.5 pb-4"
    >
      {LANES.map((lane) => {
        const isActive = lane.id === active
        const count = counts[lane.id]

        return (
          <button
            key={lane.id}
            role="tab"
            aria-selected={isActive}
            title={lane.description}
            onClick={() => onChange(lane.id)}
            className={cn(
              'inline-flex items-center gap-2 rounded-full py-1.5 pr-2 pl-3.5 text-[13px] transition-colors',
              isActive
                ? 'bg-brand font-medium text-white'
                : 'text-ink-secondary ring-1 ring-hairline hover:bg-surface hover:text-ink',
            )}
          >
            {lane.label}
            <span
              className={cn(
                'tnum grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-medium',
                isActive ? 'bg-white/20 text-white' : 'bg-neutral-fill text-ink-secondary',
              )}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
