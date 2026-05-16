import { Routes, Route } from 'react-router-dom'
import { BlockExplorerPage } from '@/pages/auditor/BlockExplorerPage'
import { VerifiedRecordsPage } from '@/pages/auditor/VerifiedRecordsPage'
import { TransactionDetailPage } from '@/pages/auditor/TransactionDetailPage'

export function AuditorRoutes() {
  return (
    <Routes>
      <Route index element={<BlockExplorerPage />} />
      <Route path="records" element={<VerifiedRecordsPage />} />
      <Route path="transaction" element={<TransactionDetailPage />} />
    </Routes>
  )
}
