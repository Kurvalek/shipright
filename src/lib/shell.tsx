import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { usePersistentState } from './usePersistentState'
import { useMediaQuery } from './useMediaQuery'

/* The two pieces of chrome that have to negotiate over the same horizontal
   room: the nav rail on the left and the detail column on the right. A page
   opens the detail column, and the rail gets out of its way, so the list keeps
   its columns instead of being squeezed from both ends. */
interface ShellState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  /** No room alongside the page for standing chrome. The rail becomes a menu. */
  handheld: boolean
  /** The element the detail column renders into, once the shell has painted. */
  dockHost: HTMLElement | null
  setDockHost: (element: HTMLElement | null) => void
  dockOpen: boolean
  setDockOpen: (open: boolean) => void
}

const ShellContext = createContext<ShellState | null>(null)

export function ShellProvider({ children }: { children: ReactNode }) {
  /* What the reader chose with nothing competing for the room. Folding the
     rail to make way for the detail column is not a choice they made, so it
     never overwrites this — otherwise closing the record, or reloading with one
     open, would leave the rail folded with no explanation. */
  const [preference, setPreference] = usePersistentState('shell.sidebarCollapsed', false)

  /* A deliberate override of whatever the current arrangement implies, for as
     long as that arrangement lasts. Cleared whenever the detail column opens or
     closes, since that is a new arrangement to have an opinion about. */
  const [override, setOverride] = useState<boolean | null>(null)

  const [dockHost, setDockHost] = useState<HTMLElement | null>(null)
  const [dockOpen, setDockOpen] = useState(false)

  useEffect(() => setOverride(null), [dockOpen])

  /* Below this the rail cannot be afforded at any width. Even folded to icons
     it takes a tenth of the screen to say three words that are one tap away in
     a menu, and the page it is standing beside is a table. */
  const handheld = useMediaQuery('(max-width: 767px)')

  const collapsed = override ?? (dockOpen || preference)

  const toggleSidebar = useCallback(() => {
    const next = !collapsed
    if (dockOpen) setOverride(next)
    else {
      setOverride(null)
      setPreference(next)
    }
  }, [collapsed, dockOpen, setPreference])

  const value = useMemo(
    () => ({
      sidebarCollapsed: collapsed,
      toggleSidebar,
      handheld,
      dockHost,
      setDockHost,
      dockOpen,
      setDockOpen,
    }),
    [collapsed, toggleSidebar, handheld, dockHost, dockOpen],
  )

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>
}

export function useShell(): ShellState {
  const context = useContext(ShellContext)
  if (!context) throw new Error('useShell must be used inside ShellProvider')
  return context
}

/** Puts `children` in the shell's right-hand column for as long as it is mounted. */
export function DetailDock({ children }: { children: ReactNode }) {
  const { dockHost, setDockOpen } = useShell()

  useEffect(() => {
    setDockOpen(true)
    return () => setDockOpen(false)
  }, [setDockOpen])

  if (!dockHost) return null
  return createPortal(children, dockHost)
}
