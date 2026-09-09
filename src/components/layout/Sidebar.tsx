import { NavLink } from 'react-router-dom'
import { ClipboardList, LogOut, Package, Settings as SettingsIcon } from 'lucide-react'
import { Logo } from './Logo'
import { Avatar } from '@/components/ui/Avatar'
import { currentUser } from '@/lib/mockData'
import { cn } from '@/lib/cn'

const nav = [
  { to: '/orders', label: 'Orders', icon: ClipboardList },
  { to: '/inventory', label: 'Inventory', icon: Package },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

export function Sidebar() {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-hairline bg-sidebar">
      <div className="px-5 py-[18px]">
        <Logo />
      </div>

      <nav className="flex flex-col gap-0.5 px-3">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] transition-colors',
                isActive
                  ? 'bg-surface font-medium text-ink shadow-xs ring-1 ring-hairline'
                  : 'text-ink-secondary hover:bg-black/[0.035] hover:text-ink',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={16} className={isActive ? 'text-ink' : 'text-ink-muted'} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-hairline p-3">
        <div className="flex items-center gap-2.5 px-1.5 py-1">
          <Avatar name={currentUser.name} size="md" className="bg-white ring-1 ring-hairline" />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-ink">{currentUser.name}</p>
            <p className="text-[11px] text-ink-muted capitalize">{currentUser.role}</p>
          </div>
        </div>
        <button
          type="button"
          className="mt-1 flex w-full items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] text-ink-secondary transition-colors hover:bg-black/[0.035] hover:text-ink"
        >
          <LogOut size={16} className="text-ink-muted" />
          Log out
        </button>
      </div>
    </aside>
  )
}
