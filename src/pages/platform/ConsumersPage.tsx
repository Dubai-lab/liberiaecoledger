import { useNavigate } from 'react-router-dom'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { FeatureIcon } from '@/components/landing/FeatureIcon'
import { usePlatformRates } from '@/lib/rates'

const features = [
  {
    icon: '📱',
    title: 'Register any device',
    body: 'Register your smartphone or laptop in under 60 seconds using its IMEI. We verify it against the manufacturer registry, then link its on-chain identity — a permanent, tamper-proof record — to your account.',
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
    body: 'Every device you register and every transfer earns EcoCredits, and every verified disposal earns between +200 and +500 EC — automatically, the moment the recycler confirms it.',
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
  { n: '01', title: 'Create your account', body: 'Sign up at liberiaecoledger.com with your name, email and a password, then confirm with the code we email you. You can also connect a crypto wallet.' },
  { n: '02', title: 'Register your devices', body: "Enter your device's IMEI. Once it's verified against the manufacturer registry, the device is linked to you on-chain and you receive EcoCredits immediately." },
  { n: '03', title: 'Use, transfer, repeat', body: 'Your device timeline updates automatically with every lifecycle event. Transfer to a new owner in seconds.' },
  { n: '04', title: 'Recycle and get paid', body: 'When your device reaches end-of-life, hand it to a certified recycler. They confirm disposal on-chain, and your EcoCredits arrive instantly.' },
]

export function ConsumersPage() {
  const navigate = useNavigate()
  const { values: rates } = usePlatformRates()
  return (
    <div className="min-h-screen bg-white">
      <LandingNav alwaysOpaque />

      {/* Hero */}
      <div className="bg-brand-tint border-b border-brand-line pt-32 pb-16 px-5 md:px-8 lg:px-12">
        <div className="max-w-content mx-auto">
          <p className="text-[11px] font-semibold tracking-widest text-brand-muted uppercase mb-3">Platform · Consumers</p>
          <h1 className="text-5xl font-bold text-brand leading-tight mb-5 font-display font-bold">
            Track every device you own.<br />
            <span className="text-brand">Earn rewards</span> for doing the right thing.
          </h1>
          <p className="text-lg text-brand-muted leading-relaxed max-w-2xl mb-8">
            EcoLedger turns responsible e-waste disposal into a direct economic benefit. Register your electronics, track their full lifecycle, and get paid in EcoCredits when they're properly recycled.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="px-6 py-3 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand-secondary transition-colors"
            >
              Get started free
            </button>
            <a href="#how-it-works" className="px-6 py-3 border border-brand-line text-brand-ink text-sm font-semibold rounded-xl hover:bg-brand-tint transition-colors">
              See how it works
            </a>
          </div>
        </div>
      </div>

      {/* EcoCredits callout */}
      <div className="bg-brand-deep py-12 px-5 md:px-8 lg:px-12">
        <div className="max-w-content mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <p className="text-white font-bold text-lg">The consumer never pays. Every credit is funded by manufacturer EPR fees.</p>
          <div className="flex gap-6 flex-shrink-0">
            {[`+${Math.round(rates.credits_registration)} EC per register`, `+${Math.round(rates.credits_transfer)} EC per transfer`, '+200–500 EC per disposal'].map(s => (
              <div key={s} className="text-center">
                <p className="text-[10px] font-bold tracking-widest text-[#8FD3A8]">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-20 px-5 md:px-8 lg:px-12">
        <div className="max-w-content mx-auto">
          <p className="text-[11px] font-semibold tracking-widest text-brand-muted uppercase mb-3">What you can do</p>
          <h2 className="text-3xl font-bold text-brand-ink mb-12 max-w-xl">Everything you need to manage your devices responsibly.</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(f => (
              <div key={f.title} className="bg-brand-tint rounded-2xl p-6 border border-brand-line">
                <FeatureIcon emoji={f.icon} />
                <p className="font-bold text-brand-ink mb-2">{f.title}</p>
                <p className="text-sm text-brand-muted leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div id="how-it-works" className="py-20 px-5 md:px-8 lg:px-12 bg-brand-tint border-t border-brand-line scroll-mt-20">
        <div className="max-w-content mx-auto">
          <p className="text-[11px] font-semibold tracking-widest text-brand-muted uppercase mb-3">How it works</p>
          <h2 className="text-3xl font-bold text-brand-ink mb-12">Four steps from registration to reward.</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map(s => (
              <div key={s.n} className="bg-white rounded-2xl p-5 border border-brand-line">
                <p className="text-[10px] font-bold tracking-widest text-brand-muted mb-3">{s.n}</p>
                <p className="font-bold text-brand-ink mb-2 leading-snug">{s.title}</p>
                <p className="text-xs text-brand-muted leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-20 px-5 md:px-8 lg:px-12 bg-brand">
        <div className="max-w-content mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to start earning?</h2>
          <p className="text-white/70 mb-8">Create your account and register your first device in minutes.</p>
          <button
            type="button"
            onClick={() => navigate('/signup')}
            className="px-8 py-4 bg-white text-brand text-sm font-bold rounded-xl hover:bg-brand-tint transition-colors"
          >
            Create your account
          </button>
        </div>
      </div>

      <LandingFooter />
    </div>
  )
}
