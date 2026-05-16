import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Loader2, Printer, ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'
import type { ComplianceFlag } from '@/types/database'

interface Device {
  id: string
  brand: string
  model: string
  status: string
  serial_number: string | null
  current_owner_id: string
}

interface LifecycleEvent {
  id: string
  event_type: string
  actor_name: string | null
  location: string | null
  created_at: string
  metadata: any
}

interface Profile {
  id: string
  full_name: string | null
  email: string | null
  organization: string | null
}

const FLAG_TYPE_LABEL: Record<string, string> = {
  unauthorized_export: 'Unauthorized Export',
  informal_collector:  'Informal Collector',
  unverified_disposal: 'Unverified Disposal',
  missing_owner:       'Missing Owner Record',
}

const ANOMALY_LABEL: Record<string, string> = {
  unauthorized_export: 'UNAUTHORIZED EXPORT',
  informal_collector:  'UNVERIFIED COLLECTOR',
  unverified_disposal: 'UNVERIFIED DISPOSAL',
  missing_owner:       'MISSING OWNER RECORD',
}

const ANOMALY_COLOR: Record<string, { bg: string; text: string }> = {
  unauthorized_export: { bg: '#fde8e8', text: '#c0392b' },
  informal_collector:  { bg: '#fde8e8', text: '#c0392b' },
  unverified_disposal: { bg: '#fdf3dc', text: '#b87a00' },
  missing_owner:       { bg: '#fde8e8', text: '#c0392b' },
}

const SEVERITY_STYLE: Record<string, { bg: string; text: string }> = {
  low:      { bg: '#f3f4f6', text: '#6b7280' },
  medium:   { bg: '#fdf3dc', text: '#b87a00' },
  high:     { bg: '#fde8d0', text: '#b85c00' },
  critical: { bg: '#fde8e8', text: '#c0392b' },
}

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  open:          { bg: '#fde8e8', text: '#c0392b' },
  investigating: { bg: '#fdf3dc', text: '#b87a00' },
  resolved:      { bg: '#e8f5ec', text: '#2d6a3f' },
  dismissed:     { bg: '#f3f4f6', text: '#6b7280' },
}

const EVENT_LABEL: Record<string, string> = {
  registered:  'Device registered',
  transferred: 'Ownership transferred',
  disposed:    'Disposal logged',
}

function caseId(flag: ComplianceFlag) {
  const year = new Date(flag.created_at).getFullYear()
  const suffix = flag.id.replace(/-/g, '').slice(-4).toUpperCase()
  return `INV-${year}-${suffix}`
}

function truncateWallet(id: string) {
  return `0x${id.slice(0, 4)}…${id.slice(-4)}`
}

function initials(name: string | null, email: string | null) {
  const n = name ?? email ?? '?'
  return n.slice(0, 2).toUpperCase()
}

export function FlagCaseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [flag, setFlag] = useState<ComplianceFlag | null>(null)
  const [device, setDevice] = useState<Device | null>(null)
  const [owner, setOwner] = useState<Profile | null>(null)
  const [lifecycle, setLifecycle] = useState<LifecycleEvent[]>([])
  const [stakeholders, setStakeholders] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      const { data: f } = await supabase
        .from('compliance_flags')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (!f) { setLoading(false); return }
      setFlag(f as ComplianceFlag)

      const promises: Promise<any>[] = []

      if (f.device_id) {
        promises.push(
          supabase.from('devices').select('id, brand, model, status, serial_number, current_owner_id').eq('id', f.device_id).maybeSingle()
            .then(({ data }) => {
              if (data) {
                setDevice(data as Device)
                return supabase.from('profiles').select('id, full_name, email, organization').eq('id', (data as Device).current_owner_id).maybeSingle()
                  .then(({ data: p }) => setOwner(p as Profile))
              }
            }),
          supabase.from('device_lifecycle').select('*').eq('device_id', f.device_id).order('created_at', { ascending: true })
            .then(({ data }) => setLifecycle((data ?? []) as LifecycleEvent[])),
        )
      }

      if (f.stakeholders_looped?.length) {
        promises.push(
          supabase.from('profiles').select('id, full_name, email, organization').in('id', f.stakeholders_looped)
            .then(({ data }) => setStakeholders((data ?? []) as Profile[])),
        )
      }

      await Promise.all(promises)
      setLoading(false)
    })()
  }, [id])

  const updateStatus = async (status: string) => {
    if (!flag || !profile) return
    setUpdating(true)
    const patch: Partial<ComplianceFlag> = { status: status as ComplianceFlag['status'] }
    if (status === 'resolved') {
      patch.resolved_by = profile.id
      patch.resolved_at = new Date().toISOString()
    }
    const { error } = await supabase.from('compliance_flags').update(patch).eq('id', flag.id)
    if (error) { toast.error(error.message) }
    else {
      toast.success(`Flag marked as ${status}`)
      setFlag(prev => prev ? { ...prev, ...patch } : prev)
    }
    setUpdating(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f5f5f2' }}>
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!flag) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: '#f5f5f2' }}>
        <p className="text-sm text-gray-500">Flag not found.</p>
        <button type="button" onClick={() => navigate('/regulator/flags')} className="mt-3 text-sm font-medium underline">
          Back to Flagged Cases
        </button>
      </div>
    )
  }

  const sevStyle = SEVERITY_STYLE[flag.severity]
  const stStyle  = STATUS_STYLE[flag.status]
  const anomaly  = ANOMALY_COLOR[flag.flag_type] ?? { bg: '#f3f4f6', text: '#6b7280' }
  const cid      = caseId(flag)

  return (
    <div className="min-h-screen" style={{ background: '#f5f5f2' }}>

      {/* ── Top bar ───────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-gray-400">
          <button type="button" onClick={() => navigate('/regulator')} className="hover:text-gray-700 transition-colors">
            EPA Liberia
          </button>
          <span>/</span>
          <button type="button" onClick={() => navigate('/regulator/flags')} className="hover:text-gray-700 transition-colors">
            Flagged Cases
          </button>
          <span>/</span>
          <span className="text-gray-700 font-medium">{cid}</span>
        </div>
        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-gray-700"
          >
            <Printer className="w-4 h-4" />
            Print warrant brief
          </button>
          {flag.status !== 'resolved' && flag.status !== 'dismissed' && (
            <button
              type="button"
              disabled={updating}
              onClick={() => updateStatus('investigating')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: '#c0392b' }}
            >
              {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Escalate to AG'}
            </button>
          )}
        </div>
      </div>

      {/* ── Case header ───────────────────────────────────────────── */}
      <div className="px-6 py-5 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2 mb-3">
          <span
            className="text-[11px] font-bold tracking-widest px-2.5 py-1 rounded-full"
            style={{ background: sevStyle.bg, color: sevStyle.text }}
          >
            {flag.severity.toUpperCase()}
          </span>
          <span className="text-gray-300">·</span>
          <span
            className="text-[11px] font-bold tracking-widest px-2.5 py-1 rounded-full"
            style={{ background: stStyle.bg, color: stStyle.text }}
          >
            {flag.status.toUpperCase()}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          {cid} — {FLAG_TYPE_LABEL[flag.flag_type] ?? flag.flag_type}
          {device ? `, ${device.brand} ${device.model}` : ''}
        </h1>
        <p className="text-sm text-gray-500 max-w-3xl">{flag.description}</p>
      </div>

      {/* ── Main body ─────────────────────────────────────────────── */}
      <div className="flex gap-5 p-6 items-start">

        {/* Left column */}
        <div className="flex-[3] space-y-5">

          {/* Devices involved */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Devices involved</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Token', 'Device', 'Current Owner', 'Status', 'Anomaly'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] tracking-widest text-gray-400 uppercase font-medium whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {device ? (
                    <tr className="border-b border-gray-50 last:border-0">
                      <td className="px-4 py-3.5 font-mono text-gray-500">#{device.id.slice(-5).toUpperCase()}</td>
                      <td className="px-4 py-3.5 font-medium text-gray-900">{device.brand} {device.model}</td>
                      <td className="px-4 py-3.5 font-mono text-gray-500">
                        {owner?.full_name ?? truncateWallet(device.current_owner_id)}
                      </td>
                      <td className="px-4 py-3.5 capitalize text-gray-600">{device.status.replace('_', ' ')}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className="text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-md whitespace-nowrap"
                          style={{ background: anomaly.bg, color: anomaly.text }}
                        >
                          {ANOMALY_LABEL[flag.flag_type]}
                        </span>
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-400">
                        No specific device linked to this flag.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Custody trail */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">
                Custody trail{device ? ` · Device #${device.id.slice(-5).toUpperCase()}` : ''}
              </h2>
            </div>
            {lifecycle.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">
                {device ? 'No lifecycle events recorded for this device.' : 'No device linked — no custody trail available.'}
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {lifecycle.map(ev => {
                  const txHash = ev.metadata?.tx_hash as string | undefined
                  const isOnChain = !!txHash
                  const label = EVENT_LABEL[ev.event_type] ?? ev.event_type
                  const detail = ev.actor_name
                    ? `${ev.actor_name}${ev.location ? ` at ${ev.location}` : ''}`
                    : ev.location ?? ''

                  return (
                    <div key={ev.id} className="px-5 py-4">
                      <p className="text-sm font-medium text-gray-900">{label}</p>
                      {detail && <p className="text-xs text-gray-500 mt-0.5">{detail}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(ev.created_at).toLocaleDateString('en-LR', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {ev.metadata?.reason ? ` · reason: ${ev.metadata.reason}` : ''}
                      </p>
                      {txHash ? (
                        <p className="text-xs font-mono mt-1" style={{ color: '#2d6a3f' }}>
                          {txHash.slice(0, 10)}…{txHash.slice(-6)}
                        </p>
                      ) : (
                        <p className="text-xs font-medium mt-1" style={{ color: '#b87a00' }}>off-chain</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Status actions */}
          {flag.status !== 'resolved' && flag.status !== 'dismissed' && (
            <div className="bg-white rounded-2xl border border-gray-200 px-5 py-4 flex items-center gap-3 flex-wrap">
              <p className="text-sm font-medium text-gray-700 flex-1">Update case status:</p>
              {flag.status === 'open' && (
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => updateStatus('investigating')}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border transition-colors disabled:opacity-50"
                  style={{ borderColor: '#b87a00', color: '#b87a00', background: '#fdf3dc' }}
                >
                  Mark Investigating
                </button>
              )}
              <button
                type="button"
                disabled={updating}
                onClick={() => updateStatus('resolved')}
                className="px-4 py-2 text-xs font-semibold rounded-lg border transition-colors disabled:opacity-50"
                style={{ borderColor: '#2d6a3f', color: '#2d6a3f', background: '#e8f5ec' }}
              >
                Mark Resolved
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={() => updateStatus('dismissed')}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="flex-[2] space-y-5 min-w-0">

          {/* Evidence locker */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Evidence locker</h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {flag.evidence_urls.length > 0 ? (
                flag.evidence_urls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-video rounded-xl overflow-hidden border border-gray-100 hover:border-gray-300 transition-colors"
                  >
                    <img src={url} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                  </a>
                ))
              ) : (
                /* Placeholder slots */
                ['CUSTOMS LOG', 'FIELD PHOTO', 'DEVICE RECEIPT', 'INSPECTOR STMT', 'DISPOSAL CERT', 'FACILITY SCAN']
                  .map(label => (
                    <div
                      key={label}
                      className="aspect-video rounded-xl flex items-center justify-center relative overflow-hidden"
                      style={{ background: '#f0ede6' }}
                    >
                      <svg className="absolute inset-0 w-full h-full opacity-30">
                        <defs>
                          <pattern id={`stripe-${label}`} patternUnits="userSpaceOnUse" width="12" height="12" patternTransform="rotate(45)">
                            <line x1="0" y1="0" x2="0" y2="12" stroke="#c8c5bd" strokeWidth="6" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill={`url(#stripe-${label})`} />
                      </svg>
                      <span className="text-[9px] tracking-widest font-bold text-gray-400 uppercase relative z-10">{label}</span>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Stakeholders looped in */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Stakeholders looped in</h2>
            </div>
            {stakeholders.length === 0 ? (
              <div className="px-5 py-6 text-center text-sm text-gray-400">
                No stakeholders have been added to this case.
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {stakeholders.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                      style={{ background: ['#2d6a3f', '#1a56db', '#b87a00', '#6b21a8', '#c0392b'][i % 5] }}
                    >
                      {initials(s.full_name, s.email)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {s.full_name ?? s.email ?? 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{s.organization ?? 'EPA Liberia'}</p>
                    </div>
                    <span
                      className="text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full flex-shrink-0"
                      style={{ background: '#e8f5ec', color: '#2d6a3f' }}
                    >
                      LOOPED IN
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Flag metadata */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <p className="text-[10px] tracking-widest text-gray-400 uppercase">Case Details</p>
            {[
              { label: 'Case ID',    value: cid },
              { label: 'Flag Type',  value: FLAG_TYPE_LABEL[flag.flag_type] ?? flag.flag_type },
              { label: 'Severity',   value: flag.severity.toUpperCase() },
              { label: 'Status',     value: flag.status.toUpperCase() },
              { label: 'Raised',     value: new Date(flag.created_at).toLocaleDateString('en-LR', { dateStyle: 'medium' }) },
              ...(flag.resolved_at ? [{ label: 'Resolved', value: new Date(flag.resolved_at).toLocaleDateString('en-LR', { dateStyle: 'medium' }) }] : []),
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{row.label}</span>
                <span className="text-xs font-semibold text-gray-900">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
