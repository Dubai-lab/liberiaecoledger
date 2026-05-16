import { Routes, Route } from 'react-router-dom'
import { MyDevicesPage } from '@/pages/consumer/MyDevicesPage'
import { RegisterDevicePage } from '@/pages/consumer/RegisterDevicePage'
import { TransferDevicePage } from '@/pages/consumer/TransferDevicePage'
import { EcoCreditsPage } from '@/pages/consumer/EcoCreditsPage'
import { NotificationsPage } from '@/pages/shared/NotificationsPage'
import { DeviceDetailPage } from '@/pages/consumer/DeviceDetailPage'

export function ConsumerRoutes() {
  return (
    <Routes>
      <Route index element={<MyDevicesPage />} />
      <Route path="devices/:id" element={<DeviceDetailPage />} />
      <Route path="register" element={<RegisterDevicePage />} />
      <Route path="transfer" element={<TransferDevicePage />} />
      <Route path="credits" element={<EcoCreditsPage />} />
      <Route path="notifications" element={<NotificationsPage />} />
    </Routes>
  )
}
