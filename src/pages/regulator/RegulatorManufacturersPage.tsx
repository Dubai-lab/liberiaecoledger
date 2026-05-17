import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend,
} from 'recharts'
import {
  Factory, Loader2, Search, Download, TrendingUp,
  AlertTriangle, CheckCircle2, Eye, Leaf,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ManufacturerRow {
  id: string
  name: string
  email: string | null
  isVerified: boolean
  devicesPlaced: number
  devicesReturned: number
  takeBackRate: number
  score: number
  status: 'compliant' | 'watch' | 'non_compliant'
}

interface MonthlyPoint {
  month: string
  rate: number
  goal: number
}

// ── Constants ─────────────────────────────────────────────────────────────────

const EPR_GOAL_PCT = 45  // 45% by 2027

const STATUS_STYLE: Record<string, { badge: string; label: string }> = {
  compliant:     { badge: 'bg-eco-50 text-eco-700 border border-eco-200',   label: 'Compliant' },
  watch:         { badge: 'bg-amber-50 text-amber-700 border border-amber-200', label: 'Watch' },
  non_compliant: { badge: 'bg-red-50 text-red-700 border border-red-200',   label: 'Non-compliant' },
}

function scoreColor(score: number) {
  if (score >= 70) return { ring: '#2f6b3a', text: '#2f6b3a', bg: '#f0faf2' }
  if (score >= 40) return { ring: '#d97706', text: '#d97706', bg: '#fffbeb' }
  return { ring: '#dc2626', text: '#dc2626', bg: '#fef2f2' }
}

function fmt(n: number, d = 0) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: d }).format(n)
}

function deriveStatus(score: number): ManufacturerRow['status'] {
  if (score >= 70) return 'compliant'
  if (score >= 40) return 'watch'
  return 'non_compliant'
}

function deriveScore(takeBackRate: number, devicesPlaced: number): number {
  if (devicesPlaced === 0) return 0
  return Math.min(100, Math.round((takeBackRate / EPR_GOAL_PCT) * 100))
}

function exportCSV(rows: ManufacturerRow[]) {
  const headers = ['Producer', 'Email', 'Devices Placed', 'Devices Returned', 'Take-back Rate', 'EPR Score', 'Status']
  const data = rows.map(r => [
    r.name, r.email ?? '',
    r.devicesPlaced, r.devicesReturned,
    `${r.takeBackRate.toFixed(1)}%`,
    r.score, STATUS_STYLE[r.status].label,
  ])
  const csv = [headers, ...data].map(row => row.map(v => `"${v}"`).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = `epr-scorecard-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
}

// ── Score circle SVG ──────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const { ring, text, bg } = scoreColor(score)
  const r = 22
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <div className="relative flex items-center justify-center w-12 h-12" style={{ background: bg, borderRadius: '50%' }}>
      <svg width="48" height="48" className="absolute inset-0" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="24" cy="24" r={r} fill="none" stroke="#e5e7eb" strokeWidth="3" />
        <circle
          cx="24" cy="24" r={r} fill="none"
          stroke={ring} strokeWidth="3"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="text-xs font-bold relative z-10" style={{ color: text }}>{score}</span>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RegulatorManufacturersPage() {
  const [all, setAll] = useState<ManufacturerRow[]>([])
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [escalating, setEscalating] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      const [rolesRes, devicesRes] = await Promise.all([
        supabase.from('user_roles').select('user_id, is_verified, organization').eq('role', 'manufacturer'),
        supabase.from('devices').select('id, original_owner_id, status, created_at'),
      ])

      const roles = rolesRes.data ?? []
      const mfrIds = roles.map(r => r.user_id)

      const { data: profileRows } = mfrIds.length
        ? await supabase.from('profiles').select('id, full_name, organization, email').in('id', mfrIds)
        : { data: [] }

      const pMap = new Map(profileRows?.map(p => [p.id, p]) ?? [])
      const rMap = new Map(roles.map(r => [r.user_id, r]))
      const devices = (devicesRes.data ?? [])
      const mfrIdSet = new Set(mfrIds)

      const rows: ManufacturerRow[] = (profileRows ?? []).map(p => {
        const role = rMap.get(p.id)
        const placed = devices.filter(d => d.original_owner_id === p.id)
        const returned = placed.filter(d => d.status === 'disposed')
        const takeBackRate = placed.length > 0 ? (returned.length / placed.length) * 100 : 0
        const score = deriveScore(takeBackRate, placed.length)
        return {
          id: p.id,
          name: p.organization ?? role?.organization ?? p.full_name ?? p.email ?? 'Unknown',
          email: p.email,
          isVerified: role?.is_verified ?? false,  // kept for display only
          devicesPlaced: placed.length,
          devicesReturned: returned.length,
          takeBackRate,
          score,
          status: deriveStatus(score),
        }
      })

      // Only assess producers who have actually placed devices on the market
      setAll(rows.filter(r => r.devicesPlaced > 0).sort((a, b) => b.score - a.score))

      // ── Monthly trend (last 24 months) ───────────────────────────────────
      const now = new Date()
      const mfrDevices = devices.filter(d => mfrIdSet.has(d.original_owner_id))
      const trend: MonthlyPoint[] = Array.from({ length: 24 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (23 - i), 1)
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString()
        const placed = mfrDevices.filter(dev => dev.created_at <= monthEnd)
        const returned = placed.filter(dev => dev.status === 'disposed')
        const rate = placed.length > 0 ? Math.round((returned.length / placed.length) * 100) : 0
        return {
          month: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          rate,
          goal: EPR_GOAL_PCT,
        }
      })
      setMonthlyTrend(trend)
      setLoading(false)
    })()
  }, [])

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalPlaced   = all.reduce((s, r) => s + r.devicesPlaced, 0)
    const totalReturned = all.reduce((s, r) => s + r.devicesReturned, 0)
    const nationalRate  = totalPlaced > 0 ? (totalReturned / totalPlaced) * 100 : 0
    return {
      producers:     all.length,
      totalPlaced,
      nationalRate,
      compliant:     all.filter(r => r.status === 'compliant').length,
      watch:         all.filter(r => r.status === 'watch').length,
      nonCompliant:  all.filter(r => r.status === 'non_compliant').length,
    }
  }, [all])

  // ── Filters ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return all.filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (!q) return true
      return r.name.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q)
    })
  }, [all, search, statusFilter])

  const escalateToAG = async (producer: ManufacturerRow) => {
    setEscalating(producer.id)
    await supabase.from('notifications').insert({
      user_id:  producer.id,
      title:    'EPR Enforcement Notice — Section 14',
      body:     `Your EPR compliance score of ${producer.score}/100 (take-back rate ${producer.takeBackRate.toFixed(1)}%) falls below the mandatory threshold. This matter has been referred to the Attorney General under Section 14 of the EPR Act.`,
      type:     'warning',
      is_read:  false,
      link:     null,
    })
    toast.success(`Enforcement notice sent to ${producer.name}.`)
    setEscalating(null)
  }

  const TAB_FILTERS = [
    { label: 'All',           filter: 'all',          count: all.length },
    { label: 'Compliant',     filter: 'compliant',    count: stats.compliant },
    { label: 'Watch',         filter: 'watch',        count: stats.watch },
    { label: 'Non-compliant', filter: 'non_compliant',count: stats.nonCompliant },
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
          <h1 className="text-2xl font-semibold">Manufacturer EPR Compliance</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Every entity placing electronic devices on the Liberian market, scored against their Extended Producer Responsibility obligations.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-xs text-muted-foreground px-3 py-2 border border-border rounded-lg">
            Period: FY {new Date().getFullYear()}/{String(new Date().getFullYear() + 1).slice(2)}
          </div>
          <button
            type="button"
            onClick={() => exportCSV(filtered)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-border rounded-lg hover:bg-muted/30 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export EPR ledger
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white rounded-lg transition-colors"
            style={{ background: '#0f1410' }}
          >
            Generate AG brief →
          </button>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          {
            label: 'Registered Producers',
            value: fmt(stats.producers),
            sub:   `${stats.compliant} compliant this period`,
            icon:  <Factory className="w-5 h-5" />,
            color: 'text-foreground',
            subColor: 'text-eco-700',
          },
          {
            label: 'Devices Placed (YTD)',
            value: stats.totalPlaced >= 1000 ? `${fmt(stats.totalPlaced / 1000, 0)}k` : fmt(stats.totalPlaced),
            sub:   `tracked on EcoLedger`,
            icon:  <TrendingUp className="w-5 h-5" />,
            color: 'text-blue-600',
            subColor: 'text-blue-600',
          },
          {
            label: 'National Take-back Rate',
            value: `${stats.nationalRate.toFixed(1)} %`,
            sub:   `goal ${EPR_GOAL_PCT}% by 2027`,
            icon:  <Leaf className="w-5 h-5" />,
            color: stats.nationalRate >= EPR_GOAL_PCT ? 'text-eco-700' : 'text-amber-500',
            subColor: stats.nationalRate >= EPR_GOAL_PCT ? 'text-eco-700' : 'text-amber-500',
          },
          {
            label: 'EPR Levies Outstanding',
            value: fmt(stats.nonCompliant),
            sub:   stats.nonCompliant > 0 ? `${stats.nonCompliant} producer${stats.nonCompliant > 1 ? 's' : ''} in arrears` : 'No outstanding levies',
            icon:  <AlertTriangle className="w-5 h-5" />,
            color: stats.nonCompliant > 0 ? 'text-red-600' : 'text-eco-700',
            subColor: stats.nonCompliant > 0 ? 'text-red-600' : 'text-eco-700',
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
            <p className={`text-[11px] mt-2 ${s.subColor}`}>{s.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Search + filter ── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search producer or parent org…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors"
          />
        </div>
        <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
          Showing {fmt(filtered.length)} of {fmt(all.length)}
        </span>
      </div>

      {/* ── EPR Scorecard table ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white border border-border rounded-xl overflow-hidden"
      >
        <div className="px-5 py-3 border-b border-border flex items-center gap-2 flex-wrap">
          <h2 className="text-sm font-semibold mr-2">Producer EPR scorecard</h2>
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
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {['Producer', 'Devices Placed', 'Devices Returned', 'Take-back Rate', 'EPR Score', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-muted-foreground tracking-widest uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-sm text-muted-foreground">
                    {all.length === 0
                      ? 'No manufacturer accounts registered yet.'
                      : 'No results match your filters.'}
                  </td>
                </tr>
              ) : filtered.map(r => {
                const { badge, label } = STATUS_STYLE[r.status]
                const barColor = r.takeBackRate >= EPR_GOAL_PCT ? '#2f6b3a' : r.takeBackRate >= 20 ? '#d97706' : '#dc2626'
                const barPct = Math.min(100, (r.takeBackRate / EPR_GOAL_PCT) * 100)
                return (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                    {/* Producer */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#0f1410] flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-white">
                            {r.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{r.name}</p>
                          {r.email && <p className="text-[11px] text-muted-foreground">{r.email}</p>}
                        </div>
                        {r.isVerified && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-eco-700 flex-shrink-0" aria-label="Verified" />
                        )}
                      </div>
                    </td>

                    {/* Devices placed */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-medium">{fmt(r.devicesPlaced)}</span>
                    </td>

                    {/* Devices returned */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-muted-foreground">{fmt(r.devicesReturned)}</span>
                    </td>

                    {/* Take-back rate with progress bar */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${barPct}%`, background: barColor }}
                          />
                        </div>
                        <span className="text-xs font-medium tabular-nums w-10 text-right">
                          {r.takeBackRate.toFixed(1)}%
                        </span>
                      </div>
                    </td>

                    {/* EPR Score circle */}
                    <td className="px-4 py-3.5">
                      <ScoreBadge score={r.score} />
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${badge}`}>
                        {label}
                      </span>
                    </td>

                    {/* Open file */}
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        className="text-sm font-medium text-eco-700 hover:underline underline-offset-2"
                      >
                        Open file
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── 24-month take-back trend ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white border border-border rounded-xl p-6"
      >
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4 text-eco-700" />
          <h2 className="text-sm font-semibold">National take-back rate trend</h2>
          <span className="ml-auto text-xs text-muted-foreground">Last 24 months</span>
        </div>
        <p className="text-xs text-muted-foreground mb-5">
          Cumulative take-back rate across all registered producers vs the 45%-by-2027 EPR target.
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={monthlyTrend} margin={{ left: -12, right: 8 }}>
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              interval={3}
            />
            <YAxis
              domain={[0, 60]}
              tickFormatter={v => `${v}%`}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8 }}
              formatter={(v: number, name: string) => [
                `${v}%`,
                name === 'rate' ? 'Take-back rate' : 'EPR Target',
              ]}
              cursor={{ stroke: '#e5e7eb' }}
            />
            <Legend
              iconType="line"
              iconSize={12}
              formatter={(value: string) => (
                <span style={{ fontSize: 11, color: '#6b7280' }}>
                  {value === 'rate' ? 'National take-back rate' : `EPR goal (${EPR_GOAL_PCT}%)`}
                </span>
              )}
            />
            <ReferenceLine y={EPR_GOAL_PCT} stroke="#2f6b3a" strokeDasharray="4 4" strokeOpacity={0.5} />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="goal"
              stroke="#2f6b3a"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* ── Outstanding enforcement panel ── */}
      {all.filter(r => r.status === 'non_compliant').length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white border border-red-200 rounded-xl overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-red-200 bg-red-50 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <h2 className="text-sm font-semibold text-red-800">Outstanding enforcement actions</h2>
            <span className="ml-auto text-xs text-red-600">
              Section 14 · EPR Act — referral to Attorney General
            </span>
          </div>
          <div className="divide-y divide-border">
            {all.filter(r => r.status === 'non_compliant').map(r => (
              <div key={r.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-9 h-9 rounded-xl bg-[#0f1410] flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-white">
                    {r.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{r.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Take-back rate: {r.takeBackRate.toFixed(1)}% · EPR score: {r.score}/100
                    · {r.devicesPlaced} placed, {r.devicesReturned} returned
                  </p>
                </div>
                <ScoreBadge score={r.score} />
                <button
                  type="button"
                  onClick={() => escalateToAG(r)}
                  disabled={escalating === r.id}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {escalating === r.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Eye className="w-3.5 h-3.5" />}
                  Escalate to AG
                </button>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 bg-red-50 border-t border-red-200">
            <p className="text-[11px] text-red-700">
              Escalation sends a formal EPR enforcement notification to the producer and logs the action.
              Section 14 of the EPR Act provides for monetary penalties and license revocation.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  )
}
