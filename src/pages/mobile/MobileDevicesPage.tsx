import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Loader2 } from 'lucide-react'
import logoCompactLight from '@/brands/logo-compact-light.png'

interface Device {
  id: string
  brand: string
  model: string
  storage_gb: number | null
  status: string
  registered_at: string
  image_url: string | null
}

function statusPill(status: string) {
  if (status === 'in_use')   return { bg: '#e8f5ec', text: '#2d6a3f', label: 'In Use' }
  if (status === 'disposed') return { bg: '#fde8e8', text: '#c0392b', label: 'Disposed' }
  return { bg: '#f0ede6', text: '#9b9b98', label: status }
}

export function MobileDevicesPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    supabase.from('devices').select('*').eq('current_owner_id', profile.id).order('registered_at', { ascending: false })
      .then(({ data }) => {
        setDevices(data ?? [])
        setLoading(false)
      })
  }, [profile])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f0ede6' }}>
        <Loader2 className="w-6 h-6 animate-spin text-[#9b9b98]" />
      </div>
    )
  }

  return (
    <div className="px-5 pt-6" style={{ background: '#f0ede6', minHeight: '100vh' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <img src={logoCompactLight} alt="EcoLedger" className="h-8 w-auto object-contain" />
        <p className="text-xs text-[#9b9b98]">{devices.length} devices</p>
      </div>

      {devices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-4">
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="#d8d5ce" strokeWidth={1.5}>
              <rect x="2" y="5" width="20" height="14" rx="2" />
            </svg>
          </div>
          <p className="text-sm text-[#9b9b98]">No devices yet.</p>
          <p className="text-xs text-[#b0afa8] mt-1">Scan a device or register one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {devices.map(d => {
            const { bg, text, label } = statusPill(d.status)
            return (
              <button
                key={d.id}
                onClick={() => navigate(`/mobile/device/${d.id}`)}
                className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 text-left"
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0" style={{ background: '#e8e5de' }}>
                  {d.image_url ? (
                    <img src={d.image_url} alt={d.model} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="#b0afa8" strokeWidth={1.5}>
                        <rect x="2" y="5" width="20" height="14" rx="2" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0f0f0e] truncate">{d.brand} {d.model}</p>
                  {d.storage_gb && <p className="text-xs text-[#9b9b98]">{d.storage_gb}GB</p>}
                  <span className="inline-block text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full mt-1" style={{ background: bg, color: text }}>
                    {label}
                  </span>
                </div>
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 flex-shrink-0" stroke="#d8d5ce" strokeWidth={2}>
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
