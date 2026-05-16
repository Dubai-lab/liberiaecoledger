import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Loader2, TrendingUp, Recycle, Leaf, BarChart3 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Device } from '@/types/database'

function StatCard({ label, value, sub, icon, delay = 0 }: {
  label: string; value: string | number; sub?: string; icon: React.ReactNode; delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-xl border border-border p-5"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 rounded-lg bg-muted/50 text-muted-foreground">{icon}</div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-xs text-eco-700 mt-1">{sub}</p>}
    </motion.div>
  )
}

export function ManufacturerAnalyticsPage() {
  const { profile } = useAuth()
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!profile) return
    const { data } = await supabase
      .from('devices')
      .select('*')
      .eq('original_owner_id', profile.id)
    setDevices(data ?? [])
    setLoading(false)
  }, [profile])

  useEffect(() => { load() }, [load])

  const total = devices.length
  const disposed = devices.filter(d => d.status === 'disposed').length
  const disposalRate = total > 0 ? Math.round((disposed / total) * 100) : 0

  const totalGold     = devices.reduce((s, d) => s + (d.material_gold_g     ?? 0), 0)
  const totalCopper   = devices.reduce((s, d) => s + (d.material_copper_g   ?? 0), 0)
  const totalAluminum = devices.reduce((s, d) => s + (d.material_aluminum_g ?? 0), 0)
  const totalLithium  = devices.reduce((s, d) => s + (d.material_lithium_g  ?? 0), 0)

  const categoryCounts: Record<string, number> = {}
  devices.forEach(d => { categoryCounts[d.category] = (categoryCounts[d.category] ?? 0) + 1 })
  const categoryEntries = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])

  const hazardCounts: Record<string, number> = {}
  devices.forEach(d => { hazardCounts[d.hazard_class] = (hazardCounts[d.hazard_class] ?? 0) + 1 })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <p className="text-xs text-muted-foreground tracking-widest uppercase mb-0.5">Manufacturer</p>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Lifecycle and material recovery insights</p>
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <BarChart3 className="w-8 h-8 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No data yet. Register devices to see analytics.</p>
        </div>
      ) : (
        <>
          {/* Key stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Devices" value={total} icon={<BarChart3 className="w-5 h-5" />} delay={0} />
            <StatCard label="Disposal Rate" value={`${disposalRate}%`} sub={`${disposed} of ${total} recycled`} icon={<Recycle className="w-5 h-5" />} delay={0.05} />
            <StatCard label="Total Gold (g)" value={totalGold.toFixed(2)} sub="Recoverable" icon={<TrendingUp className="w-5 h-5" />} delay={0.1} />
            <StatCard label="Total Copper (g)" value={totalCopper.toFixed(2)} sub="Recoverable" icon={<Leaf className="w-5 h-5" />} delay={0.15} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Device by category */}
            <div className="bg-white rounded-xl border border-border p-6">
              <h2 className="text-sm font-semibold mb-5">Devices by Category</h2>
              {categoryEntries.length === 0 ? (
                <p className="text-xs text-muted-foreground">No data</p>
              ) : (
                <div className="space-y-3">
                  {categoryEntries.map(([cat, count]) => (
                    <div key={cat}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{cat}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(count / total) * 100}%` }}
                          transition={{ duration: 0.7, ease: 'easeOut' }}
                          className="h-full rounded-full bg-[#2f6b3a]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Material recovery summary */}
            <div className="bg-white rounded-xl border border-border p-6">
              <h2 className="text-sm font-semibold mb-5">Total Recoverable Materials</h2>
              <div className="space-y-3">
                {[
                  { label: 'Gold',     value: totalGold,     color: '#b45309' },
                  { label: 'Copper',   value: totalCopper,   color: '#b91c1c' },
                  { label: 'Aluminum', value: totalAluminum, color: '#1d4ed8' },
                  { label: 'Lithium',  value: totalLithium,  color: '#6d28d9' },
                ].map(mat => {
                  const maxVal = Math.max(totalGold, totalCopper, totalAluminum, totalLithium, 1)
                  return (
                    <div key={mat.label}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{mat.label}</span>
                        <span className="font-medium">{mat.value.toFixed(2)} g</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(mat.value / maxVal) * 100}%` }}
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
          </div>

          {/* Hazard class breakdown */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="text-sm font-semibold mb-5">Hazard Class Distribution</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {Object.entries(hazardCounts).map(([hazard, count]) => (
                <div key={hazard} className="text-center p-4 bg-muted/30 rounded-lg">
                  <p className="text-xl font-bold">{count}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 capitalize">{hazard.replace(/_/g, ' ')}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
