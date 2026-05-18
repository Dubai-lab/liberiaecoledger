import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Loader2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Device {
  id: string
  brand: string
  model: string
  category: string | null
  status: string
}

interface Facility {
  id: string
  name: string
  location_city: string
  location_county: string
  accepts_free_pickup: boolean
}

export function MobileDisposePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()

  const [device, setDevice] = useState<Device | null>(null)
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [selectedFacility, setSelectedFacility] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!id) { setLoading(false); return }
    Promise.all([
      supabase.from('devices').select('id, brand, model, category, status').eq('id', id).maybeSingle(),
      supabase.from('recycler_facilities').select('id, name, location_city, location_county, accepts_free_pickup').eq('is_active', true).limit(10),
    ]).then(([devRes, facRes]) => {
      setDevice(devRes.data ?? null)
      setFacilities((facRes.data ?? []) as Facility[])
      setLoading(false)
    })
  }, [id])

  const handleSubmit = async () => {
    if (!profile || !device) return
    setSubmitting(true)
    try {
      // Mark device as ready for disposal
      await supabase.from('devices').update({ status: 'ready_for_disposal' }).eq('id', device.id)

      // Log lifecycle event
      await supabase.from('device_lifecycle').insert({
        device_id:  device.id,
        event_type: 'disposed',
        actor_id:   profile.id,
        actor_name: profile.full_name ?? profile.email ?? 'Consumer',
        location:   profile.city ? `${profile.city}, Liberia` : 'Liberia',
        metadata: {
          action:   'marked_for_disposal',
          facility: selectedFacility || null,
          notes:    notes || null,
        },
      })

      // Notify the user themselves
      await supabase.from('notifications').insert({
        user_id: profile.id,
        title:   'Device marked for disposal',
        body:    `Your ${device.brand} ${device.model} is now marked as ready for recycling. A certified recycler will process it.`,
        type:    'info',
        is_read: false,
        link:    '/consumer',
      })

      setDone(true)
    } catch {
      toast.error('Failed to submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

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

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center" style={{ background: '#f0ede6' }}>
        <div className="w-16 h-16 rounded-full bg-[#e8f5ec] flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-[#2d6a3f]" />
        </div>
        <h1 className="text-xl font-bold text-[#0f0f0e] mb-2">Marked for Recycling</h1>
        <p className="text-sm text-[#9b9b98] mb-1">
          {device.brand} {device.model} is now ready for disposal.
        </p>
        <p className="text-xs text-[#b0afa8] mb-8">
          A certified recycler will process your device and you'll earn EcoCredits once disposal is confirmed.
        </p>
        <button
          type="button"
          onClick={() => navigate('/mobile/devices')}
          className="w-full py-4 rounded-2xl text-white text-sm font-bold"
          style={{ background: '#0f0f0e' }}
        >
          Back to My Devices
        </button>
      </div>
    )
  }

  return (
    <div className="px-5 pt-6 pb-8" style={{ background: '#f0ede6', minHeight: '100vh' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
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
          <p className="text-base font-semibold text-[#0f0f0e]">Dispose Device</p>
          <p className="text-xs text-[#9b9b98]">Mark for recycling</p>
        </div>
      </div>

      {/* Device summary */}
      <div className="bg-white rounded-2xl p-4 mb-5">
        <p className="text-[10px] tracking-widest text-[#9b9b98] uppercase mb-2">Device</p>
        <p className="text-base font-bold text-[#0f0f0e]">{device.brand} {device.model}</p>
        {device.category && <p className="text-xs text-[#9b9b98]">{device.category}</p>}
      </div>

      {/* Info card */}
      <div className="rounded-2xl p-4 mb-5" style={{ background: '#e8f5ec' }}>
        <p className="text-xs font-semibold text-[#2d6a3f] mb-1">How it works</p>
        <p className="text-xs text-[#4a7a5a] leading-relaxed">
          Marking your device for disposal makes it visible to certified recyclers. Once a recycler processes it, you'll earn EcoCredits based on the materials recovered.
        </p>
      </div>

      {/* Recycler facility selection */}
      {facilities.length > 0 && (
        <div className="mb-5">
          <p className="text-[10px] tracking-widest text-[#9b9b98] uppercase mb-3">Preferred Recycler (optional)</p>
          <div className="space-y-2">
            {facilities.map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFacility(selectedFacility === f.name ? '' : f.name)}
                className={`w-full bg-white rounded-2xl p-4 text-left border-2 transition-all ${
                  selectedFacility === f.name ? 'border-[#0f0f0e]' : 'border-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[#0f0f0e]">{f.name}</p>
                    <p className="text-xs text-[#9b9b98]">{f.location_city}, {f.location_county}</p>
                  </div>
                  {f.accepts_free_pickup && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                      style={{ background: '#e8f5ec', color: '#2d6a3f' }}>
                      Free pickup
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="mb-6">
        <p className="text-[10px] tracking-widest text-[#9b9b98] uppercase mb-2">Notes (optional)</p>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Device condition, preferred pickup time, addressâ€¦"
          rows={3}
          className="w-full bg-white rounded-2xl px-4 py-3 text-sm text-[#0f0f0e] placeholder:text-[#b0afa8] focus:outline-none resize-none"
          style={{ border: '2px solid transparent' }}
          onFocus={e => { e.target.style.borderColor = '#0f0f0e' }}
          onBlur={e => { e.target.style.borderColor = 'transparent' }}
        />
      </div>

      {/* Warning */}
      <div className="bg-white rounded-2xl p-4 mb-5 flex items-start gap-3">
        <div className="w-6 h-6 rounded-full bg-[#fde8d0] flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3" stroke="#b85c00" strokeWidth={2.5}>
            <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <p className="text-xs text-[#9b9b98] leading-relaxed">
          Once submitted, this device will be locked from transfer. Please back up any data before proceeding.
        </p>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-4 rounded-2xl text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ background: '#0f0f0e' }}
      >
        {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submittingâ€¦</> : 'Mark for Recycling'}
      </button>
    </div>
  )
}
