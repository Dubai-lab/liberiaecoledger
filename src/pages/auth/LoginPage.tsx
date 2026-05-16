import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import logoDark from '@/brands/logo-dark.png'
import { usePrivy } from '@privy-io/react-auth'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

export function LoginPage() {
  const { login } = usePrivy()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

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
        style={{ background: '#0f1410' }}
      >
        <div
          className="absolute -top-32 -right-32 w-[560px] h-[560px] rounded-full opacity-10"
          style={{ border: '1px solid #fafaf7' }}
        />
        <div
          className="absolute -top-20 -right-20 w-[420px] h-[420px] rounded-full opacity-5"
          style={{ border: '1px solid #fafaf7' }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <img src={logoDark} alt="EcoLedger" className="h-10 w-auto object-contain" />
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
            style={{ color: '#fafaf7', fontFamily: "'Cormorant Garamond', serif", fontWeight: 400 }}
          >
            An immutable record for every device, from point of sale to end of life.
          </h1>
          <p className="text-sm leading-relaxed max-w-xs" style={{ color: '#fafaf7', opacity: 0.5 }}>
            Liberia EcoLedger turns electronic devices into digital entities on a permissioned blockchain — so manufacturers, recyclers, regulators, and the communities they serve can audit the lifecycle of every unit.
          </p>
        </motion.div>

        {/* Stats */}
        <div className="flex gap-8 relative z-10">
          {[
            { value: '2.41 M', label: 'Devices on chain' },
            { value: '184', label: 'Verified Recyclers' },
            { value: '12', label: 'Regulatory Bodies' },
          ].map(stat => (
            <div key={stat.label}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#2f6b3a' }} />
                <p className="text-xs font-medium" style={{ color: '#fafaf7', opacity: 0.5 }}>
                  {stat.label}
                </p>
              </div>
              <p className="text-sm font-semibold" style={{ color: '#fafaf7' }}>{stat.value}</p>
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
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-1">
            Welcome back
          </p>
          <h2
            className="text-3xl mb-8"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, color: '#0f1410' }}
          >
            Sign in to your account
          </h2>

          <form onSubmit={handleSignIn} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
                Organization Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@epa.gov.lr"
                required
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
                Password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="············"
                required
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors"
              />
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-border accent-eco-700"
                />
                <span className="text-xs text-muted-foreground">Remember this device</span>
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Sign in button */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-3 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#0f1410', color: '#fafaf7' }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or continue with</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Wallet + Gov SSO */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={login}
              className="border border-border py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              Connect Wallet
            </button>
            <Link
              to="/login/institutional"
              className="border border-border py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors text-center"
            >
              Government SSO
            </Link>
          </div>

          {/* Register link */}
          <p className="text-xs text-center text-muted-foreground mt-6">
            Not on the platform yet?{' '}
            <a
              href="mailto:support@liberiaecoledger.com"
              className="text-eco-700 hover:underline"
            >
              Request stakeholder access
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
