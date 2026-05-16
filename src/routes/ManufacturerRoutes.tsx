import { Routes, Route } from 'react-router-dom'
import { ManufacturerDashboardPage } from '@/pages/manufacturer/ManufacturerDashboardPage'
import { ProductCataloguePage } from '@/pages/manufacturer/ProductCataloguePage'
import { RegisterDevicePage } from '@/pages/manufacturer/RegisterDevicePage'
import { ManufacturerAnalyticsPage } from '@/pages/manufacturer/ManufacturerAnalyticsPage'
import { NotificationsPage } from '@/pages/shared/NotificationsPage'

export function ManufacturerRoutes() {
  return (
    <Routes>
      <Route index element={<ManufacturerDashboardPage />} />
      <Route path="catalogue" element={<ProductCataloguePage />} />
      <Route path="register" element={<RegisterDevicePage />} />
      <Route path="analytics" element={<ManufacturerAnalyticsPage />} />
      <Route path="notifications" element={<NotificationsPage />} />
    </Routes>
  )
}
