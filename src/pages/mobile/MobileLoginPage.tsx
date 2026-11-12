import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePrivy } from '@privy-io/react-auth'
import { Eye, EyeOff, Loader2, CheckCircle, ArrowLeft, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import logoCompactLight from '@/brands/logo-compact-light.png'

type Mode = 'signin' | 'signup' | 'verify'

const PENDING_EMAIL_KEY = 'ecoledger.pendingSignupEmail'
const RESEND_COOLDOWN_S = 60

const inputCls =
  'w-full bg-white border border-[#e8e5de] rounded-2xl px-4 py-3.5 text-[15px] text-[#0f0f0e] placeholder:text-[#b0afa8] focus:outline-none focus:ring-2 focus:ring-[#2d6a3f]/20 focus:border-[#2d6a3f] transition-colors'
const labelCls = 'block text-xs font-semibold text-[#0f0f0e] mb-1.5'

const passwordChecks = (pw: string) => [
  { label: 'At least 8 characters', pass: pw.length >= 8 },
  { label: 'One uppercase letter',  pass: /[A-Z]/.test(pw) },
  { label: 'One number',            pass: /\d/.test(pw) },
]

function readPendingEmail() {
  try { return sessionStorage.getItem(PENDING_EMAIL_KEY) ?? '' } catch { return '' }
}
function writePendingEmail(v: string | null) {
  try { v ? sessionStorage.setItem(PENDING_EMAIL_KEY, v) : sessionStorage.removeItem(PENDING_EMAIL_KEY) } catch { /* ignore */ }
}

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
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[#9b9b98] hover:text-[#0f0f0e] transition-colors"
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

  const pending = readPendingEmail()
  const [mode, setMode] = useState<Mode>(pending ? 'verify' : 'signin')
  const [busy, setBusy] = useState(false)
  const [connecting, setConnecting] = useState(false)

  // Sign in
  const [siEmail, setSiEmail] = useState('')
  const [siPassword, setSiPassword] = useState('')

  // Sign up
  const [su, setSu] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '' })
  const setSuField = (k: keyof typeof su, v: string) => setSu(p => ({ ...p, [k]: v }))

  // Verify
  const [verifyEmail, setVerifyEmail] = useState(pending)
  const [code, setCode] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const codeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isAuthenticated) {
      writePendingEmail(null)
      navigate('/mobile', { replace: true })
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  useEffect(() => {
    if (mode === 'verify') codeRef.current?.focus()
  }, [mode])

  const goVerify = (email: string, startCooldown = true) => {
    setVerifyEmail(email)
    writePendingEmail(email)
    setCode('')
    if (startCooldown) setCooldown(RESEND_COOLDOWN_S)
    setMode('verify')
  }

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
          goVerify(email)
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

  const checks = passwordChecks(su.password)
  const signupValid =
    su.firstName.trim().length >= 1 &&
    su.lastName.trim().length >= 1 &&
    /^\S+@\S+\.\S+$/.test(su.email.trim()) &&
    checks.every(c => c.pass) &&
    su.password === su.confirm

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signupValid) return
    const email = su.email.toLowerCase().trim()
    const firstName = su.firstName.trim()
    const lastName = su.lastName.trim()
    setBusy(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: su.password,
        options: {
          data: { first_name: firstName, last_name: lastName, full_name: `${firstName} ${lastName}` },
          emailRedirectTo: `${window.location.origin}/mobile`,
        },
      })
      if (error) throw error

      // Supabase returns a user with no identities when the email is already registered
      if (data.user && (data.user.identities?.length ?? 0) === 0) {
        toast.error('An account with this email already exists. Please sign in.')
        setSiEmail(email)
        setMode('signin')
        return
      }

      // Email confirmation disabled on the project → already signed in
      if (data.session) return

      toast.success(`We sent a verification code to ${email}`)
      setSu({ firstName: '', lastName: '', email: '', password: '', confirm: '' })
      goVerify(email)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not create your account')
    } finally {
      setBusy(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = code.trim()
    if (token.length < 6 || !verifyEmail) return
    setBusy(true)
    try {
      const { data, error } = await supabase.auth.verifyOtp({ email: verifyEmail, token, type: 'signup' })
      if (error) throw error

      // Fallback in case the DB trigger didn't copy the name onto the profile
      const user = data.user
      const fullName = (user?.user_metadata?.full_name as string | undefined)?.trim()
      if (user && fullName) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('profiles') as any)
          .update({ full_name: fullName })
          .eq('supabase_uid', user.id)
          .is('full_name', null)
      }

      writePendingEmail(null)
      toast.success('Email verified — welcome to EcoLedger!')
      // SIGNED_IN fires → AuthContext loads profile → redirect effect runs
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed'
      toast.error(/expired|invalid/i.test(msg) ? 'That code is invalid or has expired. Request a new one.' : msg)
    } finally {
      setBusy(false)
    }
  }

  const handleResend = async () => {
    if (cooldown > 0 || !verifyEmail) return
    setBusy(true)
    const { error } = await supabase.auth.resend({ type: 'signup', email: verifyEmail })
    setBusy(false)
    if (error) { toast.error(error.message); return }
    toast.success('A new code is on its way')
    setCooldown(RESEND_COOLDOWN_S)
  }

  const leaveVerify = () => {
    writePendingEmail(null)
    setCode('')
    setMode('signup')
  }

  // ── UI ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col px-6 pt-14 pb-10" style={{ background: '#f0ede6' }}>
      <div className="mb-10">
        <img src={logoCompactLight} alt="EcoLedger" className="h-9 w-auto object-contain" />
      </div>

      {mode === 'verify' ? (
        <div className="flex-1 flex flex-col">
          <button
            type="button"
            onClick={leaveVerify}
            className="flex items-center gap-1.5 text-sm text-[#6b6b68] mb-6 self-start"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="w-12 h-12 rounded-2xl bg-white border border-[#e8e5de] flex items-center justify-center mb-5">
            <Mail className="w-5 h-5 text-[#2d6a3f]" />
          </div>
          <h1 className="text-3xl font-bold text-[#0f0f0e] mb-2">Check your email</h1>
          <p className="text-sm text-[#9b9b98] leading-relaxed mb-8">
            Enter the verification code we sent to <strong className="text-[#0f0f0e] break-all">{verifyEmail}</strong> to finish creating your account.
          </p>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label htmlFor="otp" className={labelCls}>Verification code</label>
              <input
                id="otp"
                ref={codeRef}
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="••••••"
                className={`${inputCls} text-center text-2xl font-semibold tracking-[0.5em] tabular-nums`}
              />
            </div>

            <button
              type="submit"
              disabled={busy || code.length < 6}
              className="w-full py-4 rounded-2xl text-white text-base font-bold transition-opacity active:opacity-80 disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ background: '#0f0f0e' }}
            >
              {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</> : 'Verify & create account'}
            </button>
          </form>

          <p className="text-sm text-center text-[#9b9b98] mt-6">
            Didn't get it? Check spam, or{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || busy}
              className="font-semibold text-[#2d6a3f] disabled:text-[#b0afa8]"
            >
              {cooldown > 0 ? `resend in ${cooldown}s` : 'resend code'}
            </button>
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <h1 className="text-3xl font-bold text-[#0f0f0e] mb-2">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-sm text-[#9b9b98] leading-relaxed mb-6">
            {mode === 'signin'
              ? 'Sign in with your email and password.'
              : 'Register your devices, track their lifecycle, and earn EcoCredits.'}
          </p>

          {/* Tabs */}
          <div className="grid grid-cols-2 gap-1 bg-[#e6e2d9] rounded-2xl p-1 mb-6" role="tablist">
            {(['signin', 'signup'] as const).map(m => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={`py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  mode === m ? 'bg-white text-[#0f0f0e] shadow-sm' : 'text-[#6b6b68]'
                }`}
              >
                {m === 'signin' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          {mode === 'signin' ? (
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
                  <label htmlFor="si-password" className="text-xs font-semibold text-[#0f0f0e]">Password</label>
                  <button type="button" onClick={handleForgotPassword} className="text-xs text-[#6b6b68]">
                    Forgot password?
                  </button>
                </div>
                <PasswordInput id="si-password" value={siPassword} onChange={setSiPassword} autoComplete="current-password" />
              </div>

              <button
                type="submit"
                disabled={busy || !siEmail || !siPassword}
                className="w-full py-4 rounded-2xl text-white text-base font-bold transition-opacity active:opacity-80 disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: '#0f0f0e' }}
              >
                {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : 'Sign in'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="su-first" className={labelCls}>First name</label>
                  <input
                    id="su-first"
                    autoComplete="given-name"
                    value={su.firstName}
                    onChange={e => setSuField('firstName', e.target.value)}
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
                    onChange={e => setSuField('lastName', e.target.value)}
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
                  onChange={e => setSuField('email', e.target.value)}
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
                  onChange={v => setSuField('password', v)}
                  autoComplete="new-password"
                />
                {su.password && (
                  <div className="space-y-1 mt-2">
                    {checks.map(c => (
                      <div key={c.label} className="flex items-center gap-2">
                        <CheckCircle className={`w-3.5 h-3.5 flex-shrink-0 ${c.pass ? 'text-[#2d6a3f]' : 'text-[#c9c6bd]'}`} />
                        <span className={`text-xs ${c.pass ? 'text-[#2d6a3f]' : 'text-[#9b9b98]'}`}>{c.label}</span>
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
                  onChange={v => setSuField('confirm', v)}
                  autoComplete="new-password"
                  invalid={!!su.confirm && su.confirm !== su.password}
                />
                {su.confirm && su.confirm !== su.password && (
                  <p className="text-xs text-red-500 mt-1.5">Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={busy || !signupValid}
                className="w-full py-4 rounded-2xl text-white text-base font-bold transition-opacity active:opacity-80 disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: '#0f0f0e' }}
              >
                {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</> : 'Create account'}
              </button>
              <p className="text-xs text-center text-[#9b9b98]">
                We'll email you a code to confirm your address.
              </p>
            </form>
          )}

          {/* Wallet option */}
          <div className="mt-auto pt-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-[#e0dcd2]" />
              <span className="text-xs text-[#b0afa8]">or</span>
              <div className="flex-1 h-px bg-[#e0dcd2]" />
            </div>

            {connecting && (
              <div className="bg-white rounded-2xl px-4 py-3 mb-3 flex items-start gap-3 border border-[#e8e5de]">
                <span className="text-lg">👆</span>
                <p className="text-sm text-[#0f0f0e] leading-relaxed">
                  After approving in MetaMask, tap the <strong>browser icon</strong> or swipe back to return here.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleWallet}
              disabled={connecting}
              className="w-full py-3.5 rounded-2xl text-[#0f0f0e] text-sm font-semibold bg-white border border-[#e8e5de] transition-opacity active:opacity-80 disabled:opacity-60"
            >
              {connecting ? 'Opening…' : 'Continue with wallet'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
