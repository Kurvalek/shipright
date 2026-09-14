import { useLayoutEffect, useRef, useState } from 'react'
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

  const listRef = useRef<HTMLDivElement>(null)
  const [marker, setMarker] = useState<{ left: number; width: number } | null>(null)

  /* One underline that travels rather than six that take turns switching on.
     Fading one out while another fades in leaves a beat with no answer to
     "which stage am I in", and the two places are unrelated on screen — the
     line sliding between them is what makes the move one movement.

     Measured rather than declared, because the tabs are sized by their own
     labels and counts. Watched as well as measured: the counts change under it
     as orders move, a stage going from 86 to 100 widens its tab, and every tab
     after it shifts along. */
  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return

    const measure = () => {
      const tab = list.querySelector<HTMLElement>('[aria-selected="true"]')
      // Nothing to measure while the row is behind its container query.
      if (!tab || tab.offsetWidth === 0) return

      const next = { left: tab.offsetLeft, width: tab.offsetWidth }
      setMarker((prev) =>
        prev && prev.left === next.left && prev.width === next.width ? prev : next,
      )
    }

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(list)
    for (const tab of list.querySelectorAll('[role="tab"]')) observer.observe(tab)
    return () => observer.disconnect()
  }, [active])

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
        ref={listRef}
        role="tablist"
        aria-label="Fulfillment stage"
        className="relative hidden min-w-0 gap-1 @min-[820px]:flex"
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

              {/* The hover hint only. The line under the selected stage is one
                  element for the whole row, below, so that it can travel. */}
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-transparent transition-colors group-hover:bg-hairline"
              />
            </button>
          )
        })}

        {/* Sits on the rule under the row rather than above it, so the stage you
            are in reads as a break in the line. */}
        {marker && (
          <span
            aria-hidden
            className="absolute bottom-0 left-0 h-[3px] rounded-full bg-brand transition-[translate,width] duration-200 ease-out motion-reduce:transition-none"
            style={{ translate: `${marker.left}px`, width: marker.width }}
          />
        )}
      </div>
    </>
  )
}
