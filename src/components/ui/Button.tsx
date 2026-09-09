import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  iconRight?: ReactNode
}

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-hover active:bg-brand-press shadow-xs',
  secondary:
    'bg-surface text-ink ring-1 ring-hairline hover:bg-surface-sunken active:bg-neutral-fill shadow-xs',
  ghost: 'text-ink-secondary hover:bg-neutral-fill hover:text-ink',
  danger: 'text-danger-text hover:bg-danger-fill',
}

const sizes: Record<Size, string> = {
  sm: 'h-7 gap-1.5 px-2.5 text-[12px]',
  md: 'h-9 gap-2 px-3.5 text-[13px]',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  iconRight,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md font-medium whitespace-nowrap transition-colors',
        'disabled:pointer-events-none disabled:opacity-40',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
      {iconRight}
    </button>
  )
}
