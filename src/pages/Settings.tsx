import { Bell, Building2, MapPin, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { AccountPanel } from '@/components/settings/AccountPanel'
import { UsersPanel } from '@/components/settings/UsersPanel'
import { WarehousePanel } from '@/components/settings/WarehousePanel'
import { NotificationsPanel } from '@/components/settings/NotificationsPanel'
import { usePersistentState } from '@/lib/usePersistentState'
import { cn } from '@/lib/cn'

type TabId = 'account' | 'users' | 'warehouse' | 'notifications'

const tabs: Array<{ id: TabId; label: string; icon: LucideIcon }> = [
  { id: 'account', label: 'Account', icon: Building2 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'warehouse', label: 'Warehouse', icon: MapPin },
  { id: 'notifications', label: 'Notifications', icon: Bell },
]

export default function Settings() {
  const [tab, setTab] = usePersistentState<TabId>('settings.tab', 'account')

  return (
    <>
      <PageHeader title="Settings" meta={<span>Workspace and warehouse configuration</span>} />

      <div role="tablist" aria-label="Settings sections" className="mb-6 flex gap-6 border-b border-hairline">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = id === tab
          return (
            <button
              key={id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setTab(id)}
              className={cn(
                '-mb-px flex items-center gap-2 border-b-2 pb-2.5 text-[13px] transition-colors',
                isActive
                  ? 'border-ink font-medium text-ink'
                  : 'border-transparent text-ink-secondary hover:border-hairline hover:text-ink',
              )}
            >
              <Icon size={14} className={isActive ? 'text-ink' : 'text-ink-muted'} />
              {label}
            </button>
          )
        })}
      </div>

      {tab === 'account' && <AccountPanel />}
      {tab === 'users' && <UsersPanel />}
      {tab === 'warehouse' && <WarehousePanel />}
      {tab === 'notifications' && <NotificationsPanel />}
    </>
  )
}
