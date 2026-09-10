import { LANES } from '@/lib/derive'
import type { LaneId } from '@/lib/types'
import { cn } from '@/lib/cn'

/* The stages an order passes through, in order. Underlined tabs rather than
   pills, because these are the structure of the work, not one filter among many
   — the toolbar they sit in is where narrowing happens.

   Counts have come off the labels. Six running totals across the top invited a
   reading none of them supported: they are the size of each stage, not work to
   get through, and Completed climbing forever said nothing at all. The one
   number that still earns its place is on Needs attention, and a dot carries
   it — whether anything is stuck is the question, not how much. */
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
    <div
      role="tablist"
      aria-label="Fulfillment stage"
      className="flex min-w-0 gap-1 overflow-x-auto"
    >
      {LANES.map((lane) => {
        const isActive = lane.id === active
        const isRisk = lane.id === 'needs_attention' && counts[lane.id] > 0

        return (
          <button
            key={lane.id}
            role="tab"
            aria-selected={isActive}
            title={lane.description}
            onClick={() => onChange(lane.id)}
            className={cn(
              'group relative flex shrink-0 items-center px-3 py-2.5 text-[15px] whitespace-nowrap transition-colors',
              isActive ? 'font-medium text-ink' : 'text-ink-secondary hover:text-ink',
            )}
          >
            {isRisk && (
              <span
                aria-hidden
                className={cn(
                  'mr-2 h-1.5 w-1.5 rounded-full',
                  isActive ? 'bg-risk-text' : 'bg-risk-text/60',
                )}
              />
            )}
            {lane.label}

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
