import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { LogOut, ChevronRight } from 'lucide-react'
import logoCompactLight from '@/brands/logo-compact-light.png'

export function MobileMePage() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const displayName = profile?.full_name ?? profile?.email?.split('@')[0] ?? 'User'
  const initials = displayName.slice(0, 2).toUpperCase()

  const handleSignOut = async () => {
    await signOut()
    navigate('/mobile/login', { replace: true })
  }

  const ITEMS = [
    { label: 'Switch to Web App', sub: 'Access full dashboard', action: () => navigate('/consumer') },
    { label: 'Account Settings',  sub: 'Email, password, preferences', action: () => {} },
    { label: 'About EcoLedger',   sub: 'Version 1.0 · Polygon Amoy', action: () => {} },
  ]

  return (
    <div className="px-5 pt-6 pb-8" style={{ background: '#f0ede6', minHeight: '100vh' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <img src={logoCompactLight} alt="EcoLedger" className="h-8 w-auto object-contain" />
        <p className="text-xs text-[#9b9b98]">My Profile</p>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-2xl p-5 mb-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[#0f0f0e] flex items-center justify-center flex-shrink-0">
          <span className="text-lg font-bold text-white">{initials}</span>
        </div>
        <div>
          <p className="text-base font-semibold text-[#0f0f0e]">{displayName}</p>
          <p className="text-xs text-[#9b9b98]">{profile?.email}</p>
          {profile?.organization && (
            <p className="text-xs text-[#9b9b98]">{profile.organization}</p>
          )}
        </div>
      </div>

      {/* Menu items */}
      <div className="bg-white rounded-2xl overflow-hidden mb-5 divide-y divide-[#f0ede6]">
        {ITEMS.map(item => (
          <button
            key={item.label}
            onClick={item.action}
            className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-[#f8f7f4] transition-colors"
          >
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#0f0f0e]">{item.label}</p>
              <p className="text-xs text-[#9b9b98]">{item.sub}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#d8d5ce]" />
          </button>
        ))}
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-[#e8e5de] bg-white text-sm font-semibold text-red-500"
      >
        <LogOut className="w-4 h-4" />
        Sign out
      </button>
    </div>
  )
}
