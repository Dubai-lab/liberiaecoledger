import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Loader2, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const LIBERIA_COUNTIES = [
  'Montserrado', 'Bomi', 'Bong', 'Gbarpolu', 'Grand Bassa',
  'Grand Cape Mount', 'Grand Gedeh', 'Grand Kru', 'Lofa', 'Margibi',
  'Maryland', 'Nimba', 'River Cess', 'River Gee', 'Sinoe',
]

interface FacilityRow {
  id: string
  name: string
  location_city: string
  location_county: string
  license_number: string
  is_basel_certified: boolean
  is_active: boolean
  accepts_free_pickup: boolean
}

interface CountySummary {
  county: string
  facilities: FacilityRow[]
  deviceCount: number
  disposedCount: number
}

function ComplianceTag({ certified, active }: { certified: boolean; active: boolean }) {
  if (!active) return (
    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
      <XCircle className="w-3 h-3" /> Inactive
    </span>
  )
  if (certified) return (
    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-eco-50 text-eco-700 font-medium border border-eco-200">
      <CheckCircle className="w-3 h-3" /> Basel
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 font-medium border border-yellow-200">
      <AlertTriangle className="w-3 h-3" /> Not Certified
    </span>
  )
}

export function ComplianceMapPage() {
  const [counties, setCounties] = useState<CountySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    Promise.all([
      supabase.from('recycler_facilities').select('*'),
      supabase.from('devices').select('location_county:current_owner_id, status').not('status', 'eq', 'disposed'),
      supabase.from('devices').select('id, status'),
    ]).then(([facRes, , allDevRes]) => {
      const facilities: FacilityRow[] = (facRes.data ?? []) as FacilityRow[]
      const allDevices = allDevRes.data ?? []

      const summaries: CountySummary[] = LIBERIA_COUNTIES.map(county => ({
        county,
        facilities: facilities.filter(f => f.location_county === county),
        deviceCount: 0,
        disposedCount: allDevices.filter(d => d.status === 'disposed').length,
      }))

      setCounties(summaries)
      setLoading(false)
    })
  }, [])

  const filtered = counties.filter(c =>
    !search || c.county.toLowerCase().includes(search.toLowerCase()) ||
    c.facilities.some(f => f.name.toLowerCase().includes(search.toLowerCase()))
  )

  const totalFacilities = counties.reduce((s, c) => s + c.facilities.length, 0)
  const certifiedFacilities = counties.reduce((s, c) => s + c.facilities.filter(f => f.is_basel_certified).length, 0)
  const countiesWithFacilities = counties.filter(c => c.facilities.length > 0).length

  if (loading) {
    return <div className="flex items-center justify-center min-h-96"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <p className="text-xs text-muted-foreground tracking-widest uppercase mb-0.5">Regulator</p>
        <h1 className="text-2xl font-semibold">Compliance Map</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Licensed e-waste recycling facilities across Liberia's 15 counties.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Facilities',     value: totalFacilities,       color: 'text-foreground' },
          { label: 'Basel Certified',       value: certifiedFacilities,   color: 'text-eco-700' },
          { label: 'Counties Covered',      value: countiesWithFacilities, color: 'text-blue-600' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-border rounded-xl p-4 text-center">
            <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Coverage bar */}
      <div className="bg-white border border-border rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium">County Coverage</p>
          <p className="text-xs font-medium text-eco-700">{countiesWithFacilities} / 15 counties</p>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(countiesWithFacilities / 15) * 100}%` }}
            transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full bg-eco-700"
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">
          {15 - countiesWithFacilities} counties still lack a certified recycling facility.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search county or facility name…"
          className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors"
        />
      </div>

      {/* County grid */}
      <div className="space-y-2">
        {filtered.map((county, i) => (
          <motion.div
            key={county.county}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.025 }}
            className="bg-white border border-border rounded-xl overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setSelected(selected === county.county ? null : county.county)}
              className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-muted/20 transition-colors"
            >
              <MapPin className={`w-4 h-4 flex-shrink-0 ${county.facilities.length > 0 ? 'text-eco-700' : 'text-muted-foreground/30'}`} />
              <span className="flex-1 text-sm font-medium">{county.county}</span>
              {county.facilities.length === 0 ? (
                <span className="text-[10px] text-muted-foreground font-medium flex-shrink-0">No facilities</span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-eco-50 text-eco-700 font-medium border border-eco-200 flex-shrink-0">
                  {county.facilities.length} facilit{county.facilities.length === 1 ? 'y' : 'ies'}
                </span>
              )}
            </button>

            {selected === county.county && county.facilities.length > 0 && (
              <div className="border-t border-border divide-y divide-border">
                {county.facilities.map(f => (
                  <div key={f.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="text-sm font-medium">{f.name}</p>
                        <ComplianceTag certified={f.is_basel_certified} active={f.is_active} />
                        {f.accepts_free_pickup && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                            Free Pickup
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {f.location_city} · License: <span className="font-mono">{f.license_number}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selected === county.county && county.facilities.length === 0 && (
              <div className="border-t border-border px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  No licensed facilities registered in {county.county} yet. Consider prioritizing this county for EPA outreach.
                </p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
