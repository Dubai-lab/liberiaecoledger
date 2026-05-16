import { Outlet, NavLink } from 'react-router-dom'

const NAV = [
  { label: 'DEVICES',  path: '/mobile/devices',  icon: DevicesIcon },
  { label: 'SCAN',     path: '/mobile',           icon: ScanIcon,   exact: true },
  { label: 'REWARDS',  path: '/mobile/rewards',   icon: RewardsIcon },
  { label: 'ME',       path: '/mobile/me',        icon: MeIcon },
]

function DevicesIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke={active ? '#0f0f0e' : '#b0afa8'} strokeWidth={1.8}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M9 19v2M15 19v2M7 22h10" />
    </svg>
  )
}

function ScanIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <div className="w-12 h-12 rounded-2xl bg-[#0f0f0e] flex items-center justify-center -mt-6 shadow-lg">
        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="#fff" strokeWidth={2}>
          <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
          <line x1="3" y1="12" x2="21" y2="12" />
        </svg>
      </div>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="#b0afa8" strokeWidth={1.8}>
      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
      <line x1="3" y1="12" x2="21" y2="12" />
    </svg>
  )
}

function RewardsIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke={active ? '#0f0f0e' : '#b0afa8'} strokeWidth={1.8}>
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
    </svg>
  )
}

function MeIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke={active ? '#0f0f0e' : '#b0afa8'} strokeWidth={1.8}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

export function MobileLayout() {
  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto w-full" style={{ background: '#f0ede6' }}>
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e8e5de] flex items-end justify-around px-2 pt-3 pb-4 z-50">
        {NAV.map(({ label, path, icon: Icon, exact }) => (
          <NavLink
            key={path}
            to={path}
            end={exact}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 min-w-[60px] ${isActive ? '' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon active={isActive} />
                <span
                  className="text-[10px] tracking-widest"
                  style={{ color: isActive ? '#0f0f0e' : '#b0afa8', fontWeight: isActive ? 700 : 400 }}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
