import { X } from 'lucide-react'
import { Select } from '@/components/ui/Field'
import { STATUS_META } from '@/lib/derive'
import { ORDER_FLOW } from '@/lib/derive'
import type { OrderStatus, Priority, User } from '@/lib/types'

export interface Filters {
  search: string
  status: OrderStatus | ''
  priority: Priority | ''
  assignee: string
}

export function OrdersToolbar({
  filters,
  onChange,
  users,
  shown,
  total,
}: {
  filters: Filters
  onChange: (patch: Partial<Filters>) => void
  users: User[]
  shown: number
  total: number
}) {
  const isFiltered =
    filters.search !== '' || filters.status !== '' || filters.priority !== '' || filters.assignee !== ''

  return (
    <div className="flex flex-wrap items-center gap-2 pb-4">
      <Select
        value={filters.status}
        placeholder="All statuses"
        aria-label="Filter by status"
        onChange={(e) => onChange({ status: e.target.value as OrderStatus | '' })}
        className="w-[150px]"
      >
        {ORDER_FLOW.map((status) => (
          <option key={status} value={status}>
            {STATUS_META[status].label}
          </option>
        ))}
      </Select>

      <Select
        value={filters.priority}
        placeholder="All priorities"
        aria-label="Filter by priority"
        onChange={(e) => onChange({ priority: e.target.value as Priority | '' })}
        className="w-[150px]"
      >
        <option value="rush">Rush</option>
        <option value="standard">Standard</option>
        <option value="bulk">Bulk</option>
      </Select>

      <Select
        value={filters.assignee}
        placeholder="Anyone"
        aria-label="Filter by assignee"
        onChange={(e) => onChange({ assignee: e.target.value })}
        className="w-[160px]"
      >
        <option value="none">Unassigned</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </Select>

      {isFiltered && (
        <button
          type="button"
          onClick={() => onChange({ search: '', status: '', priority: '', assignee: '' })}
          className="inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-[13px] text-ink-secondary transition-colors hover:bg-neutral-fill hover:text-ink"
        >
          <X size={13} />
          Clear
        </button>
      )}

      <p className="tnum ml-auto pl-2 text-[12px] text-ink-muted">
        {shown} of {total}
      </p>
    </div>
  )
}
