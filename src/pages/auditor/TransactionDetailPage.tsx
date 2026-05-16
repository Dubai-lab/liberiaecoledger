import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search, Cpu, ArrowLeftRight, Recycle, ShieldAlert, Tag,
  CheckCircle, Clock, AlertTriangle, ExternalLink, Loader2, Package,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Device, DeviceLifecycleEvent } from '@/types/database'

interface FullDevice extends Device {
  lifecycle: DeviceLifecycleEvent[]
}

const EVENT_META: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  manufactured: { label: 'Manufactured',  color: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-200', icon: <Tag className="w-4 h-4" /> },
  registered:   { label: 'Registered',    color: 'text-indigo-700', bg: 'bg-indigo-50',  border: 'border-indigo-200', icon: <Cpu className="w-4 h-4" /> },
  transferred:  { label: 'Transferred',   color: 'text-yellow-700', bg: 'bg-yellow-50',  border: 'border-yellow-200', icon: <ArrowLeftRight className="w-4 h-4" /> },
  disposed:     { label: 'Disposed',      color: 'text-eco-700',    bg: 'bg-eco-50',     border: 'border-eco-200', icon: <Recycle className="w-4 h-4" /> },
  flagged:      { label: 'Flagged',       color: 'text-red-700',    bg: 'bg-red-50',     border: 'border-red-200', icon: <ShieldAlert className="w-4 h-4" /> },
}

const STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  in_use:              { label: 'In Use',              color: 'text-blue-700',   icon: <CheckCircle className="w-4 h-4" /> },
  awaiting_transfer:   { label: 'Awaiting Transfer',   color: 'text-yellow-700', icon: <Clock className="w-4 h-4" /> },
  ready_for_disposal:  { label: 'Ready for Disposal',  color: 'text-orange-700', icon: <AlertTriangle className="w-4 h-4" /> },
  disposed:            { label: 'Disposed',            color: 'text-eco-700',    icon: <Recycle className="w-4 h-4" /> },
  flagged:             { label: 'Flagged',             color: 'text-red-700',    icon: <ShieldAlert className="w-4 h-4" /> },
}

function fmtDate(d: string) {
  return new Date(d).toLocaleString('en-LR', { dateStyle: 'medium', timeStyle: 'short' })
}

function MaterialRow({ label, value, unit }: { label: string; value: number; unit: string }) {
  if (!value) return null
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value.toFixed(2)} {unit}</span>
    </div>
  )
}

export function TransactionDetailPage() {
  const [query, setQuery] = useState('')
  const [device, setDevice] = useState<FullDevice | null>(null)
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    setLoading(true)
    setNotFound(false)
    setDevice(null)

    // Search by serial number, IMEI, or device ID prefix
    const { data } = await supabase
      .from('devices')
      .select('*')
      .or(`serial_number.ilike.%${q}%,imei.ilike.%${q}%,id.eq.${q.length === 36 ? q : '00000000-0000-0000-0000-000000000000'}`)
      .limit(1)
      .maybeSingle()

    if (!data) {
      setNotFound(true)
      setLoading(false)
      return
    }

    const { data: lifecycle } = await supabase
      .from('device_lifecycle')
      .select('*')
      .eq('device_id', data.id)
      .order('created_at', { ascending: true })

    setDevice({ ...data, lifecycle: lifecycle ?? [] })
    setLoading(false)
  }

  const statusMeta = device ? STATUS_META[device.status] : null

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs text-muted-foreground tracking-widest uppercase mb-0.5">NGO / Auditor</p>
        <h1 className="text-2xl font-semibold">Transaction Detail</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Look up any device by serial number or IMEI to view its full immutable lifecycle.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Enter serial number or IMEI…"
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-colors"
          style={{ background: '#0f1410' }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Lookup
        </button>
      </form>

      {/* Not found */}
      {notFound && (
        <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl mb-6">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <p className="text-sm text-yellow-800">No device found matching <strong>{query}</strong>. Check the serial number or IMEI and try again.</p>
        </div>
      )}

      {/* Device result */}
      {device && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {/* Device header card */}
          <div className="bg-white border border-border rounded-xl p-5 mb-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                <Package className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <h2 className="text-lg font-semibold">{device.brand} {device.model}</h2>
                  {statusMeta && (
                    <span className={`flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium bg-muted ${statusMeta.color}`}>
                      {statusMeta.icon}
                      {statusMeta.label}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{device.category}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
              {[
                { label: 'Serial No.', value: device.serial_number ?? '—' },
                { label: 'IMEI',       value: device.imei ?? '—' },
                { label: 'Year',       value: device.manufacture_year?.toString() ?? '—' },
                { label: 'Hazard',     value: device.hazard_class.replace(/_/g, ' ') },
              ].map(f => (
                <div key={f.label}>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{f.label}</p>
                  <p className="text-sm font-medium mt-0.5 capitalize">{f.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            {/* Recoverable materials */}
            <div className="bg-white border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-3">Recoverable Materials</h3>
              <MaterialRow label="Gold"      value={device.material_gold_g}      unit="g" />
              <MaterialRow label="Copper"    value={device.material_copper_g}    unit="g" />
              <MaterialRow label="Aluminum"  value={device.material_aluminum_g}  unit="g" />
              <MaterialRow label="Lithium"   value={device.material_lithium_g}   unit="g" />
              <MaterialRow label="Cobalt"    value={device.material_cobalt_g}    unit="g" />
              <MaterialRow label="Lead"      value={device.material_lead_g}      unit="g" />
              {!device.material_gold_g && !device.material_copper_g && !device.material_aluminum_g && (
                <p className="text-xs text-muted-foreground">No material data recorded.</p>
              )}
            </div>

            {/* CO₂ + blockchain */}
            <div className="bg-white border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-3">Environmental & Chain</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">CO₂ Avoided</span>
                  <span className="text-sm font-medium">{device.co2_kg_avoided} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Registered</span>
                  <span className="text-sm font-medium">{fmtDate(device.created_at)}</span>
                </div>
                {device.receipt_ipfs_hash && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Receipt (IPFS)</span>
                    <a
                      href={`https://gateway.pinata.cloud/ipfs/${device.receipt_ipfs_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-mono text-eco-700 hover:underline"
                    >
                      {device.receipt_ipfs_hash.slice(0, 12)}…
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {device.chain_tx_hash && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Tx Hash</span>
                    <a
                      href={`https://amoy.polygonscan.com/tx/${device.chain_tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-mono text-eco-700 hover:underline"
                    >
                      {device.chain_tx_hash.slice(0, 10)}…
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Lifecycle timeline */}
          <div className="bg-white border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-4">Lifecycle Timeline ({device.lifecycle.length} events)</h3>
            {device.lifecycle.length === 0 ? (
              <p className="text-sm text-muted-foreground">No lifecycle events recorded yet.</p>
            ) : (
              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
                <div className="space-y-4">
                  {device.lifecycle.map((ev, i) => {
                    const meta = EVENT_META[ev.event_type] ?? EVENT_META.registered
                    return (
                      <div key={ev.id} className="flex gap-4 relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 z-10 ${meta.bg} ${meta.border} ${meta.color}`}>
                          {meta.icon}
                        </div>
                        <div className="flex-1 min-w-0 pt-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium">{meta.label}</p>
                            {ev.tx_hash && (
                              <a
                                href={`https://amoy.polygonscan.com/tx/${ev.tx_hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] font-mono text-muted-foreground hover:text-eco-700 transition-colors flex items-center gap-0.5"
                              >
                                {ev.tx_hash.slice(0, 10)}…
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {ev.actor_name ?? 'Unknown'}
                            {ev.location && ` · ${ev.location}`}
                            {' · '}{fmtDate(ev.created_at)}
                          </p>
                          {Object.keys(ev.metadata ?? {}).length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {Object.entries(ev.metadata).slice(0, 4).map(([k, v]) => (
                                <span key={k} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                                  {k}: {String(v)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {i < device.lifecycle.length - 1 && (
                          <div className="absolute left-5 top-10 bottom-0 w-px bg-border -z-0" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {!device && !loading && !notFound && (
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Search className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Enter a device serial number or IMEI to view its full blockchain record.</p>
        </div>
      )}
    </div>
  )
}
