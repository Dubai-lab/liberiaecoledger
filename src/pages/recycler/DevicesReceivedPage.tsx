import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import {
  Recycle, Loader2, ExternalLink, Search, Download, FileText,
  ChevronLeft, ChevronRight, TrendingUp, Leaf, AlertCircle,
  CheckCircle2, Clock, Package,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

// ── Types ─────────────────────────────────────────────────────────────────────

interface RawDisposal {
  id: string
  device_id: string
  disposal_type: string
  final_mass_kg: number
  hazard_class: string
  eco_credits_awarded: number
  tx_hash: string | null
  status: string
  created_at: string
  devices: {
    brand: string
    model: string
    token_id: string | null
    imei: string | null
    serial_number: string | null
    current_owner_id: string
  } | null
}

interface DisposalRow extends RawDisposal {
  ownerName: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

const HAZARD_LABEL: Record<string, string> = {
  none:           '—',
  li_ion_battery: 'Li-Ion Battery',
  mercury_ccfl:   'Mercury · CCFL',
  toner:          'Toner',
  mixed:          'Mixed',
}

const HAZARD_BADGE: Record<string, string> = {
  li_ion_battery: 'bg-amber-100 text-amber-700',
  mercury_ccfl:   'bg-red-100 text-red-700',
  toner:          'bg-blue-100 text-blue-700',
  mixed:          'bg-purple-100 text-purple-700',
}

const HAZARD_COLOR: Record<string, string> = {
  li_ion_battery: '#d97706',
  mercury_ccfl:   '#dc2626',
  toner:          '#2563eb',
  mixed:          '#7c3aed',
  none:           '#9ca3af',
}

const DISPOSAL_LABEL: Record<string, string> = {
  recycle:       'Recycle',
  refurbish:     'Refurbish',
  salvage_parts: 'Salvage parts',
  hazardous:     'Hazardous',
}

const DISPOSAL_COLOR: Record<string, string> = {
  recycle:       '#2f6b3a',
  refurbish:     '#2563eb',
  salvage_parts: '#d97706',
  hazardous:     '#dc2626',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 0) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: decimals }).format(n)
}

function shortHash(hash: string) {
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`
}

function exportCSV(rows: DisposalRow[]) {
  const headers = ['Device', 'Token ID', 'From Owner', 'Disposed', 'Mass (kg)', 'Hazard', 'Type', 'EC Paid', 'On-Chain Tx', 'Status']
  const data = rows.map(r => [
    `${r.devices?.brand ?? ''} ${r.devices?.model ?? ''}`.trim(),
    r.devices?.token_id ?? '',
    r.ownerName,
    new Date(r.created_at).toLocaleDateString('en-US'),
    r.final_mass_kg,
    HAZARD_LABEL[r.hazard_class] ?? r.hazard_class,
    DISPOSAL_LABEL[r.disposal_type] ?? r.disposal_type,
    r.eco_credits_awarded,
    r.tx_hash ?? 'Pending chain sync',
    r.status,
  ])
  const csv = [headers, ...data].map(row => row.map(v => `"${v}"`).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = `disposal-history-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DevicesReceivedPage() {
  const { profile } = useAuth()
  const [all, setAll] = useState<DisposalRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dateRange, setDateRange] = useState('all')
  const [hazardFilter, setHazardFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(0)

  useEffect(() => {
    if (!profile) return
    ;(async () => {
      const { data: rawDisposals } = await supabase
        .from('disposals')
        .select(`
          id, device_id, disposal_type, final_mass_kg, hazard_class,
          eco_credits_awarded, tx_hash, status, created_at,
          devices (brand, model, token_id, imei, serial_number, current_owner_id)
        `)
        .eq('recycler_id', profile.id)
        .order('created_at', { ascending: false })

      const raw = (rawDisposals ?? []) as RawDisposal[]

      const ownerIds = [
        ...new Set(raw.map(d => d.devices?.current_owner_id).filter(Boolean) as string[])
      ]

      const { data: profileRows } = ownerIds.length
        ? await supabase
            .from('profiles')
            .select('id, full_name, organization, email')
            .in('id', ownerIds)
        : { data: [] }

      const pMap = new Map(profileRows?.map(p => [p.id, p]) ?? [])

      setAll(
        raw.map(d => ({
          ...d,
          ownerName: (() => {
            const p = pMap.get(d.devices?.current_owner_id ?? '')
            return p?.organization ?? p?.full_name ?? p?.email ?? 'Unknown'
          })(),
        }))
      )
      setLoading(false)
    })()
  }, [profile])

  // ── Stats ─────────────────────────────────────────────────────────────────
  const now = new Date()
  const yearStart = `${now.getFullYear()}-01-01`
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const stats = useMemo(() => {
    const confirmed = all.filter(d => d.status === 'confirmed')
    const ytd = confirmed.filter(d => d.created_at >= yearStart)
    return {
      processedYTD: ytd.length,
      massKg:       confirmed.reduce((s, d) => s + (d.final_mass_kg ?? 0), 0),
      creditsOut:   confirmed.reduce((s, d) => s + (d.eco_credits_awarded ?? 0), 0),
      pendingSync:  all.filter(d => !d.tx_hash).length,
      thisMonth:    confirmed.filter(d => d.created_at >= monthStart).length,
      consumers:    all.filter(d => d.eco_credits_awarded > 0).length,
    }
  }, [all, yearStart, monthStart])

  // ── Date cut-off ─────────────────────────────────────────────────────────
  const cutoff = useMemo(() => {
    const d = new Date()
    if (dateRange === '30d')  { d.setDate(d.getDate() - 30); return d.toISOString() }
    if (dateRange === '90d')  { d.setDate(d.getDate() - 90); return d.toISOString() }
    if (dateRange === '12m')  { d.setMonth(d.getMonth() - 12); return d.toISOString() }
    return null
  }, [dateRange])

  // ── Filtered rows ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return all.filter(d => {
      if (cutoff && d.created_at < cutoff) return false
      if (hazardFilter !== 'all' && d.hazard_class !== hazardFilter) return false
      if (typeFilter   !== 'all' && d.disposal_type !== typeFilter) return false
      if (statusFilter === 'verified'     && !d.tx_hash) return false
      if (statusFilter === 'pending_sync' &&  d.tx_hash) return false
      if (!q) return true
      const dev = d.devices
      return (
        dev?.token_id?.toLowerCase().includes(q) ||
        dev?.imei?.toLowerCase().includes(q) ||
        dev?.serial_number?.toLowerCase().includes(q) ||
        d.tx_hash?.toLowerCase().includes(q) ||
        `${dev?.brand ?? ''} ${dev?.model ?? ''}`.toLowerCase().includes(q) ||
        d.ownerName.toLowerCase().includes(q)
      )
    })
  }, [all, search, cutoff, hazardFilter, typeFilter, statusFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageRows   = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function updateFilter(fn: () => void) { fn(); setPage(0) }

  // ── Monthly chart data ────────────────────────────────────────────────────
  const monthlyData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
      const key = d.toISOString().slice(0, 7)
      const match = all.filter(r => r.created_at.startsWith(key))
      return {
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        count: match.length,
        massKg: match.reduce((s, r) => s + (r.final_mass_kg ?? 0), 0),
      }
    })
  }, [all])

  // ── Hazard breakdown ──────────────────────────────────────────────────────
  const hazardData = useMemo(() => {
    const counts: Record<string, number> = {}
    all.forEach(d => { counts[d.hazard_class] = (counts[d.hazard_class] ?? 0) + 1 })
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([key, value]) => ({
        name:  HAZARD_LABEL[key] ?? key,
        value,
        color: HAZARD_COLOR[key] ?? '#9ca3af',
      }))
      .sort((a, b) => b.value - a.value)
  }, [all])

  // ── Disposal type breakdown ───────────────────────────────────────────────
  const typeData = useMemo(() => {
    const counts: Record<string, number> = {}
    all.forEach(d => { counts[d.disposal_type] = (counts[d.disposal_type] ?? 0) + 1 })
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([key, value]) => ({
        key,
        name:  DISPOSAL_LABEL[key] ?? key,
        value,
        color: DISPOSAL_COLOR[key] ?? '#9ca3af',
      }))
  }, [all])

  // ── Tab counts ────────────────────────────────────────────────────────────
  const TAB_FILTERS = [
    { label: 'All',          filter: 'all' },
    { label: 'Recycle',      filter: 'recycle' },
    { label: 'Refurbish',    filter: 'refurbish' },
    { label: 'Salvage parts',filter: 'salvage_parts' },
    { label: 'Hazardous',    filter: 'hazardous' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs text-muted-foreground tracking-widest uppercase mb-0.5">Recycler</p>
          <h1 className="text-2xl font-semibold">Devices Received</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-lg">
            Every device your facility has processed, with on-chain proof of disposal for audit and compliance.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => exportCSV(filtered)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-border rounded-lg hover:bg-muted/30 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-border rounded-lg hover:bg-muted/30 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" /> Export PDF report
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg text-white transition-colors"
            style={{ background: '#0f1410' }}
          >
            <Recycle className="w-3.5 h-3.5" /> Compliance brief
          </button>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          {
            label: 'Devices Processed (YTD)',
            value: fmt(stats.processedYTD),
            sub:   `+${stats.thisMonth} this month`,
            icon:  <Recycle className="w-5 h-5" />,
            color: 'text-eco-700',
            subColor: 'text-eco-700',
            subIcon: <TrendingUp className="w-3 h-3" />,
          },
          {
            label: 'Total Mass Recovered',
            value: `${fmt(stats.massKg / 1000, 1)} t`,
            sub:   `${fmt(stats.massKg, 0)} kg total recovered`,
            icon:  <TrendingUp className="w-5 h-5" />,
            color: 'text-blue-600',
            subColor: 'text-blue-600',
          },
          {
            label: 'EcoCredits Paid Out',
            value: `${fmt(stats.creditsOut)} EC`,
            sub:   `→ to ${fmt(stats.consumers)} consumers`,
            icon:  <Leaf className="w-5 h-5" />,
            color: 'text-eco-700',
            subColor: 'text-eco-700',
          },
          {
            label: 'Pending Chain Sync',
            value: fmt(stats.pendingSync),
            sub:   stats.pendingSync > 0 ? 'Awaiting block confirm' : 'All transactions synced',
            icon:  stats.pendingSync > 0 ? <Clock className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />,
            color: stats.pendingSync > 0 ? 'text-amber-500' : 'text-eco-700',
            subColor: stats.pendingSync > 0 ? 'text-amber-500' : 'text-eco-700',
          },
        ] as const).map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-white border border-border rounded-xl p-5"
          >
            <div className={`mb-3 ${s.color}`}>{s.icon}</div>
            <p className="text-2xl font-semibold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            <p className={`text-[11px] mt-2 flex items-center gap-1 ${s.subColor}`}>
              {'subIcon' in s && s.subIcon}
              {s.sub}
            </p>
          </motion.div>
        ))}
      </div>

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search token, IMEI, or tx hash…"
            value={search}
            onChange={e => updateFilter(() => setSearch(e.target.value))}
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors"
          />
        </div>
        {([
          {
            value: dateRange, set: (v: string) => setDateRange(v),
            options: [
              { value: '30d', label: 'Last 30 days' },
              { value: '90d', label: 'Last 90 days' },
              { value: '12m', label: 'Last 12 months' },
              { value: 'all', label: 'All time' },
            ],
          },
          {
            value: hazardFilter, set: (v: string) => setHazardFilter(v),
            options: [
              { value: 'all',           label: 'Hazard: All' },
              { value: 'none',          label: 'None' },
              { value: 'li_ion_battery',label: 'Li-Ion Battery' },
              { value: 'mercury_ccfl',  label: 'Mercury / CCFL' },
              { value: 'toner',         label: 'Toner' },
              { value: 'mixed',         label: 'Mixed' },
            ],
          },
          {
            value: typeFilter, set: (v: string) => setTypeFilter(v),
            options: [
              { value: 'all',          label: 'Type: All' },
              { value: 'recycle',      label: 'Recycle' },
              { value: 'refurbish',    label: 'Refurbish' },
              { value: 'salvage_parts',label: 'Salvage parts' },
              { value: 'hazardous',    label: 'Hazardous' },
            ],
          },
          {
            value: statusFilter, set: (v: string) => setStatusFilter(v),
            options: [
              { value: 'all',         label: 'Status: All' },
              { value: 'verified',    label: 'On-chain verified' },
              { value: 'pending_sync',label: 'Pending sync' },
            ],
          },
        ] as const).map((sel, i) => (
          <select
            key={i}
            value={sel.value}
            onChange={e => updateFilter(() => (sel.set as (v: string) => void)(e.target.value))}
            className="px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors"
          >
            {sel.options.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        ))}
        <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
          Showing {fmt(Math.min(PAGE_SIZE, pageRows.length))} of {fmt(filtered.length)}
        </span>
      </div>

      {/* ── Table ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white border border-border rounded-xl overflow-hidden"
      >
        {/* Table header row with tabs */}
        <div className="px-5 py-3 border-b border-border flex items-center gap-2 flex-wrap">
          <h2 className="text-sm font-semibold mr-2">Disposal history</h2>
          {TAB_FILTERS.map(t => (
            <button
              key={t.label}
              type="button"
              onClick={() => updateFilter(() => setTypeFilter(t.filter))}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                typeFilter === t.filter
                  ? 'bg-muted text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              {t.label}{' '}
              <span className={typeFilter === t.filter ? 'font-bold' : 'font-medium'}>
                {all.filter(d => t.filter === 'all' || d.disposal_type === t.filter).length}
              </span>
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="px-4 py-3 w-8">
                  <input type="checkbox" className="rounded border-border" />
                </th>
                {[
                  'Device', 'Token ID', 'From Owner', 'Disposed',
                  'Mass', 'Hazard', 'Type', 'EC Paid', 'On-Chain',
                ].map(h => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[10px] font-semibold text-muted-foreground tracking-widest uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center text-sm text-muted-foreground">
                    {all.length === 0
                      ? 'No disposals logged yet. Use Log Disposal to record your first device.'
                      : 'No results match your current filters.'}
                  </td>
                </tr>
              ) : pageRows.map(d => {
                const dev = d.devices
                const verified = !!d.tx_hash
                return (
                  <tr key={d.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3.5">
                      <input type="checkbox" className="rounded border-border" />
                    </td>

                    {/* Device */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Package className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <span className="font-medium text-foreground whitespace-nowrap">
                          {dev ? `${dev.brand} ${dev.model}` : '—'}
                        </span>
                      </div>
                    </td>

                    {/* Token ID */}
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-mono text-muted-foreground">
                        {dev?.token_id ?? `ECO-${d.device_id.slice(0, 8).toUpperCase()}`}
                      </span>
                    </td>

                    {/* From owner */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-muted-foreground">{d.ownerName}</span>
                    </td>

                    {/* Disposed date */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="text-sm text-muted-foreground">
                        {new Date(d.created_at).toLocaleDateString('en-US', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </span>
                    </td>

                    {/* Mass */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="text-sm font-medium">{fmt(d.final_mass_kg, 2)} kg</span>
                    </td>

                    {/* Hazard */}
                    <td className="px-4 py-3.5">
                      {d.hazard_class === 'none' ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                            HAZARD_BADGE[d.hazard_class] ?? 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {HAZARD_LABEL[d.hazard_class] ?? d.hazard_class}
                        </span>
                      )}
                    </td>

                    {/* Disposal type */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-muted-foreground">
                        {DISPOSAL_LABEL[d.disposal_type] ?? d.disposal_type}
                      </span>
                    </td>

                    {/* EC paid */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-semibold text-eco-700">
                        {d.eco_credits_awarded > 0 ? `+${fmt(d.eco_credits_awarded)}` : '—'}
                      </span>
                    </td>

                    {/* On-chain */}
                    <td className="px-4 py-3.5">
                      {verified ? (
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-eco-700 bg-eco-50 border border-eco-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                            <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                            {shortHash(d.tx_hash!)}
                          </span>
                          <a
                            href={`https://sepolia.etherscan.io/tx/${d.tx_hash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-muted-foreground hover:text-eco-700 transition-colors flex-shrink-0"
                            aria-label="View on Etherscan"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          Pending sync
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3.5 border-t border-border flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              Page {page + 1} of {totalPages} · {fmt(filtered.length)} total records
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="p-1.5 rounded-md border border-border disabled:opacity-40 hover:bg-muted/30 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const start = Math.max(0, Math.min(page - 3, totalPages - 7))
                const pg = i + start
                return (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => setPage(pg)}
                    className={`w-7 h-7 text-xs rounded-md transition-colors ${
                      pg === page
                        ? 'bg-[#0f1410] text-white font-medium'
                        : 'border border-border hover:bg-muted/30 text-foreground'
                    }`}
                  >
                    {pg + 1}
                  </button>
                )
              })}
              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-md border border-border disabled:opacity-40 hover:bg-muted/30 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Monthly volume bar chart — 2 cols */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-border rounded-xl p-6 lg:col-span-2"
        >
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-eco-700" />
            <h2 className="text-sm font-semibold">Monthly disposal volume</h2>
            <span className="text-xs text-muted-foreground ml-auto">Last 12 months</span>
          </div>
          <p className="text-xs text-muted-foreground mb-5">Number of devices processed each month</p>
          {all.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
              No disposal data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} barSize={16} margin={{ left: -8 }}>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    boxShadow: '0 4px 12px rgba(0,0,0,.08)',
                  }}
                  formatter={(value: number, name: string) => [
                    value,
                    name === 'count' ? 'Devices' : 'Mass (kg)',
                  ]}
                  cursor={{ fill: 'rgba(0,0,0,.03)' }}
                />
                <Bar dataKey="count" fill="#2f6b3a" radius={[4, 4, 0, 0]} name="count" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Hazard class donut — 1 col */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold">By hazard class</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Breakdown of all processed devices</p>
          {hazardData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
              No data yet
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={hazardData}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={64}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {hazardData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8 }}
                    formatter={(v: number) => [`${v} devices`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {hazardData.map(h => (
                  <div key={h.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: h.color }}
                      />
                      <span className="text-muted-foreground">{h.name}</span>
                    </div>
                    <span className="font-semibold tabular-nums">{h.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* ── Disposal method breakdown ── */}
      {typeData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-1">
            <Recycle className="w-4 h-4 text-eco-700" />
            <h2 className="text-sm font-semibold">By disposal method</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-5">
            How devices were handled across all time
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {typeData.map(t => {
              const pct = all.length > 0 ? Math.round((t.value / all.length) * 100) : 0
              return (
                <div
                  key={t.key}
                  className="flex flex-col items-center p-5 rounded-xl border border-border hover:border-border/80 transition-colors"
                >
                  <div className="w-3 h-3 rounded-full mb-3" style={{ background: t.color }} />
                  <p className="text-3xl font-bold mb-0.5" style={{ color: t.color }}>
                    {t.value}
                  </p>
                  <p className="text-xs text-foreground font-medium">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{pct}% of total</p>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}
    </div>
  )
}
