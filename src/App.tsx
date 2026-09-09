import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { StoreProvider } from '@/lib/store'
import Orders from '@/pages/Orders'
import Inventory from '@/pages/Inventory'
import Settings from '@/pages/Settings'

export default function App() {
  return (
    <StoreProvider>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/orders" replace />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/orders" replace />} />
        </Routes>
      </AppShell>
    </StoreProvider>
  )
}
