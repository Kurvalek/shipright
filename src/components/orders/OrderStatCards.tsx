import boxOpen from '@/assets/icons/box-open.png'
import newIcon from '@/assets/icons/new.png'
import outOfStock from '@/assets/icons/out-of-stock.png'
import truckClock from '@/assets/icons/truck-clock.png'
import truckLoading from '@/assets/icons/truck-loading.png'
import truckShipped from '@/assets/icons/truck-shipped.png'
import type { LaneId } from '@/lib/types'
import { cn } from '@/lib/cn'

/* Two kinds of artwork end up in the same chip. The animated ones are sprite
   strips rather than the GIFs they came from, since a GIF cannot be stopped,
   restarted or recoloured from CSS — see scripts/build-icon-sprites.py. The
   still ones are single drawings, and `animated` is what decides whether the
   mask is stepped through on hover or simply held.

   Both are masks either way, so a card takes the colour of the tone it is in
   rather than carrying its own. */
const ICONS = {
  'box-open': { src: boxOpen, animated: true },
  'truck-clock': { src: truckClock, animated: true },
  'truck-loading': { src: truckLoading, animated: true },
  'truck-shipped': { src: truckShipped, animated: true },
  new: { src: newIcon, animated: false },
  'out-of-stock': { src: outOfStock, animated: false },
} as const

export type IconName = keyof typeof ICONS

export interface Callout {
  label: string
  value: number
  /** What the number means, in the words a packer would use. */
  footnote: string
  icon: IconName
  /** The stage this number lives in, so the card is a way in and not just a sign. */
  lane: LaneId
  /** The group within that stage to open, when the stage has groups. */
  group?: string
  tone?: 'brand' | 'risk'
}

const tones = {
  brand: { chip: 'bg-brand-tint', ink: 'text-brand', value: 'text-ink' },
  risk: { chip: 'bg-risk-fill', ink: 'text-risk-text', value: 'text-risk-text' },
} as const

/* The numbers that decide what a shift does next, each one a way into the stage
   that holds it. The tabs carry the same counts, but a tab is a place to go once
   you already know where you are going; these say where to start. */
export function OrderStatCards({
  cards,
  onSelect,
}: {
  cards: Callout[]
  onSelect: (card: Callout) => void
}) {
  return (
    <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        const tone = tones[card.tone ?? 'brand']
        const icon = ICONS[card.icon]

        return (
          <button
            key={card.label}
            type="button"
            onClick={() => onSelect(card)}
            className="group rounded-card border border-hairline bg-surface px-4 py-3.5 text-left transition-colors hover:border-brand-tint-border hover:bg-brand-tint/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="label-text">{card.label}</p>

                {/* No "View" beside the number any more. The whole card has
                    been the target all along, and a link inside a button gave
                    the click two names for one destination. The border and
                    fill still answer the pointer, which is what says it is a
                    way in. */}
                <span
                  className={cn('display tnum mt-1.5 block text-[26px] leading-none', tone.value)}
                >
                  {card.value}
                </span>

                <p className="mt-1.5 truncate text-[12px] text-ink-muted">{card.footnote}</p>
              </div>

              <span
                className={cn('grid size-11 shrink-0 place-items-center rounded-lg', tone.chip)}
              >
                <span
                  aria-hidden
                  style={{ maskImage: `url(${icon.src})` }}
                  className={cn(
                    'block size-7',
                    icon.animated ? 'sprite motion-safe:group-hover:sprite-run' : 'icon-mask',
                    tone.ink,
                  )}
                />
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
