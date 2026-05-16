import { useState, useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'

// Approximate geographic positions for Liberia's 15 counties (% of map container)
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

const LIBERIA_COUNTIES = Object.keys(COUNTY_POS)

const VIEWS = [
  { id: 'flags',    label: 'Compliance flags' },
  { id: 'coverage', label: 'Facility coverage' },
  { id: 'basel',    label: 'Basel certification' },
  { id: 'flow',     label: 'Device flow' },
]

const PERIODS = ['7d', '30d', '90d', 'YTD', 'All']

const CATEGORIES = [
  { id: 'mobile',    label: 'Mobile phones' },
  { id: 'computers', label: 'Computers' },
  { id: 'large',     label: 'Large appliances' },
  { id: 'screens',   label: 'Screens · CRT/LCD' },
  { id: 'batteries', label: 'Batteries' },
]

interface FacilityRow {
  id: string
  name: string
  location_city: string
  location_county: string
  is_basel_certified: boolean
  is_active: boolean
  license_number: string
}

interface FlagRow {
  id: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'investigating' | 'resolved' | 'dismissed'
  flag_type: string
  description: string
  created_at: string
}

interface CountyData {
  county: string
  facilities: FacilityRow[]
  flags: FlagRow[]
  pos: { x: number; y: number }
}

type DotColor = 'green' | 'orange' | 'red' | 'gray'

function getDotColor(county: CountyData, view: string): DotColor {
  if (view === 'flags') {
    const openFlags = county.flags.filter(f => f.status === 'open' || f.status === 'investigating')
    if (openFlags.some(f => f.severity === 'critical')) return 'red'
    if (openFlags.some(f => f.severity === 'high')) return 'red'
    if (openFlags.some(f => f.severity === 'medium')) return 'orange'
    if (openFlags.length > 0) return 'orange'
    if (county.facilities.length === 0) return 'gray'
    return 'green'
  }
  if (view === 'coverage') {
    if (county.facilities.filter(f => f.is_active).length === 0) return 'red'
    return 'green'
  }
  if (view === 'basel') {
    if (county.facilities.some(f => f.is_basel_certified && f.is_active)) return 'green'
    if (county.facilities.some(f => f.is_active)) return 'orange'
    return 'red'
  }
  // flow — use facility presence as proxy
  if (county.facilities.length > 1) return 'green'
  if (county.facilities.length === 1) return 'orange'
  return 'gray'
}

const DOT_STYLE: Record<DotColor, { bg: string; ring: string; label: string }> = {
  green:  { bg: '#2d6a3f', ring: 'rgba(45,106,63,0.25)',  label: 'Compliant' },
  orange: { bg: '#b87a00', ring: 'rgba(184,122,0,0.25)',  label: 'Needs attention' },
  red:    { bg: '#c0392b', ring: 'rgba(192,57,43,0.25)',  label: 'Critical' },
  gray:   { bg: '#9b9b98', ring: 'rgba(155,155,152,0.2)', label: 'No data' },
}

function severityBadge(c: CountyData) {
  const open = c.flags.filter(f => f.status === 'open' || f.status === 'investigating')
  if (open.some(f => f.severity === 'critical')) return { label: 'CRITICAL', bg: '#fde8e8', text: '#c0392b' }
  if (open.some(f => f.severity === 'high'))     return { label: 'HIGH RISK', bg: '#fde8e8', text: '#c0392b' }
  if (open.some(f => f.severity === 'medium'))   return { label: 'WARNING',   bg: '#fdf3dc', text: '#b87a00' }
  if (c.facilities.some(f => f.is_basel_certified && f.is_active))
    return { label: 'CERTIFIED', bg: '#e8f5ec', text: '#2d6a3f' }
  if (c.facilities.some(f => f.is_active))
    return { label: 'ACTIVE', bg: '#e8f0fe', text: '#1a56db' }
  return { label: 'NO FACILITY', bg: '#f0ede6', text: '#9b9b98' }
}

export function ComplianceMapPage() {
  const navigate = useNavigate()
  const [counties, setCounties] = useState<CountyData[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('flags')
  const [period, setPeriod] = useState('90d')
  const [categories, setCategories] = useState<string[]>(['mobile', 'computers', 'large', 'screens', 'batteries'])
  const [threshold, setThreshold] = useState(60)
  const [selected, setSelected] = useState<CountyData | null>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([
      supabase.from('recycler_facilities').select('id, name, location_city, location_county, is_basel_certified, is_active, license_number'),
      supabase.from('compliance_flags').select('id, severity, status, flag_type, description, created_at'),
    ]).then(([facRes, flagRes]) => {
      const facilities = (facRes.data ?? []) as FacilityRow[]
      const flags = (flagRes.data ?? []) as FlagRow[]

      const data: CountyData[] = LIBERIA_COUNTIES.map(county => ({
        county,
        facilities: facilities.filter(f => f.location_county === county),
        flags,
        pos: COUNTY_POS[county],
      }))

      setCounties(data)
      setLoading(false)
    })
  }, [])

  const toggleCategory = (id: string) =>
    setCategories(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])

  const criticalCount = counties.filter(c => getDotColor(c, view) === 'red').length
  const hotspotCount  = counties.filter(c => getDotColor(c, view) !== 'gray').length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f5f5f2' }}>
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f5f5f2' }}>

      {/* ── Left filter panel ─────────────────────────────────────── */}
      <aside className="w-72 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100">
          <p className="text-[10px] tracking-widest text-gray-400 uppercase mb-0.5">Regulator</p>
          <h1 className="text-lg font-semibold text-gray-900">Compliance Map</h1>
        </div>

        <div className="flex-1 px-5 py-5 space-y-6">

          {/* VIEW */}
          <div>
            <p className="text-[10px] tracking-widest text-gray-400 uppercase mb-3">View</p>
            <div className="space-y-1.5">
              {VIEWS.map(v => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setView(v.id)}
                  className="w-full flex items-center gap-2.5 text-sm text-left py-1"
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                    style={{
                      borderColor: view === v.id ? '#0f1410' : '#d1d5db',
                      background: 'white',
                    }}
                  >
                    {view === v.id && (
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#0f1410' }} />
                    )}
                  </span>
                  <span className={view === v.id ? 'font-semibold text-gray-900' : 'text-gray-500'}>
                    {v.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* PERIOD */}
          <div>
            <p className="text-[10px] tracking-widest text-gray-400 uppercase mb-3">Period</p>
            <div className="flex gap-1 flex-wrap">
              {PERIODS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: period === p ? '#0f1410' : '#f3f4f6',
                    color: period === p ? 'white' : '#6b7280',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* DEVICE CATEGORY */}
          <div>
            <p className="text-[10px] tracking-widest text-gray-400 uppercase mb-3">Device Category</p>
            <div className="space-y-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className="w-full flex items-center gap-2.5 text-sm text-left"
                >
                  <span
                    className="w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all"
                    style={{
                      borderColor: categories.includes(cat.id) ? '#0f1410' : '#d1d5db',
                      background: categories.includes(cat.id) ? '#0f1410' : 'white',
                    }}
                  >
                    {categories.includes(cat.id) && (
                      <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="none" stroke="white" strokeWidth={1.8}>
                        <path d="M1.5 5l2.5 2.5 4.5-5" />
                      </svg>
                    )}
                  </span>
                  <span className="text-gray-600">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* SEVERITY THRESHOLD */}
          <div>
            <p className="text-[10px] tracking-widest text-gray-400 uppercase mb-3">Severity Threshold</p>
            <div className="relative">
              <div className="h-1.5 rounded-full mb-2" style={{ background: 'linear-gradient(to right, #22c55e, #f59e0b, #ef4444)' }} />
              <input
                type="range"
                min={0}
                max={100}
                value={threshold}
                onChange={e => setThreshold(Number(e.target.value))}
                className="w-full h-1.5 absolute top-0 opacity-0 cursor-pointer"
              />
              <div
                className="absolute top-0 w-3.5 h-3.5 rounded-full bg-white border-2 border-gray-400 -translate-y-1 cursor-pointer shadow-sm"
                style={{ left: `calc(${threshold}% - 7px)` }}
              />
            </div>
            <div className="flex justify-between mt-3 text-[10px] text-gray-400">
              <span>Low</span>
              <span className="font-medium text-gray-600">
                {threshold < 33 ? '● Low' : threshold < 66 ? '● High' : '● Critical'}
              </span>
              <span>Critical</span>
            </div>
          </div>

          {/* SHOWING */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-[10px] tracking-widest text-gray-400 uppercase mb-1">Showing</p>
            <p className="text-2xl font-bold text-gray-900">{hotspotCount} counties</p>
            <p className="text-xs text-gray-500 mt-0.5">
              across 15 counties · <span className="text-red-500 font-medium">{criticalCount} critical</span>
            </p>
          </div>

          {/* Legend */}
          <div>
            <p className="text-[10px] tracking-widest text-gray-400 uppercase mb-3">Legend</p>
            <div className="space-y-1.5">
              {(['green', 'orange', 'red', 'gray'] as DotColor[]).map(color => (
                <div key={color} className="flex items-center gap-2.5 text-xs text-gray-500">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: DOT_STYLE[color].bg }} />
                  {DOT_STYLE[color].label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* ── Map area ──────────────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden">

        {/* Map background */}
        <div className="absolute inset-0" style={{ background: '#e8e5de' }}>
          {/* Subtle grid pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-20">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#9b9b98" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Liberia outline (simplified SVG polygon approximation) */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <polygon
              points="10,22 18,15 35,12 50,5 70,10 85,15 90,30 88,45 82,55 78,65 72,78 65,88 55,92 45,90 35,85 25,80 18,72 12,60 8,48 6,35"
              fill="#dbd8d0"
              stroke="#c8c5bd"
              strokeWidth="0.5"
            />
          </svg>
        </div>

        {/* County dots */}
        {counties.map(county => {
          const color = getDotColor(county, view)
          const style = DOT_STYLE[color]
          const isSelected = selected?.county === county.county
          const count = view === 'flags'
            ? county.flags.filter(f => f.status === 'open' || f.status === 'investigating').length
            : county.facilities.length

          return (
            <button
              key={county.county}
              type="button"
              onClick={() => setSelected(isSelected ? null : county)}
              className="absolute flex flex-col items-center group transition-transform hover:scale-110"
              style={{
                left: `${county.pos.x}%`,
                top: `${county.pos.y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: isSelected ? 20 : 10,
              }}
            >
              {/* Ring */}
              <span
                className="absolute rounded-full animate-ping"
                style={{
                  width: 28,
                  height: 28,
                  background: style.ring,
                  opacity: isSelected ? 1 : 0,
                }}
              />
              {/* Dot */}
              <span
                className="relative flex items-center justify-center rounded-full text-white font-bold transition-all"
                style={{
                  width: count > 0 ? 32 : 22,
                  height: count > 0 ? 32 : 22,
                  background: style.bg,
                  boxShadow: isSelected ? `0 0 0 3px white, 0 0 0 5px ${style.bg}` : '0 2px 6px rgba(0,0,0,0.2)',
                  fontSize: count > 9 ? 10 : 12,
                }}
              >
                {count > 0 ? count : ''}
              </span>
              {/* Label */}
              <span
                className="mt-1 px-1.5 py-0.5 rounded text-[9px] font-semibold whitespace-nowrap pointer-events-none"
                style={{
                  background: 'rgba(255,255,255,0.85)',
                  color: '#0f1410',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
              >
                {county.county.replace('Grand ', 'Gr. ')}
              </span>
            </button>
          )
        })}

        {/* Selected county popup card */}
        {selected && (() => {
          const badge = severityBadge(selected)
          const openFlags = selected.flags.filter(f => f.status === 'open' || f.status === 'investigating')
          const activeFacilities = selected.facilities.filter(f => f.is_active)
          const baselFacilities = selected.facilities.filter(f => f.is_basel_certified)

          return (
            <div
              ref={popupRef}
              className="absolute top-5 right-5 w-80 bg-white rounded-2xl shadow-2xl z-30 overflow-hidden"
              style={{ border: '1px solid #e8e5de' }}
            >
              {/* Badge */}
              <div className="px-5 pt-5 pb-3">
                <span
                  className="text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-full"
                  style={{ background: badge.bg, color: badge.text }}
                >
                  {badge.label}
                </span>
                <h2 className="text-xl font-bold text-gray-900 mt-3">{selected.county}</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {activeFacilities.length > 0
                    ? `${activeFacilities.length} active facilit${activeFacilities.length === 1 ? 'y' : 'ies'} · ${activeFacilities.map(f => f.location_city).filter(Boolean)[0] ?? 'Liberia'}`
                    : 'No registered recycling facility'}
                </p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-px bg-gray-100 border-t border-b border-gray-100">
                {[
                  { label: 'Facilities',       value: selected.facilities.length },
                  { label: 'Open Flags',        value: openFlags.length },
                  { label: 'Basel Certified',   value: baselFacilities.length },
                  { label: 'Last flag',         value: openFlags[0] ? new Date(openFlags[0].created_at).toLocaleDateString('en-LR', { month: 'short', day: 'numeric' }) : 'None' },
                ].map(stat => (
                  <div key={stat.label} className="bg-white px-4 py-3">
                    <p className="text-[10px] tracking-wider text-gray-400 uppercase">{stat.label}</p>
                    <p className="text-lg font-bold text-gray-900 mt-0.5">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div className="px-5 py-4">
                {openFlags.length > 0 ? (
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {openFlags[0].description || `${openFlags.length} open compliance flag${openFlags.length > 1 ? 's' : ''} in ${selected.county}. Review and take action to resolve outstanding issues.`}
                  </p>
                ) : activeFacilities.length > 0 ? (
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {selected.county} has {activeFacilities.length} active facilit{activeFacilities.length === 1 ? 'y' : 'ies'}{baselFacilities.length > 0 ? ', including Basel Convention certified operations' : ' without Basel Convention certification'}.
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 leading-relaxed">
                    No licensed e-waste recycling facility is registered in {selected.county}. This creates a compliance gap — consider prioritizing EPA outreach.
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 px-5 pb-5">
                <button
                  type="button"
                  onClick={() => navigate('/regulator/flags')}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: '#0f1410' }}
                >
                  View Flags
                </button>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )
        })()}

        {/* Empty state hint */}
        {!selected && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 pointer-events-none">
            <div className="px-4 py-2 rounded-full text-xs text-gray-500 font-medium" style={{ background: 'rgba(255,255,255,0.85)' }}>
              Click a county dot to view details
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
