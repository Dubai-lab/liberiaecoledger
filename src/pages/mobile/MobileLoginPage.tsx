import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePrivy } from '@privy-io/react-auth'
import { Eye, EyeOff, Loader2, CheckCircle, ArrowLeft, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useConsumerSignup } from '@/hooks/useConsumerSignup'
import { EcoLedgerLogo } from '@/components/brand/EcoLedgerLogo'

type Tab = 'signin' | 'signup'

const inputCls =
  'w-full bg-white border border-brand-line rounded-2xl px-4 py-3.5 text-[15px] text-brand-ink placeholder:text-brand-sage focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors'
const labelCls = 'block text-xs font-semibold text-brand-ink mb-1.5'

function PasswordInput({
  value, onChange, placeholder, autoComplete, invalid, id,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoComplete: string
  invalid?: boolean
  id: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? '••••••••'}
        required
        className={`${inputCls} pr-12 ${invalid ? '!border-red-400 focus:!ring-red-200' : ''}`}
      />
      <button
        type="button"
        aria-label={show ? 'Hide password' : 'Show password'}
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-brand-muted hover:text-brand transition-colors"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}

export function MobileLoginPage() {
  const { login } = usePrivy()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab] = useState<Tab>('signin')
  const [busy, setBusy] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [siEmail, setSiEmail] = useState('')
  const [siPassword, setSiPassword] = useState('')
  const codeRef = useRef<HTMLInputElement>(null)

  const signup = useConsumerSignup({
    redirectPath: '/mobile',
    onAccountExists: email => { setSiEmail(email); setTab('signin') },
  })
  const su = signup.form
  const anyBusy = busy || signup.busy

  useEffect(() => {
    if (isAuthenticated) {
      signup.clearPending()
      navigate('/mobile', { replace: true })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (signup.step === 'verify') codeRef.current?.focus()
  }, [signup.step])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleWallet = async () => {
    setConnecting(true)
    try {
      await login()
    } finally {
      // If wallet connect opens MetaMask, the user needs to manually return to the browser
      setTimeout(() => setConnecting(false), 5000)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    const email = siEmail.toLowerCase().trim()
    if (!email || !siPassword) return
    setBusy(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: siPassword })
      if (error) {
        if (/not confirmed/i.test(error.message)) {
          // Account exists but the email code was never entered — send a fresh one
          await supabase.auth.resend({ type: 'signup', email })
          toast.info('Please verify your email first. We sent you a new code.')
          signup.startVerify(email)
          return
        }
        throw error
      }
      // Redirect happens via onAuthStateChange → isAuthenticated effect
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setBusy(false)
    }
  }

  const handleForgotPassword = async () => {
    const email = siEmail.toLowerCase().trim()
    if (!email) { toast.error('Enter your email first'); return }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) toast.error(error.message)
    else toast.success('Password reset link sent to your email')
  }

  // ── UI ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col px-6 pt-14 pb-10" style={{ background: '#F4F7F2' }}>
      <div className="mb-10">
        <EcoLedgerLogo />
      </div>

      {signup.step === 'verify' ? (
        <div className="flex-1 flex flex-col">
          <button
            type="button"
            onClick={() => { signup.leaveVerify(); setTab('signup') }}
            className="flex items-center gap-1.5 text-sm text-brand-muted mb-6 self-start"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="w-12 h-12 rounded-2xl bg-white border border-brand-line flex items-center justify-center mb-5">
            <Mail className="w-5 h-5 text-brand" />
          </div>
          <h1 className="text-3xl font-bold text-brand-ink mb-2">Check your email</h1>
          <p className="text-sm text-brand-muted leading-relaxed mb-8">
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
                className={`${inputCls} text-center text-2xl font-semibold tracking-[0.5em] tabular-nums`}
              />
            </div>

            <button
              type="submit"
              disabled={anyBusy || signup.code.length < 6}
              className="w-full py-4 rounded-2xl text-white text-base font-bold transition-opacity active:opacity-80 disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ background: '#083D24' }}
            >
              {signup.busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</> : 'Verify & create account'}
            </button>
          </form>

          <p className="text-sm text-center text-brand-muted mt-6">
            Didn't get it? Check spam, or{' '}
            <button
              type="button"
              onClick={signup.resend}
              disabled={signup.cooldown > 0 || anyBusy}
              className="font-semibold text-brand disabled:text-brand-sage"
            >
              {signup.cooldown > 0 ? `resend in ${signup.cooldown}s` : 'resend code'}
            </button>
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <h1 className="text-3xl font-bold text-brand-ink mb-2">
            {tab === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-sm text-brand-muted leading-relaxed mb-6">
            {tab === 'signin'
              ? 'Sign in with your email and password.'
              : 'Register your devices, track their lifecycle, and earn EcoCredits.'}
          </p>

          {/* Tabs */}
          <div className="grid grid-cols-2 gap-1 bg-brand-line rounded-2xl p-1 mb-6" role="tablist">
            {(['signin', 'signup'] as const).map(m => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={tab === m}
                onClick={() => setTab(m)}
                className={`py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  tab === m ? 'bg-white text-brand-ink shadow-sm' : 'text-brand-muted'
                }`}
              >
                {m === 'signin' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          {tab === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label htmlFor="si-email" className={labelCls}>Email</label>
                <input
                  id="si-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={siEmail}
                  onChange={e => setSiEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="si-password" className="text-xs font-semibold text-brand-ink">Password</label>
                  <button type="button" onClick={handleForgotPassword} className="text-xs text-brand-muted">
                    Forgot password?
                  </button>
                </div>
                <PasswordInput id="si-password" value={siPassword} onChange={setSiPassword} autoComplete="current-password" />
              </div>

              <button
                type="submit"
                disabled={anyBusy || !siEmail || !siPassword}
                className="w-full py-4 rounded-2xl text-white text-base font-bold transition-opacity active:opacity-80 disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: '#083D24' }}
              >
                {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : 'Sign in'}
              </button>
            </form>
          ) : (
            <form onSubmit={signup.submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="su-first" className={labelCls}>First name</label>
                  <input
                    id="su-first"
                    autoComplete="given-name"
                    value={su.firstName}
                    onChange={e => signup.setField('firstName', e.target.value)}
                    placeholder="George"
                    maxLength={60}
                    required
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="su-last" className={labelCls}>Surname</label>
                  <input
                    id="su-last"
                    autoComplete="family-name"
                    value={su.lastName}
                    onChange={e => signup.setField('lastName', e.target.value)}
                    placeholder="Emmanuel"
                    maxLength={60}
                    required
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="su-email" className={labelCls}>Email</label>
                <input
                  id="su-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={su.email}
                  onChange={e => signup.setField('email', e.target.value)}
                  placeholder="you@example.com"
                  maxLength={254}
                  required
                  className={inputCls}
                />
              </div>

              <div>
                <label htmlFor="su-password" className={labelCls}>Password</label>
                <PasswordInput
                  id="su-password"
                  value={su.password}
                  onChange={v => signup.setField('password', v)}
                  autoComplete="new-password"
                />
                {su.password && (
                  <div className="space-y-1 mt-2">
                    {signup.checks.map(c => (
                      <div key={c.label} className="flex items-center gap-2">
                        <CheckCircle className={`w-3.5 h-3.5 flex-shrink-0 ${c.pass ? 'text-brand' : 'text-brand-line'}`} />
                        <span className={`text-xs ${c.pass ? 'text-brand' : 'text-brand-muted'}`}>{c.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="su-confirm" className={labelCls}>Confirm password</label>
                <PasswordInput
                  id="su-confirm"
                  value={su.confirm}
                  onChange={v => signup.setField('confirm', v)}
                  autoComplete="new-password"
                  invalid={!!su.confirm && su.confirm !== su.password}
                />
                {su.confirm && su.confirm !== su.password && (
                  <p className="text-xs text-red-500 mt-1.5">Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={anyBusy || !signup.valid}
                className="w-full py-4 rounded-2xl text-white text-base font-bold transition-opacity active:opacity-80 disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: '#083D24' }}
              >
                {signup.busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</> : 'Create account'}
              </button>
              <p className="text-xs text-center text-brand-muted">
                We'll email you a code to confirm your address.
              </p>
            </form>
          )}

          {/* Wallet option */}
          <div className="mt-auto pt-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-brand-line" />
              <span className="text-xs text-brand-sage">or</span>
              <div className="flex-1 h-px bg-brand-line" />
            </div>

            {connecting && (
              <div className="bg-white rounded-2xl px-4 py-3 mb-3 flex items-start gap-3 border border-brand-line">
                <span className="text-lg">👆</span>
                <p className="text-sm text-brand-ink leading-relaxed">
                  After approving in MetaMask, tap the <strong>browser icon</strong> or swipe back to return here.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleWallet}
              disabled={connecting}
              className="w-full py-3.5 rounded-2xl text-brand-ink text-sm font-semibold bg-white border border-brand-line transition-opacity active:opacity-80 disabled:opacity-60"
            >
              {connecting ? 'Opening…' : 'Continue with wallet'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
