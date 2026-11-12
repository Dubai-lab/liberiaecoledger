import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { EcoLedgerLogo } from '@/components/brand/EcoLedgerLogo'

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
        style={{ background: '#063921' }}
      >
        <div className="absolute -top-32 -right-32 w-[560px] h-[560px] rounded-full opacity-10" style={{ border: '1px solid #FFFFFF' }} />
        <div className="absolute -top-20 -right-20 w-[420px] h-[420px] rounded-full opacity-5" style={{ border: '1px solid #FFFFFF' }} />

        <div className="flex items-center gap-3 relative z-10">
          <div>
            <EcoLedgerLogo tone="dark" />
            <p className="text-xs tracking-widest uppercase mt-2" style={{ color: '#FFFFFF', opacity: 0.6 }}>Government & Institutional</p>
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
            style={{ color: '#FFFFFF', fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}
          >
            Reserved for government bodies, regulators, and verified NGOs.
          </h1>
          <p className="text-sm leading-relaxed max-w-xs" style={{ color: '#FFFFFF', opacity: 0.5 }}>
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
              <p className="text-xs font-semibold" style={{ color: '#FFFFFF' }}>{item.value}</p>
              <p className="text-[10px]" style={{ color: '#FFFFFF', opacity: 0.4 }}>{item.label}</p>
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
          <div className="lg:hidden mb-10"><EcoLedgerLogo /></div>
          <Link
            to="/login"
            className="flex items-center gap-2 text-sm text-brand-muted hover:text-brand-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>

          <div>
            <p className="text-xs text-brand-muted tracking-widest uppercase mb-1">
              Government / Institutional Access
            </p>
            <h2
              className="text-3xl"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, color: '#063921' }}
            >
              Institutional Sign In
            </h2>
            <p className="text-sm text-brand-muted mt-2">
              Enter your official email and the access code issued by the platform administrator.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium tracking-widest uppercase text-brand-muted">
                Official Email
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

            <div className="space-y-1.5">
              <label className="text-xs font-medium tracking-widest uppercase text-brand-muted">
                Access Code
              </label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="ECO-XXXX-XXXX"
                required
                className="w-full border border-brand-line rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors font-mono tracking-widest"
              />
              <p className="text-xs text-brand-muted">
                Don't have a code?{' '}
                <Link to="/stakeholders/request-access" className="text-brand hover:underline">
                  Request access
                </Link>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !code}
              className="w-full py-3 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#063921', color: '#FFFFFF' }}
            >
              {loading ? 'Verifying…' : 'Verify & Sign in'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
