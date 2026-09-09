import { useCallback, useEffect, useState } from 'react'

/* View state is the one thing that survives a reload. Order data is mock and
   resets by design, but re-picking your lane and re-typing your filters on
   every refresh is exactly the friction this redesign is meant to remove. */
export function usePersistentState<T>(key: string, fallback: T) {
  const storageKey = `shipright:${key}`

  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(storageKey)
      return raw === null ? fallback : (JSON.parse(raw) as T)
    } catch {
      return fallback
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(value))
    } catch {
      // Private browsing or a full quota. Losing the preference is acceptable.
    }
  }, [storageKey, value])

  const reset = useCallback(() => setValue(fallback), [fallback])

  return [value, setValue, reset] as const
}
