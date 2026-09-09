import { Check } from 'lucide-react'
import { ORDER_FLOW, STATUS_META } from '@/lib/derive'
import type { OrderStatus } from '@/lib/types'
import { cn } from '@/lib/cn'

/* Primarily a read: where the order sits in the flow. The next step has its own
   named button above, so the steps here are for jumping to any stage —
   including backwards, to undo a move made too early — which a single
   forward-only action cannot express. */
export function StatusTimeline({
  status,
  onChange,
}: {
  status: OrderStatus
  onChange: (next: OrderStatus) => void
}) {
  const currentIndex = ORDER_FLOW.indexOf(status)

  return (
    <ol className="flex items-center">
      {ORDER_FLOW.map((step, i) => {
        const isDone = i < currentIndex
        const isCurrent = i === currentIndex

        return (
          <li key={step} className={cn('flex items-center', i < ORDER_FLOW.length - 1 && 'flex-1')}>
            <button
              type="button"
              onClick={() => onChange(step)}
              disabled={isCurrent}
              aria-current={isCurrent ? 'step' : undefined}
              title={isCurrent ? undefined : `Move to ${STATUS_META[step].label}`}
              className="group flex shrink-0 flex-col items-center gap-1.5 disabled:cursor-default"
            >
              <span
                className={cn(
                  'grid size-6 place-items-center rounded-full border text-[11px] font-medium transition-colors',
                  isCurrent && 'border-brand bg-brand text-white',
                  isDone && 'border-brand-tint-border bg-brand-tint text-brand',
                  !isCurrent && !isDone && 'border-hairline bg-surface text-ink-muted group-hover:border-ink-muted',
                )}
              >
                {isDone ? <Check size={12} strokeWidth={3} /> : i + 1}
              </span>
              <span
                className={cn(
                  'text-[11px] whitespace-nowrap transition-colors',
                  isCurrent ? 'font-medium text-ink' : 'text-ink-secondary group-hover:text-ink',
                )}
              >
                {STATUS_META[step].label}
              </span>
            </button>

            {i < ORDER_FLOW.length - 1 && (
              <span
                className={cn(
                  '-mt-4 mx-2 h-px flex-1',
                  i < currentIndex ? 'bg-brand-tint-border' : 'bg-hairline',
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
