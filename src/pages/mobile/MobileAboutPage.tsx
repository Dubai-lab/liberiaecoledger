import { useNavigate } from 'react-router-dom'
import logoCompactLight from '@/brands/logo-compact-light.png'

const FACTS = [
  { label: 'Version',  value: '1.0.0' },
  { label: 'Network',  value: 'Sepolia (Testnet)' },
  { label: 'Token Standard', value: 'ERC-721 · ERC-20' },
  { label: 'Country',  value: 'Liberia, West Africa' },
]

export function MobileAboutPage() {
  const navigate = useNavigate()

  return (
    <div className="px-5 pt-6 pb-8" style={{ background: '#f0ede6', minHeight: '100vh' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-[#0f0f0e] flex items-center justify-center flex-shrink-0"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="white" strokeWidth={2}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <p className="text-base font-semibold text-[#0f0f0e]">About EcoLedger</p>
      </div>

      {/* Logo + tagline */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-20 h-20 rounded-3xl bg-[#0f0f0e] flex items-center justify-center mb-4">
          <img src={logoCompactLight} alt="EcoLedger" className="h-12 w-auto object-contain" />
        </div>
        <h1 className="text-xl font-bold text-[#0f0f0e] mb-1">EcoLedger</h1>
        <p className="text-sm text-[#9b9b98] max-w-xs">
          Blockchain-powered e-waste tracking for Liberia. Register, transfer, and responsibly dispose of electronic devices — every action on-chain.
        </p>
      </div>

      {/* App info */}
      <div className="bg-white rounded-2xl p-4 mb-4">
        <p className="text-[10px] tracking-widest text-[#9b9b98] uppercase mb-4">App Info</p>
        <div className="space-y-3">
          {FACTS.map(f => (
            <div key={f.label} className="flex items-center justify-between">
              <p className="text-sm text-[#9b9b98]">{f.label}</p>
              <p className="text-sm font-semibold text-[#0f0f0e]">{f.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mission */}
      <div className="bg-white rounded-2xl p-4">
        <p className="text-[10px] tracking-widests text-[#9b9b98] uppercase mb-3">Mission</p>
        <p className="text-sm text-[#9b9b98] leading-relaxed">
          EcoLedger creates a transparent lifecycle record for every electronic device in Liberia — from first sale to final recycling. Owners earn EcoCredits for responsible disposal, redeemable for mobile money.
        </p>
      </div>
    </div>
  )
}
