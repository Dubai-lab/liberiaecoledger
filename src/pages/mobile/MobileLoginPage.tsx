import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePrivy } from '@privy-io/react-auth'
import { useAuth } from '@/hooks/useAuth'
import logoCompactLight from '@/brands/logo-compact-light.png'

export function MobileLoginPage() {
  const { login } = usePrivy()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) navigate('/mobile', { replace: true })
  }, [isAuthenticated, navigate])

  return (
    <div className="min-h-screen flex flex-col px-6 pt-16 pb-10" style={{ background: '#f0ede6' }}>
      {/* Logo */}
      <div className="mb-12">
        <img src={logoCompactLight} alt="EcoLedger" className="h-9 w-auto object-contain" />
      </div>

      {/* Hero */}
      <div className="flex-1">
        <h1 className="text-3xl font-bold text-[#0f0f0e] mb-3">Welcome back</h1>
        <p className="text-sm text-[#9b9b98] leading-relaxed mb-2">
          Connect the same wallet you used to register on the EcoLedger web platform.
        </p>
        <p className="text-xs text-[#b0afa8] leading-relaxed">
          Don't have an account yet? Register first at liberiaecoledger.com
        </p>
      </div>

      {/* Connect button */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={login}
          className="w-full py-4 rounded-2xl text-white text-base font-bold transition-opacity active:opacity-80"
          style={{ background: '#0f0f0e' }}
        >
          Connect Wallet
        </button>
        <p className="text-xs text-center text-[#b0afa8]">
          Uses the same wallet connected on the web app
        </p>
      </div>
    </div>
  )
}
