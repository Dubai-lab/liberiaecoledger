import { Routes, Route } from 'react-router-dom'
import { HubOverviewPage } from '@/pages/recycler/HubOverviewPage'
import { IntakeQueuePage } from '@/pages/recycler/IntakeQueuePage'
import { LogDisposalPage } from '@/pages/recycler/LogDisposalPage'
import { FacilityProfilePage } from '@/pages/recycler/FacilityProfilePage'

export function RecyclerRoutes() {
  return (
    <Routes>
      <Route index element={<HubOverviewPage />} />
      <Route path="intake" element={<IntakeQueuePage />} />
      <Route path="disposal" element={<LogDisposalPage />} />
      <Route path="facility" element={<FacilityProfilePage />} />
    </Routes>
  )
}
