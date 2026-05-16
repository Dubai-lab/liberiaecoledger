import { Routes, Route } from 'react-router-dom'
import { AdminOverviewPage } from '@/pages/admin/AdminOverviewPage'
import { UsersPage } from '@/pages/admin/UsersPage'
import { InvitationsPage } from '@/pages/admin/InvitationsPage'
import { RecyclersPage } from '@/pages/admin/RecyclersPage'
import { SmartContractsPage } from '@/pages/admin/SmartContractsPage'
import { SystemSettingsPage } from '@/pages/admin/SystemSettingsPage'

export function AdminRoutes() {
  return (
    <Routes>
      <Route index element={<AdminOverviewPage />} />
      <Route path="users" element={<UsersPage />} />
      <Route path="invitations" element={<InvitationsPage />} />
      <Route path="recyclers" element={<RecyclersPage />} />
      <Route path="contracts" element={<SmartContractsPage />} />
      <Route path="settings" element={<SystemSettingsPage />} />
    </Routes>
  )
}
