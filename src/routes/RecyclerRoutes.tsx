import { Routes, Route } from 'react-router-dom'
import { HubOverviewPage } from '@/pages/recycler/HubOverviewPage'
import { IntakeQueuePage } from '@/pages/recycler/IntakeQueuePage'
import { LogDisposalPage } from '@/pages/recycler/LogDisposalPage'
import { DevicesReceivedPage } from '@/pages/recycler/DevicesReceivedPage'
import { FacilityProfilePage } from '@/pages/recycler/FacilityProfilePage'
import { NotificationsPage } from '@/pages/shared/NotificationsPage'

export function RecyclerRoutes() {
  return (
    <Routes>
      <Route index element={<HubOverviewPage />} />
      <Route path="intake" element={<IntakeQueuePage />} />
      <Route path="disposal" element={<LogDisposalPage />} />
      <Route path="received" element={<DevicesReceivedPage />} />
      <Route path="facility" element={<FacilityProfilePage />} />
      <Route path="notifications" element={<NotificationsPage />} />
    </Routes>
  )
}
