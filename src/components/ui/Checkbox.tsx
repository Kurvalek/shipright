import { Check, Minus } from 'lucide-react'
import { cn } from '@/lib/cn'

export function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  label,
  className,
}: {
  checked: boolean
  indeterminate?: boolean
  onChange: (next: boolean) => void
  label: string
  className?: string
}) {
  const active = checked || indeterminate

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation()
        onChange(!checked)
      }}
      className={cn(
        'grid size-4 shrink-0 place-items-center rounded-[4px] border transition-colors',
        active
          ? 'border-brand bg-brand text-white'
          : 'border-hairline bg-surface hover:border-ink-muted',
        className,
      )}
    >
      {indeterminate ? (
        <Minus size={11} strokeWidth={3} />
      ) : checked ? (
        <Check size={11} strokeWidth={3} />
      ) : null}
    </button>
  )
}
