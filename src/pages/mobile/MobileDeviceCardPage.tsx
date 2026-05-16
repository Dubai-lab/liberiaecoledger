import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Device {
  id: string
  brand: string
  model: string
  category: string | null
  status: string
  created_at: string
  imei: string | null
  serial_number: string | null
  receipt_url: string | null
  hazard_class: string | null
}

interface LifecycleEvent {
  id: string
  event_type: string
  actor_name: string | null
  location: string | null
  created_at: string
  metadata: any
}

function eventLabel(e: LifecycleEvent) {
  switch (e.event_type) {
    case 'registered':  return { title: 'Registered', sub: e.location ?? e.actor_name ?? '' }
    case 'transferred': return { title: 'Ownership transferred', sub: e.metadata?.to_email ?? '' }
    case 'disposed':    return { title: 'Disposed for recycling', sub: e.location ?? '' }
    default:            return { title: e.event_type, sub: e.actor_name ?? '' }
  }
}

function statusColor(status: string) {
  if (status === 'in_use')   return { bg: '#e8f5ec', text: '#2d6a3f', label: 'IN USE' }
  if (status === 'disposed') return { bg: '#fde8e8', text: '#c0392b', label: 'DISPOSED' }
  return { bg: '#f0ede6', text: '#9b9b98', label: status.toUpperCase() }
}

export function MobileDeviceCardPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [device, setDevice] = useState<Device | null>(null)
  const [lifecycle, setLifecycle] = useState<LifecycleEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('devices').select('*').eq('id', id).single(),
      supabase.from('device_lifecycle').select('*').eq('device_id', id).order('created_at', { ascending: true }),
    ]).then(([devRes, lcRes]) => {
      setDevice(devRes.data)
      setLifecycle(lcRes.data ?? [])
      setLoading(false)
    })
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f0ede6' }}>
        <Loader2 className="w-6 h-6 animate-spin text-[#9b9b98]" />
      </div>
    )
  }

  if (!device) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center" style={{ background: '#f0ede6' }}>
        <p className="text-sm text-[#9b9b98]">Device not found.</p>
        <button type="button" onClick={() => navigate(-1)} className="mt-4 text-sm font-semibold underline text-[#0f0f0e]">Go back</button>
      </div>
    )
  }

  const { bg, text, label } = statusColor(device.status)
  const identifier = device.imei ?? device.serial_number

  return (
    <div className="px-5 pt-6 pb-8" style={{ background: '#f0ede6', minHeight: '100vh' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-[#0f0f0e] flex items-center justify-center flex-shrink-0"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="white" strokeWidth={2}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div>
          <p className="text-base font-semibold text-[#0f0f0e]">Device Record</p>
          <p className="text-xs text-[#9b9b98]">#{device.id.slice(-6).toUpperCase()}</p>
        </div>
      </div>

      {/* Device photo placeholder */}
      <div className="rounded-2xl overflow-hidden mb-4" style={{ background: '#e8e5de', minHeight: 180 }}>
        {device.receipt_url ? (
          <img src={device.receipt_url} alt={device.model} className="w-full object-cover" style={{ maxHeight: 220 }} />
        ) : (
          <div className="flex items-center justify-center h-44 relative overflow-hidden">
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="stripe" patternUnits="userSpaceOnUse" width="16" height="16" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="16" stroke="#d8d5ce" strokeWidth="8" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#stripe)" />
            </svg>
            <p className="text-[10px] tracking-widest text-[#b0afa8] uppercase relative z-10">No Photo</p>
          </div>
        )}
      </div>

      {/* Status badges */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[11px] font-bold tracking-widest px-3 py-1 rounded-full" style={{ background: bg, color: text }}>
          {label}
        </span>
        <span className="text-[11px] font-bold tracking-widest px-3 py-1 rounded-full border border-[#d8d5ce] text-[#9b9b98]">
          ERC-721
        </span>
      </div>

      {/* Device name */}
      <h1 className="text-2xl font-bold text-[#0f0f0e] mb-0.5">
        {device.brand} {device.model}
      </h1>
      <p className="text-sm text-[#9b9b98] mb-5">
        {device.category && `${device.category} · `}
        Registered {new Date(device.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        {identifier ? ` · ${identifier.slice(0, 8)}…` : ''}
      </p>

      {/* Lifecycle */}
      {lifecycle.length > 0 && (
        <div className="bg-white rounded-2xl p-4 mb-5">
          <p className="text-[10px] tracking-widest text-[#9b9b98] uppercase mb-4">Lifecycle</p>
          <div className="space-y-4">
            {lifecycle.map(e => {
              const { title, sub } = eventLabel(e)
              return (
                <div key={e.id} className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#2d6a3f] mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-[#0f0f0e]">{title}</p>
                    {sub && <p className="text-xs text-[#9b9b98]">{sub}</p>}
                    <p className="text-xs text-[#b0afa8]">
                      {new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      {device.status === 'in_use' && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => toast.info('Go to the web dashboard to transfer this device.')}
            className="flex-[3] py-4 rounded-2xl text-white text-sm font-bold"
            style={{ background: '#0f0f0e' }}
          >
            Transfer
          </button>
          <button
            type="button"
            onClick={() => toast.info('Go to the web dashboard to dispose this device.')}
            className="flex-[2] py-4 rounded-2xl text-sm font-semibold border border-[#d8d5ce] text-[#0f0f0e]"
            style={{ background: 'white' }}
          >
            Dispose
          </button>
        </div>
      )}
    </div>
  )
}
