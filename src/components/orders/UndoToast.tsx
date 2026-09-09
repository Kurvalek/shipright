import { useEffect } from 'react'
import { Undo2, X } from 'lucide-react'

/* Moving 84 orders in one click is only comfortable if it is reversible. The
   toast reports what happened in the worker's own terms and holds the undo
   open long enough to notice a mistake. */
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
    <div className="pointer-events-none fixed bottom-6 left-60 z-50 flex w-[calc(100%-15rem)] justify-center px-8">
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-auto flex items-center gap-3 rounded-full bg-ink py-2 pr-2 pl-4 shadow-lg motion-safe:animate-[lift_160ms_ease-out]"
      >
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
