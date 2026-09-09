import { initials } from '@/lib/derive'
import { cn } from '@/lib/cn'

export function Avatar({
  name,
  size = 'sm',
  className,
}: {
  name: string
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid shrink-0 place-items-center rounded-full bg-neutral-fill font-medium text-ink-secondary',
        size === 'sm' ? 'size-6 text-[10px]' : 'size-8 text-[11px]',
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}
