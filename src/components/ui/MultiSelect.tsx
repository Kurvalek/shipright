import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface MultiSelectOption {
  value: string
  label: string
  /** Sits at the end of the row, in muted type: a code, a count, a role. */
  hint?: ReactNode
}

/* A native select can hold one value, and its multiple form is a scrolling box
   that asks the reader to hold ctrl. Filters are the one place on this page
   where "New or In progress" is an ordinary thing to want, so they get a list
   of checkboxes behind a trigger instead.

   The list is a listbox with a roving active option rather than a stack of
   focusable buttons: focus stays on the list, arrow keys move a highlight, and
   space toggles without closing. Closing on every pick is what makes the
   multiple form of the native control so tiring, and it is the one behaviour a
   filter list must not copy. */
export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder,
  label,
  className,
}: {
  options: MultiSelectOption[]
  selected: string[]
  onChange: (next: string[]) => void
  /** Shown, in muted type, while nothing is chosen — "All statuses". */
  placeholder: string
  /** Names the control for screen readers, since there is no visible label. */
  label: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  useEffect(() => {
    if (!open) return

    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  // Opening moves focus into the list, so the keyboard and the pointer end up
  // in the same place; closing hands it back to the trigger that was pressed.
  useEffect(() => {
    if (open) listRef.current?.focus()
  }, [open])

  const close = () => {
    setOpen(false)
    triggerRef.current?.focus()
  }

  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((held) => held !== value) : [...selected, value])
  }

  const chosen = options.filter((option) => selected.includes(option.value))

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' || e.key === 'Tab') {
      close()
      return
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActive((current) => Math.min(options.length - 1, Math.max(0, current + step)))
      return
    }
    if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault()
      setActive(e.key === 'Home' ? 0 : options.length - 1)
      return
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const option = options[active]
      if (option) toggle(option.value)
    }
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => setOpen((previous) => !previous)}
        className={cn(
          'flex h-9 w-full items-center gap-1.5 rounded-md bg-surface px-3 text-[13px] transition-colors',
          'ring-1 ring-hairline hover:ring-ink-muted/50 focus:ring-brand focus:outline-none',
          open && 'ring-brand',
          chosen.length > 0 ? 'text-ink' : 'text-ink-muted',
        )}
      >
        <span className="truncate">{chosen[0]?.label ?? placeholder}</span>

        {/* The first pick stays legible and the rest are counted. A trigger
            that lists everything chosen either truncates mid-word or sets the
            width of the row it is in. */}
        {chosen.length > 1 && (
          <span className="tnum shrink-0 rounded bg-neutral-fill px-1 text-[11.5px] font-medium text-ink-secondary">
            +{chosen.length - 1}
          </span>
        )}

        <ChevronDown
          size={14}
          className={cn('ml-auto shrink-0 text-ink-muted transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          aria-multiselectable
          aria-label={label}
          aria-activedescendant={options[active] ? `${listId}-${active}` : undefined}
          tabIndex={-1}
          onKeyDown={onKeyDown}
          className={cn(
            'absolute left-0 z-40 mt-1.5 max-h-72 w-max max-w-[18rem] min-w-full overflow-y-auto',
            'rounded-lg border border-hairline bg-surface py-1 shadow-lg focus:outline-none',
            // Hangs off the trigger above it, so it drops rather than rises.
            'motion-safe:animate-[descend_100ms_ease-out]',
          )}
        >
          {options.map((option, index) => {
            const isSelected = selected.includes(option.value)

            return (
              <div
                key={option.value}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={isSelected}
                onClick={() => toggle(option.value)}
                onMouseEnter={() => setActive(index)}
                className={cn(
                  'flex cursor-pointer items-center gap-2.5 px-3 py-1.5 text-[13px] text-ink',
                  index === active && 'bg-neutral-fill',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'grid size-4 shrink-0 place-items-center rounded-[4px] border transition-colors',
                    isSelected ? 'border-brand bg-brand text-white' : 'border-hairline bg-surface',
                  )}
                >
                  {isSelected && <Check size={11} strokeWidth={3} />}
                </span>

                <span className="truncate">{option.label}</span>
                {option.hint !== undefined && (
                  <span className="ml-auto shrink-0 pl-2 text-[12px] text-ink-muted">
                    {option.hint}
                  </span>
                )}
              </div>
            )
          })}

          {/* Unpicking six statuses one at a time to get back to "all" is the
              cost of letting someone pick six in the first place. */}
          {selected.length > 0 && (
            <div className="mt-1 border-t border-hairline pt-1">
              <button
                type="button"
                onClick={() => onChange([])}
                className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[13px] text-ink-secondary transition-colors hover:bg-neutral-fill hover:text-ink"
              >
                <X size={13} className="ml-0.5" />
                Clear {label.toLowerCase()}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
