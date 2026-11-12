import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Loader2 } from 'lucide-react'
import { EcoLedgerLogo } from '@/components/brand/EcoLedgerLogo'

interface Device {
  id: string
  brand: string
  model: string
  category: string | null
  status: string
  created_at: string
  receipt_url: string | null
}

function statusPill(status: string) {
  if (status === 'in_use')   return { bg: '#E6EEE7', text: '#083D24', label: 'In Use' }
  if (status === 'disposed') return { bg: '#fde8e8', text: '#c0392b', label: 'Disposed' }
  return { bg: '#F4F7F2', text: '#566D62', label: status }
}

export function MobileDevicesPage() {
  const { profile, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!profile) { setLoading(false); return }

    supabase
      .from('devices')
      .select('id, brand, model, category, status, created_at, receipt_url')
      .eq('current_owner_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setDevices(data ?? [])
        setLoading(false)
      })
  }, [profile, authLoading])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#F4F7F2' }}>
        <Loader2 className="w-6 h-6 animate-spin text-brand-muted" />
      </div>
    )
  }

  return (
    <div className="px-5 pt-6" style={{ background: '#F4F7F2', minHeight: '100vh' }}>
      <div className="flex items-center justify-between mb-6">
        <EcoLedgerLogo />
        <p className="text-xs text-brand-muted">{devices.length} devices</p>
      </div>

      {devices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-4">
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="#D7E0D5" strokeWidth={1.5}>
              <rect x="2" y="5" width="20" height="14" rx="2" />
            </svg>
          </div>
          <p className="text-sm text-brand-muted">No devices yet.</p>
          <p className="text-xs text-brand-sage mt-1">Register a device on the web dashboard first.</p>
        </div>
      ) : (
        <div className="space-y-3 pb-6">
          {devices.map(d => {
            const { bg, text, label } = statusPill(d.status)
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => navigate(`/mobile/device/${d.id}`)}
                className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 text-left"
              >
                <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: '#D7E0D5' }}>
                  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="#748C7F" strokeWidth={1.5}>
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-brand-ink truncate">{d.brand} {d.model}</p>
                  {d.category && <p className="text-xs text-brand-muted">{d.category}</p>}
                  <span className="inline-block text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full mt-1" style={{ background: bg, color: text }}>
                    {label}
                  </span>
                </div>
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 flex-shrink-0" stroke="#D7E0D5" strokeWidth={2}>
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
