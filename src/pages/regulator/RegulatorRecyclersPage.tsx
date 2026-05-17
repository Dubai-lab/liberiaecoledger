import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  Recycle, Loader2, Search, Download, ShieldAlert,
  CheckCircle2, Clock, X, ChevronRight, AlertCircle,
  MapPin, Award,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

// ── Types ─────────────────────────────────────────────────────────────────────

interface FacilityRow {
  id: string
  owner_id: string
  name: string
  license_number: string
  location_city: string
  location_county: string
  is_active: boolean
  is_basel_certified: boolean
  accepts_free_pickup: boolean
  total_devices_processed: number
  created_at: string
  ownerName: string
  ownerEmail: string | null
  devicesYTD: number
  massKg: number
  flagCount: number
  hazardClasses: string[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

const HAZARD_BADGE: Record<string, string> = {
  li_ion_battery: 'bg-amber-100 text-amber-700',
  mercury_ccfl:   'bg-red-100 text-red-700',
  toner:          'bg-blue-100 text-blue-700',
  mixed:          'bg-purple-100 text-purple-700',
  pcb:            'bg-pink-100 text-pink-700',
  ferrous:        'bg-zinc-100 text-zinc-700',
}

const HAZARD_SHORT: Record<string, string> = {
  li_ion_battery: 'LI-ION',
  mercury_ccfl:   'MERCURY',
  toner:          'TONER',
  mixed:          'MIXED',
  pcb:            'PCB',
  ferrous:        'FERROUS',
}

function fmt(n: number, d = 0) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: d }).format(n)
}

function exportCSV(rows: FacilityRow[]) {
  const headers = ['Facility', 'License', 'City', 'County', 'Devices YTD', 'Mass kg', 'Flags', 'Basel', 'Active']
  const data = rows.map(r => [
    r.name, r.license_number, r.location_city, r.location_county,
    r.devicesYTD, fmt(r.massKg, 1), r.flagCount,
    r.is_basel_certified ? 'Yes' : 'No',
    r.is_active ? 'Active' : 'Inactive',
  ])
  const csv = [headers, ...data].map(row => row.map(v => `"${v}"`).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = `recycler-register-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RegulatorRecyclersPage() {
  const [all, setAll] = useState<FacilityRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [countyFilter, setCountyFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [managingId, setManagingId] = useState<string | null>(null)
  const [acting, setActing] = useState(false)

  const load = async () => {
    const [facilityRes, disposalRes, flagRes] = await Promise.all([
      supabase.from('recycler_facilities').select('*').order('created_at', { ascending: false }),
      supabase.from('disposals').select('facility_id, recycler_id, final_mass_kg, created_at, hazard_class'),
      supabase.from('compliance_flags').select('reporter_id, status, severity'),
    ])

    const facilities = facilityRes.data ?? []
    const ownerIds = [...new Set(facilities.map(f => f.owner_id))]
    const { data: profileRows } = ownerIds.length
      ? await supabase.from('profiles').select('id, full_name, organization, email').in('id', ownerIds)
      : { data: [] }

    const pMap = new Map(profileRows?.map(p => [p.id, p]) ?? [])
    const now = new Date()
    const yearStart = `${now.getFullYear()}-01-01`
    const disposals = disposalRes.data ?? []
    const flags = flagRes.data ?? []

    setAll(facilities.map(f => {
      const owner = pMap.get(f.owner_id)
      const fDisposals = disposals.filter(d => d.facility_id === f.id)
      const ytd = fDisposals.filter(d => d.created_at >= yearStart)
      const hazardSet = new Set(fDisposals.map(d => d.hazard_class).filter(h => h && h !== 'none'))
      const flagCount = flags.filter(fl => fl.reporter_id === f.owner_id && fl.status !== 'resolved' && fl.status !== 'dismissed').length

      return {
        ...f,
        ownerName: owner?.organization ?? owner?.full_name ?? owner?.email ?? '—',
        ownerEmail: owner?.email ?? null,
        devicesYTD: ytd.length,
        massKg: fDisposals.reduce((s, d) => s + (d.final_mass_kg ?? 0), 0),
        flagCount,
        hazardClasses: [...hazardSet],
      }
    }))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:        all.length,
    active:       all.filter(f => f.is_active).length,
    inactive:     all.filter(f => !f.is_active).length,
    basel:        all.filter(f => f.is_basel_certified).length,
    withFlags:    all.filter(f => f.flagCount > 0).length,
  }), [all])

  // ── Filters ───────────────────────────────────────────────────────────────
  const counties = useMemo(() => [...new Set(all.map(f => f.location_county))].sort(), [all])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return all.filter(f => {
      if (countyFilter !== 'all' && f.location_county !== countyFilter) return false
      if (statusFilter === 'active'   && !f.is_active) return false
      if (statusFilter === 'inactive' &&  f.is_active) return false
      if (!q) return true
      return (
        f.name.toLowerCase().includes(q) ||
        f.license_number.toLowerCase().includes(q) ||
        f.location_county.toLowerCase().includes(q) ||
        f.location_city.toLowerCase().includes(q)
      )
    })
  }, [all, search, countyFilter, statusFilter])

  // ── County distribution ───────────────────────────────────────────────────
  const countyData = useMemo(() => {
    const counts: Record<string, number> = {}
    all.forEach(f => { counts[f.location_county] = (counts[f.location_county] ?? 0) + 1 })
    return Object.entries(counts).map(([county, count]) => ({ county, count })).sort((a, b) => b.count - a.count)
  }, [all])

  // ── Manage panel ──────────────────────────────────────────────────────────
  const managing = all.find(f => f.id === managingId) ?? null

  const toggleActive = async () => {
    if (!managing) return
    setActing(true)
    const { error } = await supabase
      .from('recycler_facilities')
      .update({ is_active: !managing.is_active })
      .eq('id', managing.id)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success(`Facility ${managing.is_active ? 'suspended' : 'reactivated'} successfully.`)
      setAll(prev => prev.map(f => f.id === managing.id ? { ...f, is_active: !f.is_active } : f))
    }
    setActing(false)
  }

  const TAB_FILTERS = [
    { label: 'All',      filter: 'all',      count: all.length },
    { label: 'Active',   filter: 'active',   count: stats.active },
    { label: 'Inactive', filter: 'inactive', count: stats.inactive },
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
          <p className="text-xs text-muted-foreground tracking-widest uppercase mb-0.5">EPA Liberia</p>
          <h1 className="text-2xl font-semibold">Licensed Recyclers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            The full national register of certified e-waste recyclers — suspend and manage operating licenses.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => exportCSV(filtered)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-border rounded-lg hover:bg-muted/30 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export register (CSV)
          </button>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          {
            label: 'Licensed Facilities',
            value: `${stats.active} / ${stats.total}`,
            sub:   `${stats.inactive} inactive`,
            icon:  <Recycle className="w-5 h-5" />,
            color: 'text-eco-700',
          },
          {
            label: 'Pending / Inactive',
            value: fmt(stats.inactive),
            sub:   'awaiting review or suspended',
            icon:  <Clock className="w-5 h-5" />,
            color: 'text-amber-500',
          },
          {
            label: 'Facilities with Flags',
            value: fmt(stats.withFlags),
            sub:   stats.withFlags > 0 ? 'open compliance issues' : 'all clear',
            icon:  <ShieldAlert className="w-5 h-5" />,
            color: stats.withFlags > 0 ? 'text-red-500' : 'text-eco-700',
          },
          {
            label: 'Basel-Certified',
            value: fmt(stats.basel),
            sub:   'hazardous-permitted facilities',
            icon:  <Award className="w-5 h-5" />,
            color: 'text-blue-600',
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
            <p className="text-2xl font-semibold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            <p className={`text-[11px] mt-2 ${s.color}`}>{s.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search facility, license, or county…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors"
          />
        </div>
        <select
          value={countyFilter}
          onChange={e => setCountyFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20"
        >
          <option value="all">County: All</option>
          {counties.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
          Showing {fmt(filtered.length)} of {fmt(all.length)}
        </span>
      </div>

      {/* ── Table ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white border border-border rounded-xl overflow-hidden"
      >
        <div className="px-5 py-3 border-b border-border flex items-center gap-2 flex-wrap">
          <h2 className="text-sm font-semibold mr-2">National recycler register</h2>
          {TAB_FILTERS.map(t => (
            <button
              key={t.label}
              type="button"
              onClick={() => setStatusFilter(t.filter)}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                statusFilter === t.filter
                  ? 'bg-muted text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              {t.label} <span className="font-semibold">{t.count}</span>
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {['Facility', 'License', 'Location', 'Hazard Classes', 'Devices YTD', 'Mass', 'Flags', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-muted-foreground tracking-widest uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-sm text-muted-foreground">
                    {all.length === 0 ? 'No recycler facilities registered yet.' : 'No results match your filters.'}
                  </td>
                </tr>
              ) : filtered.map(f => (
                <tr key={f.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                  {/* Facility */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#0f1410] flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-white">
                          {f.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{f.name}</p>
                        <p className="text-[11px] text-muted-foreground">{f.location_city}</p>
                      </div>
                    </div>
                  </td>

                  {/* License */}
                  <td className="px-4 py-3.5">
                    <span className="text-xs font-mono text-muted-foreground">{f.license_number}</span>
                  </td>

                  {/* Location */}
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-muted-foreground">{f.location_county}</span>
                  </td>

                  {/* Hazard classes */}
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {f.hazardClasses.length === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : f.hazardClasses.map(h => (
                        <span
                          key={h}
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${HAZARD_BADGE[h] ?? 'bg-gray-100 text-gray-500'}`}
                        >
                          {HAZARD_SHORT[h] ?? h}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Devices YTD */}
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-medium">{fmt(f.devicesYTD)}</span>
                  </td>

                  {/* Mass */}
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-muted-foreground">
                      {f.massKg >= 1000 ? `${fmt(f.massKg / 1000, 1)} t` : `${fmt(f.massKg, 1)} kg`}
                    </span>
                  </td>

                  {/* Flags */}
                  <td className="px-4 py-3.5">
                    {f.flagCount > 0 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold bg-red-100 text-red-600 rounded-full">
                        {f.flagCount}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    {f.is_active ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-eco-50 text-eco-700 border border-eco-200 uppercase tracking-wide">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200 uppercase tracking-wide">
                        <AlertCircle className="w-3 h-3" /> Inactive
                      </span>
                    )}
                    {f.is_basel_certified && (
                      <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200 uppercase">
                        Basel
                      </span>
                    )}
                  </td>

                  {/* Manage */}
                  <td className="px-4 py-3.5">
                    <button
                      type="button"
                      onClick={() => setManagingId(f.id)}
                      className="flex items-center gap-0.5 text-sm font-medium text-eco-700 hover:underline underline-offset-2"
                    >
                      Manage <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── County distribution ── */}
      {countyData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <MapPin className="w-4 h-4 text-eco-700" />
            <h2 className="text-sm font-semibold">Distribution by county</h2>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={countyData} barSize={18} margin={{ left: -12 }}>
              <XAxis dataKey="county" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip
                contentStyle={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8 }}
                formatter={(v: number) => [v, 'Facilities']}
                cursor={{ fill: 'rgba(0,0,0,.03)' }}
              />
              <Bar dataKey="count" fill="#2f6b3a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* ── Manage slide panel ── */}
      <AnimatePresence>
        {managingId && managing && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setManagingId(null)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col"
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest">Manage facility</p>
                  <p className="text-sm font-semibold mt-0.5">{managing.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setManagingId(null)}
                  className="p-1.5 rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Panel content */}
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
                {/* Status indicator */}
                <div className={`flex items-center gap-2 p-3 rounded-xl border ${
                  managing.is_active
                    ? 'bg-eco-50 border-eco-200'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  {managing.is_active
                    ? <CheckCircle2 className="w-4 h-4 text-eco-700" />
                    : <AlertCircle className="w-4 h-4 text-gray-400" />}
                  <span className={`text-sm font-semibold ${managing.is_active ? 'text-eco-900' : 'text-gray-600'}`}>
                    {managing.is_active ? 'Active · Currently licensed' : 'Inactive · License suspended'}
                  </span>
                </div>

                {/* Details grid */}
                {[
                  { label: 'License Number',   value: managing.license_number },
                  { label: 'Location',          value: `${managing.location_city}, ${managing.location_county}` },
                  { label: 'Operator',          value: managing.ownerName },
                  { label: 'Contact',           value: managing.ownerEmail ?? '—' },
                  { label: 'Devices (all time)',value: fmt(managing.total_devices_processed) },
                  { label: 'Devices (YTD)',     value: fmt(managing.devicesYTD) },
                  { label: 'Mass Processed',    value: managing.massKg >= 1000 ? `${fmt(managing.massKg / 1000, 1)} t` : `${fmt(managing.massKg, 1)} kg` },
                  { label: 'Open Flags',        value: String(managing.flagCount) },
                  { label: 'Basel Certified',   value: managing.is_basel_certified ? 'Yes' : 'No' },
                  { label: 'Free Pickup',       value: managing.accepts_free_pickup ? 'Yes' : 'No' },
                  { label: 'Registered',        value: new Date(managing.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
                ].map(row => (
                  <div key={row.label}>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">{row.label}</p>
                    <p className="text-sm font-medium">{row.value}</p>
                  </div>
                ))}
              </div>

              {/* Panel actions */}
              <div className="px-5 py-4 border-t border-border space-y-2">
                <button
                  type="button"
                  onClick={toggleActive}
                  disabled={acting}
                  className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                    managing.is_active
                      ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                      : 'bg-eco-50 text-eco-700 border border-eco-200 hover:bg-eco-100'
                  }`}
                >
                  {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {managing.is_active ? 'Suspend facility' : 'Reactivate facility'}
                </button>
                <button
                  type="button"
                  onClick={() => setManagingId(null)}
                  className="w-full py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted/30 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
