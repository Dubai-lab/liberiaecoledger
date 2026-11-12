import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { LogOut, ChevronRight } from 'lucide-react'
import { EcoLedgerLogo } from '@/components/brand/EcoLedgerLogo'

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
    { label: 'Switch to Web App', sub: 'Access full dashboard',      action: () => navigate('/consumer') },
    { label: 'Account Settings',  sub: 'Name, phone, organization',  action: () => navigate('/mobile/settings') },
    { label: 'About EcoLedger',   sub: 'Version 1.0 · Sepolia',      action: () => navigate('/mobile/about') },
  ]

  return (
    <div className="px-5 pt-6 pb-8" style={{ background: '#F4F7F2', minHeight: '100vh' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <EcoLedgerLogo />
        <p className="text-xs text-brand-muted">My Profile</p>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-2xl p-5 mb-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-brand flex items-center justify-center flex-shrink-0">
          <span className="text-lg font-bold text-white">{initials}</span>
        </div>
        <div>
          <p className="text-base font-semibold text-brand-ink">{displayName}</p>
          <p className="text-xs text-brand-muted">{profile?.email}</p>
          {profile?.organization && (
            <p className="text-xs text-brand-muted">{profile.organization}</p>
          )}
        </div>
      </div>

      {/* Menu items */}
      <div className="bg-white rounded-2xl overflow-hidden mb-5 divide-y divide-[#F4F7F2]">
        {ITEMS.map(item => (
          <button
            key={item.label}
            onClick={item.action}
            className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-brand-tint transition-colors"
          >
            <div className="flex-1">
              <p className="text-sm font-semibold text-brand-ink">{item.label}</p>
              <p className="text-xs text-brand-muted">{item.sub}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-brand-line" />
          </button>
        ))}
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-brand-line bg-white text-sm font-semibold text-red-500"
      >
        <LogOut className="w-4 h-4" />
        Sign out
      </button>
    </div>
  )
}
