import { Routes, Route } from 'react-router-dom'
import { MobileScanHomePage } from '@/pages/mobile/MobileScanHomePage'
import { MobileScanPage } from '@/pages/mobile/MobileScanPage'
import { MobileDeviceCardPage } from '@/pages/mobile/MobileDeviceCardPage'
import { MobileDevicesPage } from '@/pages/mobile/MobileDevicesPage'
import { MobileRewardsPage } from '@/pages/mobile/MobileRewardsPage'
import { MobileMePage } from '@/pages/mobile/MobileMePage'
import { MobileSettingsPage } from '@/pages/mobile/MobileSettingsPage'
import { MobileAboutPage } from '@/pages/mobile/MobileAboutPage'

export function MobileRoutes() {
  return (
    <Routes>
      <Route index element={<MobileScanHomePage />} />
      <Route path="scan" element={<MobileScanPage />} />
      <Route path="device/:id" element={<MobileDeviceCardPage />} />
      <Route path="devices" element={<MobileDevicesPage />} />
      <Route path="rewards" element={<MobileRewardsPage />} />
      <Route path="me" element={<MobileMePage />} />
      <Route path="settings" element={<MobileSettingsPage />} />
      <Route path="about" element={<MobileAboutPage />} />
    </Routes>
  )
}
