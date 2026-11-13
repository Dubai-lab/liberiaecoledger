import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Cpu, Send, Leaf, Bell, Factory, BookOpen,
  BarChart3, Recycle, ClipboardList, Trash2, MapPin, ShieldAlert,
  FileText, Search, CheckSquare, Users, MailPlus, Code2, Settings,
  ChevronRight, Menu, X, LogOut, Gift, Building2, Coins,
  PlusCircle, LayoutGrid, Map as MapIcon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { BottomNav } from '@/components/nav/BottomNav'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/types/database'
import { EcoLedgerLogo } from '@/components/brand/EcoLedgerLogo'

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
    { label: 'Overview',         path: '/manufacturer',                  icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Device Catalogue', path: '/manufacturer/catalogue',        icon: <Cpu className="w-4 h-4" /> },
    { label: 'Register Units',   path: '/manufacturer/register',         icon: <Factory className="w-4 h-4" /> },
    { label: 'Analytics',        path: '/manufacturer/analytics',        icon: <BarChart3 className="w-4 h-4" /> },
    { label: 'EPR Reports',      path: '/manufacturer/epr',              icon: <FileText className="w-4 h-4" /> },
    { label: 'Notifications',    path: '/manufacturer/notifications',    icon: <Bell className="w-4 h-4" /> },
  ],
  recycler: [
    { label: 'Hub Overview',     path: '/recycler',                      icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Intake Queue',     path: '/recycler/intake',               icon: <ClipboardList className="w-4 h-4" /> },
    { label: 'Log Disposal',     path: '/recycler/disposal',             icon: <Trash2 className="w-4 h-4" /> },
    { label: 'Devices Received', path: '/recycler/received',             icon: <Recycle className="w-4 h-4" /> },
    { label: 'Facility Profile', path: '/recycler/facility',             icon: <MapPin className="w-4 h-4" /> },
    { label: 'Notifications',    path: '/recycler/notifications',        icon: <Bell className="w-4 h-4" /> },
  ],
  regulator: [
    { label: 'National Overview', path: '/regulator',                    icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Compliance Map',    path: '/regulator/map',                icon: <MapPin className="w-4 h-4" /> },
    { label: 'Recyclers',         path: '/regulator/recyclers',          icon: <Recycle className="w-4 h-4" /> },
    { label: 'Manufacturers',     path: '/regulator/manufacturers',      icon: <Building2 className="w-4 h-4" /> },
    { label: 'Flagged Cases',     path: '/regulator/flags',              icon: <ShieldAlert className="w-4 h-4" /> },
    { label: 'Reports',           path: '/regulator/reports',            icon: <FileText className="w-4 h-4" /> },
    { label: 'Notifications',     path: '/regulator/notifications',      icon: <Bell className="w-4 h-4" /> },
  ],
  auditor: [
    { label: 'Block Explorer',    path: '/auditor',                      icon: <Search className="w-4 h-4" /> },
    { label: 'Verified Records',  path: '/auditor/records',              icon: <CheckSquare className="w-4 h-4" /> },
    { label: 'Transaction Detail',path: '/auditor/transaction',          icon: <BookOpen className="w-4 h-4" /> },
    { label: 'Notifications',     path: '/auditor/notifications',        icon: <Bell className="w-4 h-4" /> },
  ],
  admin: [
    { label: 'Overview',          path: '/admin',                        icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Users',             path: '/admin/users',                  icon: <Users className="w-4 h-4" /> },
    { label: 'Invitations',       path: '/admin/invitations',            icon: <MailPlus className="w-4 h-4" /> },
    { label: 'Recyclers',         path: '/admin/recyclers',              icon: <Recycle className="w-4 h-4" /> },
    { label: 'Rewards',           path: '/admin/rewards',                icon: <Gift className="w-4 h-4" /> },
    { label: 'Rates & Prices',    path: '/admin/rates',                  icon: <Coins className="w-4 h-4" /> },
    { label: 'Smart Contracts',   path: '/admin/contracts',              icon: <Code2 className="w-4 h-4" /> },
    { label: 'System Settings',   path: '/admin/settings',               icon: <Settings className="w-4 h-4" /> },
    { label: 'Notifications',     path: '/admin/notifications',          icon: <Bell className="w-4 h-4" /> },
  ],
}

/** Phone bottom bar: the 4 most used destinations per role; "More" opens the full menu. */
const TABS: Record<UserRole, { label: string; to: string; icon: LucideIcon; end?: boolean }[]> = {
  consumer: [
    { label: 'Devices',  to: '/consumer',          icon: Cpu, end: true },
    { label: 'Register', to: '/consumer/register', icon: PlusCircle },
    { label: 'Transfer', to: '/consumer/transfer', icon: Send },
    { label: 'Credits',  to: '/consumer/credits',  icon: Leaf },
  ],
  manufacturer: [
    { label: 'Overview',  to: '/manufacturer',           icon: LayoutDashboard, end: true },
    { label: 'Catalogue', to: '/manufacturer/catalogue', icon: Cpu },
    { label: 'Register',  to: '/manufacturer/register',  icon: PlusCircle },
    { label: 'Reports',   to: '/manufacturer/epr',       icon: FileText },
  ],
  recycler: [
    { label: 'Hub',      to: '/recycler',          icon: LayoutDashboard, end: true },
    { label: 'Intake',   to: '/recycler/intake',   icon: ClipboardList },
    { label: 'Dispose',  to: '/recycler/disposal', icon: Trash2 },
    { label: 'Received', to: '/recycler/received', icon: Recycle },
  ],
  regulator: [
    { label: 'Overview', to: '/regulator',         icon: LayoutDashboard, end: true },
    { label: 'Map',      to: '/regulator/map',     icon: MapIcon },
    { label: 'Flags',    to: '/regulator/flags',   icon: ShieldAlert },
    { label: 'Reports',  to: '/regulator/reports', icon: FileText },
  ],
  auditor: [
    { label: 'Explorer', to: '/auditor',               icon: Search, end: true },
    { label: 'Records',  to: '/auditor/records',       icon: CheckSquare },
    { label: 'Detail',   to: '/auditor/transaction',   icon: BookOpen },
    { label: 'Alerts',   to: '/auditor/notifications', icon: Bell },
  ],
  admin: [
    { label: 'Overview', to: '/admin',             icon: LayoutDashboard, end: true },
    { label: 'Users',    to: '/admin/users',       icon: Users },
    { label: 'Invites',  to: '/admin/invitations', icon: MailPlus },
    { label: 'Rates',    to: '/admin/rates',       icon: Coins },
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
    <div className="min-h-screen flex bg-brand-tint">
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
          'w-60 bg-brand-deep lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        {/* Logo */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
          <EcoLedgerLogo tone="dark" />
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="ml-auto lg:hidden text-white hover:text-white/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Role badge */}
        <div className="px-5 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#8FD3A8]" />
            <span className="text-xs text-white tracking-widest uppercase">{ROLE_LABEL[role]}</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === `/${role}`}
              className={({ isActive }) => [
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                isActive
                  ? 'bg-white/10 text-white font-medium shadow-[inset_3px_0_0_#8FD3A8]'
                  : 'text-white hover:text-white/50 hover:bg-white/5',
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
          <button
            type="button"
            onClick={() => { navigate('/account'); setMobileOpen(false) }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 hover:opacity-60 transition-all text-left"
          >
            <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-white">{initials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white truncate">{displayName}</p>
              <p className="text-[10px] text-white/80 truncate">{profile?.organization ?? 'EcoLedger'}</p>
            </div>
            <Settings className="w-3.5 h-3.5 text-white flex-shrink-0" />
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 mt-1 rounded-lg text-white hover:text-white/50 hover:bg-white/5 transition-colors text-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
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
          <EcoLedgerLogo />
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:block">{ROLE_LABEL[role]}</span>
            <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">{initials}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Phone bottom navigation */}
      <BottomNav
        id="dash"
        items={[
          ...TABS[role],
          { label: 'More', icon: LayoutGrid, onClick: () => setMobileOpen(o => !o), active: mobileOpen },
        ]}
      />
    </div>
  )
}
