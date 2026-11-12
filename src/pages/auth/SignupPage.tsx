import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2, CheckCircle, ArrowLeft, Mail, Smartphone, Coins, Recycle } from 'lucide-react'
import { EcoLedgerLogo } from '@/components/brand/EcoLedgerLogo'
import { useAuth } from '@/hooks/useAuth'
import { useConsumerSignup } from '@/hooks/useConsumerSignup'

const inputCls =
  'w-full border border-brand-line rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors'
const labelCls = 'block text-xs font-medium tracking-widest uppercase text-brand-muted mb-1.5'

function PasswordInput({
  id, value, onChange, invalid,
}: { id: string; value: string; onChange: (v: string) => void; invalid?: boolean }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        autoComplete="new-password"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="············"
        required
        className={`${inputCls} pr-10 ${invalid ? '!border-red-400 focus:!ring-red-200' : ''}`}
      />
      <button
        type="button"
        aria-label={show ? 'Hide password' : 'Show password'}
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-ink transition-colors"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}

export function SignupPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const codeRef = useRef<HTMLInputElement>(null)
  const signup = useConsumerSignup({
    redirectPath: '/consumer',
    onAccountExists: () => navigate('/login'),
  })
  const f = signup.form

  useEffect(() => {
    if (isAuthenticated) {
      signup.clearPending()
      navigate('/consumer', { replace: true })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (signup.step === 'verify') codeRef.current?.focus()
  }, [signup.step])

  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_1fr]">
      {/* ── Left dark panel ── */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden bg-brand-deep">
        <div className="absolute -top-32 -right-32 w-[560px] h-[560px] rounded-full border border-white/10" />
        <div className="absolute -top-20 -right-20 w-[420px] h-[420px] rounded-full border border-white/5" />

        <div className="relative z-10 flex items-center justify-between">
          <EcoLedgerLogo tone="dark" />
          <Link to="/" className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to home
          </Link>
        </div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="relative z-10">
          <p className="text-xs font-semibold tracking-widest uppercase text-white/50 mb-4">For consumers</p>
          <h1 className="font-display text-4xl font-semibold leading-tight text-white mb-5">
            Track every device you own. Earn rewards for doing the right thing.
          </h1>
          <p className="text-sm leading-relaxed max-w-sm text-white/60">
            Register your phone or laptop with its IMEI, follow its full lifecycle on the ledger, and get paid in EcoCredits when it's properly recycled.
          </p>
        </motion.div>

        <div className="relative z-10 grid grid-cols-3 gap-6 max-w-md">
          {[
            { Icon: Smartphone, label: 'Verify by IMEI' },
            { Icon: Recycle,    label: 'Recycle responsibly' },
            { Icon: Coins,      label: 'Earn EcoCredits' },
          ].map(({ Icon, label }) => (
            <div key={label}>
              <Icon className="w-5 h-5 text-[#8FD3A8] mb-2" strokeWidth={1.75} />
              <p className="text-xs font-medium text-white/70">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right white panel ── */}
      <div className="flex items-center justify-center p-8 bg-white">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="w-full max-w-sm">
          <div className="lg:hidden mb-10"><EcoLedgerLogo /></div>

          {signup.step === 'verify' ? (
            <>
              <button
                type="button"
                onClick={signup.leaveVerify}
                className="flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-ink mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-brand-tint text-brand mb-4">
                <Mail className="w-5 h-5" />
              </span>
              <h2 className="text-3xl font-semibold text-brand-deep mb-2">Check your email</h2>
              <p className="text-sm text-brand-muted mb-8">
                Enter the verification code we sent to <strong className="text-brand-ink break-all">{signup.verifyEmail}</strong> to finish creating your account.
              </p>

              <form onSubmit={signup.verify} className="space-y-4">
                <div>
                  <label htmlFor="otp" className={labelCls}>Verification code</label>
                  <input
                    id="otp"
                    ref={codeRef}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={signup.code}
                    onChange={e => signup.setCode(e.target.value)}
                    placeholder="••••••"
                    className={`${inputCls} text-center text-2xl font-semibold tracking-[0.5em] tabular-nums py-3`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={signup.busy || signup.code.length < 6}
                  className="w-full py-3 rounded-lg text-sm font-medium text-white bg-brand-deep hover:bg-brand-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {signup.busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</> : 'Verify & create account'}
                </button>
              </form>

              <p className="text-xs text-center text-brand-muted mt-5">
                Didn't get it? Check spam, or{' '}
                <button
                  type="button"
                  onClick={signup.resend}
                  disabled={signup.cooldown > 0 || signup.busy}
                  className="font-semibold text-brand hover:underline disabled:text-brand-sage disabled:no-underline"
                >
                  {signup.cooldown > 0 ? `resend in ${signup.cooldown}s` : 'resend code'}
                </button>
              </p>
            </>
          ) : (
            <>
              <p className="text-xs tracking-widest uppercase text-brand-muted mb-1">Consumer account</p>
              <h2 className="text-3xl font-semibold text-brand-deep mb-8">Create your account</h2>

              <form onSubmit={signup.submit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="su-first" className={labelCls}>First name</label>
                    <input id="su-first" autoComplete="given-name" value={f.firstName} onChange={e => signup.setField('firstName', e.target.value)} placeholder="George" maxLength={60} required className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="su-last" className={labelCls}>Surname</label>
                    <input id="su-last" autoComplete="family-name" value={f.lastName} onChange={e => signup.setField('lastName', e.target.value)} placeholder="Emmanuel" maxLength={60} required className={inputCls} />
                  </div>
                </div>

                <div>
                  <label htmlFor="su-email" className={labelCls}>Email</label>
                  <input id="su-email" type="email" autoComplete="email" value={f.email} onChange={e => signup.setField('email', e.target.value)} placeholder="you@example.com" maxLength={254} required className={inputCls} />
                </div>

                <div>
                  <label htmlFor="su-password" className={labelCls}>Password</label>
                  <PasswordInput id="su-password" value={f.password} onChange={v => signup.setField('password', v)} />
                  {f.password && (
                    <div className="space-y-1 mt-2">
                      {signup.checks.map(c => (
                        <div key={c.label} className="flex items-center gap-2">
                          <CheckCircle className={`w-3 h-3 flex-shrink-0 ${c.pass ? 'text-brand' : 'text-brand-line'}`} />
                          <span className={`text-xs ${c.pass ? 'text-brand' : 'text-brand-muted'}`}>{c.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="su-confirm" className={labelCls}>Confirm password</label>
                  <PasswordInput id="su-confirm" value={f.confirm} onChange={v => signup.setField('confirm', v)} invalid={!!f.confirm && f.confirm !== f.password} />
                  {f.confirm && f.confirm !== f.password && <p className="text-xs text-red-500 mt-1.5">Passwords do not match</p>}
                </div>

                <button
                  type="submit"
                  disabled={signup.busy || !signup.valid}
                  className="w-full py-3 rounded-lg text-sm font-medium text-white bg-brand-deep hover:bg-brand-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {signup.busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</> : 'Create account'}
                </button>
                <p className="text-xs text-center text-brand-muted">We'll email you a code to confirm your address.</p>
              </form>

              <div className="mt-8 pt-6 border-t border-brand-line space-y-2 text-xs text-center text-brand-muted">
                <p>
                  Already have an account?{' '}
                  <Link to="/login" className="text-brand font-medium hover:underline">Sign in</Link>
                </p>
                <p>
                  Manufacturer, recycler, regulator or NGO?{' '}
                  <Link to="/stakeholders/request-access" className="text-brand font-medium hover:underline">Request access</Link>
                </p>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}
