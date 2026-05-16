import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings, Loader2, CheckCircle, Database, Globe, Shield, Cpu } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  as string
const PRIVY_APP_ID  = import.meta.env.VITE_PRIVY_APP_ID  as string
const APP_NAME      = import.meta.env.VITE_APP_NAME      as string
const APP_URL       = import.meta.env.VITE_APP_URL       as string
const CHAIN_ID      = import.meta.env.VITE_POLYGON_CHAIN_ID as string

interface PlatformStats {
  users: number
  devices: number
  facilities: number
  events: number
}

function ConfigRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium truncate max-w-xs text-right ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  )
}

export function SystemSettingsPage() {
  const [stats, setStats] = useState<PlatformStats>({ users: 0, devices: 0, facilities: 0, events: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('devices').select('id', { count: 'exact', head: true }),
      supabase.from('recycler_facilities').select('id', { count: 'exact', head: true }),
      supabase.from('device_lifecycle').select('id', { count: 'exact', head: true }),
    ]).then(([usersRes, devRes, facRes, evtRes]) => {
      setStats({
        users:      usersRes.count ?? 0,
        devices:    devRes.count   ?? 0,
        facilities: facRes.count   ?? 0,
        events:     evtRes.count   ?? 0,
      })
      setLoading(false)
    })
  }, [])

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <p className="text-xs text-muted-foreground tracking-widest uppercase mb-0.5">Platform Admin</p>
        <h1 className="text-2xl font-semibold">System Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform configuration and health overview.</p>
      </div>

      {/* Platform stats */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Users',       value: stats.users,      icon: <Shield className="w-4 h-4" />,   color: 'text-foreground' },
            { label: 'Devices',     value: stats.devices,    icon: <Cpu className="w-4 h-4" />,      color: 'text-blue-600' },
            { label: 'Facilities',  value: stats.facilities, icon: <Globe className="w-4 h-4" />,    color: 'text-eco-700' },
            { label: 'Chain Events',value: stats.events,     icon: <Database className="w-4 h-4" />, color: 'text-purple-600' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="bg-white border border-border rounded-xl p-4 text-center">
              <div className={`flex justify-center mb-2 ${s.color}`}>{s.icon}</div>
              <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* App config */}
      <div className="space-y-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Application</h2>
          </div>
          <ConfigRow label="App Name" value={APP_NAME ?? 'Liberia EcoLedger'} />
          <ConfigRow label="App URL"  value={APP_URL  ?? '—'} mono />
          <ConfigRow label="Version"  value="1.0.0" />
          <ConfigRow label="Environment" value={APP_URL?.includes('localhost') ? 'Development' : 'Production'} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Supabase</h2>
          </div>
          <ConfigRow label="Project URL" value={SUPABASE_URL ?? '—'} mono />
          <ConfigRow label="Auth Provider" value="Supabase Auth + Privy" />
          <ConfigRow label="Storage"       value="Supabase Storage + Pinata IPFS" />
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
            <CheckCircle className="w-4 h-4 text-eco-700" />
            <span className="text-xs text-eco-700 font-medium">Connected</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Privy Wallet Auth</h2>
          </div>
          <ConfigRow label="App ID"        value={PRIVY_APP_ID ?? '—'} mono />
          <ConfigRow label="Login Methods" value="Email OTP · Wallet (WalletConnect)" />
          <ConfigRow label="Consumers"     value="Wallet login" />
          <ConfigRow label="Institutions"  value="Email + Invitation code" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-white border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Blockchain</h2>
          </div>
          <ConfigRow label="Network"       value="Polygon Amoy Testnet" />
          <ConfigRow label="Chain ID"      value={CHAIN_ID ?? '80002'} mono />
          <ConfigRow label="Smart Contract" value="Not deployed — tx hash anchoring active" />
          <ConfigRow label="IPFS"           value="Pinata (CIDv1)" />
        </motion.div>

        {/* Roles reference */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Role Permissions</h2>
          </div>
          <div className="space-y-2">
            {[
              { role: 'consumer',     desc: 'Register and track personal devices, earn EcoCredits', color: 'bg-gray-100 text-gray-600' },
              { role: 'manufacturer', desc: 'Register manufactured/imported devices, view analytics', color: 'bg-blue-100 text-blue-700' },
              { role: 'recycler',     desc: 'Accept intake, log disposals, award EcoCredits', color: 'bg-green-100 text-green-700' },
              { role: 'regulator',    desc: 'National oversight, compliance flags, reports', color: 'bg-purple-100 text-purple-700' },
              { role: 'auditor',      desc: 'Read-only: block explorer, verified records, transaction lookup', color: 'bg-yellow-100 text-yellow-700' },
              { role: 'admin',        desc: 'Full platform access: users, invitations, facilities, settings', color: 'bg-red-100 text-red-700' },
            ].map(r => (
              <div key={r.role} className="flex items-center gap-3">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize flex-shrink-0 ${r.color}`}>{r.role}</span>
                <span className="text-xs text-muted-foreground">{r.desc}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
