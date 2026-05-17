import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/types/database'

const ROLE_META: Record<UserRole, { label: string; description: string; path: string }> = {
  consumer:     { label: 'Consumer',         description: 'Track devices you own',             path: '/consumer' },
  manufacturer: { label: 'Manufacturer',     description: 'Register units at point of sale',   path: '/manufacturer' },
  recycler:     { label: 'Recycler',         description: 'Log intake & disposal',             path: '/recycler' },
  regulator:    { label: 'Regulator',        description: 'Audit and enforce compliance',       path: '/regulator' },
  auditor:      { label: 'NGO / Auditor',    description: 'Read-only verification',            path: '/auditor' },
  admin:        { label: 'Platform Admin',   description: 'Manage users & contracts',          path: '/admin' },
}

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  consumer: (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}>
      <path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  manufacturer: (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      <line x1="12" y1="12" x2="12" y2="16" />
      <line x1="10" y1="14" x2="14" y2="14" />
    </svg>
  ),
  recycler: (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}>
      <path d="M7 19H4.923a1 1 0 01-.916-1.4l1-2a1 1 0 01.916-.6H7" />
      <path d="M17 19h2.077a1 1 0 00.916-1.4l-1-2a1 1 0 00-.916-.6H17" />
      <path d="M9 19h6" />
      <path d="M12 3l3 5H9l3-5z" />
      <path d="M12 8v6" />
    </svg>
  ),
  regulator: (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}>
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  ),
  auditor: (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  ),
  admin: (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
}

export function RoleSelectPage() {
  const { profile, signOut, switchRole } = useAuth()
  const navigate = useNavigate()
  const [assignedRoles, setAssignedRoles] = useState<UserRole[]>([])
  const [loadingRoles, setLoadingRoles] = useState(true)
  const [selecting, setSelecting] = useState<UserRole | null>(null)

  useEffect(() => {
    if (!profile) return

    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', profile.id)
      .then(({ data }) => {
        const roles = data?.map(r => r.role as UserRole) ?? []
        setAssignedRoles(roles)
        setLoadingRoles(false)
      })
  }, [profile])

  const handleSelect = async (role: UserRole) => {
    setSelecting(role)
    await switchRole(role)
    navigate(ROLE_META[role].path)
  }

  const displayName = profile?.full_name ?? profile?.email ?? 'Unknown user'

  return (
    <div className="min-h-screen" style={{ background: '#fafaf7' }}>
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: '#0f1410' }}
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="#fafaf7" strokeWidth={1.5}>
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="15" cy="9" r="2" fill="#2f6b3a" stroke="none" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-sm" style={{ color: '#0f1410' }}>EcoLedger</p>
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground">Liberia</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="hidden sm:block">{displayName}</span>
          <button
            type="button"
            onClick={signOut}
            className="text-xs hover:text-foreground transition-colors border border-border rounded-md px-3 py-1.5"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <p className="text-xs text-muted-foreground tracking-widest uppercase mb-1">Identity verified</p>
          <h1
            className="text-3xl mb-2"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, color: '#0f1410' }}
          >
            Continue as...
          </h1>
          <p className="text-muted-foreground text-sm">
            Select the stakeholder workspace you want to enter.
          </p>
        </motion.div>

        <div className="mt-8">
          {loadingRoles ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {assignedRoles.map((role, i) => {
                const meta = ROLE_META[role]
                const isSelecting = selecting === role
                return (
                  <motion.button
                    key={role}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    onClick={() => handleSelect(role)}
                    disabled={!!selecting}
                    className="text-left p-5 border border-border rounded-xl bg-white hover:border-eco-700 hover:shadow-sm transition-all group disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-muted-foreground group-hover:text-eco-700 transition-colors">
                        {ROLE_ICONS[role]}
                      </span>
                      {isSelecting && <Loader2 className="w-4 h-4 animate-spin text-eco-700" />}
                    </div>
                    <p className="font-medium text-sm text-foreground">{meta.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
                  </motion.button>
                )
              })}
            </div>
          )}
        </div>

        <p className="text-xs text-center text-muted-foreground mt-10">
          Don't see the right role?{' '}
          <a href="mailto:support@liberiaecoledger.com" className="hover:underline" style={{ color: '#2f6b3a' }}>
            Contact support
          </a>
        </p>
      </div>
    </div>
  )
}
