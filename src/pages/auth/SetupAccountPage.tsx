import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'One uppercase letter',  pass: /[A-Z]/.test(password) },
    { label: 'One number',            pass: /\d/.test(password) },
  ]
  return (
    <div className="space-y-1 mt-2">
      {checks.map(c => (
        <div key={c.label} className="flex items-center gap-2">
          <CheckCircle className={`w-3 h-3 flex-shrink-0 ${c.pass ? 'text-eco-700' : 'text-muted-foreground/40'}`} />
          <span className={`text-xs ${c.pass ? 'text-eco-700' : 'text-muted-foreground'}`}>{c.label}</span>
        </div>
      ))}
    </div>
  )
}

export function SetupAccountPage() {
  const { profile, isLoading, refetch } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [retries, setRetries] = useState(0)

  // If already set up, move on
  useEffect(() => {
    if (profile?.full_name) navigate('/role-select', { replace: true })
  }, [profile, navigate])

  // Auth loaded but no profile yet — DB trigger may still be running after OTP confirm.
  // Retry up to 5 times (one per second) before giving up.
  useEffect(() => {
    if (!isLoading && !profile && retries < 5) {
      const t = setTimeout(() => { refetch(); setRetries(r => r + 1) }, 1000)
      return () => clearTimeout(t)
    }
  }, [isLoading, profile, retries, refetch])

  // Show loading screen while auth resolves or while retrying
  if (isLoading || (!profile && retries < 5)) return <LoadingScreen />

  // After 5 retries with no profile — something went wrong, let user recover
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-white">
        <div className="text-center max-w-xs">
          <p className="text-sm text-muted-foreground mb-4">
            Could not load your account details. Your invitation link may have expired or already been used.
          </p>
          <a href="/login" className="text-sm font-medium text-eco-700 hover:underline">
            Back to sign in
          </a>
        </div>
      </div>
    )
  }

  const isValid =
    fullName.trim().length >= 2 &&
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    password === confirm

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || !profile) return
    setLoading(true)

    try {
      // Update profile name in DB first — fixes needsSetup check before auth refresh fires
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', profile.id)
      if (profileError) throw profileError

      // Read the invited role from OTP metadata — this is the authoritative source
      const { data: { user } } = await supabase.auth.getUser()
      const invitedRole = user?.user_metadata?.invited_role as string | undefined
      const invitedOrg  = user?.user_metadata?.invited_org  as string | undefined

      if (invitedRole && invitedRole !== 'consumer') {
        // Assign the invited role
        await supabase.from('user_roles').upsert(
          { user_id: profile.id, role: invitedRole, organization: invitedOrg ?? null, is_verified: true, metadata: {} },
          { onConflict: 'user_id,role' }
        )
        // Set it as the active role so role-select lands on the right workspace
        await supabase.from('profiles').update({ active_role: invitedRole }).eq('id', profile.id)
      }

      // Mark the invitation as accepted — now authenticated so RLS allows it
      if (profile.email) {
        await supabase
          .from('invitations')
          .update({ accepted_at: new Date().toISOString() })
          .eq('email', profile.email)
          .is('accepted_at', null)
          .gt('expires_at', new Date().toISOString())
      }

      toast.success('Account set up successfully! Welcome to EcoLedger.')

      // updateUser fires USER_UPDATED → the shared AuthContext refreshes all state at once,
      // so the route guard in App.tsx sees needsSetup=false before navigation happens.
      await supabase.auth.updateUser({
        password,
        data: { full_name: fullName.trim() },
      }).catch(() => {})
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Setup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_1fr]">
      {/* Dark panel */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: '#0f1410' }}
      >
        <div className="absolute -top-32 -right-32 w-[560px] h-[560px] rounded-full opacity-10" style={{ border: '1px solid #fafaf7' }} />
        <div className="absolute -top-20 -right-20 w-[420px] h-[420px] rounded-full opacity-5" style={{ border: '1px solid #fafaf7' }} />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#1a2e1c' }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="#fafaf7" strokeWidth={1.5}>
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="15" cy="9" r="2" fill="#2f6b3a" stroke="none" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-sm" style={{ color: '#fafaf7' }}>EcoLedger</p>
            <p className="text-xs tracking-widest uppercase" style={{ color: '#fafaf7', opacity: 0.4 }}>Account Setup</p>
          </div>
        </div>

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
            One last step before you begin.
          </h1>
          <p className="text-sm leading-relaxed max-w-xs" style={{ color: '#fafaf7', opacity: 0.5 }}>
            Your identity has been verified. Set your display name and a secure password to complete your EcoLedger account.
          </p>
        </motion.div>

        <div className="flex gap-8 relative z-10">
          {[
            { value: 'Verified', label: 'Identity confirmed' },
            { value: 'Secure', label: 'End-to-end encrypted' },
            { value: 'Immutable', label: 'Blockchain-backed' },
          ].map(stat => (
            <div key={stat.label}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#2f6b3a' }} />
                <p className="text-xs font-medium" style={{ color: '#fafaf7', opacity: 0.5 }}>{stat.label}</p>
              </div>
              <p className="text-sm font-semibold" style={{ color: '#fafaf7' }}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* White panel */}
      <div className="flex items-center justify-center p-8 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-sm"
        >
          <p className="text-xs text-muted-foreground tracking-widest uppercase mb-1">Almost there</p>
          <h2
            className="text-3xl mb-2"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, color: '#0f1410' }}
          >
            Set up your account
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            You're signing in as <strong>{profile?.email}</strong>. Create a password so you can log in next time.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
                Full Name *
              </label>
              <input
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Your full name"
                required
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
                Create Password *
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="············"
                  required
                  className="w-full border border-border rounded-lg px-3 py-2.5 pr-10 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors"
                />
                <button
                  type="button"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password && <PasswordStrength password={password} />}
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
                Confirm Password *
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="············"
                required
                className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 transition-colors ${
                  confirm && confirm !== password
                    ? 'border-red-400 focus:ring-red-200 focus:border-red-400'
                    : 'border-border focus:ring-eco-700/20 focus:border-eco-700'
                }`}
              />
              {confirm && confirm !== password && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !isValid}
              className="w-full py-3 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: '#0f1410', color: '#fafaf7' }}
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Setting up…</>
                : 'Complete Setup & Enter Dashboard'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
