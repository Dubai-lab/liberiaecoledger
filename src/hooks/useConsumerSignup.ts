import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

const PENDING_EMAIL_KEY = 'ecoledger.pendingSignupEmail'
const RESEND_COOLDOWN_S = 60

function readPendingEmail() {
  try { return sessionStorage.getItem(PENDING_EMAIL_KEY) ?? '' } catch { return '' }
}
function writePendingEmail(v: string | null) {
  try { if (v) sessionStorage.setItem(PENDING_EMAIL_KEY, v); else sessionStorage.removeItem(PENDING_EMAIL_KEY) } catch { /* ignore */ }
}

export const passwordChecks = (pw: string) => [
  { label: 'At least 8 characters', pass: pw.length >= 8 },
  { label: 'One uppercase letter',  pass: /[A-Z]/.test(pw) },
  { label: 'One number',            pass: /\d/.test(pw) },
]

const EMPTY = { firstName: '', lastName: '', email: '', password: '', confirm: '' }

interface Options {
  /** Where Supabase's email link (if the template uses one) should land */
  redirectPath: string
  /** Called when the email already has an account */
  onAccountExists?: (email: string) => void
}

/**
 * Consumer email + password sign-up with a one-time email code.
 * Shared by the mobile login screen and the desktop /signup page.
 */
export function useConsumerSignup({ redirectPath, onAccountExists }: Options) {
  const pending = readPendingEmail()
  const [step, setStep] = useState<'form' | 'verify'>(pending ? 'verify' : 'form')
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const [verifyEmail, setVerifyEmail] = useState(pending)
  const [code, setCodeRaw] = useState('')
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const setField = (k: keyof typeof EMPTY, v: string) => setForm(p => ({ ...p, [k]: v }))
  const setCode = (v: string) => setCodeRaw(v.replace(/\D/g, '').slice(0, 10))

  const checks = passwordChecks(form.password)
  const valid =
    form.firstName.trim().length >= 1 &&
    form.lastName.trim().length >= 1 &&
    /^\S+@\S+\.\S+$/.test(form.email.trim()) &&
    checks.every(c => c.pass) &&
    form.password === form.confirm

  /** Move to the code step for an email (also used when an unconfirmed user tries to sign in) */
  const startVerify = (email: string, startCooldown = true) => {
    setVerifyEmail(email)
    writePendingEmail(email)
    setCodeRaw('')
    if (startCooldown) setCooldown(RESEND_COOLDOWN_S)
    setStep('verify')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid || busy) return
    const email = form.email.toLowerCase().trim()
    const firstName = form.firstName.trim()
    const lastName = form.lastName.trim()
    setBusy(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          data: { first_name: firstName, last_name: lastName, full_name: `${firstName} ${lastName}` },
          emailRedirectTo: `${window.location.origin}${redirectPath}`,
        },
      })
      if (error) throw error

      // Supabase returns a user with no identities when the email is already registered
      if (data.user && (data.user.identities?.length ?? 0) === 0) {
        toast.error('An account with this email already exists. Please sign in.')
        onAccountExists?.(email)
        return
      }
      // Email confirmation disabled on the project → already signed in
      if (data.session) return

      toast.success(`We sent a verification code to ${email}`)
      setForm(EMPTY)
      startVerify(email)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not create your account')
    } finally {
      setBusy(false)
    }
  }

  const verify = async (e: React.FormEvent) => {
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
      // SIGNED_IN fires → AuthContext loads the profile → route guards redirect
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed'
      toast.error(/expired|invalid/i.test(msg) ? 'That code is invalid or has expired. Request a new one.' : msg)
    } finally {
      setBusy(false)
    }
  }

  const resend = async () => {
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
    setCodeRaw('')
    setStep('form')
  }

  const clearPending = () => writePendingEmail(null)

  return {
    step, form, setField, checks, valid, busy, submit,
    verifyEmail, code, setCode, cooldown, verify, resend, startVerify, leaveVerify, clearPending,
  }
}
