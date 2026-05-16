import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Loader2, Printer, Recycle, Cpu, Leaf, TrendingUp } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { supabase } from '@/lib/supabase'

function fmt(n: number) { return new Intl.NumberFormat('en-LR').format(n) }

interface MonthlyBar { month: string; registered: number; disposed: number }
interface CategoryPie { name: string; value: number }

interface ReportData {
  totalDevices: number
  totalDisposed: number
  totalTransfers: number
  totalCredits: number
  co2Avoided: number
  activeFacilities: number
  monthlyTrend: MonthlyBar[]
  categories: CategoryPie[]
  hazardBreakdown: CategoryPie[]
}

const ECO_COLORS = ['#2f6b3a', '#4a9c5d', '#6bb87e', '#9dd4aa', '#c8ebd1', '#e2f5e8']

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function buildMonthlyTrend(devices: { created_at: string; status: string }[]): MonthlyBar[] {
  const now = new Date()
  const months: MonthlyBar[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = MONTH_NAMES[d.getMonth()]
    const start = d.toISOString()
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString()
    months.push({
      month: label,
      registered: devices.filter(dev => dev.created_at >= start && dev.created_at < end).length,
      disposed:   devices.filter(dev => dev.status === 'disposed' && dev.created_at >= start && dev.created_at < end).length,
    })
  }
  return months
}

export function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('devices').select('id, status, category, hazard_class, co2_kg_avoided, created_at'),
      supabase.from('transfers').select('id', { count: 'exact', head: true }),
      supabase.from('eco_credits').select('amount').eq('type', 'earned'),
      supabase.from('recycler_facilities').select('id', { count: 'exact', head: false }).eq('is_active', true),
    ]).then(([devRes, transferRes, credRes, facRes]) => {
      const devices = devRes.data ?? []
      const credits = credRes.data ?? []

      const categoryMap: Record<string, number> = {}
      const hazardMap: Record<string, number> = {}
      let co2 = 0

      for (const d of devices) {
        categoryMap[d.category] = (categoryMap[d.category] ?? 0) + 1
        hazardMap[d.hazard_class] = (hazardMap[d.hazard_class] ?? 0) + 1
        co2 += d.co2_kg_avoided ?? 0
      }

      const HAZARD_LABELS: Record<string, string> = {
        none: 'No Hazard', li_ion_battery: 'Li-Ion Battery',
        mercury_ccfl: 'Mercury/CCFL', toner: 'Toner', mixed: 'Mixed',
      }

      setData({
        totalDevices: devices.length,
        totalDisposed: devices.filter(d => d.status === 'disposed').length,
        totalTransfers: transferRes.count ?? 0,
        totalCredits: credits.reduce((s, c) => s + (c.amount ?? 0), 0),
        co2Avoided: co2,
        activeFacilities: facRes.data?.length ?? 0,
        monthlyTrend: buildMonthlyTrend(devices),
        categories: Object.entries(categoryMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([name, value]) => ({ name, value })),
        hazardBreakdown: Object.entries(hazardMap)
          .map(([k, v]) => ({ name: HAZARD_LABELS[k] ?? k, value: v })),
      })
      setLoading(false)
    })
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center min-h-96"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
  }

  if (!data) return null

  const disposalRate = data.totalDevices > 0 ? Math.round((data.totalDisposed / data.totalDevices) * 100) : 0

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6 print:mb-3">
        <div>
          <p className="text-xs text-muted-foreground tracking-widest uppercase mb-0.5">Regulator</p>
          <h1 className="text-2xl font-semibold">National E-Waste Report</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generated {new Date().toLocaleDateString('en-LR', { dateStyle: 'long' })} · Liberia EcoLedger
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border bg-white hover:bg-muted/30 transition-colors print:hidden flex-shrink-0"
        >
          <Printer className="w-4 h-4" /> Print / Export PDF
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Devices on Ledger',   value: fmt(data.totalDevices),    icon: <Cpu className="w-5 h-5" />,      color: 'text-foreground' },
          { label: 'Properly Disposed',    value: fmt(data.totalDisposed),   icon: <Recycle className="w-5 h-5" />,  color: 'text-eco-700' },
          { label: 'Disposal Rate',        value: `${disposalRate}%`,        icon: <TrendingUp className="w-5 h-5" />, color: disposalRate >= 50 ? 'text-eco-700' : 'text-orange-600' },
          { label: 'Ownership Transfers',  value: fmt(data.totalTransfers),  icon: <FileText className="w-5 h-5" />, color: 'text-blue-600' },
          { label: 'EcoCredits Issued',    value: fmt(data.totalCredits),    icon: <Leaf className="w-5 h-5" />,     color: 'text-eco-700' },
          { label: 'Active Facilities',    value: fmt(data.activeFacilities),icon: <Recycle className="w-5 h-5" />, color: 'text-blue-600' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-white border border-border rounded-xl p-5"
          >
            <div className={`mb-2 ${s.color}`}>{s.icon}</div>
            <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Monthly trend chart */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-white border border-border rounded-xl p-5 mb-5"
      >
        <h2 className="text-sm font-semibold mb-4">Device Activity — Last 6 Months</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.monthlyTrend} margin={{ top: 0, right: 0, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              labelStyle={{ fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="registered" name="Registered" fill="#1d4ed8" radius={[3, 3, 0, 0]} />
            <Bar dataKey="disposed"   name="Disposed"   fill="#2f6b3a" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Category breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white border border-border rounded-xl p-5"
        >
          <h2 className="text-sm font-semibold mb-4">Devices by Category</h2>
          {data.categories.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data.categories}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  fontSize={10}
                >
                  {data.categories.map((_, i) => (
                    <Cell key={i} fill={ECO_COLORS[i % ECO_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Hazard breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-white border border-border rounded-xl p-5"
        >
          <h2 className="text-sm font-semibold mb-4">Hazard Classification</h2>
          {data.hazardBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No data yet.</p>
          ) : (
            <div className="space-y-2.5 pt-2">
              {data.hazardBreakdown
                .sort((a, b) => b.value - a.value)
                .map((h, i) => (
                  <div key={h.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">{h.name}</span>
                      <span className="text-xs font-medium">{h.value}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(h.value / data.totalDevices) * 100}%` }}
                        transition={{ delay: 0.5 + i * 0.05, duration: 0.6, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: ECO_COLORS[i % ECO_COLORS.length] }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* CO₂ impact */}
      {data.co2Avoided > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-eco-50 border border-eco-200 rounded-xl p-5"
        >
          <div className="flex items-center gap-2 mb-1">
            <Leaf className="w-4 h-4 text-eco-700" />
            <h2 className="text-sm font-semibold text-eco-900">Environmental Impact</h2>
          </div>
          <p className="text-3xl font-bold text-eco-700 mt-2">{data.co2Avoided.toFixed(1)} kg</p>
          <p className="text-sm text-eco-800 mt-0.5">CO₂ emissions avoided through responsible e-waste recycling.</p>
        </motion.div>
      )}
    </div>
  )
}
