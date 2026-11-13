import { Outlet } from 'react-router-dom'
import { ScanLine, Smartphone, Gift, UserRound } from 'lucide-react'
import { BottomNav } from '@/components/nav/BottomNav'

const NAV = [
  { label: 'Scan',    to: '/mobile',         icon: ScanLine,   end: true },
  { label: 'Devices', to: '/mobile/devices', icon: Smartphone },
  { label: 'Rewards', to: '/mobile/rewards', icon: Gift },
  { label: 'Me',      to: '/mobile/me',      icon: UserRound },
]

export function MobileLayout() {
  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto w-full" style={{ background: '#F4F7F2' }}>
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-[calc(5rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>

      <BottomNav id="mobile" items={NAV} desktop />
    </div>
  )
}
