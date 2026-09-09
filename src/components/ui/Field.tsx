import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'

const control =
  'w-full rounded-md bg-surface px-3 text-[13px] text-ink ring-1 ring-hairline transition-colors placeholder:text-ink-muted hover:ring-ink-muted/50 focus:ring-brand focus:outline-none disabled:bg-surface-sunken disabled:text-ink-secondary'

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="label-micro mb-1.5 block">
      {children}
    </label>
  )
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, 'h-9', className)} {...rest} />
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, 'resize-none py-2 leading-relaxed', className)} {...rest} />
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Rendered in muted type until a real value is chosen, like a placeholder. */
  placeholder?: string
}

export function Select({ className, placeholder, children, value, ...rest }: SelectProps) {
  const isPlaceheld = placeholder !== undefined && (value === '' || value === undefined)

  return (
    <div className="relative">
      <select
        value={value}
        className={cn(
          control,
          'h-9 cursor-pointer appearance-none pr-8',
          isPlaceheld && 'text-ink-muted',
          className,
        )}
        {...rest}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {children}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-ink-muted"
      />
    </div>
  )
}

/** A read-only value presented as a labelled fact rather than a dead input. */
export function ReadOnlyField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      <p className="text-[13px] text-ink">{value}</p>
    </div>
  )
}
