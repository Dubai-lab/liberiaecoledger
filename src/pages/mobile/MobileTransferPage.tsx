import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Device {
  id: string
  brand: string
  model: string
  serial_number: string | null
  status: string
}

const REASONS = [
  { value: 'resale',          label: 'Resale' },
  { value: 'donation',        label: 'Donation' },
  { value: 'gift',            label: 'Gift' },
  { value: 'warranty_return', label: 'Warranty Return' },
]

export function MobileTransferPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedId = searchParams.get('device') ?? ''

  const [devices, setDevices] = useState<Device[]>([])
  const [loadingDevices, setLoadingDevices] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [deviceId, setDeviceId] = useState(preselectedId)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [reason, setReason] = useState('resale')
  const [price, setPrice] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!profile) return
    supabase
      .from('devices')
      .select('id, brand, model, serial_number, status')
      .eq('current_owner_id', profile.id)
      .in('status', ['in_use', 'awaiting_transfer'])
      .then(({ data }) => {
        setDevices((data as Device[]) ?? [])
        setLoadingDevices(false)
      })
  }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile || !deviceId) return
    setSubmitting(true)

    try {
      const { data: recipient } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', recipientEmail.toLowerCase().trim())
        .maybeSingle()

      if (!recipient) {
        toast.error('Recipient not found. They must be registered on EcoLedger.')
        return
      }

      const { error } = await supabase.from('transfers').insert({
        device_id: deviceId,
        from_user_id: profile.id,
        to_user_id: recipient.id,
        reason: reason as 'resale' | 'donation' | 'gift' | 'warranty_return',
        sale_price_lrd: price ? Number(price) : null,
        condition_notes: notes || null,
        evidence_urls: [],
        status: 'pending',
      })

      if (error) throw error

      await supabase
        .from('devices')
        .update({ status: 'awaiting_transfer' })
        .eq('id', deviceId)

      const selectedDevice = devices.find(d => d.id === deviceId)
      await supabase.from('device_lifecycle').insert({
        device_id: deviceId,
        event_type: 'transferred',
        actor_id: profile.id,
        actor_name: profile.full_name ?? profile.email ?? 'Consumer',
        location: profile.city ? `${profile.city}, Liberia` : 'Liberia',
        metadata: {
          reason,
          to_email: recipientEmail.toLowerCase().trim(),
          to_user_id: recipient.id,
          sale_price_lrd: price ? Number(price) : null,
          condition_notes: notes || null,
          brand: selectedDevice?.brand,
          model: selectedDevice?.model,
        },
      })

      toast.success('Transfer initiated. The recipient will need to confirm.')
      navigate('/mobile/devices')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Transfer failed')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedDevice = devices.find(d => d.id === deviceId)

  return (
    <div className="min-h-screen px-5 pt-6 pb-10" style={{ background: '#F4F7F2' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center flex-shrink-0"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="white" strokeWidth={2}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div>
          <p className="text-[10px] tracking-widest text-brand-muted uppercase">Consumer</p>
          <p className="text-base font-semibold text-brand-ink">Transfer a Device</p>
        </div>
      </div>

      <p className="text-xs text-brand-muted mb-6 leading-relaxed">
        Transferring ownership creates an immutable record on the EcoLedger chain.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Device selection */}
        <div className="bg-white rounded-2xl p-4 space-y-3">
          <p className="text-[10px] tracking-widest text-brand-muted uppercase">Device</p>

          {loadingDevices ? (
            <div className="flex items-center gap-2 text-sm text-brand-muted">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading devices…
            </div>
          ) : devices.length === 0 ? (
            <p className="text-sm text-brand-muted">No eligible devices found.</p>
          ) : (
            <div className="space-y-2">
              {devices.map(d => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDeviceId(d.id)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left"
                  style={{
                    borderColor: deviceId === d.id ? '#083D24' : '#D7E0D5',
                    background: deviceId === d.id ? '#083D24' : 'white',
                  }}
                >
                  <div>
                    <p className="text-sm font-semibold" style={{ color: deviceId === d.id ? 'white' : '#083D24' }}>
                      {d.brand} {d.model}
                    </p>
                    {d.serial_number && (
                      <p className="text-xs" style={{ color: deviceId === d.id ? '#566D62' : '#566D62' }}>
                        S/N: {d.serial_number}
                      </p>
                    )}
                  </div>
                  {deviceId === d.id && (
                    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 flex-shrink-0" stroke="white" strokeWidth={2.5}>
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}

          {selectedDevice && (
            <p className="text-xs text-brand-muted">
              Status: <span className="font-medium text-brand-ink">{selectedDevice.status.replace('_', ' ')}</span>
            </p>
          )}
        </div>

        {/* Recipient */}
        <div className="bg-white rounded-2xl p-4 space-y-3">
          <p className="text-[10px] tracking-widest text-brand-muted uppercase">Recipient</p>
          <div>
            <label className="text-[10px] tracking-widest text-brand-muted uppercase block mb-1.5">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={recipientEmail}
              onChange={e => setRecipientEmail(e.target.value)}
              placeholder="recipient@ecoledger.lr"
              className="w-full border border-brand-line rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#083D24] transition-colors"
            />
            <p className="text-xs text-brand-muted mt-1.5">The recipient must have an EcoLedger account.</p>
          </div>
        </div>

        {/* Transfer details */}
        <div className="bg-white rounded-2xl p-4 space-y-4">
          <p className="text-[10px] tracking-widest text-brand-muted uppercase">Transfer Details</p>

          <div>
            <label className="text-[10px] tracking-widest text-brand-muted uppercase block mb-1.5">
              Reason *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {REASONS.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setReason(r.value)}
                  className="py-2.5 px-3 rounded-xl border text-sm font-medium transition-all"
                  style={{
                    borderColor: reason === r.value ? '#083D24' : '#D7E0D5',
                    background: reason === r.value ? '#083D24' : 'white',
                    color: reason === r.value ? 'white' : '#083D24',
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {reason === 'resale' && (
            <div>
              <label className="text-[10px] tracking-widest text-brand-muted uppercase block mb-1.5">
                Sale Price (LRD)
              </label>
              <input
                type="number"
                min="0"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="e.g. 18000"
                className="w-full border border-brand-line rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#083D24] transition-colors"
              />
            </div>
          )}

          <div>
            <label className="text-[10px] tracking-widest text-brand-muted uppercase block mb-1.5">
              Condition Notes
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optional — describe current condition"
              rows={3}
              className="w-full border border-brand-line rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#083D24] transition-colors resize-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || !deviceId || !recipientEmail}
          className="w-full py-4 rounded-2xl text-sm font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: '#083D24', color: 'white' }}
        >
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Initiating…</> : 'Initiate Transfer'}
        </button>
      </form>
    </div>
  )
}
