import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Recycle, Loader2, CheckCircle, XCircle, MapPin, Shield, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { RecyclerFacility } from '@/types/database'

interface FacilityWithOwner extends RecyclerFacility {
  ownerName: string
  ownerEmail: string
  disposalCount: number
}

export function RecyclersPage() {
  const [facilities, setFacilities] = useState<FacilityWithOwner[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const load = useCallback(async () => {
    const { data: facs } = await supabase
      .from('recycler_facilities')
      .select('*')
      .order('created_at', { ascending: false })

    if (!facs || facs.length === 0) { setFacilities([]); setLoading(false); return }

    const ownerIds = facs.map(f => f.owner_id)
    const [{ data: owners }, { data: disposals }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, organization, email').in('id', ownerIds),
      supabase.from('disposals').select('id, facility_id'),
    ])

    const ownerMap = Object.fromEntries((owners ?? []).map(o => [o.id, o]))
    const disposalCountMap: Record<string, number> = {}
    for (const d of disposals ?? []) {
      disposalCountMap[d.facility_id] = (disposalCountMap[d.facility_id] ?? 0) + 1
    }

    setFacilities(facs.map(f => ({
      ...f,
      ownerName:  ownerMap[f.owner_id]?.organization ?? ownerMap[f.owner_id]?.full_name ?? 'Unknown',
      ownerEmail: ownerMap[f.owner_id]?.email ?? '',
      disposalCount: disposalCountMap[f.id] ?? 0,
    })))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const toggleActive = async (id: string, current: boolean) => {
    setUpdating(id)
    const { error } = await supabase.from('recycler_facilities').update({ is_active: !current }).eq('id', id)
    if (error) { toast.error(error.message) }
    else {
      toast.success(current ? 'Facility deactivated' : 'Facility activated')
      load()
    }
    setUpdating(null)
  }

  const toggleBasel = async (id: string, current: boolean) => {
    setUpdating(id)
    const { error } = await supabase.from('recycler_facilities').update({ is_basel_certified: !current }).eq('id', id)
    if (error) { toast.error(error.message) }
    else {
      toast.success(current ? 'Basel certification removed' : 'Basel certification granted')
      load()
    }
    setUpdating(null)
  }

  const filtered = facilities.filter(f => {
    const matchSearch = !search ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.location_city.toLowerCase().includes(search.toLowerCase()) ||
      f.location_county.toLowerCase().includes(search.toLowerCase()) ||
      f.license_number.toLowerCase().includes(search.toLowerCase()) ||
      f.ownerName.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || (filter === 'active' ? f.is_active : !f.is_active)
    return matchSearch && matchFilter
  })

  const activeCount   = facilities.filter(f => f.is_active).length
  const baselCount    = facilities.filter(f => f.is_basel_certified).length

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <p className="text-xs text-muted-foreground tracking-widest uppercase mb-0.5">Platform Admin</p>
        <h1 className="text-2xl font-semibold">Recycler Facilities</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {facilities.length} registered · {activeCount} active · {baselCount} Basel certified
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Facilities', value: facilities.length, color: 'text-foreground' },
          { label: 'Active',           value: activeCount,        color: 'text-eco-700' },
          { label: 'Basel Certified',  value: baselCount,         color: 'text-blue-600' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-border rounded-xl p-4 text-center">
            <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search facility, city, county, license…"
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors"
          />
        </div>
        {(['all', 'active', 'inactive'] as const).map(f => (
          <button key={f} type="button" onClick={() => setFilter(f)}
            className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors capitalize ${filter === f ? 'bg-foreground text-background' : 'bg-white border border-border text-muted-foreground hover:text-foreground'}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Recycle className="w-8 h-8 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No facilities found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((f, i) => (
            <motion.div key={f.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-white border border-border rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                  <Recycle className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-semibold">{f.name}</p>
                    {f.is_active
                      ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-eco-50 text-eco-700 font-medium border border-eco-200">Active</span>
                      : <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">Inactive</span>
                    }
                    {f.is_basel_certified && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium border border-blue-200">Basel Certified</span>
                    )}
                    {f.accepts_free_pickup && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 font-medium">Free Pickup</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{f.location_city}, {f.location_county}</span>
                    <span className="font-mono">{f.license_number}</span>
                    <span>Owner: <strong>{f.ownerName}</strong></span>
                    <span>{f.disposalCount} disposal{f.disposalCount !== 1 ? 's' : ''}</span>
                  </div>
                  {f.operating_hours && (
                    <p className="text-xs text-muted-foreground mt-1">{f.operating_hours}</p>
                  )}
                </div>
              </div>

              {/* Admin actions */}
              <div className="flex gap-2 mt-4 flex-wrap">
                <button type="button" onClick={() => toggleActive(f.id, f.is_active)} disabled={updating === f.id}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                    f.is_active
                      ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                      : 'bg-eco-50 text-eco-700 border border-eco-200 hover:bg-eco-100'
                  }`}>
                  {updating === f.id ? <Loader2 className="w-3 h-3 animate-spin" />
                    : f.is_active ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                  {f.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button type="button" onClick={() => toggleBasel(f.id, f.is_basel_certified)} disabled={updating === f.id}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                    f.is_basel_certified
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                  }`}>
                  <Shield className="w-3 h-3" />
                  {f.is_basel_certified ? 'Remove Basel' : 'Grant Basel Cert'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
