import { cn } from '@/lib/cn'

/* The mark reads as a check inside a shipping tile: "right" as in correct,
   which is the promise in the name. It is one of only a few places the brand
   colour is allowed to appear. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'grid size-[22px] shrink-0 place-items-center rounded-[6px] bg-brand',
        className,
      )}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 12.8 9.2 18 20 6.5"
          stroke="white"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark />
      <span className="text-[15px] font-semibold tracking-[-0.015em] text-ink">ShipRight</span>
    </div>
  )
}
