import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePrivy } from '@privy-io/react-auth'
import { useAuth } from '@/hooks/useAuth'
import logoCompactLight from '@/brands/logo-compact-light.png'

export function MobileLoginPage() {
  const { login } = usePrivy()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    if (isAuthenticated) navigate('/mobile', { replace: true })
  }, [isAuthenticated, navigate])

  const handleLogin = async () => {
    setConnecting(true)
    try {
      await login()
    } finally {
      // Reset after a delay — if wallet connect opens MetaMask,
      // the user needs to manually return to the browser
      setTimeout(() => setConnecting(false), 5000)
    }
  }

  return (
    <div className="min-h-screen flex flex-col px-6 pt-16 pb-10" style={{ background: '#f0ede6' }}>
      {/* Logo */}
      <div className="mb-12">
        <img src={logoCompactLight} alt="EcoLedger" className="h-9 w-auto object-contain" />
      </div>

      {/* Hero */}
      <div className="flex-1">
        <h1 className="text-3xl font-bold text-[#0f0f0e] mb-3">Welcome back</h1>
        <p className="text-sm text-[#9b9b98] leading-relaxed mb-6">
          Sign in with your email or connect the wallet you registered with.
        </p>

        {/* Return hint — shows after connecting */}
        {connecting && (
          <div className="bg-white rounded-2xl px-4 py-3 mb-6 flex items-start gap-3 border border-[#e8e5de]">
            <span className="text-lg">👆</span>
            <p className="text-sm text-[#0f0f0e] leading-relaxed">
              After approving in MetaMask, tap the <strong>browser icon</strong> or swipe back to return here.
            </p>
          </div>
        )}
      </div>

      {/* Connect button */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleLogin}
          disabled={connecting}
          className="w-full py-4 rounded-2xl text-white text-base font-bold transition-opacity active:opacity-80 disabled:opacity-60"
          style={{ background: '#0f0f0e' }}
        >
          {connecting ? 'Opening…' : 'Log in / Sign up'}
        </button>
        <p className="text-xs text-center text-[#b0afa8]">
          Email or wallet — your choice
        </p>
      </div>
    </div>
  )
}
