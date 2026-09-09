import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

/* Search lives in the top bar rather than inside each page, so there is one
   place to look for it. Pages lend the field their own state instead of the
   shell trying to guess what "search" means on any given screen. */
export interface SearchSlot {
  value: string
  onChange: (value: string) => void
  placeholder: string
}

const SearchSlotContext = createContext<{
  slot: SearchSlot | null
  register: (slot: SearchSlot | null) => void
} | null>(null)

export function TopBarSearchProvider({ children }: { children: ReactNode }) {
  const [slot, register] = useState<SearchSlot | null>(null)
  const value = useMemo(() => ({ slot, register }), [slot])

  return <SearchSlotContext.Provider value={value}>{children}</SearchSlotContext.Provider>
}

/** Read by the top bar. Null when the current page has no searchable content. */
export function useSearchSlot(): SearchSlot | null {
  return useContext(SearchSlotContext)?.slot ?? null
}

/** Called by a page to put its search state into the top bar for as long as it is mounted. */
export function useTopBarSearch(value: string, onChange: (next: string) => void, placeholder: string) {
  const context = useContext(SearchSlotContext)
  const register = context?.register

  useEffect(() => {
    if (!register) return
    register({ value, onChange, placeholder })
    return () => register(null)
  }, [register, value, onChange, placeholder])
}
