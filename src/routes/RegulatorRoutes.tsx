import { Routes, Route } from 'react-router-dom'
import { NationalOverviewPage } from '@/pages/regulator/NationalOverviewPage'
import { FlaggedCasesPage } from '@/pages/regulator/FlaggedCasesPage'
import { ComplianceMapPage } from '@/pages/regulator/ComplianceMapPage'
import { ReportsPage } from '@/pages/regulator/ReportsPage'

export function RegulatorRoutes() {
  return (
    <Routes>
      <Route index element={<NationalOverviewPage />} />
      <Route path="map" element={<ComplianceMapPage />} />
      <Route path="flags" element={<FlaggedCasesPage />} />
      <Route path="reports" element={<ReportsPage />} />
    </Routes>
  )
}
