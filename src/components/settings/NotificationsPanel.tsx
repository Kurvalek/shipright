import { AlertTriangle, Bell, Mail, Package } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Toggle } from '@/components/ui/Toggle'
import { useStore } from '@/lib/store'
import type { NotificationSettings } from '@/lib/types'

const rows: Array<{
  key: keyof NotificationSettings
  icon: LucideIcon
  title: string
  body: string
}> = [
  {
    key: 'email',
    icon: Mail,
    title: 'Email notifications',
    body: 'Receive a daily digest and any urgent alerts by email',
  },
  {
    key: 'lowStock',
    icon: AlertTriangle,
    title: 'Low stock alerts',
    body: 'Get notified the moment a SKU reaches its reorder point',
  },
  {
    key: 'orderUpdates',
    icon: Package,
    title: 'Order updates',
    body: 'Notifications when an order changes status or is reassigned',
  },
  {
    key: 'systemAlerts',
    icon: Bell,
    title: 'System alerts',
    body: 'Maintenance windows, outages and release notes',
  },
]

export function NotificationsPanel() {
  const { notifications, setNotifications } = useStore()

  return (
    <Card>
      <CardHeader
        title="Notification preferences"
        actions={<Button size="sm" variant="primary">Save preferences</Button>}
      />
      <CardBody className="p-0">
        <p className="border-b border-hairline-subtle px-5 py-4 text-[13px] text-ink-secondary">
          Manage how and when you hear about warehouse activity.
        </p>

        <ul>
          {rows.map(({ key, icon: Icon, title, body }) => (
            <li
              key={key}
              className="flex items-center justify-between gap-6 border-b border-hairline-subtle px-5 py-4 last:border-0"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md bg-neutral-fill text-ink-secondary">
                  <Icon size={14} />
                </span>
                <div>
                  <p className="text-[13px] font-medium text-ink">{title}</p>
                  <p className="text-[12px] text-ink-secondary">{body}</p>
                </div>
              </div>
              <Toggle
                checked={notifications[key]}
                onChange={(next) => setNotifications({ [key]: next })}
                label={title}
              />
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  )
}
