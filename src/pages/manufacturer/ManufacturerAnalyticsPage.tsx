import { useState, useEffect } from 'react'
import { Loader2, BarChart3, Download } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Device } from '@/types/database'

const COUNTY_POS: Record<string, { x: number; y: number }> = {
  'Lofa':             { x: 46, y:  7 },
  'Grand Cape Mount': { x: 12, y: 29 },
  'Gbarpolu':         { x: 34, y: 27 },
  'Nimba':            { x: 76, y: 20 },
  'Bomi':             { x: 21, y: 38 },
  'Bong':             { x: 52, y: 33 },
  'Montserrado':      { x: 17, y: 48 },
  'Margibi':          { x: 32, y: 48 },
  'Grand Bassa':      { x: 44, y: 55 },
  'Grand Gedeh':      { x: 82, y: 55 },
  'River Cess':       { x: 55, y: 64 },
  'Sinoe':            { x: 67, y: 68 },
  'River Gee':        { x: 84, y: 75 },
  'Grand Kru':        { x: 73, y: 83 },
  'Maryland':         { x: 89, y: 86 },
}

const STATUS_FLOW = [
  { key: 'in_use',             label: 'In use',              color: '#2d6a3f' },
  { key: 'awaiting_transfer',  label: 'Awaiting transfer',   color: '#4a7ba5' },
  { key: 'ready_for_disposal', label: 'Ready for disposal',  color: '#c47c00' },
  { key: 'disposed',           label: 'Disposed (recycled)', color: '#5a9a6b' },
  { key: 'flagged',            label: 'Flagged',             color: '#b83535' },
]

const PERIODS = [
  { id: '3m',  label: '3 months' },
  { id: '6m',  label: '6 months' },
  { id: '12m', label: '12 months' },
  { id: 'all', label: 'All time' },
]

function fmt(n: number) { return new Intl.NumberFormat().format(Math.round(n)) }

// Sankey-style flow visualization
function LifecycleFlow({ items, total }: { items: { label: string; count: number; color: string }[]; total: number }) {
  const H = 200 // SVG height
  const W = 400 // SVG width

  let cumY = 0
  const bands = items.map(item => {
    const pct = total > 0 ? item.count / total : 0
    const h = pct * H
    const band = { ...item, pct, y: cumY, h }
    cumY += h
    return band
  })

  return (
    <div className="flex gap-0 items-stretch" style={{ height: H }}>
      {/* Left dark placed block */}
      <div
        className="w-32 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-white"
        style={{ background: '#0f1410' }}
      >
        <p className="text-[9px] tracking-widest text-white/40 uppercase mb-1">Placed</p>
        <p className="text-2xl font-bold leading-none">{fmt(total)}</p>
        <p className="text-[10px] text-white/40 mt-1">units · 100%</p>
      </div>

      {/* SVG flow bands */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="flex-1"
        style={{ height: H }}
      >
        {bands.map((band) => {
          if (band.h < 1) return null
          const lyt = band.y
          const lyb = band.y + band.h
          const ryt = band.y
          const ryb = band.y + band.h
          const cx = W * 0.45
          return (
            <path
              key={band.key}
              d={`M 0,${lyt} C ${cx},${lyt} ${cx},${ryt} ${W},${ryt} L ${W},${ryb} C ${cx},${ryb} ${cx},${lyb} 0,${lyb} Z`}
              fill={band.color}
              opacity={0.85}
            />
          )
        })}
      </svg>

      {/* Right labels */}
      <div className="w-52 flex flex-col flex-shrink-0" style={{ height: H }}>
        {bands.map((band) => {
          if (band.h < 1) return null
          const pct = Math.round(band.pct * 100)
          return (
            <div
              key={band.key}
              className="flex items-center justify-between px-3"
              style={{ height: band.h, background: band.color, minHeight: band.h < 20 ? band.h : undefined }}
            >
              {band.h >= 18 && (
                <>
                  <span className="text-white text-xs font-medium truncate pr-2">{band.label}</span>
                  <span className="text-white text-xs font-bold flex-shrink-0">{pct}%</span>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function ManufacturerAnalyticsPage() {
  const { profile } = useAuth()
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('12m')

  useEffect(() => {
    if (!profile) return
    supabase
      .from('devices')
      .select('*')
      .eq('original_owner_id', profile.id)
      .then(({ data }) => {
        setDevices(data ?? [])
        setLoading(false)
      })
  }, [profile])

  // Filter devices by period
  const filteredDevices = (() => {
    if (period === 'all') return devices
    const months = period === '3m' ? 3 : period === '6m' ? 6 : 12
    const cutoff = new Date()
    cutoff.setMonth(cutoff.getMonth() - months)
    return devices.filter(d => new Date(d.created_at) >= cutoff)
  })()

  const total    = filteredDevices.length
  const inUse    = filteredDevices.filter(d => d.status === 'in_use').length
  const disposed = filteredDevices.filter(d => d.status === 'disposed').length
  const awaiting = filteredDevices.filter(d => d.status === 'awaiting_transfer').length
  const rdp      = filteredDevices.filter(d => d.status === 'ready_for_disposal').length
  const flagged  = filteredDevices.filter(d => d.status === 'flagged').length

  const disposalRate  = total > 0 ? ((disposed / total) * 100).toFixed(1) : '0.0'
  const totalCO2      = filteredDevices.reduce((s, d) => s + (d.co2_kg_avoided ?? 0), 0)
  const totalMaterials = filteredDevices.reduce((s, d) =>
    s + d.material_gold_g + d.material_copper_g + d.material_aluminum_g + d.material_lithium_g + d.material_cobalt_g + d.material_lead_g, 0)

  // Top models
  const modelMap: Record<string, { brand: string; model: string; total: number; disposed: number }> = {}
  filteredDevices.forEach(d => {
    const key = `${d.brand}||${d.model}`
    if (!modelMap[key]) modelMap[key] = { brand: d.brand, model: d.model, total: 0, disposed: 0 }
    modelMap[key].total++
    if (d.status === 'disposed') modelMap[key].disposed++
  })
  const topModels = Object.values(modelMap).sort((a, b) => b.total - a.total).slice(0, 5)
  const maxModelTotal = topModels[0]?.total ?? 1

  // Status flow data
  const flowItems = STATUS_FLOW.map(s => ({
    key: s.key,
    label: s.label,
    color: s.color,
    count: filteredDevices.filter(d => d.status === s.key).length,
  })).filter(s => s.count > 0)

  // Compliance routing summary
  const compliantPct = total > 0 ? Math.round((disposed / total) * 100) : 0
  const awaitingPct  = total > 0 ? Math.round(((awaiting + rdp) / total) * 100) : 0
  const offNetPct    = total > 0 ? Math.round((flagged / total) * 100) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f5f5f2' }}>
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#f5f5f2' }}>
      {/* ── Top bar ──────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm text-gray-400">
          <span>Manufacturer</span>
          <span>/</span>
          <span className="text-gray-700 font-medium">Lifecycle Analytics</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Period filter */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {PERIODS.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{
                  background: period === p.id ? 'white' : 'transparent',
                  color: period === p.id ? '#0f1410' : '#9b9b98',
                  boxShadow: period === p.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white"
            style={{ background: '#0f1410' }}
          >
            <Download className="w-3.5 h-3.5" />
            Export CSR report
          </button>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* ── Page title ───────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lifecycle analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            How devices you've placed on the market are moving through ownership and disposal.
          </p>
        </div>

        {total === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <BarChart3 className="w-10 h-10 text-gray-300 mb-4" />
            <p className="text-sm text-gray-500 mb-1">No devices registered yet.</p>
            <p className="text-xs text-gray-400">Register devices to see lifecycle analytics.</p>
          </div>
        ) : (
          <>
            {/* ── KPI cards ──────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: 'DEVICES PLACED',
                  value: fmt(total),
                  sub: `+${fmt(filteredDevices.filter(d => {
                    const d30 = new Date(); d30.setDate(d30.getDate() - 30)
                    return new Date(d.created_at) >= d30
                  }).length)} this month`,
                  subColor: '#2d6a3f',
                  chart: true,
                },
                {
                  label: 'DISPOSAL RATE',
                  value: `${disposalRate}%`,
                  sub: `${fmt(disposed)} of ${fmt(total)} recycled`,
                  subColor: '#2d6a3f',
                },
                {
                  label: 'CO₂ AVOIDED',
                  value: `${totalCO2.toFixed(1)} kg`,
                  sub: 'through compliant recycling',
                  subColor: '#9b9b98',
                },
                {
                  label: 'MATERIALS (g)',
                  value: fmt(totalMaterials),
                  sub: 'recoverable across all devices',
                  subColor: '#9b9b98',
                },
              ].map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-white rounded-2xl border border-gray-200 p-5 relative overflow-hidden"
                >
                  <p className="text-[10px] tracking-widest text-gray-400 uppercase mb-3">{card.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                  <p className="text-xs mt-1" style={{ color: card.subColor }}>{card.sub}</p>
                  {card.chart && (
                    <svg className="absolute right-4 top-4 w-16 h-8 opacity-60" viewBox="0 0 64 32">
                      <polyline points="0,28 12,22 24,18 36,14 48,10 64,4" fill="none" stroke="#2d6a3f" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )}
                </motion.div>
              ))}
            </div>

            {/* ── Flow + Top models ────────────────────────────────── */}
            <div className="grid lg:grid-cols-5 gap-5">

              {/* Device lifecycle flow */}
              <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-900">Device lifecycle flow</h2>
                  <span className="text-xs text-gray-400">Sankey · {PERIODS.find(p => p.id === period)?.label} cohort</span>
                </div>
                {flowItems.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-sm text-gray-400">
                    No status data available.
                  </div>
                ) : (
                  <LifecycleFlow items={flowItems} total={total} />
                )}

                {/* Legend */}
                <div className="flex flex-wrap gap-3 mt-4">
                  {flowItems.map(item => (
                    <div key={item.key} className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: item.color }} />
                      {item.label} · {total > 0 ? Math.round((item.count / total) * 100) : 0}%
                    </div>
                  ))}
                </div>
              </div>

              {/* Top models */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">Top models · disposal rate</h2>
                {topModels.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-sm text-gray-400">No data</div>
                ) : (
                  <div className="space-y-4">
                    {topModels.map((m, i) => {
                      const rate = m.total > 0 ? Math.round((m.disposed / m.total) * 100) : 0
                      const barWidth = Math.round((m.total / maxModelTotal) * 100)
                      const barColor = rate >= 50 ? '#2d6a3f' : rate >= 25 ? '#c47c00' : '#b83535'
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-medium text-gray-900 truncate pr-2">
                              {m.brand} {m.model}
                            </span>
                            <span className="text-gray-400 flex-shrink-0">
                              {fmt(m.total)} units · <span className="font-semibold" style={{ color: barColor }}>{rate}%</span>
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#f0ede6' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${barWidth}%` }}
                              transition={{ duration: 0.7, delay: i * 0.08, ease: 'easeOut' }}
                              className="h-full rounded-full"
                              style={{ background: barColor }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── Geographic distribution ──────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">
                  Geographic distribution &amp; end-of-life routing
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full" style={{ background: '#e8f5ec', color: '#2d6a3f' }}>
                    RECYCLED {compliantPct}%
                  </span>
                  <span className="text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full" style={{ background: '#fdf3dc', color: '#b87a00' }}>
                    AWAITING {awaitingPct}%
                  </span>
                  {offNetPct > 0 && (
                    <span className="text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full" style={{ background: '#fde8e8', color: '#c0392b' }}>
                      FLAGGED {offNetPct}%
                    </span>
                  )}
                </div>
              </div>

              {/* Liberia county map */}
              <div className="relative" style={{ height: 300, background: '#e8e5de' }}>
                <svg className="absolute inset-0 w-full h-full opacity-20">
                  <defs>
                    <pattern id="agrid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#9b9b98" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#agrid)" />
                </svg>
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <polygon
                    points="10,22 18,15 35,12 50,5 70,10 85,15 90,30 88,45 82,55 78,65 72,78 65,88 55,92 45,90 35,85 25,80 18,72 12,60 8,48 6,35"
                    fill="#dbd8d0"
                    stroke="#c8c5bd"
                    strokeWidth="0.5"
                  />
                </svg>

                {/* County dots — all green since we can't map devices to counties directly */}
                {Object.entries(COUNTY_POS).map(([county, pos]) => (
                  <div
                    key={county}
                    className="absolute flex flex-col items-center"
                    style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
                  >
                    <span
                      className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
                      style={{ background: '#2d6a3f' }}
                    />
                    <span
                      className="mt-0.5 px-1 rounded text-[8px] font-semibold whitespace-nowrap"
                      style={{ background: 'rgba(255,255,255,0.8)', color: '#0f1410' }}
                    >
                      {county.replace('Grand ', 'Gr. ')}
                    </span>
                  </div>
                ))}

                {/* Info card overlay */}
                <div className="absolute top-3 left-3 bg-white rounded-xl shadow-md border border-gray-200 px-4 py-3 max-w-xs">
                  <p className="text-[10px] tracking-wider text-gray-400 uppercase mb-0.5">Registered</p>
                  <p className="text-sm font-bold text-gray-900">Liberia · 15 counties</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {fmt(inUse)} active · {fmt(disposed)} returned · {flagged > 0 ? `${fmt(flagged)} flagged` : 'none flagged'}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Materials recovery ───────────────────────────────── */}
            <div className="grid lg:grid-cols-2 gap-5">
              {/* Material breakdown */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">Total recoverable materials</h2>
                <div className="space-y-3">
                  {[
                    { label: 'Copper',   value: filteredDevices.reduce((s, d) => s + d.material_copper_g,   0), color: '#b91c1c' },
                    { label: 'Aluminum', value: filteredDevices.reduce((s, d) => s + d.material_aluminum_g, 0), color: '#1d4ed8' },
                    { label: 'Lithium',  value: filteredDevices.reduce((s, d) => s + d.material_lithium_g,  0), color: '#6d28d9' },
                    { label: 'Cobalt',   value: filteredDevices.reduce((s, d) => s + d.material_cobalt_g,   0), color: '#0e7490' },
                    { label: 'Gold',     value: filteredDevices.reduce((s, d) => s + d.material_gold_g,     0), color: '#b45309' },
                    { label: 'Lead',     value: filteredDevices.reduce((s, d) => s + d.material_lead_g,     0), color: '#4b5563' },
                  ].map(mat => {
                    const maxVal = Math.max(
                      filteredDevices.reduce((s, d) => s + d.material_copper_g, 0),
                      filteredDevices.reduce((s, d) => s + d.material_aluminum_g, 0), 1)
                    return (
                      <div key={mat.label}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-500">{mat.label}</span>
                          <span className="font-semibold text-gray-900">{mat.value.toFixed(1)} g</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#f0ede6' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((mat.value / maxVal) * 100, 100)}%` }}
                            transition={{ duration: 0.7, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ background: mat.color }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Hazard class breakdown */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">Hazard class distribution</h2>
                <div className="grid grid-cols-2 gap-3">
                  {(() => {
                    const counts: Record<string, number> = {}
                    filteredDevices.forEach(d => {
                      const k = d.hazard_class || 'none'
                      counts[k] = (counts[k] ?? 0) + 1
                    })
                    const HAZARD_LABEL: Record<string, string> = {
                      none: 'None', li_ion_battery: 'Li-Ion', mercury_ccfl: 'Mercury',
                      toner: 'Toner', mixed: 'Mixed'
                    }
                    const HAZARD_COLOR: Record<string, string> = {
                      none: '#2d6a3f', li_ion_battery: '#c47c00', mercury_ccfl: '#b83535',
                      toner: '#4a7ba5', mixed: '#6d28d9'
                    }
                    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([hazard, count]) => (
                      <div key={hazard} className="rounded-xl p-4 text-center" style={{ background: '#f5f5f2' }}>
                        <p className="text-xl font-bold" style={{ color: HAZARD_COLOR[hazard] ?? '#0f1410' }}>{count}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{HAZARD_LABEL[hazard] ?? hazard}</p>
                        <p className="text-[10px] text-gray-300">{total > 0 ? Math.round((count / total) * 100) : 0}%</p>
                      </div>
                    ))
                  })()}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
