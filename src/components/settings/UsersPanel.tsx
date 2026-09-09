import { Info, UserPlus } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Pill } from '@/components/ui/Pill'
import { useStore } from '@/lib/store'
import type { Role } from '@/lib/types'
import { cn } from '@/lib/cn'

const roleMeta: Record<Role, { label: string; className: string; can: string }> = {
  admin: {
    label: 'Admin',
    className: 'bg-brand-tint text-brand',
    can: 'Full system access, can manage users and settings',
  },
  manager: {
    label: 'Manager',
    className: 'bg-progress-fill text-progress-text',
    can: 'Can view all orders, manage inventory and assign workers',
  },
  worker: {
    label: 'Worker',
    className: 'bg-neutral-fill text-neutral-text',
    can: 'Can view assigned orders and update order status',
  },
}

export function UsersPanel() {
  const { users, orders, removeUser } = useStore()

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Team members"
          actions={
            <Button size="sm" variant="primary" icon={<UserPlus size={13} />}>
              Invite user
            </Button>
          }
        />
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-hairline bg-surface">
              <th className="label-text py-2.5 pr-4 pl-5 text-left">Name</th>
              <th className="label-text py-2.5 pr-4 text-left">Email</th>
              <th className="label-text py-2.5 pr-4 text-left">Role</th>
              <th className="label-text py-2.5 pr-4 text-right">Open orders</th>
              <th className="label-text py-2.5 pr-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              // A worker's live load is more useful here than a bare row.
              const openOrders = orders.filter(
                (order) =>
                  order.assigneeId === user.id &&
                  order.status !== 'shipped' &&
                  order.status !== 'completed',
              ).length

              return (
                <tr
                  key={user.id}
                  className="group border-b border-hairline-subtle transition-colors last:border-0 hover:bg-surface-sunken"
                >
                  <td className="py-3 pr-4 pl-5">
                    <span className="flex items-center gap-2.5">
                      <Avatar name={user.name} />
                      <span className="text-[13px] font-medium text-ink">{user.name}</span>
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-[13px] text-ink-secondary">{user.email}</td>
                  <td className="py-3 pr-4">
                    <Pill className={roleMeta[user.role].className}>
                      {roleMeta[user.role].label}
                    </Pill>
                  </td>
                  <td className="tnum py-3 pr-4 text-right text-[13px] text-ink-secondary">
                    {openOrders || <span className="text-ink-muted">—</span>}
                  </td>
                  <td className="py-2 pr-5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                      <Button size="sm" variant="ghost">
                        Edit
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => removeUser(user.id)}>
                        Remove
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>

      <div className="rounded-card border border-hairline bg-surface-sunken p-5">
        <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
          <Info size={14} className="text-ink-muted" />
          Role permissions
        </p>
        <dl className="mt-3 space-y-2">
          {(Object.keys(roleMeta) as Role[]).map((role) => (
            <div key={role} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <dt className="w-20 shrink-0">
                <Pill className={cn(roleMeta[role].className)}>{roleMeta[role].label}</Pill>
              </dt>
              <dd className="text-[13px] text-ink-secondary">{roleMeta[role].can}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
