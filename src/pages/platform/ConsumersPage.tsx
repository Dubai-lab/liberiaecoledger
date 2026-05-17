import { useNavigate } from 'react-router-dom'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'

const features = [
  {
    icon: '📱',
    title: 'Register any device',
    body: 'Register smartphones, laptops, TVs, and appliances in under 60 seconds. Your device gets an on-chain identity — a permanent, tamper-proof record tied to your wallet address.',
  },
  {
    icon: '🔄',
    title: 'Transfer ownership',
    body: 'Selling or giving away a device? Initiate a transfer on the platform. Both parties sign, the chain of custody updates on-chain, and the new owner inherits the full history.',
  },
  {
    icon: '♻️',
    title: 'Recycle responsibly',
    body: 'Mark a device ready for disposal from your dashboard. Our certified recycler network will collect or accept it. Once processed, the disposal is confirmed on-chain.',
  },
  {
    icon: '💰',
    title: 'Earn EcoCredits',
    body: 'Every device registered earns +91 EC. Every transfer earns +5 EC. Every verified disposal earns between +200 and +500 EC — automatically, the moment the recycler confirms it.',
  },
  {
    icon: '🎁',
    title: 'Redeem real rewards',
    body: 'Spend EcoCredits on mobile airtime, supermarket vouchers, solar lanterns, or cash via Orange Money and MTN MoMo. Reward delivery is handled by our partner network.',
  },
  {
    icon: '🔔',
    title: 'Stay informed',
    body: 'Receive notifications for every lifecycle event on your devices — registrations, transfers, disposals, and credit earnings. In-app and by email.',
  },
]

const steps = [
  { n: '01', title: 'Create your account', body: 'Request access at liberiaecoledger.com or ask your recycler to onboard you. Connect with email or a crypto wallet.' },
  { n: '02', title: 'Register your devices', body: 'Enter brand, model, and IMEI. Each device is minted as an on-chain record. You receive +91 EcoCredits immediately.' },
  { n: '03', title: 'Use, transfer, repeat', body: 'Your device timeline updates automatically with every lifecycle event. Transfer to a new owner in seconds.' },
  { n: '04', title: 'Recycle and get paid', body: 'When your device reaches end-of-life, hand it to a certified recycler. They confirm disposal on-chain, and your EcoCredits arrive instantly.' },
]

export function ConsumersPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-white">
      <LandingNav alwaysOpaque />

      {/* Hero */}
      <div className="bg-[#fafaf8] border-b border-[#e8e5de] pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-semibold tracking-widest text-[#9b9b98] uppercase mb-3">Platform · Consumers</p>
          <h1 className="text-5xl font-bold text-[#0f0f0e] leading-tight mb-5" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>
            Track every device you own.<br />
            <span className="text-[#2d6a3f]">Earn rewards</span> for doing the right thing.
          </h1>
          <p className="text-lg text-[#6b6b68] leading-relaxed max-w-2xl mb-8">
            EcoLedger turns responsible e-waste disposal into a direct economic benefit. Register your electronics, track their full lifecycle, and get paid in EcoCredits when they're properly recycled.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-[#0f0f0e] text-white text-sm font-semibold rounded-xl hover:bg-[#2a2a28] transition-colors"
            >
              Get started free
            </button>
            <a href="#how-it-works" className="px-6 py-3 border border-[#e8e5de] text-[#0f0f0e] text-sm font-semibold rounded-xl hover:bg-[#f5f5f2] transition-colors">
              See how it works
            </a>
          </div>
        </div>
      </div>

      {/* EcoCredits callout */}
      <div className="bg-[#0f0f0e] py-12 px-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <p className="text-white font-bold text-lg">The consumer never pays. Every credit is funded by manufacturer EPR fees.</p>
          <div className="flex gap-6 flex-shrink-0">
            {['+91 EC per register', '+5 EC per transfer', '+200–500 EC per disposal'].map(s => (
              <div key={s} className="text-center">
                <p className="text-[10px] font-bold tracking-widest text-[#6dba7f]">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-semibold tracking-widest text-[#9b9b98] uppercase mb-3">What you can do</p>
          <h2 className="text-3xl font-bold text-[#0f0f0e] mb-12 max-w-xl">Everything you need to manage your devices responsibly.</h2>
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

      {/* How it works */}
      <div id="how-it-works" className="py-20 px-6 bg-[#fafaf8] border-t border-[#e8e5de] scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-semibold tracking-widest text-[#9b9b98] uppercase mb-3">How it works</p>
          <h2 className="text-3xl font-bold text-[#0f0f0e] mb-12">Four steps from registration to reward.</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map(s => (
              <div key={s.n} className="bg-white rounded-2xl p-5 border border-[#e8e5de]">
                <p className="text-[10px] font-bold tracking-widest text-[#9b9b98] mb-3">{s.n}</p>
                <p className="font-bold text-[#0f0f0e] mb-2 leading-snug">{s.title}</p>
                <p className="text-xs text-[#9b9b98] leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-20 px-6 bg-[#0f0f0e]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to start earning?</h2>
          <p className="text-[#9b9b98] mb-8">Request access and register your first device in minutes.</p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="px-8 py-4 bg-white text-[#0f0f0e] text-sm font-bold rounded-xl hover:bg-[#f5f5f2] transition-colors"
          >
            Create your account
          </button>
        </div>
      </div>

      <LandingFooter />
    </div>
  )
}
