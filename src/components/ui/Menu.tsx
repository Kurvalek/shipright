import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface MenuItem {
  label: string
  onSelect: () => void
  icon?: ReactNode
  danger?: boolean
  disabled?: boolean
  /** The one already chosen. Marked rather than disabled: still a way back. */
  active?: boolean
}

/** Where the panel sits, in viewport coordinates. */
interface Anchor {
  top: number | null
  bottom: number | null
  left: number | null
  right: number | null
}

const GAP = 6

export function Menu({
  trigger,
  items,
  align = 'right',
  /** 'top' for triggers that sit near the bottom edge, like the bulk bar. */
  side = 'bottom',
  header,
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode
  items: MenuItem[]
  align?: 'left' | 'right'
  side?: 'top' | 'bottom'
  header?: string
}) {
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState<Anchor | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  /* Positioned against the viewport rather than the trigger, because the row
     this opens from lives inside a horizontally scrolling table. A scroll
     container clips on both axes whatever you ask of it — `overflow-x: auto`
     quietly makes the other axis `auto` too — so an absolutely positioned
     panel was being cut off at the bottom of the grid. */
  const place = useCallback(() => {
    const button = rootRef.current
    if (!button) return

    const rect = button.getBoundingClientRect()
    const height = panelRef.current?.offsetHeight ?? 0

    /* Opens downwards unless the panel would run off the bottom, which is the
       same rule the caller's `side` states outright for triggers that already
       sit at the foot of the page. */
    const flip =
      side === 'top' || (height > 0 && rect.bottom + GAP + height > window.innerHeight - 8)

    setAnchor({
      top: flip ? null : rect.bottom + GAP,
      bottom: flip ? window.innerHeight - rect.top + GAP : null,
      left: align === 'left' ? rect.left : null,
      right: align === 'right' ? window.innerWidth - rect.right : null,
    })
  }, [align, side])

  useLayoutEffect(() => {
    if (open) place()
    else setAnchor(null)
  }, [open, place])

  useEffect(() => {
    if (!open) return

    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    // Capture, so a scroll in any ancestor keeps the panel on its trigger.
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)

    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [open, place])

  return (
    <div ref={rootRef} className="relative">
      {trigger({ open, toggle: () => setOpen((v) => !v) })}

      {open &&
        createPortal(
          <div
            ref={panelRef}
            role="menu"
            style={{
              position: 'fixed',
              top: anchor?.top ?? undefined,
              bottom: anchor?.bottom ?? undefined,
              left: anchor?.left ?? undefined,
              right: anchor?.right ?? undefined,
              // Measured before it is placed, so the first paint is not a flash
              // in the corner of the screen.
              visibility: anchor ? undefined : 'hidden',
            }}
            className={cn(
              'z-50 min-w-48 overflow-hidden rounded-lg border border-hairline bg-surface py-1 shadow-lg',
              'motion-safe:animate-[rise_100ms_ease-out]',
            )}
          >
            {header && <p className="label-text px-3 pt-1.5 pb-1">{header}</p>}
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                aria-current={item.active ? 'true' : undefined}
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false)
                  item.onSelect()
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[13px] transition-colors',
                  'disabled:pointer-events-none disabled:opacity-40',
                  item.danger
                    ? 'text-danger-text hover:bg-danger-fill'
                    : item.active
                      ? 'bg-mauve/50 font-medium text-brand'
                      : 'text-ink hover:bg-neutral-fill',
                )}
              >
                {item.icon && (
                  <span className={item.active ? 'text-brand' : 'text-ink-muted'}>{item.icon}</span>
                )}
                {item.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  )
}
