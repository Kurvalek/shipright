import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'

/* A drawer rather than a centred modal. Detail work sits beside the list it
   came from, so the row you were reading stays on screen and the table does
   not get covered by a slab in the middle of it. */
export function SidePanel({
  open,
  onClose,
  title,
  eyebrow,
  footer,
  children,
  width = 'sm:max-w-[34rem]',
  bodyClassName = 'overflow-y-auto px-6 py-5',
}: {
  open: boolean
  onClose: () => void
  title: string
  eyebrow?: ReactNode
  footer?: ReactNode
  children: ReactNode
  width?: string
  /** For bodies that lay themselves out to the panel's height rather than scroll. */
  bodyClassName?: string
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-ink/25 backdrop-blur-[1px] motion-safe:animate-[fade_120ms_ease-out]"
        onClick={onClose}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          'absolute inset-y-0 right-0 flex w-full flex-col bg-surface shadow-2xl outline-none',
          'border-l border-hairline motion-safe:animate-[slide-in_180ms_cubic-bezier(0.32,0.72,0,1)]',
          width,
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-hairline px-6 py-4">
          <div className="min-w-0">
            <h2 className="display truncate text-[22px] leading-tight text-ink">{title}</h2>
            {eyebrow && <div className="mt-1 flex items-center gap-2">{eyebrow}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1.5 grid size-8 shrink-0 place-items-center rounded-md text-ink-muted transition-colors hover:bg-neutral-fill hover:text-ink"
          >
            <X size={16} />
          </button>
        </header>

        {/* The body handles its own overflow so the header and actions stay put. */}
        <div className={cn('min-h-0 flex-1', bodyClassName)}>{children}</div>

        {footer && (
          <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-hairline bg-surface-sunken px-6 py-3.5">
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}
