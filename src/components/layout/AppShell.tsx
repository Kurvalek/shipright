import type { ReactNode } from 'react'
import { PANE_DOCK_ID } from './PaneDock'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { TopBarSearchProvider } from '@/lib/topbarSearch'

/* The warm shell runs edge to edge and carries the top bar and the sidebar.
   The page itself floats on top of it as a single white pane, so chrome and
   content are told apart by depth rather than by another border. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <TopBarSearchProvider>
      <div className="flex h-dvh flex-col overflow-hidden bg-canvas">
        <TopBar />

        <div className="flex min-h-0 flex-1">
          <Sidebar />

          {/* An even canvas gutter on all four sides, so the pane floats clear
              of the sidebar and the top bar rather than butting into them. */}
          <main className="min-w-0 flex-1 p-3">
            <div className="relative h-full">
              <div className="shadow-pane h-full overflow-y-auto rounded-shell bg-surface ring-1 ring-hairline/70">
                <div className="mx-auto max-w-[1400px] px-8 py-7">{children}</div>
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
        </div>
      </div>
    </TopBarSearchProvider>
  )
}
