import { LANES } from '@/lib/derive'
import type { LaneId } from '@/lib/types'
import { cn } from '@/lib/cn'

/* The stages an order passes through, in order. Underlined tabs rather than
   pills, because these are the structure of the work, not one filter among many
   — the toolbar they sit in is where narrowing happens.

   Six labels and nothing else. The counts came off first, then the dot that
   replaced the one on Needs attention: what is stuck is already announced by
   the Overdue card above, in red, with the number attached. A second alarm on
   the tab underneath it was the same news told twice and quieter. */
export function StageTabs({
  active,
  onChange,
}: {
  active: LaneId
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
              'group relative shrink-0 px-3 py-2.5 text-[15px] whitespace-nowrap transition-colors',
              isActive ? 'font-medium text-ink' : 'text-ink-secondary hover:text-ink',
            )}
          >
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
