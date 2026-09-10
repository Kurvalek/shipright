import { LANES } from '@/lib/derive'
import type { LaneId } from '@/lib/types'
import { cn } from '@/lib/cn'

/* The stages an order passes through, in order. Underlined tabs rather than
   pills, because these are the structure of the work, not one filter among many
   — the toolbar they sit in is where narrowing happens.

   The counts are set plainly beside their labels: no badge, no weight of their
   own, and lighter than the word they follow. How much work is waiting in each
   stage is worth knowing at a glance, but it is not what you are reading the
   row for. */
export function StageTabs({
  active,
  counts,
  onChange,
}: {
  active: LaneId
  counts: Record<LaneId, number>
  onChange: (lane: LaneId) => void
}) {
  return (
    <div role="tablist" aria-label="Fulfillment stage" className="flex min-w-0 gap-1 overflow-x-auto">
      {LANES.map((lane) => {
        const isActive = lane.id === active

        return (
          <button
            key={lane.id}
            role="tab"
            aria-selected={isActive}
            title={lane.description}
            onClick={() => onChange(lane.id)}
            className={cn(
              'group relative flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-[15px] whitespace-nowrap transition-colors',
              isActive ? 'font-medium text-ink' : 'text-ink-secondary hover:text-ink',
            )}
          >
            {lane.label}

            {/* font-normal rather than inherited, so the count stays at one
                weight while the label bolds under the selection. */}
            <span className="tnum font-normal text-ink-muted">{counts[lane.id]}</span>

            {/* Sits on the rule under the row rather than above it, so the
                stage you are in reads as a break in the line. */}
            <span
              aria-hidden
              className={cn(
                'absolute inset-x-0 bottom-0 h-[3px] rounded-full transition-colors',
                isActive ? 'bg-brand' : 'bg-transparent group-hover:bg-hairline',
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
