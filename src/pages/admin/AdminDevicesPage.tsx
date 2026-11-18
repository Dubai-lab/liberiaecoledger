import { useState, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { Search, Loader2, Trash2, Cpu, ShieldCheck, X, AlertTriangle, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

type AdminDevice = {
  id: string; brand: string; model: string; category: string | null; imei: string | null
  serial_number: string | null; status: string; manufacture_year: number | null; created_at: string
  chain_tx_hash: string | null; owner_id: string | null; owner_name: string; owner_email: string | null
  manufacturer_name: string | null; verified: boolean
  events: number; transfers: number; disposals: number; credits: number; flags: number
}

type Impact = {
  device: string; events: number; transfers: number; disposals: number
  flags: number; credits: number; on_chain: boolean
}

const STATUS: Record<string, { label: string; cls: string }> = {
  in_use:             { label: 'In use',             cls: 'bg-green-100 text-green-700' },
  awaiting_transfer:  { label: 'Awaiting transfer',  cls: 'bg-yellow-100 text-yellow-700' },
  ready_for_disposal: { label: 'Ready for disposal', cls: 'bg-orange-100 text-orange-700' },
  disposed:           { label: 'Disposed',           cls: 'bg-gray-100 text-gray-600' },
  flagged:            { label: 'Flagged',            cls: 'bg-red-100 text-red-700' },
}

export function AdminDevicesPage() {
  const [devices, setDevices] = useState<AdminDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [source, setSource] = useState<'all' | 'registry' | 'consumer'>('all')
  const [target, setTarget] = useState<AdminDevice | null>(null)
  const [impact, setImpact] = useState<Impact | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await (supabase.rpc as any)('admin_devices')
    if (error) toast.error(error.message)
    setDevices((data as AdminDevice[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => devices.filter(d => {
    const q = query.trim().toLowerCase()
    const matchQ = !q || [d.brand, d.model, d.imei, d.serial_number, d.owner_name, d.owner_email, d.manufacturer_name, d.id]
      .some(v => v?.toLowerCase().includes(q))
    const matchS = status === 'all' || d.status === status
    const matchSrc = source === 'all' || (source === 'registry' ? d.verified : !d.verified)
    return matchQ && matchS && matchSrc
  }), [devices, query, status, source])

  const askDelete = async (d: AdminDevice) => {
    setTarget(d)
    setImpact(null)
    const { data, error } = await (supabase.rpc as any)('admin_delete_device', { p_device_id: d.id, p_dry_run: true })
    if (error) { toast.error(error.message); setTarget(null); return }
    setImpact(data as Impact)
  }

  const confirmDelete = async () => {
    if (!target) return
    setDeleting(true)
    const { error } = await (supabase.rpc as any)('admin_delete_device', { p_device_id: target.id, p_dry_run: false })
    setDeleting(false)
    if (error) { toast.error(error.message); return }
    toast.success(`${target.brand} ${target.model} deleted`)
    setDevices(prev => prev.filter(x => x.id !== target.id))
    setTarget(null)
  }

  const counts = useMemo(() => ({
    total: devices.length,
    registry: devices.filter(d => d.verified).length,
    disposed: devices.filter(d => d.status === 'disposed').length,
  }), [devices])

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <p className="text-xs text-muted-foreground tracking-widest uppercase mb-0.5">Platform Admin</p>
          <h1 className="text-2xl font-semibold">Devices</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {counts.total} devices in the database · {counts.registry} from the manufacturer registry · {counts.disposed} disposed
          </p>
        </div>
        <button type="button" onClick={load} aria-label="Refresh"
          className="flex-shrink-0 w-9 h-9 rounded-lg border border-border bg-white flex items-center justify-center text-muted-foreground hover:text-foreground">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search brand, model, IMEI, serial, owner…"
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
        </div>
        <div className="grid grid-cols-2 sm:flex gap-2">
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="border border-border rounded-lg px-3 py-2.5 text-sm bg-white">
            <option value="all">All statuses</option>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={source} onChange={e => setSource(e.target.value as typeof source)}
            className="border border-border rounded-lg px-3 py-2.5 text-sm bg-white">
            <option value="all">All sources</option>
            <option value="registry">Manufacturer registry</option>
            <option value="consumer">Consumer-registered</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-border rounded-xl text-sm text-muted-foreground">
          {devices.length === 0 ? 'No devices in the database yet.' : 'No devices match these filters.'}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{filtered.length} shown</p>
          {filtered.map((d, i) => {
            const st = STATUS[d.status] ?? { label: d.status, cls: 'bg-gray-100 text-gray-600' }
            return (
              <motion.div key={d.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 12) * 0.02 }}
                className="bg-white border border-border rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-tint flex items-center justify-center flex-shrink-0">
                    <Cpu className="w-5 h-5 text-brand" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="font-medium text-sm">{d.brand} {d.model}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.cls}`}>{st.label}</span>
                      {d.verified && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium bg-brand-tint text-brand">
                          <ShieldCheck className="w-3 h-3" /> Registry
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 break-all">
                      {d.category ?? 'Device'}
                      {d.imei && ` · IMEI ${d.imei}`}
                      {d.serial_number && ` · SN ${d.serial_number}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Owner: <span className="text-foreground">{d.owner_name}</span>
                      {d.manufacturer_name && <> · Made by {d.manufacturer_name}</>}
                      {' · '}Added {new Date(d.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {d.events} events · {d.transfers} transfers · {d.disposals} disposals · {d.credits} EC{d.flags > 0 && ` · ${d.flags} flags`}
                    </p>
                  </div>
                  <button type="button" onClick={() => askDelete(d)} aria-label={`Delete ${d.brand} ${d.model}`}
                    className="flex-shrink-0 w-9 h-9 rounded-lg border border-red-200 bg-white flex items-center justify-center text-red-600 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Delete confirmation */}
      {target && createPortal(
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center sm:p-4"
          onClick={() => !deleting && setTarget(null)} role="dialog" aria-modal="true" aria-label="Delete device">
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6"
            style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Delete {target.brand} {target.model}?</h3>
                  <p className="text-xs text-muted-foreground">This permanently removes it from EcoLedger.</p>
                </div>
              </div>
              <button type="button" onClick={() => setTarget(null)} disabled={deleting} aria-label="Close" className="p-1 text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!impact ? (
              <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : (
              <>
                <p className="text-sm mb-2">This will also delete:</p>
                <ul className="text-sm space-y-1 bg-muted/40 rounded-xl p-4">
                  <li>{impact.events} lifecycle event{impact.events === 1 ? '' : 's'}</li>
                  <li>{impact.transfers} transfer record{impact.transfers === 1 ? '' : 's'}</li>
                  <li>{impact.disposals} disposal record{impact.disposals === 1 ? '' : 's'}</li>
                  <li>{impact.flags} compliance flag{impact.flags === 1 ? '' : 's'}</li>
                  <li>{impact.credits} EcoCredits earned from this device (removed from owners' balances)</li>
                </ul>
                {impact.on_chain && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">
                    This device was recorded on the Sepolia blockchain. That on-chain record is permanent and will remain.
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2 mt-5">
                  <button type="button" onClick={() => setTarget(null)} disabled={deleting}
                    className="py-2.5 rounded-xl border border-border text-sm font-medium">Cancel</button>
                  <button type="button" onClick={confirmDelete} disabled={deleting}
                    className="py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60">
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Delete device
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
