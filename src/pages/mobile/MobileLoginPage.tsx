import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import logoCompactLight from '@/brands/logo-compact-light.png'
import { useLoginWithEmail, useLoginWithSms } from '@privy-io/react-auth'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

type Mode = 'email' | 'phone'
type Step = 'input' | 'otp'

export function MobileLoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const [mode, setMode] = useState<Mode>('email')
  const [step, setStep] = useState<Step>('input')
  const [value, setValue] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  const { sendCode: sendEmail, loginWithCode: verifyEmail } = useLoginWithEmail({
    onComplete: () => navigate('/mobile'),
    onError: (e) => { toast.error(String(e) || 'Verification failed'); setVerifying(false) },
  })

  const { sendCode: sendSms, loginWithCode: verifySms } = useLoginWithSms({
    onComplete: () => navigate('/mobile'),
    onError: (e) => { toast.error(String(e) || 'Verification failed'); setVerifying(false) },
  })

  useEffect(() => {
    if (isAuthenticated) navigate('/mobile')
  }, [isAuthenticated, navigate])

  const handleSend = async () => {
    if (!value.trim()) return
    setSending(true)
    try {
      if (mode === 'email') {
        await sendEmail({ email: value.trim() })
      } else {
        const phone = value.trim().startsWith('+') ? value.trim() : `+${value.trim()}`
        await sendSms({ phoneNumber: phone })
      }
      setStep('otp')
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to send code')
    } finally {
      setSending(false)
    }
  }

  const handleOtpChange = (index: number, val: string) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]
    next[index] = val
    setOtp(next)
    if (val && index < 5) otpRefs.current[index + 1]?.focus()
    if (next.every(d => d !== '') && next.join('').length === 6) {
      handleVerify(next.join(''))
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleVerify = async (code?: string) => {
    const pin = code ?? otp.join('')
    if (pin.length !== 6) return
    setVerifying(true)
    try {
      if (mode === 'email') {
        await verifyEmail({ code: pin })
      } else {
        await verifySms({ code: pin })
      }
    } catch {
      // handled by onError
    }
  }

  return (
    <div className="min-h-screen flex flex-col px-6 pt-16 pb-10" style={{ background: '#f0ede6' }}>
      {/* Logo */}
      <div className="mb-12">
        <img src={logoCompactLight} alt="EcoLedger" className="h-9 w-auto object-contain" />
      </div>

      {step === 'input' ? (
        <>
          <h1 className="text-3xl font-bold text-[#0f0f0e] mb-2">Welcome</h1>
          <p className="text-sm text-[#9b9b98] mb-8">
            Sign in with your email or phone number. We'll send you a one-time code.
          </p>

          {/* Mode toggle */}
          <div className="flex bg-white rounded-2xl p-1 mb-5">
            {(['email', 'phone'] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setValue('') }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: mode === m ? '#0f0f0e' : 'transparent',
                  color: mode === m ? '#fff' : '#9b9b98',
                }}
              >
                {m === 'email' ? 'Email' : 'Phone'}
              </button>
            ))}
          </div>

          {/* Input */}
          <input
            type={mode === 'email' ? 'email' : 'tel'}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={mode === 'email' ? 'you@example.com' : '+231 77 000 0000'}
            autoFocus
            className="w-full bg-white border border-[#e8e5de] rounded-2xl px-5 py-4 text-base focus:outline-none focus:border-[#0f0f0e] transition-colors mb-4"
          />

          <button
            onClick={handleSend}
            disabled={sending || !value.trim()}
            className="w-full py-4 rounded-2xl text-white text-base font-bold disabled:opacity-40 transition-opacity"
            style={{ background: '#0f0f0e' }}
          >
            {sending ? 'Sending…' : 'Send Code'}
          </button>

          <p className="text-xs text-center text-[#9b9b98] mt-6 leading-relaxed">
            A secure digital wallet is created automatically on your first sign-in. No crypto knowledge needed.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold text-[#0f0f0e] mb-2">Check your {mode}</h1>
          <p className="text-sm text-[#9b9b98] mb-8">
            Enter the 6-digit code sent to <span className="font-semibold text-[#0f0f0e]">{value}</span>
          </p>

          {/* OTP boxes */}
          <div className="flex gap-3 mb-6 justify-between">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => { otpRefs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleOtpChange(i, e.target.value)}
                onKeyDown={e => handleOtpKeyDown(i, e)}
                className="flex-1 aspect-square text-center text-2xl font-bold bg-white border-2 rounded-2xl focus:outline-none transition-colors"
                style={{ borderColor: digit ? '#0f0f0e' : '#e8e5de' }}
              />
            ))}
          </div>

          <button
            onClick={() => handleVerify()}
            disabled={verifying || otp.some(d => !d)}
            className="w-full py-4 rounded-2xl text-white text-base font-bold disabled:opacity-40 transition-opacity mb-4"
            style={{ background: '#0f0f0e' }}
          >
            {verifying ? 'Verifying…' : 'Confirm'}
          </button>

          <button
            onClick={() => { setStep('input'); setOtp(['', '', '', '', '', '']) }}
            className="w-full py-3 text-sm text-[#9b9b98] font-medium"
          >
            ← Use a different {mode}
          </button>

          <button
            onClick={handleSend}
            disabled={sending}
            className="w-full py-3 text-sm font-semibold text-[#0f0f0e]"
          >
            {sending ? 'Resending…' : 'Resend code'}
          </button>
        </>
      )}
    </div>
  )
}
