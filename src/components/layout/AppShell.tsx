import type { ReactNode } from 'react'
import { PANE_DOCK_ID } from './PaneDock'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { TopBarSearchProvider } from '@/lib/topbarSearch'
import { ShellProvider, useShell } from '@/lib/shell'
import { cn } from '@/lib/cn'

/* The warm shell runs edge to edge and carries the top bar and the sidebar.
   The page itself floats on top of it as a single white pane, so chrome and
   content are told apart by depth rather than by another border. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ShellProvider>
      <TopBarSearchProvider>
        <ShellLayout>{children}</ShellLayout>
      </TopBarSearchProvider>
    </ShellProvider>
  )
}

function ShellLayout({ children }: { children: ReactNode }) {
  const { dockOpen, handheld, setDockHost } = useShell()

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-canvas">
      <TopBar />

      <div className="flex min-h-0 flex-1">
        {/* Gone entirely on a handheld, not folded: the top bar carries the
            three destinations in a menu there. */}
        {!handheld && <Sidebar />}

        {/* An even canvas gutter on all four sides, so the pane floats clear
            of the sidebar and the top bar rather than butting into them. */}
        <main className={cn('min-w-0 flex-1', handheld ? 'p-2 pt-0' : 'p-3')}>
          <div className="relative h-full">
            <div className="shadow-pane h-full overflow-y-auto rounded-shell bg-surface ring-1 ring-hairline/70">
              {/* The room won back from the rail belongs to the table, not to
                  the margins either side of it. */}
              <div className="mx-auto max-w-[1400px] px-4 py-5 md:px-8 md:py-7">{children}</div>
            </div>

            {/* Outside the scroll container so docked bars stay put. It must
                not clip: a docked bar sits at the very bottom, so its menus
                open upward and out of this box. Anything full-bleed in here
                rounds its own bottom corners to match the pane instead. */}
            <div
              id={PANE_DOCK_ID}
              className="pointer-events-none absolute inset-x-0 bottom-0 z-30"
            />
          </div>
        </main>

        {/* A second pane rather than a sheet over the first, so a record and
            the list it came from are legible at the same time. It is full
            height on purpose: its contents are sized to fit that height, which
            is what lets the whole record be read without scrolling. */}
        <aside
          aria-hidden={!dockOpen}
          className={cn(
            'shrink-0 overflow-hidden py-3 transition-[width,padding] duration-200 ease-out',
            dockOpen ? 'w-[25.25rem] pr-3' : 'w-0',
          )}
        >
          <div ref={setDockHost} className="h-full w-[24.5rem]" />
        </aside>
      </div>
    </div>
  )
}
