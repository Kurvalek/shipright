import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'

export function Modal({
  open,
  onClose,
  title,
  eyebrow,
  footer,
  children,
  width = 'max-w-2xl',
}: {
  open: boolean
  onClose: () => void
  title: string
  eyebrow?: ReactNode
  footer?: ReactNode
  children: ReactNode
  width?: string
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
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-6 sm:p-10">
      <div
        className="fixed inset-0 bg-ink/25 backdrop-blur-[1px] motion-safe:animate-[fade_120ms_ease-out]"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          'relative my-auto w-full rounded-card border border-hairline bg-surface shadow-xl outline-none',
          'motion-safe:animate-[rise_140ms_ease-out]',
          width,
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-hairline px-6 py-4">
          <div className="min-w-0">
            <h2 className="display text-[22px] leading-tight text-ink">{title}</h2>
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

        <div className="px-6 py-5">{children}</div>

        {footer && (
          <footer className="flex items-center justify-end gap-2 border-t border-hairline bg-surface-sunken px-6 py-3.5">
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}
