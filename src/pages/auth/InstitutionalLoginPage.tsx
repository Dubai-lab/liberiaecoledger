import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function InstitutionalLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !code) return
    setLoading(true)

    try {
      // Look up a valid, unexpired, unaccepted invitation matching email + token
      const { data: invite, error: inviteError } = await supabase
        .from('invitations')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .eq('token', code.trim())
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

      if (inviteError) throw inviteError

      if (!invite) {
        toast.error('Invalid or expired access code. Contact support@liberiaecoledger.com')
        return
      }

      // Sign in with password — the admin creates the Supabase account when sending the invite.
      // If no password exists yet (first sign-in), send a magic link instead.
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/setup-account`,
          data: { invited_role: invite.role, invited_org: invite.organization },
        },
      })

      if (signInError) throw signInError

      // accepted_at is marked in SetupAccountPage after the user is authenticated
      toast.success('Magic link sent! Check your email to complete sign-in.')
      navigate('/login')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Verification failed. Please try again.')
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
            <p className="text-xs tracking-widest uppercase" style={{ color: '#fafaf7', opacity: 0.4 }}>Government & Institutional</p>
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
            Reserved for government bodies, regulators, and verified NGOs.
          </h1>
          <p className="text-sm leading-relaxed max-w-xs" style={{ color: '#fafaf7', opacity: 0.5 }}>
            Access codes are issued by the Platform Administrator after identity verification. Contact support if you have not received one.
          </p>
        </motion.div>

        <div className="flex gap-6 relative z-10">
          {[
            { value: 'EPA', label: 'Environmental Protection Agency' },
            { value: 'MOCI', label: 'Ministry of Commerce' },
            { value: 'LISGIS', label: 'Statistics & Geo-Information' },
          ].map(item => (
            <div key={item.label}>
              <p className="text-xs font-semibold" style={{ color: '#fafaf7' }}>{item.value}</p>
              <p className="text-[10px]" style={{ color: '#fafaf7', opacity: 0.4 }}>{item.label}</p>
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
          className="w-full max-w-sm space-y-6"
        >
          <Link
            to="/login"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>

          <div>
            <p className="text-xs text-muted-foreground tracking-widest uppercase mb-1">
              Government / Institutional Access
            </p>
            <h2
              className="text-3xl"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, color: '#0f1410' }}
            >
              Institutional Sign In
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Enter your official email and the access code issued by the platform administrator.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
                Official Email
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

            <div className="space-y-1.5">
              <label className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
                Access Code
              </label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="ECO-XXXX-XXXX"
                required
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors font-mono tracking-widest"
              />
              <p className="text-xs text-muted-foreground">
                Don't have a code?{' '}
                <a href="mailto:support@liberiaecoledger.com" className="text-eco-700 hover:underline">
                  Request one from support
                </a>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !code}
              className="w-full py-3 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#0f1410', color: '#fafaf7' }}
            >
              {loading ? 'Verifying…' : 'Verify & Sign in'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
