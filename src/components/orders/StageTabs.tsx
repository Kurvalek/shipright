import { ChevronDown } from 'lucide-react'
import { Menu } from '@/components/ui/Menu'
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
  landed,
  onChange,
}: {
  active: LaneId
  counts: Record<LaneId, number>
  /* Where orders have just arrived. `token` changes on every move so a second
     move to the same stage plays again rather than sitting still. */
  landed?: { lane: LaneId; token: number } | null
  onChange: (lane: LaneId) => void
}) {
  const current = LANES.find((lane) => lane.id === active) ?? LANES[0]!

  return (
    <>
      {/* Narrow, the six become one. A scrolling tab strip hides most of the
          stages behind a gesture and gives no sign of which ones — a menu at
          least says what there is, and says which one you are in without being
          read sideways.

          820px is what the six labels and their counts need before they start
          fighting the filter button for the row, and it is asked of the toolbar
          rather than the window: the room here depends on the nav rail and the
          detail pane as much as the screen, so the same squeeze that happens on
          a phone happens on a desktop with a record open beside the list. */}
      <div className="min-w-0 @min-[820px]:hidden">
        <Menu
          align="left"
          header="Stage"
          items={LANES.map((lane) => ({
            label: `${lane.label} · ${counts[lane.id]}`,
            active: lane.id === active,
            onSelect: () => onChange(lane.id),
          }))}
          trigger={({ open, toggle }) => (
            <button
              type="button"
              onClick={toggle}
              aria-expanded={open}
              className="flex h-9 items-center gap-2 rounded-md px-2.5 text-[15px] font-medium text-ink transition-colors hover:bg-neutral-fill"
            >
              {current.label}
              <span className="tnum font-normal text-ink-muted">{counts[current.id]}</span>
              <ChevronDown
                size={15}
                className={cn('text-ink-muted transition-transform', open && 'rotate-180')}
              />
            </button>
          )}
        />
      </div>

      <div
        role="tablist"
        aria-label="Fulfillment stage"
        className="hidden min-w-0 gap-1 @min-[820px]:flex"
      >
        {LANES.map((lane) => {
          const isActive = lane.id === active
          const justLanded = landed?.lane === lane.id

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
                  weight while the label bolds under the selection.

                  Remounted on arrival, by key, because an animation class added
                  to an element already wearing it does not start over — and
                  moving two orders to Packed in a row should be two answers. */}
              <span
                key={justLanded ? landed.token : 'idle'}
                className={cn(
                  'tnum font-normal text-ink-muted',
                  // Where the order went, said by the number it went into. The
                  // row itself leaves the stage you are looking at, so without
                  // this the only report is one that has to be read.
                  justLanded && 'motion-safe:animate-[land_600ms_ease-out]',
                )}
              >
                {counts[lane.id]}
              </span>

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
    </>
  )
}
