import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  accountSettings as seedAccount,
  inventory as seedInventory,
  notificationSettings as seedNotifications,
  orders as seedOrders,
  users as seedUsers,
  warehouseSettings as seedWarehouse,
} from './mockData'
import type {
  AccountSettings,
  InventoryItem,
  NotificationSettings,
  Order,
  OrderStatus,
  User,
  WarehouseSettings,
} from './types'

interface Store {
  orders: Order[]
  inventory: InventoryItem[]
  users: User[]
  /** Who can actually be handed an order. Admins and managers do not pick. */
  workers: User[]
  account: AccountSettings
  warehouse: WarehouseSettings
  notifications: NotificationSettings

  setStatus: (ids: string[], status: OrderStatus) => void
  assign: (ids: string[], assigneeId: string | null) => void
  /** Puts a set of orders back exactly as they were, to back out a bulk action. */
  restore: (snapshots: Order[]) => void
  setNotes: (id: string, notes: string) => void
  updateItem: (sku: string, patch: Partial<InventoryItem>) => void
  removeUser: (id: string) => void
  setAccount: (patch: Partial<AccountSettings>) => void
  setWarehouse: (patch: Partial<WarehouseSettings>) => void
  setNotifications: (patch: Partial<NotificationSettings>) => void
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(seedOrders)
  const [inventory, setInventory] = useState<InventoryItem[]>(seedInventory)
  const [users, setUsers] = useState<User[]>(seedUsers)
  const [account, setAccountState] = useState<AccountSettings>(seedAccount)
  const [warehouse, setWarehouseState] = useState<WarehouseSettings>(seedWarehouse)
  const [notifications, setNotificationsState] =
    useState<NotificationSettings>(seedNotifications)

  const setStatus = useCallback((ids: string[], status: OrderStatus) => {
    const target = new Set(ids)
    setOrders((prev) =>
      prev.map((order) => (target.has(order.id) ? { ...order, status } : order)),
    )
  }, [])

  const assign = useCallback((ids: string[], assigneeId: string | null) => {
    const target = new Set(ids)
    setOrders((prev) =>
      prev.map((order) => (target.has(order.id) ? { ...order, assigneeId } : order)),
    )
  }, [])

  const restore = useCallback((snapshots: Order[]) => {
    const byId = new Map(snapshots.map((order) => [order.id, order]))
    setOrders((prev) => prev.map((order) => byId.get(order.id) ?? order))
  }, [])

  const setNotes = useCallback((id: string, notes: string) => {
    setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, notes } : order)))
  }, [])

  const updateItem = useCallback((sku: string, patch: Partial<InventoryItem>) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.sku === sku ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item,
      ),
    )
  }, [])

  const removeUser = useCallback((id: string) => {
    setUsers((prev) => prev.filter((user) => user.id !== id))
    // Orders they were holding fall back to the Unassigned lane rather than
    // pointing at somebody who is gone.
    setOrders((prev) =>
      prev.map((order) => (order.assigneeId === id ? { ...order, assigneeId: null } : order)),
    )
  }, [])

  const setAccount = useCallback((patch: Partial<AccountSettings>) => {
    setAccountState((prev) => ({ ...prev, ...patch }))
  }, [])

  const setWarehouse = useCallback((patch: Partial<WarehouseSettings>) => {
    setWarehouseState((prev) => ({ ...prev, ...patch }))
  }, [])

  const setNotifications = useCallback((patch: Partial<NotificationSettings>) => {
    setNotificationsState((prev) => ({ ...prev, ...patch }))
  }, [])

  const workers = useMemo(() => users.filter((user) => user.role === 'worker'), [users])

  const value = useMemo<Store>(
    () => ({
      orders,
      inventory,
      users,
      workers,
      account,
      warehouse,
      notifications,
      setStatus,
      assign,
      restore,
      setNotes,
      updateItem,
      removeUser,
      setAccount,
      setWarehouse,
      setNotifications,
    }),
    [
      orders,
      inventory,
      users,
      workers,
      account,
      warehouse,
      notifications,
      setStatus,
      assign,
      restore,
      setNotes,
      updateItem,
      removeUser,
      setAccount,
      setWarehouse,
      setNotifications,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore must be used inside StoreProvider')
  return store
}
