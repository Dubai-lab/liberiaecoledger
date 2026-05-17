import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, CheckCircle2, Clock, ExternalLink, Loader2,
  Package, Leaf, FileText, Printer, Image, AlertCircle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

// ── Types ─────────────────────────────────────────────────────────────────────

interface DisposalDetail {
  id: string
  device_id: string
  recycler_id: string
  facility_id: string
  disposal_type: string
  final_mass_kg: number
  hazard_class: string
  downstream_destination: string | null
  evidence_urls: string[]
  component_breakdown: Record<string, number>
  eco_credits_awarded: number
  tx_hash: string | null
  ipfs_hash: string | null
  status: string
  created_at: string
}

interface DeviceInfo {
  brand: string
  model: string
  category: string
  token_id: string | null
  imei: string | null
  serial_number: string | null
  hazard_class: string
  manufacture_year: number | null
}

interface OwnerInfo {
  full_name: string | null
  organization: string | null
  email: string | null
}

interface FacilityInfo {
  name: string
  location_city: string
  location_county: string
  license_number: string
  is_basel_certified: boolean
}

// ── Constants ─────────────────────────────────────────────────────────────────

const HAZARD_LABEL: Record<string, string> = {
  none:           'None',
  li_ion_battery: 'Lithium-Ion Battery',
  mercury_ccfl:   'Mercury / CCFL',
  toner:          'Toner Cartridge',
  mixed:          'Mixed Hazardous',
}

const HAZARD_BADGE: Record<string, string> = {
  li_ion_battery: 'bg-amber-100 text-amber-700 border-amber-200',
  mercury_ccfl:   'bg-red-100 text-red-700 border-red-200',
  toner:          'bg-blue-100 text-blue-700 border-blue-200',
  mixed:          'bg-purple-100 text-purple-700 border-purple-200',
  none:           'bg-gray-100 text-gray-500 border-gray-200',
}

const DISPOSAL_LABEL: Record<string, string> = {
  recycle:       'Full Recycling',
  refurbish:     'Refurbishment',
  salvage_parts: 'Parts Salvage',
  hazardous:     'Hazardous Waste Route',
}

const MATERIAL_META: Record<string, { label: string; unit: string; color: string; ecRate: number }> = {
  gold_g:     { label: 'Gold',     unit: 'g', color: '#b45309', ecRate: 50 },
  copper_g:   { label: 'Copper',   unit: 'g', color: '#b91c1c', ecRate: 5  },
  aluminum_g: { label: 'Aluminum', unit: 'g', color: '#1d4ed8', ecRate: 2  },
  lithium_g:  { label: 'Lithium',  unit: 'g', color: '#6d28d9', ecRate: 30 },
  cobalt_g:   { label: 'Cobalt',   unit: 'g', color: '#0e7490', ecRate: 20 },
  lead_g:     { label: 'Lead',     unit: 'g', color: '#4b5563', ecRate: 3  },
}

function fmt(n: number, decimals = 2) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: decimals }).format(n)
}

function shortHash(hash: string) {
  return `${hash.slice(0, 10)}…${hash.slice(-8)}`
}

function isPDF(url: string) {
  return url.toLowerCase().includes('.pdf') || url.toLowerCase().includes('pdf')
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DisposalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()

  const [disposal, setDisposal] = useState<DisposalDetail | null>(null)
  const [device, setDevice] = useState<DeviceInfo | null>(null)
  const [owner, setOwner] = useState<OwnerInfo | null>(null)
  const [facility, setFacility] = useState<FacilityInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id || !profile) return
    ;(async () => {
      const { data: d } = await supabase
        .from('disposals')
        .select('*')
        .eq('id', id)
        .eq('recycler_id', profile.id)
        .maybeSingle()

      if (!d) { setNotFound(true); setLoading(false); return }
      setDisposal(d as DisposalDetail)

      const [{ data: dev }, { data: fac }] = await Promise.all([
        supabase
          .from('devices')
          .select('brand, model, category, token_id, imei, serial_number, hazard_class, manufacture_year, current_owner_id')
          .eq('id', d.device_id)
          .maybeSingle(),
        supabase
          .from('recycler_facilities')
          .select('name, location_city, location_county, license_number, is_basel_certified')
          .eq('id', d.facility_id)
          .maybeSingle(),
      ])

      setDevice(dev ?? null)
      setFacility(fac ?? null)

      if (dev?.current_owner_id) {
        const { data: ownerData } = await supabase
          .from('profiles')
          .select('full_name, organization, email')
          .eq('id', dev.current_owner_id)
          .maybeSingle()
        setOwner(ownerData ?? null)
      }

      setLoading(false)
    })()
  }, [id, profile])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (notFound || !disposal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <AlertCircle className="w-8 h-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Disposal record not found.</p>
        <Link to="/recycler/received" className="text-sm font-medium text-eco-700 hover:underline">
          Back to Devices Received
        </Link>
      </div>
    )
  }

  const verified = !!disposal.tx_hash
  const ownerName = owner?.organization ?? owner?.full_name ?? owner?.email ?? 'Unknown'

  const materials = Object.entries(MATERIAL_META)
    .map(([key, meta]) => ({
      ...meta,
      key,
      value: disposal.component_breakdown?.[key] ?? 0,
    }))
    .filter(m => m.value > 0)

  const totalMassG = materials.reduce((s, m) => s + m.value, 0)

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 print:p-0 print:space-y-4">

      {/* ── Back + print ── */}
      <div className="flex items-center justify-between print:hidden">
        <button
          type="button"
          onClick={() => navigate('/recycler/received')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Devices Received
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-border rounded-lg hover:bg-muted/30 transition-colors"
        >
          <Printer className="w-3.5 h-3.5" /> Print certificate
        </button>
      </div>

      {/* ── Header ── */}
      <div className="print:mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-muted-foreground tracking-widest uppercase mb-0.5">Disposal Record</p>
            <h1 className="text-2xl font-semibold">
              {device ? `${device.brand} ${device.model}` : 'Device'}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {new Date(disposal.created_at).toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[11px] font-bold px-3 py-1 rounded-full border uppercase tracking-wide ${HAZARD_BADGE[disposal.hazard_class] ?? HAZARD_BADGE.none}`}>
              {HAZARD_LABEL[disposal.hazard_class] ?? disposal.hazard_class}
            </span>
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-muted text-muted-foreground">
              {DISPOSAL_LABEL[disposal.disposal_type] ?? disposal.disposal_type}
            </span>
          </div>
        </div>
      </div>

      {/* ── On-chain status banner ── */}
      {verified ? (
        <div className="flex items-center gap-3 bg-eco-50 border border-eco-200 rounded-xl p-4">
          <CheckCircle2 className="w-5 h-5 text-eco-700 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-eco-900">On-chain verified — immutable audit proof</p>
            <p className="text-xs text-eco-700 font-mono mt-0.5 truncate">{disposal.tx_hash}</p>
          </div>
          <a
            href={`https://sepolia.etherscan.io/tx/${disposal.tx_hash}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs font-medium text-eco-700 hover:underline flex-shrink-0 print:hidden"
          >
            View on Etherscan <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      ) : (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Pending chain sync</p>
            <p className="text-xs text-amber-700 mt-0.5">
              The off-chain record exists. The blockchain transaction has not yet confirmed.
              This typically resolves within 30 seconds of disposal logging.
            </p>
          </div>
        </div>
      )}

      {/* ── Key details grid ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-border rounded-xl p-6"
      >
        <h2 className="text-sm font-semibold mb-5">Disposal Details</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5">
          {[
            { label: 'Device',         value: device ? `${device.brand} ${device.model}` : '—' },
            { label: 'Category',       value: device?.category ?? '—' },
            { label: 'Manufacture Year', value: device?.manufacture_year?.toString() ?? '—' },
            { label: 'Token ID',       value: device?.token_id ?? `ECO-${disposal.device_id.slice(0, 8).toUpperCase()}` },
            { label: 'Serial Number',  value: device?.serial_number ?? '—' },
            { label: 'IMEI',           value: device?.imei ?? '—' },
            { label: 'From Owner',     value: ownerName },
            { label: 'Final Mass',     value: `${fmt(disposal.final_mass_kg, 2)} kg` },
            { label: 'Downstream',     value: disposal.downstream_destination ?? '—' },
            { label: 'Facility',       value: facility?.name ?? '—' },
            { label: 'Location',       value: facility ? `${facility.location_city}, ${facility.location_county}` : '—' },
            { label: 'License No.',    value: facility?.license_number ?? '—' },
          ].map(row => (
            <div key={row.label}>
              <p className="text-[10px] tracking-widest text-muted-foreground uppercase mb-0.5">{row.label}</p>
              <p className="text-sm font-medium break-all">{row.value}</p>
            </div>
          ))}
          {facility?.is_basel_certified && (
            <div>
              <p className="text-[10px] tracking-widest text-muted-foreground uppercase mb-0.5">Certification</p>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-eco-50 text-eco-700 font-semibold border border-eco-200">
                Basel Convention Certified
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Component breakdown ── */}
      {materials.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <Leaf className="w-4 h-4 text-eco-700" />
            <h2 className="text-sm font-semibold">Recovered Materials</h2>
            <span className="text-xs text-muted-foreground ml-auto">
              {fmt(totalMassG, 1)} g total recovered
            </span>
          </div>
          <div className="space-y-3">
            {materials.map(m => {
              const pct = totalMassG > 0 ? (m.value / totalMassG) * 100 : 0
              const ec = Math.round(m.value * m.ecRate)
              return (
                <div key={m.key}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: m.color }} />
                      <span className="text-sm font-medium">{m.label}</span>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <span className="text-sm text-muted-foreground">{fmt(m.value, 3)} g</span>
                      <span className="text-xs text-eco-700 font-semibold w-16">+{fmt(ec, 0)} EC</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: m.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* EcoCredits total */}
          <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-eco-700" />
              <span className="text-sm font-semibold text-eco-900">Total EcoCredits awarded</span>
            </div>
            <span className="text-xl font-bold text-eco-700">+{fmt(disposal.eco_credits_awarded, 0)} EC</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            Awarded to device owner: {ownerName}
          </p>
        </motion.div>
      )}

      {/* ── Evidence files ── */}
      {disposal.evidence_urls?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-border rounded-xl p-6 print:hidden"
        >
          <h2 className="text-sm font-semibold mb-4">Evidence Files</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Stored permanently on IPFS via Pinata — cannot be altered or deleted.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {disposal.evidence_urls.map((url, i) => (
              isPDF(url) ? (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-center justify-center gap-2 p-4 border border-border rounded-xl hover:border-eco-700/40 hover:bg-muted/20 transition-all group"
                >
                  <FileText className="w-8 h-8 text-muted-foreground group-hover:text-eco-700 transition-colors" />
                  <span className="text-xs text-center text-muted-foreground">Document {i + 1}</span>
                  <span className="text-[10px] text-eco-700 flex items-center gap-0.5">
                    View <ExternalLink className="w-2.5 h-2.5" />
                  </span>
                </a>
              ) : (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="relative overflow-hidden rounded-xl border border-border hover:border-eco-700/40 transition-all group"
                  style={{ aspectRatio: '4/3' }}
                >
                  <img
                    src={url}
                    alt={`Evidence ${i + 1}`}
                    className="w-full h-full object-cover"
                    onError={e => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none'
                      e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center', 'bg-muted/30')
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="bg-white rounded-full p-1.5">
                      <Image className="w-3.5 h-3.5 text-foreground" />
                    </div>
                  </div>
                </a>
              )
            ))}
          </div>
        </motion.div>
      )}

      {/* ── On-chain record ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white border border-border rounded-xl p-6"
      >
        <h2 className="text-sm font-semibold mb-4">Blockchain Record</h2>
        {verified ? (
          <div className="space-y-4">
            <div>
              <p className="text-[10px] tracking-widest text-muted-foreground uppercase mb-1">Transaction Hash</p>
              <p className="text-xs font-mono break-all text-foreground">{disposal.tx_hash}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] tracking-widest text-muted-foreground uppercase mb-1">Network</p>
                <p className="text-sm font-medium">Ethereum Sepolia</p>
              </div>
              <div>
                <p className="text-[10px] tracking-widest text-muted-foreground uppercase mb-1">Contract</p>
                <p className="text-sm font-medium">EcoLedger · disposeDevice()</p>
              </div>
            </div>
            {disposal.ipfs_hash && (
              <div>
                <p className="text-[10px] tracking-widest text-muted-foreground uppercase mb-1">IPFS Record</p>
                <div className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                  <span className="text-xs font-mono text-muted-foreground truncate">{disposal.ipfs_hash}</span>
                  <a
                    href={`https://gateway.pinata.cloud/ipfs/${disposal.ipfs_hash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-eco-700 hover:underline ml-3 flex-shrink-0 flex items-center gap-1 print:hidden"
                  >
                    View <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
            <a
              href={`https://sepolia.etherscan.io/tx/${disposal.tx_hash}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-eco-700 hover:underline print:hidden"
            >
              Open full transaction on Etherscan <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ) : (
          <div className="flex items-start gap-3 text-sm text-amber-700">
            <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Not yet anchored on-chain</p>
              <p className="text-xs text-amber-600 mt-1">
                The disposal was logged in the database. The blockchain transaction was not confirmed —
                this can happen if the device owner had no connected wallet at the time of logging.
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Print footer ── */}
      <div className="hidden print:block border-t border-border pt-6 text-xs text-muted-foreground">
        <p className="font-semibold">Liberia EcoLedger — Disposal Certificate</p>
        <p>Record ID: {disposal.id}</p>
        <p>Generated: {new Date().toLocaleString('en-US')}</p>
        {facility && (
          <p>Facility: {facility.name} · License {facility.license_number} · {facility.location_city}, {facility.location_county}</p>
        )}
      </div>
    </div>
  )
}
