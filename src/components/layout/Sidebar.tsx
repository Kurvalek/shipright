import { NavLink } from 'react-router-dom'
import { ClipboardList, ChevronsUpDown, Package, Settings as SettingsIcon } from 'lucide-react'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/cn'

const nav = [
  { to: '/orders', label: 'Orders', icon: ClipboardList },
  { to: '/inventory', label: 'Inventory', icon: Package },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

/* Sits directly on the shell with no fill or divider of its own. The content
   pane's edge is the only line needed to separate the two. */
export function Sidebar() {
  const { account } = useStore()

  return (
    <aside className="flex w-60 shrink-0 flex-col pb-3 pl-3">
      <button
        type="button"
        className="mb-4 flex items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-black/[0.035]"
      >
        <span className="grid size-7 shrink-0 place-items-center rounded-md bg-mauve text-[11px] font-semibold text-brand">
          {account.companyName.slice(0, 2).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">
          {account.companyName}
        </span>
        <ChevronsUpDown size={13} className="shrink-0 text-ink-muted" />
      </button>

      <nav className="flex flex-col gap-0.5">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] transition-colors',
                isActive
                  ? 'bg-mauve font-medium text-brand'
                  : 'text-ink-secondary hover:bg-black/[0.035] hover:text-ink',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={16} className={isActive ? 'text-brand' : 'text-ink-muted'} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
