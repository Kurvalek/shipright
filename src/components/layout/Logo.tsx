import ship from '@/assets/icons/ship.png'
import { AssetIcon } from '@/components/ui/AssetIcon'
import { cn } from '@/lib/cn'

/* A ship, in the brand colour, with nothing behind it. The mark used to be a
   check on a brand tile — "right" as in correct — and the ship is too finely
   drawn to survive being shrunk to fit inside one: three sails and a waterline
   at 13px is a smudge. Given the whole 22px it reads, and the brand colour it
   was borrowing from the tile it now carries itself. */
export function LogoMark({ className }: { className?: string }) {
  return <AssetIcon src={ship} size={22} className={cn('text-brand', className)} />
}

/* The wordmark drops when the nav folds to a rail, so the mark stays lined up
   over the icons underneath it rather than overhanging the content pane. */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark />
      {!compact && (
        <span className="text-[15px] font-semibold tracking-[-0.015em] text-ink">ShipRight</span>
      )}
    </div>
  )
}
