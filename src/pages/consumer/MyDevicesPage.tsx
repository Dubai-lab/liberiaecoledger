import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Cpu, ChevronRight, Loader2, Search,
  Send, CheckCircle, XCircle, Leaf, Recycle, ArrowRight,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import type { Device, Transfer } from '@/types/database'

const STATUS_COLORS: Record<string, string> = {
  in_use:             'bg-green-100 text-green-700',
  awaiting_transfer:  'bg-yellow-100 text-yellow-700',
  pending_intake:     'bg-orange-100 text-orange-700',
  ready_for_disposal: 'bg-orange-100 text-orange-700',
  disposed:           'bg-gray-100 text-gray-500',
  flagged:            'bg-red-100 text-red-700',
}

const STATUS_LABEL: Record<string, string> = {
  in_use:             'In Use',
  awaiting_transfer:  'Awaiting Transfer',
  pending_intake:     'Pending Recycler Acceptance',
  ready_for_disposal: 'Ready for Disposal',
  disposed:           'Disposed',
  flagged:            'Flagged',
}

const REASON_LABEL: Record<string, string> = {
  resale:          'Resale',
  donation:        'Donation',
  gift:            'Gift',
  warranty_return: 'Warranty Return',
}

interface IncomingTransfer extends Transfer {
  device: Pick<Device, 'id' | 'brand' | 'model' | 'category' | 'serial_number'>
  senderName: string
}

function fmt(n: number) { return new Intl.NumberFormat('en-LR').format(n) }

export function MyDevicesPage() {
  const { profile } = useAuth()
  const [devices, setDevices]   = useState<Device[]>([])
  const [incoming, setIncoming] = useState<IncomingTransfer[]>([])
  const [credits, setCredits]   = useState(0)
  const [loading, setLoading]   = useState(true)
  const [acting, setActing]     = useState<string | null>(null)
  const [query, setQuery]       = useState('')

  const load = useCallback(async () => {
    if (!profile) return

    const [{ data: devData }, { data: txData }, { data: creditData }] = await Promise.all([
      supabase.from('devices').select('*').eq('current_owner_id', profile.id).order('created_at', { ascending: false }),
      supabase.from('transfers').select('*').eq('to_user_id', profile.id).eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('eco_credits').select('amount, type').eq('user_id', profile.id),
    ])

    setDevices(devData ?? [])

    const earned   = (creditData ?? []).filter(c => c.type === 'earned' || c.type === 'bonus').reduce((s, c) => s + c.amount, 0)
    const redeemed = (creditData ?? []).filter(c => c.type === 'redeemed').reduce((s, c) => s + c.amount, 0)
    setCredits(earned - redeemed)

    if (txData && txData.length > 0) {
      const deviceIds  = txData.map(t => t.device_id)
      const senderIds  = txData.map(t => t.from_user_id)
      const [{ data: txDevices }, { data: senders }] = await Promise.all([
        supabase.from('devices').select('id, brand, model, category, serial_number').in('id', deviceIds),
        supabase.from('profiles').select('id, full_name, organization, email').in('id', senderIds),
      ])
      const devMap    = Object.fromEntries((txDevices ?? []).map(d => [d.id, d]))
      const senderMap = Object.fromEntries((senders ?? []).map(s => [s.id, s]))
      setIncoming(txData.map(t => ({
        ...t,
        device:     devMap[t.device_id] ?? { id: t.device_id, brand: 'Unknown', model: '', category: '', serial_number: null },
        senderName: senderMap[t.from_user_id]?.organization ?? senderMap[t.from_user_id]?.full_name ?? senderMap[t.from_user_id]?.email ?? 'Unknown',
      })))
    } else {
      setIncoming([])
    }

    setLoading(false)
  }, [profile])

  useEffect(() => { load() }, [load])

  const acceptTransfer = async (t: IncomingTransfer) => {
    if (!profile) return
    setActing(t.id)
    try {
      const { error: txErr } = await supabase.from('transfers').update({ status: 'confirmed' }).eq('id', t.id)
      if (txErr) throw txErr
      const { error: devErr } = await supabase.from('devices').update({ current_owner_id: profile.id, status: 'in_use' }).eq('id', t.device_id)
      if (devErr) throw devErr
      await supabase.from('device_lifecycle').insert({
        device_id:  t.device_id,
        event_type: 'transferred',
        actor_id:   profile.id,
        actor_name: profile.full_name ?? profile.email ?? 'Consumer',
        location:   profile.city ? `${profile.city}, Liberia` : 'Liberia',
        metadata:   { reason: t.reason, from_user_id: t.from_user_id, from_name: t.senderName, sale_price_lrd: t.sale_price_lrd, completed: true },
      })
      toast.success(`${t.device.brand} ${t.device.model} is now yours!`)
      load()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to accept transfer')
    } finally {
      setActing(null)
    }
  }

  const declineTransfer = async (t: IncomingTransfer) => {
    setActing(t.id)
    try {
      await Promise.all([
        supabase.from('transfers').update({ status: 'rejected' }).eq('id', t.id),
        supabase.from('devices').update({ status: 'in_use' }).eq('id', t.device_id),
      ])
      toast.success('Transfer declined.')
      load()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to decline transfer')
    } finally {
      setActing(null)
    }
  }

  const activeDevices   = devices.filter(d => d.status === 'in_use').length
  const disposedDevices = devices.filter(d => d.status === 'disposed').length

  const filtered = devices.filter(d =>
    !query || [d.brand, d.model, d.serial_number, d.imei]
      .some(v => v?.toLowerCase().includes(query.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* ── Welcome banner ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground tracking-widest uppercase mb-0.5">Consumer</p>
          <h1 className="text-2xl font-semibold">
            {profile?.full_name ? `Welcome, ${profile.full_name.split(' ')[0]}` : 'My Dashboard'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Track your devices and earn EcoCredits by recycling responsibly.</p>
        </div>
        <Link
          to="/consumer/register"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90 flex-shrink-0"
          style={{ background: '#0f1410' }}
        >
          <Plus className="w-4 h-4" />
          Register Device
        </Link>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
          className="bg-white border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Total Devices</span>
          </div>
          <p className="text-2xl font-semibold">{devices.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{activeDevices} active</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
          className="bg-eco-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Leaf className="w-4 h-4 text-white/70" />
            <span className="text-xs text-white/70">EcoCredits</span>
          </div>
          <p className="text-2xl font-semibold text-white">{fmt(credits)}</p>
          <Link to="/consumer/credits" className="text-xs text-white/70 hover:text-white transition-colors mt-0.5 flex items-center gap-1">
            View history <ArrowRight className="w-3 h-3" />
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          className="bg-white border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Recycle className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Recycled</span>
          </div>
          <p className="text-2xl font-semibold">{disposedDevices}</p>
          <p className="text-xs text-muted-foreground mt-0.5">device{disposedDevices !== 1 ? 's' : ''} disposed</p>
        </motion.div>
      </div>

      {/* ── Quick actions ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Transfer Device',  desc: 'Send to another user',          path: '/consumer/transfer',      icon: <Send className="w-4 h-4" /> },
          { label: 'EcoCredits',       desc: 'View balance & history',         path: '/consumer/credits',       icon: <Leaf className="w-4 h-4" /> },
          { label: 'Notifications',    desc: 'Alerts & updates',               path: '/consumer/notifications', icon: <Recycle className="w-4 h-4" /> },
        ].map((a, i) => (
          <motion.div key={a.path} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 + i * 0.05 }}>
            <Link to={a.path} className="flex items-start gap-3 p-4 bg-white border border-border rounded-xl hover:border-eco-700/40 hover:shadow-sm transition-all group">
              <span className="text-muted-foreground group-hover:text-eco-700 transition-colors mt-0.5">{a.icon}</span>
              <div>
                <p className="text-sm font-medium">{a.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{a.desc}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* ── Incoming transfers ── */}
      <AnimatePresence>
        {incoming.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <div className="flex items-center gap-2 mb-3">
              <Send className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-semibold">
                Incoming Transfers
                <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                  {incoming.length}
                </span>
              </h2>
            </div>
            <div className="space-y-2">
              {incoming.map(t => (
                <div key={t.id} className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Cpu className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{t.device.brand} {t.device.model}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t.device.category}{t.device.serial_number && ` · SN: ${t.device.serial_number}`}
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        From <strong>{t.senderName}</strong> · {REASON_LABEL[t.reason]}
                        {t.sale_price_lrd ? ` · LRD ${t.sale_price_lrd.toLocaleString()}` : ''}
                      </p>
                      {t.condition_notes && (
                        <p className="text-xs text-muted-foreground mt-0.5 italic">"{t.condition_notes}"</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button type="button" onClick={() => acceptTransfer(t)} disabled={acting === t.id}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[#0f1410] text-white hover:opacity-90 transition-opacity disabled:opacity-50">
                      {acting === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      Accept
                    </button>
                    <button type="button" onClick={() => declineTransfer(t)} disabled={acting === t.id}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white text-muted-foreground border border-border hover:text-foreground transition-colors disabled:opacity-50">
                      <XCircle className="w-3.5 h-3.5" /> Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Device list ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">My Devices</h2>
          {devices.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search…"
                className="pl-8 pr-3 py-1.5 text-xs border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors"
              />
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-border rounded-xl">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
              <Cpu className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-sm mb-1">{query ? 'No devices match your search' : 'No devices yet'}</p>
            <p className="text-xs text-muted-foreground mb-4">
              {query ? 'Try a different term.' : 'Register your first device to start tracking its lifecycle.'}
            </p>
            {!query && (
              <Link to="/consumer/register" className="text-xs font-medium hover:underline" style={{ color: '#2f6b3a' }}>
                Register a device →
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((device, i) => (
              <motion.div key={device.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Link
                  to={`/consumer/devices/${device.id}`}
                  className="flex items-center gap-4 p-4 bg-white border border-border rounded-xl hover:border-eco-700/40 hover:shadow-sm transition-all group"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#f5f5f2] flex items-center justify-center flex-shrink-0">
                    <Cpu className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium text-sm truncate">{device.brand} {device.model}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_COLORS[device.status]}`}>
                        {STATUS_LABEL[device.status]}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {device.category}
                      {device.serial_number && ` · SN: ${device.serial_number}`}
                      {device.imei && ` · IMEI: ${device.imei}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {device.chain_tx_hash && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-eco-50 text-eco-700 font-medium border border-eco-200">On-chain</span>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
