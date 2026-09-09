export type OrderStatus = 'new' | 'in_progress' | 'packed' | 'shipped' | 'completed'

export type Priority = 'rush' | 'standard' | 'bulk'

export type Role = 'admin' | 'manager' | 'worker'

export type LaneId =
  | 'ship_today'
  | 'at_risk'
  | 'unassigned'
  | 'in_progress'
  | 'ready_to_ship'
  | 'all'

/** Worst-case stock state across an order's line items. */
export type Fulfillment = 'ok' | 'low' | 'out'

export interface OrderLine {
  sku: string
  qty: number
}

export interface Order {
  id: string
  customer: string
  placedAt: string
  dueAt: string
  status: OrderStatus
  priority: Priority
  /** User id, or null when nobody has picked it up yet. */
  assigneeId: string | null
  lines: OrderLine[]
  notes: string
}

export interface InventoryItem {
  sku: string
  name: string
  description: string
  category: string
  quantity: number
  reorderPoint: number
  location: string
  updatedAt: string
}

export interface User {
  id: string
  name: string
  email: string
  role: Role
}

export interface StorageLocation {
  code: string
  kind: 'bin' | 'zone'
}

export interface AccountSettings {
  companyName: string
  billingEmail: string
  tier: string
}

export interface WarehouseSettings {
  name: string
  address: string
  locations: StorageLocation[]
}

export interface NotificationSettings {
  email: boolean
  lowStock: boolean
  orderUpdates: boolean
  systemAlerts: boolean
}

/** Per-line stock resolution, produced by joining an order against inventory. */
export interface LineStock {
  sku: string
  name: string
  required: number
  onHand: number
  reorderPoint: number
  location: string
  state: Fulfillment
}

export interface OrderStock {
  state: Fulfillment
  lines: LineStock[]
  lowCount: number
  outCount: number
}

export type DueTone = 'overdue' | 'today' | 'upcoming' | 'done'

export interface DueLabel {
  text: string
  tone: DueTone
}
