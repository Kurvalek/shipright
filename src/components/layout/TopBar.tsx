import { LogOut, Search, Settings as SettingsIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Logo } from './Logo'
import { Avatar } from '@/components/ui/Avatar'
import { Menu } from '@/components/ui/Menu'
import { useSearchSlot } from '@/lib/topbarSearch'
import { useShell } from '@/lib/shell'
import { currentUser } from '@/lib/mockData'
import { cn } from '@/lib/cn'

/* Sits on the warm shell above the content pane, so the page below reads as a
   sheet of paper on a desk rather than another panel in a grid. */
export function TopBar() {
  const slot = useSearchSlot()
  const navigate = useNavigate()
  const { sidebarCollapsed: collapsed } = useShell()

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 pr-4 pl-[22px]">
      {/* Matches the sidebar column so the mark sits over the nav, and follows
          it down to the rail width when it folds. */}
      <div
        className={cn(
          'flex shrink-0 items-center transition-[width] duration-200 ease-out',
          collapsed ? 'w-[2.875rem]' : 'w-[13.625rem]',
        )}
      >
        <Logo compact={collapsed} />
      </div>

      <div className="flex min-w-0 flex-1 justify-center">
        {slot && (
          <div className="relative w-full max-w-md">
            <Search
              size={14}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted"
            />
            <input
              value={slot.value}
              onChange={(event) => slot.onChange(event.target.value)}
              placeholder={slot.placeholder}
              aria-label={slot.placeholder}
              className="h-8 w-full rounded-full bg-surface/70 pr-3 pl-9 text-[13px] ring-1 ring-hairline transition-colors placeholder:text-ink-muted hover:bg-surface focus:bg-surface focus:ring-brand focus:outline-none"
            />
          </div>
        )}
      </div>

      <Menu
        align="right"
        header={currentUser.email}
        items={[
          {
            label: 'Settings',
            icon: <SettingsIcon size={14} />,
            onSelect: () => navigate('/settings'),
          },
          { label: 'Log out', icon: <LogOut size={14} />, onSelect: () => {} },
        ]}
        trigger={({ toggle }) => (
          <button
            onClick={toggle}
            className="flex shrink-0 items-center gap-2 rounded-full py-1 pr-2.5 pl-1 transition-colors hover:bg-black/[0.04]"
          >
            <Avatar name={currentUser.name} size="md" className="bg-white ring-1 ring-hairline" />
            <span className="hidden text-[13px] text-ink sm:block">{currentUser.name}</span>
          </button>
        )}
      />
    </header>
  )
}
