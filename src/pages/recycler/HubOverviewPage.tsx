import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Recycle, ClipboardList, Trash2, Leaf, TrendingUp, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { RecyclerFacility } from '@/types/database'

interface Stats {
  totalDisposals: number
  pendingIntake: number
  totalCreditsAwarded: number
  devicesThisMonth: number
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-LR').format(n)
}

export function HubOverviewPage() {
  const { profile } = useAuth()
  const [facility, setFacility] = useState<RecyclerFacility | null>(null)
  const [stats, setStats] = useState<Stats>({ totalDisposals: 0, pendingIntake: 0, totalCreditsAwarded: 0, devicesThisMonth: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return

    Promise.all([
      supabase.from('recycler_facilities').select('*').eq('owner_id', profile.id).maybeSingle(),
      supabase.from('disposals').select('id, eco_credits_awarded, status, created_at').eq('recycler_id', profile.id),
      supabase.from('devices').select('id').eq('status', 'ready_for_disposal'),
    ]).then(([facilityRes, disposalsRes, pendingRes]) => {
      setFacility(facilityRes.data ?? null)

      const disposals = disposalsRes.data ?? []
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      setStats({
        totalDisposals: disposals.filter(d => d.status === 'confirmed').length,
        pendingIntake: pendingRes.data?.length ?? 0,
        totalCreditsAwarded: disposals.reduce((s, d) => s + (d.eco_credits_awarded ?? 0), 0),
        devicesThisMonth: disposals.filter(d => d.created_at >= startOfMonth).length,
      })
      setLoading(false)
    })
  }, [profile])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <p className="text-xs text-muted-foreground tracking-widest uppercase mb-0.5">Recycler</p>
        <h1 className="text-2xl font-semibold">Hub Overview</h1>
        {facility && (
          <p className="text-sm text-muted-foreground mt-1">
            {facility.name} Â· {facility.location_city}, {facility.location_county}
            {facility.is_basel_certified && (
              <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-eco-50 text-eco-700 font-medium border border-eco-200">
                Basel Certified
              </span>
            )}
          </p>
        )}
      </div>

      {/* No facility yet */}
      {!facility && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <ClipboardList className="w-4 h-4 text-yellow-600 flex-shrink-0" />
          <p className="text-sm text-yellow-800">
            You haven't registered a facility yet.{' '}
            <Link to="/recycler/facility" className="font-medium underline">Set up your facility profile</Link>
            {' '}to start logging disposals.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Disposals',     value: fmt(stats.totalDisposals),      icon: <Recycle className="w-5 h-5" />,      color: 'text-eco-700' },
          { label: 'Pending Intake',      value: fmt(stats.pendingIntake),        icon: <ClipboardList className="w-5 h-5" />, color: 'text-yellow-600' },
          { label: 'This Month',          value: fmt(stats.devicesThisMonth),     icon: <TrendingUp className="w-5 h-5" />,   color: 'text-blue-600' },
          { label: 'EcoCredits Issued',   value: fmt(stats.totalCreditsAwarded),  icon: <Leaf className="w-5 h-5" />,         color: 'text-eco-700' },
        ].map((s, i) => (
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
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <h2 className="text-sm font-semibold mb-3">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'View Intake Queue',  desc: 'Devices awaiting processing',        path: '/recycler/intake',   icon: <ClipboardList className="w-5 h-5" /> },
          { label: 'Log a Disposal',     desc: 'Record a completed recycling event', path: '/recycler/disposal', icon: <Trash2 className="w-5 h-5" /> },
          { label: 'Facility Profile',   desc: 'Manage your hub details',            path: '/recycler/facility', icon: <Recycle className="w-5 h-5" /> },
        ].map((action, i) => (
          <motion.div
            key={action.path}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.07 }}
          >
            <Link
              to={action.path}
              className="flex items-start gap-3 p-4 bg-white border border-border rounded-xl hover:border-eco-700/40 hover:shadow-sm transition-all group"
            >
              <span className="text-muted-foreground group-hover:text-eco-700 transition-colors mt-0.5">
                {action.icon}
              </span>
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
