import { ArrowRight } from 'lucide-react'
import boxOpen from '@/assets/icons/box-open.png'
import truckClock from '@/assets/icons/truck-clock.png'
import truckLoading from '@/assets/icons/truck-loading.png'
import truckShipped from '@/assets/icons/truck-shipped.png'
import type { LaneId } from '@/lib/types'
import { cn } from '@/lib/cn'

/* Sprite strips rather than the GIFs they came from: a GIF cannot be stopped,
   restarted or recoloured from CSS. See scripts/build-icon-sprites.py. */
export const SPRITES = {
  'box-open': boxOpen,
  'truck-clock': truckClock,
  'truck-loading': truckLoading,
  'truck-shipped': truckShipped,
} as const

export type SpriteName = keyof typeof SPRITES

export interface Callout {
  label: string
  value: number
  /** What the number means, in the words a packer would use. */
  footnote: string
  sprite: SpriteName
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

                <div className="mt-1.5 flex items-baseline gap-2.5">
                  <span className={cn('display tnum text-[26px] leading-none', tone.value)}>
                    {card.value}
                  </span>
                  {/* Underlined at rest like every other link, and the arrow
                      only leans in once the card is under the pointer. */}
                  <span className="inline-flex items-center gap-1 text-[13px] text-ink-secondary underline decoration-ink-muted underline-offset-[3px] transition-colors group-hover:text-brand group-hover:decoration-brand">
                    View
                    <ArrowRight
                      size={13}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                </div>

                <p className="mt-1.5 truncate text-[12px] text-ink-muted">{card.footnote}</p>
              </div>

              <span
                className={cn('grid size-11 shrink-0 place-items-center rounded-lg', tone.chip)}
              >
                <span
                  aria-hidden
                  style={{ maskImage: `url(${SPRITES[card.sprite]})` }}
                  className={cn(
                    'sprite block size-7 motion-safe:group-hover:sprite-run',
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
