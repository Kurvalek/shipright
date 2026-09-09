import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

export const PANE_DOCK_ID = 'pane-dock'

/* Anything docked to the bottom edge of the white content pane. It has to sit
   outside the pane's scroll container to stay put regardless of how far the
   list has scrolled, but inside its rounded corners so it reads as part of the
   page rather than something floating over it. */
export function PaneDock({ children }: { children: ReactNode }) {
  const [node, setNode] = useState<HTMLElement | null>(null)

  // The dock is rendered by AppShell, so it only exists after the first paint.
  useEffect(() => setNode(document.getElementById(PANE_DOCK_ID)), [])

  if (!node) return null
  return createPortal(children, node)
}
