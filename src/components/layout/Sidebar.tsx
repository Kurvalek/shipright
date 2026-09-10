import { NavLink } from 'react-router-dom'
import {
  ClipboardList,
  ChevronsUpDown,
  PanelLeftClose,
  PanelLeftOpen,
  Package,
  Settings as SettingsIcon,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { useShell } from '@/lib/shell'
import { cn } from '@/lib/cn'

const nav = [
  { to: '/orders', label: 'Orders', icon: ClipboardList },
  { to: '/inventory', label: 'Inventory', icon: Package },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

/* Sits directly on the shell with no fill or divider of its own. The content
   pane's edge is the only line needed to separate the two.

   Folds down to a rail of icons when the page needs the room — the three
   destinations are few enough and distinct enough that the icons carry them
   on their own once you have seen the words. */
export function Sidebar() {
  const { account } = useStore()
  const { sidebarCollapsed: collapsed, toggleSidebar } = useShell()

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col pb-3 pl-3 transition-[width] duration-200 ease-out',
        collapsed ? 'w-[4.25rem]' : 'w-60',
      )}
    >
      <div className={cn('mb-4 flex items-center gap-1', collapsed && 'flex-col gap-1.5')}>
        <button
          type="button"
          title={account.companyName}
          className={cn(
            'flex min-w-0 items-center gap-2.5 rounded-lg text-left transition-colors hover:bg-black/[0.035]',
            collapsed ? 'p-1.5' : 'flex-1 px-2 py-2',
          )}
        >
          <span className="grid size-7 shrink-0 place-items-center rounded-md bg-mauve text-[11px] font-semibold text-brand">
            {account.companyName.slice(0, 2).toUpperCase()}
          </span>
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">
                {account.companyName}
              </span>
              <ChevronsUpDown size={13} className="shrink-0 text-ink-muted" />
            </>
          )}
        </button>

        <button
          type="button"
          onClick={toggleSidebar}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          className="grid size-8 shrink-0 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-black/[0.035] hover:text-ink"
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      <nav className="flex flex-col gap-0.5">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-lg text-[13px] transition-colors',
                collapsed ? 'size-10 justify-center self-center' : 'px-2.5 py-[7px]',
                isActive
                  ? 'bg-mauve font-medium text-brand'
                  : 'text-ink-secondary hover:bg-black/[0.035] hover:text-ink',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={collapsed ? 18 : 16}
                  className={isActive ? 'text-brand' : 'text-ink-muted'}
                />
                {!collapsed && label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
