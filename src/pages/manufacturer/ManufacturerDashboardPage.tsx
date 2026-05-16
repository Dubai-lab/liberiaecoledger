import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Cpu, Loader2, Factory, Recycle, AlertTriangle, Plus, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Device } from '@/types/database'

const CATEGORIES = ['Laptop', 'Smartphone', 'Tablet', 'Desktop', 'Printer', 'TV', 'Monitor', 'Server', 'Other']

interface Stats {
  total: number
  in_use: number
  awaiting_disposal: number
  disposed: number
  flagged: number
}

export function ManufacturerDashboardPage() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<Stats>({ total: 0, in_use: 0, awaiting_disposal: 0, disposed: 0, flagged: 0 })
  const [recent, setRecent] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!profile) return
    const { data } = await supabase
      .from('devices')
      .select('*')
      .eq('original_owner_id', profile.id)
      .order('created_at', { ascending: false })

    const devices = data ?? []
    setRecent(devices.slice(0, 5))
    setStats({
      total: devices.length,
      in_use: devices.filter(d => d.status === 'in_use').length,
      awaiting_disposal: devices.filter(d => d.status === 'awaiting_transfer' || d.status === 'ready_for_disposal').length,
      disposed: devices.filter(d => d.status === 'disposed').length,
      flagged: devices.filter(d => d.status === 'flagged').length,
    })
    setLoading(false)
  }, [profile])

  useEffect(() => { load() }, [load])

  const STAT_CARDS = [
    { label: 'Total Registered', value: stats.total, icon: <Cpu className="w-5 h-5" />, color: '#0f1410' },
    { label: 'Active in Field', value: stats.in_use, icon: <Factory className="w-5 h-5" />, color: '#2f6b3a' },
    { label: 'Awaiting Disposal', value: stats.awaiting_disposal, icon: <AlertTriangle className="w-5 h-5" />, color: '#b45309' },
    { label: 'Disposed / Recycled', value: stats.disposed, icon: <Recycle className="w-5 h-5" />, color: '#1d4ed8' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground tracking-widest uppercase mb-0.5">Manufacturer</p>
          <h1 className="text-2xl font-semibold">Overview</h1>
          {profile?.organization && (
            <p className="text-sm text-muted-foreground mt-0.5">{profile.organization}</p>
          )}
        </div>
        <Link
          to="/manufacturer/register"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white flex-shrink-0"
          style={{ background: '#0f1410' }}
        >
          <Plus className="w-4 h-4" />
          Register Device
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-white rounded-xl border border-border p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-muted/50" style={{ color: card.color }}>
                {card.icon}
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Category breakdown */}
      {stats.total > 0 && (
        <div className="bg-white rounded-xl border border-border p-6">
          <h2 className="text-sm font-semibold mb-4">Registration Progress</h2>
          <div className="space-y-2">
            {[
              { label: 'Active in Field', value: stats.in_use, total: stats.total, color: '#2f6b3a' },
              { label: 'Awaiting Disposal', value: stats.awaiting_disposal, total: stats.total, color: '#b45309' },
              { label: 'Disposed / Recycled', value: stats.disposed, total: stats.total, color: '#1d4ed8' },
            ].map(bar => (
              <div key={bar.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{bar.label}</span>
                  <span className="font-medium">{bar.total > 0 ? Math.round((bar.value / bar.total) * 100) : 0}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${bar.total > 0 ? (bar.value / bar.total) * 100 : 0}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: bar.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent registrations */}
      <div className="bg-white rounded-xl border border-border">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold">Recent Registrations</h2>
          <Link to="/manufacturer/catalogue" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <Cpu className="w-8 h-8 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground mb-1">No devices registered yet</p>
            <p className="text-xs text-muted-foreground/70">Register your first device to start tracking its lifecycle</p>
            <Link
              to="/manufacturer/register"
              className="mt-4 px-4 py-2 rounded-lg text-xs font-medium text-white"
              style={{ background: '#0f1410' }}
            >
              Register First Device
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recent.map(device => (
              <div key={device.id} className="flex items-center gap-4 px-6 py-3.5">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Cpu className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{device.brand} {device.model}</p>
                  <p className="text-xs text-muted-foreground">{device.category} · {device.serial_number ?? 'No serial'}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                  device.status === 'disposed'           ? 'bg-blue-50 text-blue-600' :
                  device.status === 'ready_for_disposal' ? 'bg-orange-50 text-orange-600' :
                  device.status === 'flagged'            ? 'bg-red-50 text-red-600' :
                  'bg-green-50 text-green-700'
                }`}>
                  {device.status.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      {stats.total === 0 && (
        <div className="rounded-xl border border-border bg-muted/30 p-6">
          <h2 className="text-sm font-semibold mb-1">Getting started</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Register the electronic devices your company manufactures or imports. Each device gets a unique tracking ID that follows it through its entire lifecycle — from your hands to the consumer to recycling.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link to="/manufacturer/register" className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-white border border-border hover:bg-muted/30 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Register a device
            </Link>
            <Link to="/manufacturer/catalogue" className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-white border border-border hover:bg-muted/30 transition-colors">
              <Cpu className="w-3.5 h-3.5" /> View catalogue
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
