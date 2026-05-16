import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Users, MailPlus, Recycle, Code2, Settings,
  Loader2, ShieldAlert, Clock, CheckCircle, Cpu, Leaf,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

function fmt(n: number) { return new Intl.NumberFormat('en-LR').format(n) }

interface Overview {
  totalUsers:        number
  pendingFacilities: number
  activeFacilities:  number
  totalDevices:      number
  totalDisposed:     number
  totalCredits:      number
  openFlags:         number
  pendingInvites:    number
  recentUsers:       { id: string; full_name: string | null; email: string | null; organization: string | null; created_at: string }[]
  pendingFacs:       { id: string; name: string; location_city: string; location_county: string; license_number: string; ownerName: string }[]
}

export function AdminOverviewPage() {
  const [data, setData] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('id, full_name, email, organization, created_at').order('created_at', { ascending: false }),
      supabase.from('recycler_facilities').select('id, name, location_city, location_county, license_number, is_active, owner_id'),
      supabase.from('devices').select('id, status'),
      supabase.from('eco_credits').select('amount').eq('type', 'earned'),
      supabase.from('compliance_flags').select('id, status'),
      supabase.from('invitations').select('id, used_at'),
    ]).then(async ([usersRes, facsRes, devsRes, credRes, flagRes, invRes]) => {
      const users     = usersRes.data    ?? []
      const facs      = facsRes.data     ?? []
      const devices   = devsRes.data     ?? []
      const credits   = credRes.data     ?? []
      const flags     = flagRes.data     ?? []
      const invites   = invRes.data      ?? []

      const pendingFacs = facs.filter(f => !f.is_active)
      const ownerIds    = pendingFacs.map(f => f.owner_id)

      let ownerMap: Record<string, string> = {}
      if (ownerIds.length > 0) {
        const { data: owners } = await supabase
          .from('profiles')
          .select('id, full_name, organization, email')
          .in('id', ownerIds)
        for (const o of owners ?? []) {
          ownerMap[o.id] = o.organization ?? o.full_name ?? o.email ?? 'Unknown'
        }
      }

      setData({
        totalUsers:        users.length,
        pendingFacilities: pendingFacs.length,
        activeFacilities:  facs.filter(f => f.is_active).length,
        totalDevices:      devices.length,
        totalDisposed:     devices.filter(d => d.status === 'disposed').length,
        totalCredits:      credits.reduce((s, c) => s + (c.amount ?? 0), 0),
        openFlags:         flags.filter(f => f.status === 'open' || f.status === 'investigating').length,
        pendingInvites:    invites.filter(i => !i.used_at).length,
        recentUsers:       users.slice(0, 5),
        pendingFacs:       pendingFacs.map(f => ({
          id:            f.id,
          name:          f.name,
          location_city: f.location_city,
          location_county: f.location_county,
          license_number: f.license_number,
          ownerName:     ownerMap[f.owner_id] ?? 'Unknown',
        })),
      })
      setLoading(false)
    })
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
  }

  if (!data) return null

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs text-muted-foreground tracking-widest uppercase mb-0.5">Platform Admin</p>
        <h1 className="text-2xl font-semibold">Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform health and pending actions at a glance.</p>
      </div>

      {/* Alerts — pending facilities or open flags */}
      {(data.pendingFacilities > 0 || data.openFlags > 0) && (
        <div className="space-y-2">
          {data.pendingFacilities > 0 && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <p className="text-sm text-yellow-800 flex-1">
                <strong>{data.pendingFacilities} recycler facilit{data.pendingFacilities > 1 ? 'ies' : 'y'}</strong> awaiting EPA license verification.
              </p>
              <Link to="/admin/recyclers" className="text-xs font-medium text-yellow-700 hover:underline flex-shrink-0">Review →</Link>
            </motion.div>
          )}
          {data.openFlags > 0 && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800 flex-1">
                <strong>{data.openFlags} open compliance flag{data.openFlags > 1 ? 's' : ''}</strong> require attention.
              </p>
              <Link to="/regulator/flags" className="text-xs font-medium text-red-700 hover:underline flex-shrink-0">View →</Link>
            </motion.div>
          )}
        </div>
      )}

      {/* KPI stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users',       value: fmt(data.totalUsers),        icon: <Users className="w-5 h-5" />,     color: 'text-foreground' },
          { label: 'Devices on Ledger', value: fmt(data.totalDevices),      icon: <Cpu className="w-5 h-5" />,      color: 'text-blue-600' },
          { label: 'EcoCredits Issued', value: fmt(data.totalCredits),      icon: <Leaf className="w-5 h-5" />,     color: 'text-eco-700' },
          { label: 'Devices Recycled',  value: fmt(data.totalDisposed),     icon: <Recycle className="w-5 h-5" />,  color: 'text-eco-700' },
          { label: 'Active Facilities', value: fmt(data.activeFacilities),  icon: <CheckCircle className="w-5 h-5" />, color: 'text-eco-700' },
          { label: 'Pending Facilities',value: fmt(data.pendingFacilities), icon: <Clock className="w-5 h-5" />,    color: data.pendingFacilities > 0 ? 'text-yellow-600' : 'text-muted-foreground' },
          { label: 'Pending Invites',   value: fmt(data.pendingInvites),    icon: <MailPlus className="w-5 h-5" />, color: 'text-muted-foreground' },
          { label: 'Open Flags',        value: fmt(data.openFlags),         icon: <ShieldAlert className="w-5 h-5" />, color: data.openFlags > 0 ? 'text-red-600' : 'text-muted-foreground' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white border border-border rounded-xl p-5">
            <div className={`mb-3 ${s.color}`}>{s.icon}</div>
            <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pending facility approvals */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold">Pending Facility Approvals</h2>
            <Link to="/admin/recyclers" className="text-xs text-muted-foreground hover:text-foreground transition-colors">View all →</Link>
          </div>
          {data.pendingFacs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-5">
              <CheckCircle className="w-6 h-6 text-eco-700 mb-2" />
              <p className="text-sm text-muted-foreground">All facilities verified.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {data.pendingFacs.map(f => (
                <div key={f.id} className="px-5 py-3.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-yellow-50 border border-yellow-200 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {f.location_city}, {f.location_county} · {f.ownerName}
                    </p>
                    <p className="text-[10px] font-mono text-muted-foreground">{f.license_number}</p>
                  </div>
                  <Link to="/admin/recyclers"
                    className="text-xs font-medium px-2.5 py-1 rounded-lg bg-[#0f1410] text-white hover:opacity-90 transition-opacity flex-shrink-0">
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent users */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold">Recent Users</h2>
            <Link to="/admin/users" className="text-xs text-muted-foreground hover:text-foreground transition-colors">View all →</Link>
          </div>
          <div className="divide-y divide-border">
            {data.recentUsers.map(u => (
              <div key={u.id} className="px-5 py-3.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#2f6b3a] flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-white">
                    {(u.full_name ?? u.email ?? 'U').slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.full_name ?? u.email ?? 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {u.organization ? `${u.organization} · ` : ''}{new Date(u.created_at).toLocaleDateString('en-LR', { dateStyle: 'medium' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Manage Users',    desc: 'View & assign roles',         path: '/admin/users',        icon: <Users className="w-5 h-5" /> },
            { label: 'Send Invitation', desc: 'Invite a new institution',    path: '/admin/invitations',  icon: <MailPlus className="w-5 h-5" /> },
            { label: 'Verify Recyclers',desc: 'Approve facility licenses',   path: '/admin/recyclers',    icon: <Recycle className="w-5 h-5" /> },
            { label: 'System Settings', desc: 'Platform config & health',    path: '/admin/settings',     icon: <Settings className="w-5 h-5" /> },
          ].map((a, i) => (
            <motion.div key={a.path} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.05 }}>
              <Link to={a.path} className="flex items-start gap-3 p-4 bg-white border border-border rounded-xl hover:border-eco-700/40 hover:shadow-sm transition-all group">
                <span className="text-muted-foreground group-hover:text-eco-700 transition-colors mt-0.5">{a.icon}</span>
                <div>
                  <p className="text-sm font-medium">{a.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
