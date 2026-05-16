import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldAlert, Recycle, Cpu, MapPin, TrendingUp, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface NationalStats {
  totalDevices: number
  totalDisposed: number
  activeFacilities: number
  openFlags: number
  criticalFlags: number
  disposalsThisMonth: number
}

function fmt(n: number) { return new Intl.NumberFormat('en-LR').format(n) }

export function NationalOverviewPage() {
  const [stats, setStats] = useState<NationalStats>({
    totalDevices: 0, totalDisposed: 0, activeFacilities: 0,
    openFlags: 0, criticalFlags: 0, disposalsThisMonth: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

    Promise.all([
      supabase.from('devices').select('id, status', { count: 'exact', head: false }),
      supabase.from('recycler_facilities').select('id', { count: 'exact', head: false }).eq('is_active', true),
      supabase.from('compliance_flags').select('id, severity, status', { count: 'exact', head: false }),
      supabase.from('disposals').select('id, created_at, status').eq('status', 'confirmed'),
    ]).then(([devRes, facRes, flagRes, dispRes]) => {
      const devices = devRes.data ?? []
      const flags = flagRes.data ?? []
      const disposals = dispRes.data ?? []

      setStats({
        totalDevices: devices.length,
        totalDisposed: devices.filter(d => d.status === 'disposed').length,
        activeFacilities: facRes.data?.length ?? 0,
        openFlags: flags.filter(f => f.status === 'open' || f.status === 'investigating').length,
        criticalFlags: flags.filter(f => f.severity === 'critical' && f.status !== 'resolved').length,
        disposalsThisMonth: disposals.filter(d => d.created_at >= startOfMonth).length,
      })
      setLoading(false)
    })
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center min-h-96"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <p className="text-xs text-muted-foreground tracking-widest uppercase mb-0.5">Regulator</p>
        <h1 className="text-2xl font-semibold">National Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Liberia e-waste lifecycle at a glance — live data from the EcoLedger chain.
        </p>
      </div>

      {/* Critical alert banner */}
      {stats.criticalFlags > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6"
        >
          <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800 flex-1">
            <strong>{stats.criticalFlags} critical compliance flag{stats.criticalFlags > 1 ? 's' : ''}</strong> require immediate attention.
          </p>
          <Link to="/regulator/flags" className="text-xs font-medium text-red-700 hover:underline flex-shrink-0">
            View →
          </Link>
        </motion.div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Devices on Ledger',    value: fmt(stats.totalDevices),       icon: <Cpu className="w-5 h-5" />,          color: 'text-foreground' },
          { label: 'Properly Disposed',     value: fmt(stats.totalDisposed),       icon: <Recycle className="w-5 h-5" />,      color: 'text-eco-700' },
          { label: 'Active Facilities',     value: fmt(stats.activeFacilities),    icon: <MapPin className="w-5 h-5" />,       color: 'text-blue-600' },
          { label: 'This Month Disposals',  value: fmt(stats.disposalsThisMonth),  icon: <TrendingUp className="w-5 h-5" />,   color: 'text-blue-600' },
          { label: 'Open Flags',            value: fmt(stats.openFlags),           icon: <ShieldAlert className="w-5 h-5" />,  color: stats.openFlags > 0 ? 'text-yellow-600' : 'text-eco-700' },
          { label: 'Critical Flags',        value: fmt(stats.criticalFlags),       icon: <ShieldAlert className="w-5 h-5" />,  color: stats.criticalFlags > 0 ? 'text-red-600' : 'text-eco-700' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-white border border-border rounded-xl p-5"
          >
            <div className={`mb-3 ${s.color}`}>{s.icon}</div>
            <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Disposal rate */}
      {stats.totalDevices > 0 && (
        <div className="bg-white border border-border rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">National Disposal Rate</p>
            <p className="text-sm font-semibold text-eco-700">
              {Math.round((stats.totalDisposed / stats.totalDevices) * 100)}%
            </p>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(stats.totalDisposed / stats.totalDevices) * 100}%` }}
              transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full bg-eco-700"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {fmt(stats.totalDisposed)} of {fmt(stats.totalDevices)} registered devices have been properly disposed.
          </p>
        </div>
      )}

      {/* Quick links */}
      <h2 className="text-sm font-semibold mb-3">Regulatory Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Compliance Map',  desc: 'View facility locations by county', path: '/regulator/map',     icon: <MapPin className="w-5 h-5" /> },
          { label: 'Flagged Cases',   desc: 'Review open compliance violations',  path: '/regulator/flags',   icon: <ShieldAlert className="w-5 h-5" /> },
          { label: 'Export Reports',  desc: 'Generate national compliance PDF',   path: '/regulator/reports', icon: <TrendingUp className="w-5 h-5" /> },
        ].map((action, i) => (
          <motion.div
            key={action.path}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.07 }}
          >
            <Link
              to={action.path}
              className="flex items-start gap-3 p-4 bg-white border border-border rounded-xl hover:border-eco-700/40 hover:shadow-sm transition-all group"
            >
              <span className="text-muted-foreground group-hover:text-eco-700 transition-colors mt-0.5">{action.icon}</span>
              <div>
                <p className="text-sm font-medium">{action.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
