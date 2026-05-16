import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Cpu, Send, Leaf, Bell, Factory, BookOpen,
  BarChart3, Recycle, ClipboardList, Trash2, MapPin, ShieldAlert,
  FileText, Search, CheckSquare, Users, MailPlus, Code2, Settings,
  ChevronRight, Menu, X, LogOut, ChevronDown,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/types/database'

type NavItem = { label: string; path: string; icon: React.ReactNode }

const NAV: Record<UserRole, NavItem[]> = {
  consumer: [
    { label: 'My Devices',       path: '/consumer',          icon: <Cpu className="w-4 h-4" /> },
    { label: 'Register Device',  path: '/consumer/register', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Transfer Device',  path: '/consumer/transfer', icon: <Send className="w-4 h-4" /> },
    { label: 'EcoCredits',       path: '/consumer/credits',  icon: <Leaf className="w-4 h-4" /> },
    { label: 'Notifications',    path: '/consumer/notifications', icon: <Bell className="w-4 h-4" /> },
  ],
  manufacturer: [
    { label: 'Overview',         path: '/manufacturer',           icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Device Catalogue', path: '/manufacturer/catalogue', icon: <Cpu className="w-4 h-4" /> },
    { label: 'Register Units',   path: '/manufacturer/register',  icon: <Factory className="w-4 h-4" /> },
    { label: 'Analytics',        path: '/manufacturer/analytics', icon: <BarChart3 className="w-4 h-4" /> },
  ],
  recycler: [
    { label: 'Hub Overview',     path: '/recycler',            icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Intake Queue',     path: '/recycler/intake',     icon: <ClipboardList className="w-4 h-4" /> },
    { label: 'Log Disposal',     path: '/recycler/disposal',   icon: <Trash2 className="w-4 h-4" /> },
    { label: 'Facility Profile', path: '/recycler/facility',   icon: <MapPin className="w-4 h-4" /> },
  ],
  regulator: [
    { label: 'National Overview', path: '/regulator',           icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Compliance Map',    path: '/regulator/map',       icon: <MapPin className="w-4 h-4" /> },
    { label: 'Flagged Cases',     path: '/regulator/flags',     icon: <ShieldAlert className="w-4 h-4" /> },
    { label: 'Reports',           path: '/regulator/reports',   icon: <FileText className="w-4 h-4" /> },
  ],
  auditor: [
    { label: 'Block Explorer',    path: '/auditor',             icon: <Search className="w-4 h-4" /> },
    { label: 'Verified Records',  path: '/auditor/records',     icon: <CheckSquare className="w-4 h-4" /> },
    { label: 'Transaction Detail',path: '/auditor/transaction', icon: <BookOpen className="w-4 h-4" /> },
  ],
  admin: [
    { label: 'Overview',          path: '/admin',               icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Users',             path: '/admin/users',         icon: <Users className="w-4 h-4" /> },
    { label: 'Invitations',       path: '/admin/invitations',   icon: <MailPlus className="w-4 h-4" /> },
    { label: 'Recyclers',         path: '/admin/recyclers',     icon: <Recycle className="w-4 h-4" /> },
    { label: 'Smart Contracts',   path: '/admin/contracts',     icon: <Code2 className="w-4 h-4" /> },
    { label: 'System Settings',   path: '/admin/settings',      icon: <Settings className="w-4 h-4" /> },
  ],
}

const ROLE_LABEL: Record<UserRole, string> = {
  consumer: 'Consumer',
  manufacturer: 'Manufacturer',
  recycler: 'Recycler',
  regulator: 'Regulator',
  auditor: 'NGO / Auditor',
  admin: 'Platform Admin',
}

export function DashboardLayout() {
  const { profile, activeRole, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const role = activeRole ?? 'consumer'
  const navItems = NAV[role] ?? []
  const displayName = profile?.full_name ?? profile?.email?.split('@')[0] ?? 'User'
  const initials = displayName.slice(0, 2).toUpperCase()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex bg-[#f5f5f2]">
      {/* ── Mobile overlay ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <aside
        className={[
          'fixed top-0 left-0 h-full z-50 flex flex-col transition-transform duration-300',
          'w-60 bg-[#0f1410] lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#1a2e1c' }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="#fafaf7" strokeWidth={1.5}>
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="15" cy="9" r="2" fill="#2f6b3a" stroke="none" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#fafaf7] truncate">EcoLedger</p>
            <p className="text-[10px] tracking-widest uppercase text-white/40 truncate">Liberia</p>
          </div>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="ml-auto lg:hidden text-white/40 hover:text-white/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Role badge */}
        <div className="px-5 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#2f6b3a]" />
            <span className="text-xs text-white/50 tracking-widest uppercase">{ROLE_LABEL[role]}</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === `/${role}`}
              className={({ isActive }) => [
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                isActive
                  ? 'bg-[#2f6b3a]/20 text-[#6dba7f]'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5',
              ].join(' ')}
              onClick={() => setMobileOpen(false)}
            >
              {item.icon}
              <span>{item.label}</span>
              <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100" />
            </NavLink>
          ))}
        </nav>

        {/* User profile + sign out */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
            <div className="w-7 h-7 rounded-full bg-[#2f6b3a] flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-white">{initials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white/80 truncate">{displayName}</p>
              <p className="text-[10px] text-white/40 truncate">{profile?.organization ?? 'EcoLedger'}</p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              title="Sign out"
              className="text-white/30 hover:text-white/70 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content area ── */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-60">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-white border-b border-border">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#0f1410] flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="#fafaf7" strokeWidth={1.5}>
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="15" cy="9" r="2" fill="#2f6b3a" stroke="none" />
              </svg>
            </div>
            <span className="font-semibold text-sm">EcoLedger</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:block">{ROLE_LABEL[role]}</span>
            <div className="w-6 h-6 rounded-full bg-[#2f6b3a] flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">{initials}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
