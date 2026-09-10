import { useEffect, useState } from 'react'

/* Some layout decisions cannot be made in CSS alone: docking the order detail
   beside the list and floating it over the list are two different component
   trees, not two sets of classes on one. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const list = window.matchMedia(query)
    const onChange = () => setMatches(list.matches)

    onChange()
    list.addEventListener('change', onChange)
    return () => list.removeEventListener('change', onChange)
  }, [query])

  return matches
}
