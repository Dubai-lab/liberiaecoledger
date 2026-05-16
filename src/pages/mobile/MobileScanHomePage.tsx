import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import logoCompactLight from '@/brands/logo-compact-light.png'

function fmt(n: number) { return new Intl.NumberFormat().format(n) }

function getHour() { return new Date().getHours() }

interface PendingAction {
  id: string
  deviceName: string
  type: 'disposal' | 'transfer'
  detail: string
  createdAt: string
}

interface NearbyFacility {
  id: string
  name: string
  location_city: string
  operating_hours: string | null
  accepts_free_pickup: boolean
}

export function MobileScanHomePage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [balance, setBalance] = useState(0)
  const [actions, setActions] = useState<PendingAction[]>([])
  const [facility, setFacility] = useState<NearbyFacility | null>(null)

  const firstName = profile?.full_name?.split(' ')[0] ?? profile?.email?.split('@')[0] ?? 'User'

  useEffect(() => {
    if (!profile) return

    Promise.all([
      supabase.from('eco_credits').select('amount, type').eq('user_id', profile.id),
      supabase.from('transfers').select('id, status, created_at, devices(brand, model)').eq('from_user_id', profile.id).eq('status', 'pending'),
      supabase.from('recycler_facilities').select('id, name, location_city, operating_hours, accepts_free_pickup').eq('is_active', true).limit(1),
    ]).then(([creditRes, transferRes, facRes]) => {
      const earned = (creditRes.data ?? []).filter(c => c.type === 'earned' || c.type === 'bonus').reduce((s, c) => s + c.amount, 0)
      const redeemed = (creditRes.data ?? []).filter(c => c.type === 'redeemed').reduce((s, c) => s + c.amount, 0)
      setBalance(earned - redeemed)

      const pending: PendingAction[] = (transferRes.data ?? []).map((t: any) => ({
        id: t.id,
        deviceName: t.devices ? `${t.devices.brand} ${t.devices.model}` : 'Device',
        type: 'transfer',
        detail: 'Transfer pending signature',
        createdAt: t.created_at,
      }))
      setActions(pending)
      setFacility(facRes.data?.[0] ?? null)
    })
  }, [profile])

  const isOpen = getHour() >= 8 && getHour() < 17

  return (
    <div className="px-5 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <img src={logoCompactLight} alt="EcoLedger" className="h-8 w-auto object-contain" />
        <p className="text-xs text-[#9b9b98]">{firstName}</p>
      </div>

      {/* Wallet balance card */}
      <div className="rounded-2xl p-5 mb-6" style={{ background: '#0f0f0e' }}>
        <p className="text-[10px] tracking-widest text-[#6b6b68] uppercase mb-1">Wallet Balance</p>
        <p className="text-4xl font-bold text-white mb-0.5">
          {fmt(balance)} <span className="text-lg font-normal text-[#9b9b98]">EcoCredits</span>
        </p>
        <p className="text-xs text-[#6b6b68] mb-4">≈ LRD {fmt(balance * 150)}</p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/mobile/rewards')}
            className="flex-1 py-2.5 rounded-xl bg-white text-[#0f0f0e] text-sm font-semibold"
          >
            Redeem
          </button>
          <button
            onClick={() => navigate('/mobile/rewards')}
            className="flex-1 py-2.5 rounded-xl border border-white/30 text-white text-sm font-semibold"
          >
            Cash out
          </button>
        </div>
      </div>

      {/* Action needed */}
      {actions.length > 0 && (
        <div className="mb-6">
          <p className="text-[10px] tracking-widest text-[#9b9b98] uppercase mb-3">Action Needed</p>
          <div className="space-y-2">
            {actions.map(a => (
              <div key={a.id} className="bg-white rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#f0ede6] flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="#9b9b98" strokeWidth={1.5}>
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <path d="M8 19v2M16 19v2M6 22h12" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0f0f0e] truncate">{a.deviceName}</p>
                  <p className="text-xs text-[#9b9b98]">{a.detail}</p>
                </div>
                <span className="text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-lg" style={{ background: '#fdf3dc', color: '#b87a00' }}>
                  SIGN
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nearby drop-off */}
      {facility && (
        <div className="mb-6">
          <p className="text-[10px] tracking-widest text-[#9b9b98] uppercase mb-3">Nearby Drop-off</p>
          <div className="bg-white rounded-2xl p-4">
            <p className="text-sm font-semibold text-[#0f0f0e] mb-0.5">{facility.name}</p>
            <p className="text-xs text-[#9b9b98] mb-3">{facility.location_city} · Liberia</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-[10px] font-semibold tracking-widest border border-[#e8e5de] rounded-full px-3 py-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-[#2d6a3f]' : 'bg-[#9b9b98]'}`} />
                {isOpen ? 'OPEN' : 'CLOSED'} · {facility.operating_hours ?? '8-17H'}
              </span>
              {facility.accepts_free_pickup && (
                <span className="text-[10px] font-semibold tracking-widest border border-[#e8e5de] rounded-full px-3 py-1">
                  FREE PICKUP
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scan CTA */}
      <button
        onClick={() => navigate('/mobile/scan')}
        className="w-full py-4 rounded-2xl text-white text-sm font-bold tracking-wide"
        style={{ background: '#0f0f0e' }}
      >
        Scan a Device
      </button>
    </div>
  )
}
