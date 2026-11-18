import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { usePlatformRates } from '@/lib/rates'
import { toast } from 'sonner'
import type { Device } from '@/types/database'

const REASONS = [
  { value: 'resale',           label: 'Resale' },
  { value: 'donation',         label: 'Donation' },
  { value: 'gift',             label: 'Gift' },
  { value: 'warranty_return',  label: 'Warranty Return' },
]

export function TransferDevicePage() {
  const { profile } = useAuth()
  const { values: rates } = usePlatformRates()
  const transferCredits = Math.round(rates.credits_transfer ?? 0)
  const navigate = useNavigate()
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(false)
  const [deviceId, setDeviceId] = useState('')
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
      .then(({ data }) => setDevices((data as Device[]) ?? []))
  }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile || !deviceId) return
    setLoading(true)

    try {
      // One secure step in the database: checks you own the device and the
      // recipient has an account, then creates the pending transfer.
      const { error } = await (supabase.rpc as any)('initiate_transfer', {
        p_device_id: deviceId,
        p_recipient_email: recipientEmail.toLowerCase().trim(),
        p_reason: reason,
        p_sale_price_lrd: price ? Number(price) : null,
        p_condition_notes: notes || null,
      })
      if (error) throw new Error(error.message)

      toast.success(transferCredits > 0
        ? `Transfer sent. The device moves to the new owner once they accept, and you earn ${transferCredits} EcoCredits.`
        : 'Transfer sent. The device moves to the new owner once they accept it.')
      navigate('/consumer')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Transfer failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <button
        type="button"
        onClick={() => navigate('/consumer')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        My Devices
      </button>

      <div className="mb-6">
        <p className="text-xs text-muted-foreground tracking-widest uppercase mb-0.5">Consumer</p>
        <h1 className="text-2xl font-semibold">Transfer a Device</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Transferring ownership creates an immutable record on the EcoLedger chain.
        </p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <section className="bg-white border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold">Device</h2>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Select Device *</label>
            <select
              required
              value={deviceId}
              onChange={e => setDeviceId(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors"
            >
              <option value="">Choose a device…</option>
              {devices.map(d => (
                <option key={d.id} value={d.id}>
                  {d.brand} {d.model}{d.serial_number ? ` (${d.serial_number})` : ''}
                </option>
              ))}
            </select>
            {devices.length === 0 && (
              <p className="text-xs text-muted-foreground">No eligible devices found.</p>
            )}
          </div>
        </section>

        <section className="bg-white border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold">Recipient</h2>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recipient Email *</label>
            <input
              type="email"
              required
              value={recipientEmail}
              onChange={e => setRecipientEmail(e.target.value)}
              placeholder="recipient@ecoledger.lr"
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors"
            />
            <p className="text-xs text-muted-foreground">The recipient must have an EcoLedger account.</p>
          </div>
        </section>

        <section className="bg-white border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold">Transfer Details</h2>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reason *</label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors"
            >
              {REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          {reason === 'resale' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sale Price (LRD)</label>
              <input
                type="number"
                min="0"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="e.g. 18000"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Condition Notes</label>
            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optional — describe current condition"
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors"
            />
          </div>
        </section>

        <button
          type="submit"
          disabled={loading || !deviceId || !recipientEmail}
          className="w-full py-3 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ background: '#063921', color: '#FFFFFF' }}
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Initiating…</> : 'Initiate Transfer'}
        </button>
      </motion.form>
    </div>
  )
}
