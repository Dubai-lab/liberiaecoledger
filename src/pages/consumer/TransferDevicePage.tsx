import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { relayTx, EXPLORER } from '@/lib/contracts'
import { useAuth } from '@/hooks/useAuth'
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
      // Resolve recipient by email (fetch wallet_address too for on-chain relay)
      const { data: recipient } = await supabase
        .from('profiles')
        .select('id, wallet_address')
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

      // Mark device as awaiting transfer
      await supabase
        .from('devices')
        .update({ status: 'awaiting_transfer' })
        .eq('id', deviceId)

      // Write immutable lifecycle event
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

      // Award 5 EcoCredits to sender
      await supabase.from('eco_credits').insert({
        user_id: profile.id,
        amount: 5,
        type: 'earned',
        source: 'transfer',
        device_id: deviceId,
        description: `Transferred ${selectedDevice?.brand ?? ''} ${selectedDevice?.model ?? ''} to new owner`,
      })

      await supabase.from('notifications').insert({
        user_id: profile.id,
        title: 'Transfer initiated — 5 EcoCredits earned!',
        body: `Your device transfer has been initiated. You earned 5 EC for responsible transfer.`,
        type: 'success',
        is_read: false,
        link: '/consumer/credits',
      })

      toast.success('Transfer initiated — 5 EcoCredits earned!')

      // Anchor on-chain via relay (non-fatal)
      if (profile.wallet_address) {
        toast.loading('Anchoring to Sepolia blockchain…', { id: 'relay' })
        const toAddr = (recipient as { id: string; wallet_address?: string | null }).wallet_address
        const result = await relayTx({
          action: 'transfer',
          deviceId,
          userWallet: profile.wallet_address,
          toWallet: toAddr ?? profile.wallet_address,
        })
        if (result) {
          toast.success(
            <span>On-chain confirmed! <a href={`${EXPLORER}/tx/${result.txHash}`} target="_blank" rel="noreferrer" className="underline">View tx</a></span>,
            { id: 'relay', duration: 6000 }
          )
        } else {
          toast.dismiss('relay')
        }
      }

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
          style={{ background: '#0f1410', color: '#fafaf7' }}
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Initiating…</> : 'Initiate Transfer'}
        </button>
      </motion.form>
    </div>
  )
}
