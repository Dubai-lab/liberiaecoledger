import { useNavigate } from 'react-router-dom'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'

const features = [
  {
    icon: '✅',
    title: 'On-chain EPA verification',
    body: 'Your EPA Liberia licence is linked to your facility profile on the blockchain. Consumers and regulators can verify your credentials instantly — no paperwork, no questions.',
  },
  {
    icon: '📋',
    title: 'Disposal logging',
    body: 'Log each device disposal with weight, hazard class, and materials recovered. The system checks the device exists on the registry and that you are a verified recycler before confirming.',
  },
  {
    icon: '💰',
    title: 'EcoCredit issuance',
    body: 'When you confirm a disposal, EcoCredits are automatically minted to the device\'s last registered owner. No manual action required — the smart contract handles it.',
  },
  {
    icon: '📍',
    title: 'Facility management',
    body: 'Manage your recycling facility profile including location, capacity, accepted hazard classes, and operating hours. Consumers see this when choosing where to bring their devices.',
  },
  {
    icon: '📊',
    title: 'Verified track record',
    body: 'Every disposal you log builds a publicly visible, immutable track record. Show regulators, NGOs, and device owners exactly how many units you\'ve processed and how.',
  },
  {
    icon: '🔔',
    title: 'Device intake alerts',
    body: 'Receive notifications when consumers mark devices ready for disposal in your area. Coordinate collection logistics before devices enter informal channels.',
  },
]

const requirements = [
  { title: 'Valid EPA Liberia recycler licence', desc: 'Your licence number is verified against the EPA registry at onboarding and checked before each disposal confirmation.' },
  { title: 'Facility address in Liberia', desc: 'Your physical processing location must be registered. Location is displayed to consumers searching for nearby recyclers.' },
  { title: 'Accepted hazard classes declared', desc: 'You must declare which device categories and hazard classes your facility is certified to process.' },
  { title: 'Signed EcoLedger operator agreement', desc: 'Recyclers agree to our operator terms, including accurate disposal reporting and prohibition of informal sub-contracting.' },
]

export function RecyclersPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-white">
      <LandingNav alwaysOpaque />

      {/* Hero */}
      <div className="bg-[#fafaf8] border-b border-[#e8e5de] pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-semibold tracking-widest text-[#9b9b98] uppercase mb-3">Platform · Recyclers</p>
          <h1 className="text-5xl font-bold text-[#0f0f0e] leading-tight mb-5" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>
            Your EPA licence on the blockchain.<br />
            <span className="text-[#2d6a3f]">Every disposal verified.</span>
          </h1>
          <p className="text-lg text-[#6b6b68] leading-relaxed max-w-2xl mb-8">
            EcoLedger gives certified recyclers a platform to log verified disposals, build an immutable compliance record, and automatically issue EcoCredits to device owners — all in one workflow.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-[#0f0f0e] text-white text-sm font-semibold rounded-xl hover:bg-[#2a2a28] transition-colors"
            >
              Apply for recycler access
            </button>
            <a href="#requirements" className="px-6 py-3 border border-[#e8e5de] text-[#0f0f0e] text-sm font-semibold rounded-xl hover:bg-[#f5f5f2] transition-colors">
              Eligibility requirements
            </a>
          </div>
        </div>
      </div>

      {/* Mobile app callout */}
      <div className="bg-[#e8f5ec] border-b border-[#c5e0cb] py-5 px-6">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#2d6a3f] flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="white" strokeWidth={2}>
              <rect x="5" y="2" width="14" height="20" rx="2" />
              <circle cx="12" cy="18" r="1" fill="white" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-[#1a4a25]">Mobile app available for field recyclers</p>
            <p className="text-sm text-[#2d6a3f]">Log disposals, scan device QR codes, and issue EcoCredits directly from the collection site — no desktop required.</p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-semibold tracking-widest text-[#9b9b98] uppercase mb-3">What you can do</p>
          <h2 className="text-3xl font-bold text-[#0f0f0e] mb-12 max-w-xl">The tools to run a verified, accountable recycling operation.</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(f => (
              <div key={f.title} className="bg-[#fafaf8] rounded-2xl p-6 border border-[#e8e5de]">
                <p className="text-2xl mb-3">{f.icon}</p>
                <p className="font-bold text-[#0f0f0e] mb-2">{f.title}</p>
                <p className="text-sm text-[#9b9b98] leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Requirements */}
      <div id="requirements" className="py-20 px-6 bg-[#fafaf8] border-t border-[#e8e5de] scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-semibold tracking-widest text-[#9b9b98] uppercase mb-3">Eligibility</p>
          <h2 className="text-3xl font-bold text-[#0f0f0e] mb-4">What we require from recyclers.</h2>
          <p className="text-sm text-[#9b9b98] mb-10 max-w-2xl">EcoLedger only onboards EPA Liberia-licensed recyclers. Informal collectors are not eligible. This is a non-negotiable requirement that protects the integrity of the entire registry.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requirements.map((r, i) => (
              <div key={r.title} className="bg-white rounded-2xl p-5 border border-[#e8e5de] flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#e8f5ec] text-[#2d6a3f] text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div>
                  <p className="font-bold text-[#0f0f0e] mb-1 text-sm">{r.title}</p>
                  <p className="text-xs text-[#9b9b98] leading-relaxed">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-20 px-6 bg-[#0f0f0e]">
        <div className="max-w-4xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Join the verified recycler network.</h2>
            <p className="text-[#9b9b98] max-w-md">Your EPA licence gives you the right to operate. EcoLedger gives you the infrastructure to prove it.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="flex-shrink-0 px-8 py-4 bg-white text-[#0f0f0e] text-sm font-bold rounded-xl hover:bg-[#f5f5f2] transition-colors"
          >
            Apply for recycler access
          </button>
        </div>
      </div>

      <LandingFooter />
    </div>
  )
}
