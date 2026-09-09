import { useEffect, useRef, useState } from 'react'
import { Bookmark, Check, X } from 'lucide-react'
import { LANES } from '@/lib/derive'
import type { SavedView } from '@/lib/types'
import { cn } from '@/lib/cn'

/* A stage plus a filter combination, kept under a name. This is the fix for
   re-applying "New + Rush" twenty times a day: it becomes one chip, and it is
   still there tomorrow morning. */
export function SavedViews({
  views,
  activeId,
  canSave,
  onApply,
  onSave,
  onDelete,
}: {
  views: SavedView[]
  activeId: string | null
  /** False when the current filters exactly match a view that already exists. */
  canSave: boolean
  onApply: (view: SavedView) => void
  onSave: (name: string) => void
  onDelete: (id: string) => void
}) {
  const [naming, setNaming] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (naming) inputRef.current?.focus()
  }, [naming])

  function commit() {
    const name = draft.trim()
    if (name) onSave(name)
    setDraft('')
    setNaming(false)
  }

  if (views.length === 0 && !canSave && !naming) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5 pb-4">
      <span className="label-micro pr-0.5 text-ink-muted">Saved</span>

      {views.map((view) => {
        const isActive = view.id === activeId
        const stage = LANES.find((lane) => lane.id === view.lane)

        return (
          <span
            key={view.id}
            className={cn(
              'group inline-flex items-center rounded-full text-[12.5px] transition-colors',
              isActive
                ? 'bg-brand/10 text-brand ring-1 ring-brand/25'
                : 'text-ink-secondary ring-1 ring-hairline hover:bg-surface hover:text-ink',
            )}
          >
            <button
              onClick={() => onApply(view)}
              title={stage ? `${stage.label} · saved filters` : undefined}
              className="py-1 pl-2.5 pr-1.5"
            >
              {view.name}
            </button>
            <button
              onClick={() => onDelete(view.id)}
              aria-label={`Delete saved view ${view.name}`}
              className={cn(
                'mr-1 grid h-4 w-4 place-items-center rounded-full opacity-0 transition-opacity',
                'hover:bg-black/5 focus-visible:opacity-100 group-hover:opacity-60',
              )}
            >
              <X size={11} />
            </button>
          </span>
        )
      })}

      {naming ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-surface py-0.5 pl-2.5 pr-0.5 ring-1 ring-brand/25">
          <input
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commit()
              if (event.key === 'Escape') {
                setDraft('')
                setNaming(false)
              }
            }}
            placeholder="Name this view"
            className="w-32 bg-transparent py-1 text-[12.5px] text-ink outline-none placeholder:text-ink-muted"
          />
          <button
            onClick={commit}
            aria-label="Save view"
            className="grid h-5 w-5 place-items-center rounded-full text-brand hover:bg-brand/10"
          >
            <Check size={12} />
          </button>
        </span>
      ) : (
        canSave && (
          <button
            onClick={() => setNaming(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-hairline py-1 px-2.5 text-[12.5px] text-ink-secondary transition-colors hover:border-brand/30 hover:text-brand"
          >
            <Bookmark size={11} />
            Save this view
          </button>
        )
      )}
    </div>
  )
}
