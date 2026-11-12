import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { usePrivy } from '@privy-io/react-auth'
import { motion } from 'framer-motion'
import { UserPlus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { EcoLedgerLogo } from '@/components/brand/EcoLedgerLogo'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  as string
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string

function useLoginStats() {
  const [s, setS] = useState({ devices: 0, recyclers: 0 })
  useEffect(() => {
    fetch(`${SUPABASE_URL}/functions/v1/public-stats`, {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
    })
      .then(r => r.json())
      .then(data => setS({ devices: data.devices ?? 0, recyclers: data.recyclers ?? 0 }))
      .catch(() => {})
  }, [])
  return s
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

export function LoginPage() {
  const { login } = usePrivy()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const stats = useLoginStats()

  useEffect(() => {
    if (isAuthenticated) navigate('/role-select')
  }, [isAuthenticated, navigate])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      // Navigation handled by onAuthStateChange → loadProfile → useEffect below
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) { toast.error('Enter your email first'); return }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) toast.error(error.message)
    else toast.success('Password reset link sent to your email')
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_1fr]">
      {/* ── Left dark panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: '#063921' }}
      >
        <div
          className="absolute -top-32 -right-32 w-[560px] h-[560px] rounded-full opacity-10"
          style={{ border: '1px solid #FFFFFF' }}
        />
        <div
          className="absolute -top-20 -right-20 w-[420px] h-[420px] rounded-full opacity-5"
          style={{ border: '1px solid #FFFFFF' }}
        />

        {/* Logo + back */}
        <div className="relative z-10 flex items-center justify-between">
          <EcoLedgerLogo tone="dark" />
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={2}>
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to home
          </button>
        </div>

        {/* Hero text */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="relative z-10"
        >
          <h1
            className="text-4xl leading-tight mb-5"
            style={{ color: '#FFFFFF', fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}
          >
            An immutable record for every device, from point of sale to end of life.
          </h1>
          <p className="text-sm leading-relaxed max-w-xs" style={{ color: '#FFFFFF', opacity: 0.5 }}>
            Liberia EcoLedger turns electronic devices into digital entities on a permissioned blockchain — so manufacturers, recyclers, regulators, and the communities they serve can audit the lifecycle of every unit.
          </p>
        </motion.div>

        {/* Stats — real data */}
        <div className="flex gap-8 relative z-10">
          {[
            { value: fmt(stats.devices)  || '—', label: 'Devices on chain' },
            { value: fmt(stats.recyclers) || '—', label: 'Verified recyclers' },
          ].map(stat => (
            <div key={stat.label}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#8FD3A8' }} />
                <p className="text-xs font-medium" style={{ color: '#FFFFFF', opacity: 0.5 }}>
                  {stat.label}
                </p>
              </div>
              <p className="text-sm font-semibold tabular-nums" style={{ color: '#FFFFFF' }}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right white panel ── */}
      <div className="flex items-center justify-center p-8 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-sm"
        >
          <div className="lg:hidden mb-10"><EcoLedgerLogo /></div>
          <p className="text-xs tracking-widest uppercase text-brand-muted mb-1">
            Welcome back
          </p>
          <h2
            className="text-3xl mb-8"
            style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, color: '#063921' }}
          >
            Sign in to your account
          </h2>

          <form onSubmit={handleSignIn} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium tracking-widest uppercase text-brand-muted">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@epa.gov.lr"
                required
                className="w-full border border-brand-line rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium tracking-widest uppercase text-brand-muted">
                Password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="············"
                required
                className="w-full border border-brand-line rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors"
              />
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-brand-line accent-brand"
                />
                <span className="text-xs text-brand-muted">Remember this device</span>
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs text-brand-muted hover:text-brand-ink transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Sign in button */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-3 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#063921', color: '#FFFFFF' }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-brand-muted">or continue with</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Wallet + Gov SSO */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={login}
              className="border border-brand-line py-2.5 rounded-lg text-sm font-medium hover:bg-brand-tint transition-colors"
            >
              Connect Wallet
            </button>
            <Link
              to="/login/institutional"
              className="border border-brand-line py-2.5 rounded-lg text-sm font-medium hover:bg-brand-tint transition-colors text-center"
            >
              Government SSO
            </Link>
          </div>

          {/* New here? Consumers sign up; other stakeholders request access */}
          <div className="mt-8 pt-6 border-t border-brand-line">
            <p className="text-xs text-center text-brand-muted mb-3">New to EcoLedger?</p>
            <Link
              to="/signup"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-lg text-sm font-semibold text-brand border-2 border-brand hover:bg-brand-tint transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Create a consumer account
            </Link>
            <p className="text-xs text-center text-brand-muted mt-4 leading-relaxed">
              Manufacturer, recycler, regulator or NGO?{' '}
              <Link to="/stakeholders/request-access" className="text-brand font-medium hover:underline">
                Request stakeholder access
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
