import { LANES } from '@/lib/derive'
import type { LaneId } from '@/lib/types'
import { cn } from '@/lib/cn'

/* The stages an order passes through, in order. Underlined tabs rather than
   pills, because these are the structure of the work, not one filter among many
   — the toolbar underneath is where narrowing happens. */
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
    <div className="mb-4">
      <div role="tablist" aria-label="Fulfillment stage" className="flex gap-1 overflow-x-auto">
        {LANES.map((lane) => {
          const isActive = lane.id === active
          const count = counts[lane.id]
          // Needs attention is the only tab that earns a colour when it fills up.
          const isRisk = lane.id === 'needs_attention' && count > 0

          return (
            <button
              key={lane.id}
              role="tab"
              aria-selected={isActive}
              title={lane.description}
              onClick={() => onChange(lane.id)}
              className={cn(
                'group relative flex shrink-0 items-center gap-2 px-3 py-2.5 text-[15px] whitespace-nowrap transition-colors',
                isActive ? 'font-medium text-ink' : 'text-ink-secondary hover:text-ink',
              )}
            >
              {isRisk && (
                <span
                  aria-hidden
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    isActive ? 'bg-risk-text' : 'bg-risk-text/60',
                  )}
                />
              )}
              {lane.label}
              <span
                className={cn(
                  // Scaled with the label, so the count stays a companion to
                  // the word rather than a footnote to it.
                  'tnum grid h-[21px] min-w-[21px] place-items-center rounded px-1.5 text-[12px] font-medium tabular-nums',
                  isActive
                    ? isRisk
                      ? 'bg-risk-fill text-risk-text'
                      : 'bg-brand/10 text-brand'
                    : 'bg-neutral-fill text-ink-secondary',
                )}
              >
                {count}
              </span>

              {/* Marks only the tab it belongs to. Without a rule running the
                  width of the page there is nothing for it to sit on, so it
                  ends at the tab's own edges. */}
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
    </div>
  )
}
