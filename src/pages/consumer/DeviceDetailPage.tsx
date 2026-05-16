import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Cpu, Loader2, CheckCircle2, Clock, Send,
  Trash2, AlertTriangle, ExternalLink, Package, Leaf,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import type { Device, DeviceLifecycleEvent } from '@/types/database'

const STATUS_COLORS: Record<string, string> = {
  in_use:             'bg-green-100 text-green-700',
  awaiting_transfer:  'bg-yellow-100 text-yellow-700',
  ready_for_disposal: 'bg-orange-100 text-orange-700',
  disposed:           'bg-gray-100 text-gray-500',
  flagged:            'bg-red-100 text-red-700',
}

const STATUS_LABEL: Record<string, string> = {
  in_use:             'In Use',
  awaiting_transfer:  'Awaiting Transfer',
  ready_for_disposal: 'Ready for Disposal',
  disposed:           'Disposed',
  flagged:            'Flagged',
}

const EVENT_ICON: Record<string, React.ReactNode> = {
  manufactured: <Package className="w-3.5 h-3.5" />,
  registered:   <CheckCircle2 className="w-3.5 h-3.5" />,
  transferred:  <Send className="w-3.5 h-3.5" />,
  disposed:     <Trash2 className="w-3.5 h-3.5" />,
  flagged:      <AlertTriangle className="w-3.5 h-3.5" />,
}

const HAZARD_LABEL: Record<string, string> = {
  none:          'None',
  li_ion_battery: 'Lithium-Ion Battery',
  mercury_ccfl:  'Mercury / CCFL',
  toner:         'Toner Cartridge',
  mixed:         'Mixed Hazardous',
}

interface OwnerProfile { full_name: string | null; organization: string | null; email: string | null }

export function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [device, setDevice] = useState<Device | null>(null)
  const [events, setEvents] = useState<DeviceLifecycleEvent[]>([])
  const [originalOwner, setOriginalOwner] = useState<OwnerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)

  const load = useCallback(async () => {
    if (!id || !profile) return

    const [{ data: dev }, { data: evts }] = await Promise.all([
      supabase.from('devices').select('*').eq('id', id).eq('current_owner_id', profile.id).maybeSingle(),
      supabase.from('device_lifecycle').select('*').eq('device_id', id).order('created_at', { ascending: true }),
    ])

    if (!dev) { navigate('/consumer', { replace: true }); return }

    setDevice(dev)
    setEvents(evts ?? [])

    if (dev.original_owner_id !== profile.id) {
      const { data: orig } = await supabase
        .from('profiles')
        .select('full_name, organization, email')
        .eq('id', dev.original_owner_id)
        .maybeSingle()
      setOriginalOwner(orig)
    }

    setLoading(false)
  }, [id, profile, navigate])

  useEffect(() => { load() }, [load])

  const markForDisposal = async () => {
    if (!device) return
    setActing(true)
    const { error } = await supabase
      .from('devices')
      .update({ status: 'ready_for_disposal' })
      .eq('id', device.id)
    if (error) { toast.error(error.message) }
    else {
      toast.success('Device marked for disposal. A certified recycler will pick it up.')
      load()
    }
    setActing(false)
  }

  const MATERIALS = [
    { label: 'Gold',     value: device?.material_gold_g,     color: '#b45309' },
    { label: 'Copper',   value: device?.material_copper_g,   color: '#b91c1c' },
    { label: 'Aluminum', value: device?.material_aluminum_g, color: '#1d4ed8' },
    { label: 'Lithium',  value: device?.material_lithium_g,  color: '#6d28d9' },
    { label: 'Cobalt',   value: device?.material_cobalt_g,   color: '#0e7490' },
    { label: 'Lead',     value: device?.material_lead_g,     color: '#4b5563' },
  ].filter(m => (m.value ?? 0) > 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!device) return null

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Back + header */}
      <div>
        <Link to="/consumer" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> My Devices
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
              <Cpu className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">{device.brand} {device.model}</h1>
              <p className="text-sm text-muted-foreground">{device.category}</p>
            </div>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${STATUS_COLORS[device.status]}`}>
            {STATUS_LABEL[device.status]}
          </span>
        </div>
      </div>

      {/* Device info */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-border p-6">
        <h2 className="text-sm font-semibold mb-4">Device Information</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Brand', value: device.brand },
            { label: 'Model', value: device.model },
            { label: 'Category', value: device.category },
            { label: 'Year', value: device.manufacture_year?.toString() ?? '—' },
            { label: 'Serial Number', value: device.serial_number ?? '—' },
            { label: 'IMEI', value: device.imei ?? '—' },
            { label: 'Hazard Class', value: HAZARD_LABEL[device.hazard_class] ?? device.hazard_class },
            { label: 'Retailer', value: device.retailer_name ?? '—' },
            { label: 'Purchase Price', value: device.purchase_price_lrd ? `LRD ${device.purchase_price_lrd.toLocaleString()}` : '—' },
          ].map(row => (
            <div key={row.label}>
              <p className="text-xs text-muted-foreground mb-0.5">{row.label}</p>
              <p className="text-sm font-medium truncate">{row.value}</p>
            </div>
          ))}
        </div>

        {originalOwner && (
          <div className="mt-5 pt-5 border-t border-border">
            <p className="text-xs text-muted-foreground mb-1">Originally registered by</p>
            <p className="text-sm font-medium">{originalOwner.organization ?? originalOwner.full_name ?? originalOwner.email ?? 'Unknown'}</p>
          </div>
        )}
      </motion.div>

      {/* Lifecycle timeline */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-xl border border-border p-6">
        <h2 className="text-sm font-semibold mb-5">Lifecycle History</h2>

        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No lifecycle events recorded yet.</p>
        ) : (
          <div className="relative">
            <div className="absolute left-3.5 top-4 bottom-4 w-px bg-border" />
            <div className="space-y-5">
              {events.map((evt, i) => (
                <div key={evt.id} className="flex items-start gap-4 relative">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                    i === events.length - 1 ? 'bg-[#2f6b3a] text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    {EVENT_ICON[evt.event_type] ?? <Clock className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium capitalize">{evt.event_type}</p>
                      {evt.actor_name && <span className="text-xs text-muted-foreground">by {evt.actor_name}</span>}
                      {evt.location && <span className="text-xs text-muted-foreground">· {evt.location}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(evt.created_at).toLocaleDateString('en-LR', { dateStyle: 'medium' })}
                    </p>
                    {evt.tx_hash && (
                      <a
                        href={`https://amoy.polygonscan.com/tx/${evt.tx_hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-eco-700 hover:underline mt-1"
                      >
                        View on Polygon <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Material composition */}
      {MATERIALS.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Leaf className="w-4 h-4 text-eco-700" />
            <h2 className="text-sm font-semibold">Recoverable Materials</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">These materials will be recovered when this device is properly recycled.</p>
          <div className="grid grid-cols-3 gap-3">
            {MATERIALS.map(m => (
              <div key={m.label} className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-base font-bold" style={{ color: m.color }}>{m.value?.toFixed(2)}g</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* IPFS Receipt */}
      {device.receipt_ipfs_hash && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.11 }} className="bg-white rounded-xl border border-border p-6">
          <h2 className="text-sm font-semibold mb-3">Purchase Receipt (IPFS)</h2>
          <p className="text-xs text-muted-foreground mb-2">Your receipt is permanently stored on IPFS — it cannot be altered or deleted.</p>
          <div className="flex items-center justify-between bg-muted rounded-lg px-3 py-2.5">
            <span className="text-xs font-mono text-muted-foreground truncate">{device.receipt_ipfs_hash}</span>
            <a
              href={`https://gateway.pinata.cloud/ipfs/${device.receipt_ipfs_hash}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs font-medium text-eco-700 hover:underline ml-3 flex-shrink-0"
            >
              View <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </motion.div>
      )}

      {/* On-chain info */}
      {device.chain_tx_hash && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="bg-white rounded-xl border border-border p-6">
          <h2 className="text-sm font-semibold mb-3">Blockchain Record</h2>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Transaction Hash</p>
              <p className="text-xs font-mono break-all">{device.chain_tx_hash}</p>
            </div>
            {device.block_number && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Block Number</p>
                <p className="text-sm font-medium">{device.block_number.toLocaleString()}</p>
              </div>
            )}
            <a
              href={`https://amoy.polygonscan.com/tx/${device.chain_tx_hash}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium text-eco-700 hover:underline mt-2"
            >
              View on Polygon Amoy <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </motion.div>
      )}

      {/* Actions */}
      {device.status === 'in_use' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-xl border border-border p-6">
          <h2 className="text-sm font-semibold mb-1">Actions</h2>
          <p className="text-xs text-muted-foreground mb-4">Manage this device's next step in its lifecycle.</p>
          <div className="flex gap-3 flex-wrap">
            <Link
              to={`/consumer/transfer`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-border bg-white hover:bg-muted/30 transition-colors"
            >
              <Send className="w-4 h-4" /> Transfer Ownership
            </Link>
            <button
              type="button"
              onClick={markForDisposal}
              disabled={acting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors disabled:opacity-50"
            >
              {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Mark for Disposal
            </button>
          </div>
        </motion.div>
      )}

      {device.status === 'ready_for_disposal' && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Trash2 className="w-4 h-4 text-orange-600" />
            <p className="text-sm font-medium text-orange-800">Awaiting certified recycler pickup</p>
          </div>
          <p className="text-xs text-orange-700">A licensed facility will collect this device. You'll earn EcoCredits once disposal is logged.</p>
        </div>
      )}

      {device.status === 'disposed' && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-green-700" />
            <p className="text-sm font-medium text-green-800">This device has been responsibly recycled</p>
          </div>
          <p className="text-xs text-green-700">EcoCredits have been issued. Thank you for keeping e-waste out of landfills.</p>
        </div>
      )}
    </div>
  )
}
