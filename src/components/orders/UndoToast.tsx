import { useEffect } from 'react'
import { Check, Undo2, X } from 'lucide-react'

/* Moving 84 orders in one click is only comfortable if it is reversible. The
   toast reports what happened in the worker's own terms and holds the undo
   open long enough to notice a mistake.

   It answers every move now, not only the ones made from the selection bar. A
   single order changing stage used to happen in silence, which left the two
   most common controls on the page — the square on a row and the button in the
   pane — with nothing to show for a press but a row disappearing. */
export function UndoToast({
  message,
  onUndo,
  onDismiss,
  timeoutMs = 8000,
}: {
  message: string | null
  onUndo: () => void
  onDismiss: () => void
  timeoutMs?: number
}) {
  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(onDismiss, timeoutMs)
    return () => window.clearTimeout(timer)
  }, [message, onDismiss, timeoutMs])

  if (!message) return null

  return (
    <div className="flex justify-center px-8 pb-5">
      <div
        key={message}
        role="status"
        aria-live="polite"
        className="pointer-events-auto flex items-center gap-2.5 rounded-full bg-ink py-2 pr-2 pl-2.5 shadow-lg motion-safe:animate-[lift_160ms_ease-out]"
      >
        {/* The tick is the point of the thing. Without it the toast reads as a
            notice that something happened to your orders; with it, it reads as
            the job being done. */}
        <span
          aria-hidden
          className="grid size-5 shrink-0 place-items-center rounded-full bg-brand text-white motion-safe:animate-[pop_260ms_cubic-bezier(0.34,1.56,0.64,1)]"
        >
          <Check size={12} strokeWidth={3} />
        </span>

        <p className="text-[13px] whitespace-nowrap text-white">{message}</p>

        <button
          onClick={onUndo}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[12.5px] font-medium text-white transition-colors hover:bg-white/20"
        >
          <Undo2 size={12} />
          Undo
        </button>

        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="grid size-6 place-items-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
