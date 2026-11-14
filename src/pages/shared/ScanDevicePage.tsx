import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ShieldCheck, ShieldAlert, Search, Loader2, ScanLine, UserRound, Factory, MapPin,
  Mail, Phone, Recycle, AlertTriangle, ExternalLink, ArrowRight, History,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { EXPLORER } from '@/lib/contracts'
import { QrScanner } from '@/components/scan/QrScanner'

type ScanResult = {
  found: boolean
  device?: {
    id: string; brand: string; model: string; category: string | null; imei: string | null
    serial_number: string | null; manufacture_year: number | null; status: string
    hazard_class: string | null; registered_at: string; chain_tx_hash: string | null
  }
  verified?: boolean
  manufacturer?: string | null
  owner?: {
    name: string; person: string | null; roles: string[]; city: string | null; is_you: boolean
    email: string | null; phone: string | null; since: string | null
  } | null
  lifecycle?: { event_type: string; actor_name: string | null; location: string | null; tx_hash: string | null; created_at: string }[]
  open_flags?: { flag_type: string; severity: string | null; status: string | null; created_at: string }[]
  disposal?: { disposal_type: string; facility: string | null; city: string | null; final_mass_kg: number | null; eco_credits_awarded: number | null; tx_hash: string | null; created_at: string } | null
  viewer?: { roles: string[]; is_owner: boolean }
}

const STATUS: Record<string, { label: string; cls: string }> = {
  manufactured:       { label: 'In manufacturer stock', cls: 'bg-blue-50 text-blue-700' },
  in_use:             { label: 'In use',                cls: 'bg-brand-tint text-brand' },
  registered:         { label: 'Registered',            cls: 'bg-brand-tint text-brand' },
  transferred:        { label: 'Transferred',           cls: 'bg-brand-tint text-brand' },
  ready_for_disposal: { label: 'Ready for disposal',    cls: 'bg-amber-50 text-amber-700' },
  disposed:           { label: 'Disposed',              cls: 'bg-gray-100 text-gray-600' },
}
const EVENT_LABEL: Record<string, string> = {
  manufactured: 'Manufactured', registered: 'Registered by owner', transferred: 'Ownership transferred',
  ready_for_disposal: 'Marked for disposal', disposed: 'Recycled / disposed', flagged: 'Compliance flag',
}
const ROLE_LABEL: Record<string, string> = {
  consumer: 'Consumer', manufacturer: 'Manufacturer', recycler: 'Recycler',
  regulator: 'Regulator', auditor: 'Auditor', admin: 'Admin',
}

const fmtDate = (s?: string | null) => (s ? new Date(s).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—')
const pretty = (s?: string | null) => (s ? s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—')

export function ScanDevicePage() {
  const { activeRole } = useAuth()
  const role = activeRole ?? 'consumer'
  const [scanning, setScanning] = useState(true)
  const [manual, setManual] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ScanResult | null>(null)

  const lookup = async (code: string) => {
    const clean = code.trim()
    if (!clean) return
    setScanning(false)
    setBusy(true)
    setError(null)
    setResult(null)
    const { data, error } = await (supabase.rpc as any)('scan_device', { p_code: clean })
    setBusy(false)
    if (error) { setError(error.message); return }
    const r = data as ScanResult
    if (!r?.found) { setError('This code is not on EcoLedger. The device may be unregistered or counterfeit.'); return }
    setResult(r)
  }

  const reset = () => { setResult(null); setError(null); setManual(''); setScanning(true) }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5">
      <div>
        <p className="text-xs tracking-widest uppercase text-brand-muted">{ROLE_LABEL[role] ?? 'EcoLedger'}</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-ink mt-1">Scan Device</h1>
        <p className="text-sm text-brand-muted mt-1">
          Scan a device's EcoLedger QR code to check it is verified and see its current owner and full history.
        </p>
      </div>

      {/* Scanner / scan again */}
      {scanning ? (
        <QrScanner active={scanning} onScan={lookup} />
      ) : (
        <button
          type="button"
          onClick={reset}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-brand text-white font-semibold active:opacity-80"
        >
          <ScanLine className="w-5 h-5" /> Scan another device
        </button>
      )}

      {/* Manual entry */}
      <form
        onSubmit={e => { e.preventDefault(); lookup(manual) }}
        className="flex gap-2"
      >
        <input
          value={manual}
          onChange={e => setManual(e.target.value)}
          placeholder="Or type IMEI, serial number or device ID"
          className="flex-1 min-w-0 bg-white border border-brand-line rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          autoCapitalize="characters"
          autoCorrect="off"
        />
        <button
          type="submit"
          disabled={busy || !manual.trim()}
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 rounded-xl bg-white border border-brand-line text-brand font-semibold text-sm disabled:opacity-40"
        >
          <Search className="w-4 h-4" /> Check
        </button>
      </form>

      {busy && (
        <div className="flex items-center justify-center gap-2 py-8 text-brand-muted text-sm">
          <Loader2 className="w-5 h-5 animate-spin" /> Looking up the ledger…
        </div>
      )}

      {error && (
        <div className="flex gap-3 items-start bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Not verified</p>
            <p className="text-sm mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {result?.device && <ResultView r={result} role={role} />}
    </div>
  )
}

function ResultView({ r, role }: { r: ScanResult; role: string }) {
  const d = r.device!
  const st = STATUS[d.status] ?? { label: pretty(d.status), cls: 'bg-gray-100 text-gray-600' }
  const flags = r.open_flags ?? []

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Verification banner */}
      <div className={`flex gap-3 items-center rounded-2xl p-4 ${r.verified ? 'bg-brand text-white' : 'bg-amber-50 border border-amber-200 text-amber-800'}`}>
        {r.verified ? <ShieldCheck className="w-7 h-7 flex-shrink-0" /> : <AlertTriangle className="w-7 h-7 flex-shrink-0" />}
        <div className="min-w-0">
          <p className="font-semibold">{r.verified ? 'Verified device' : 'Registered by owner'}</p>
          <p className={`text-xs mt-0.5 ${r.verified ? 'text-white/75' : ''}`}>
            {r.verified
              ? `In the manufacturer registry${r.manufacturer ? ` · ${r.manufacturer}` : ''}`
              : 'Not from the manufacturer registry (general e-waste registered directly by its owner).'}
          </p>
        </div>
      </div>

      {flags.length > 0 && (
        <div className="flex gap-3 items-start bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">{flags.length} open compliance flag{flags.length > 1 ? 's' : ''}</p>
            <p className="mt-0.5">{flags.map(f => pretty(f.flag_type)).join(', ')}</p>
          </div>
        </div>
      )}

      {/* Device */}
      <section className="bg-white border border-brand-line rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-brand-ink truncate">{d.brand} {d.model}</h2>
            <p className="text-sm text-brand-muted">{d.category ?? 'Device'}{d.manufacture_year ? ` · ${d.manufacture_year}` : ''}</p>
          </div>
          <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${st.cls}`}>{st.label}</span>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 mt-4 text-sm">
          <Field label="IMEI" value={d.imei} mono />
          <Field label="Serial number" value={d.serial_number} mono />
          <Field label="Hazard class" value={pretty(d.hazard_class)} />
          <Field label="On EcoLedger since" value={fmtDate(d.registered_at)} />
        </dl>
        {d.chain_tx_hash && (
          <a href={`${EXPLORER}/tx/${d.chain_tx_hash}`} target="_blank" rel="noreferrer"
             className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand">
            View on blockchain <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </section>

      {/* Owner */}
      <section className="bg-white border border-brand-line rounded-2xl p-5">
        <h3 className="text-xs tracking-widest uppercase text-brand-muted mb-3">Current owner</h3>
        {r.owner ? (
          <div className="flex gap-3">
            <div className="w-11 h-11 rounded-full bg-brand-tint flex items-center justify-center flex-shrink-0">
              {r.owner.roles.includes('manufacturer') ? <Factory className="w-5 h-5 text-brand" /> : <UserRound className="w-5 h-5 text-brand" />}
            </div>
            <div className="min-w-0 space-y-1 text-sm">
              <p className="font-semibold text-brand-ink">
                {r.owner.name}{r.owner.is_you && <span className="ml-2 text-xs font-medium text-brand bg-brand-tint px-2 py-0.5 rounded-full">You</span>}
              </p>
              <p className="text-brand-muted">
                {r.owner.roles.map(x => ROLE_LABEL[x] ?? x).join(' · ') || 'EcoLedger user'}
                {r.owner.since && ` · owner since ${fmtDate(r.owner.since)}`}
              </p>
              {r.owner.city && <p className="flex items-center gap-1.5 text-brand-muted"><MapPin className="w-3.5 h-3.5" />{r.owner.city}</p>}
              {r.owner.email && <a href={`mailto:${r.owner.email}`} className="flex items-center gap-1.5 text-brand break-all"><Mail className="w-3.5 h-3.5 flex-shrink-0" />{r.owner.email}</a>}
              {r.owner.phone && <a href={`tel:${r.owner.phone}`} className="flex items-center gap-1.5 text-brand"><Phone className="w-3.5 h-3.5" />{r.owner.phone}</a>}
            </div>
          </div>
        ) : (
          <p className="text-sm text-brand-muted">No current owner on record.</p>
        )}
      </section>

      {/* Disposal */}
      {r.disposal && (
        <section className="bg-white border border-brand-line rounded-2xl p-5">
          <h3 className="text-xs tracking-widest uppercase text-brand-muted mb-3 flex items-center gap-1.5"><Recycle className="w-3.5 h-3.5" /> Disposal record</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Field label="Facility" value={[r.disposal.facility, r.disposal.city].filter(Boolean).join(', ') || null} />
            <Field label="Method" value={pretty(r.disposal.disposal_type)} />
            <Field label="Mass" value={r.disposal.final_mass_kg != null ? `${r.disposal.final_mass_kg} kg` : null} />
            <Field label="EcoCredits awarded" value={r.disposal.eco_credits_awarded != null ? `${r.disposal.eco_credits_awarded} EC` : null} />
          </dl>
        </section>
      )}

      {/* Lifecycle */}
      <section className="bg-white border border-brand-line rounded-2xl p-5">
        <h3 className="text-xs tracking-widest uppercase text-brand-muted mb-4 flex items-center gap-1.5"><History className="w-3.5 h-3.5" /> Lifecycle</h3>
        {(r.lifecycle ?? []).length === 0 ? (
          <p className="text-sm text-brand-muted">No events yet.</p>
        ) : (
          <ol className="relative border-l-2 border-brand-line ml-1.5 space-y-4">
            {r.lifecycle!.map((e, i) => (
              <li key={i} className="pl-5 relative">
                <span className={`absolute -left-[7px] top-1 w-3 h-3 rounded-full ring-4 ring-white ${i === r.lifecycle!.length - 1 ? 'bg-brand' : 'bg-brand-sage'}`} />
                <p className="text-sm font-semibold text-brand-ink">{EVENT_LABEL[e.event_type] ?? pretty(e.event_type)}</p>
                <p className="text-xs text-brand-muted">
                  {fmtDate(e.created_at)}{e.actor_name ? ` · ${e.actor_name}` : ''}{e.location ? ` · ${e.location}` : ''}
                </p>
                {e.tx_hash && (
                  <a href={`${EXPLORER}/tx/${e.tx_hash}`} target="_blank" rel="noreferrer" className="text-[11px] font-mono text-brand break-all">
                    {e.tx_hash.slice(0, 10)}…{e.tx_hash.slice(-6)}
                  </a>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Role actions */}
      {role === 'consumer' && r.viewer?.is_owner && (
        <Action to={`/consumer/devices/${d.id}`} label="Open my device" />
      )}
      {role === 'recycler' && d.status === 'ready_for_disposal' && (
        <Action to={`/recycler/disposal?device=${d.id}`} label="Log disposal for this device" />
      )}
      {role === 'regulator' && flags.length > 0 && (
        <Action to="/regulator/flags" label="Review flagged cases" />
      )}
    </motion.div>
  )
}

function Field({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] tracking-wider uppercase text-brand-muted">{label}</dt>
      <dd className={`mt-0.5 text-brand-ink break-all ${mono ? 'font-mono text-[13px]' : ''}`}>{value || '—'}</dd>
    </div>
  )
}

function Action({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border-2 border-brand text-brand font-semibold active:opacity-80">
      {label} <ArrowRight className="w-4 h-4" />
    </Link>
  )
}
