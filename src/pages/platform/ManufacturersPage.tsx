import { useNavigate } from 'react-router-dom'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'

const features = [
  {
    icon: '📦',
    title: 'Bulk device registration',
    body: 'Register hundreds of units at manufacture or import using CSV upload or our API. Each unit gets an on-chain genesis record — brand, model, IMEI, hazard class — in seconds.',
  },
  {
    icon: '📊',
    title: 'EPR compliance dashboard',
    body: 'Real-time visibility into how many units you\'ve registered, how many have reached end-of-life, and what percentage have been formally recycled. Regulatory-grade reporting included.',
  },
  {
    icon: '📍',
    title: 'End-of-life tracking',
    body: 'Know where your products go after sale. Track disposal rates by device category, county, and time period. Identify disposal black spots and act before regulators flag you.',
  },
  {
    icon: '📄',
    title: 'Regulatory reports',
    body: 'Generate EPA Liberia-ready compliance reports with one click. All data is sourced from the immutable ledger — fully auditable and tamper-proof.',
  },
  {
    icon: '🔔',
    title: 'Lifecycle alerts',
    body: 'Receive email notifications when your devices are recycled by certified facilities, or when a compliance flag is raised against a device associated with your brand.',
  },
  {
    icon: '🤝',
    title: 'EPR fee management',
    body: 'Your EPR fee contribution funds the EcoCredits reward pool for consumers — a transparent, auditable flow from manufacturer obligation to consumer incentive.',
  },
]

const obligations = [
  { label: 'Registration duty', desc: 'All units sold into Liberia must be registered on the ledger within 30 days of sale.' },
  { label: 'Hazard classification', desc: 'Each device must carry an accurate hazard class (A–D) at registration. Misclassification is a compliance violation.' },
  { label: 'EPR contribution', desc: 'A per-unit EPR fee funds the EcoCredits reward pool. The fee schedule is set by EPA Liberia in coordination with EcoLedger.' },
  { label: 'Annual EPR report', desc: 'Submit a verified annual report showing total units registered, recycled, and outstanding. EcoLedger generates this from chain data.' },
]

export function ManufacturersPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-white">
      <LandingNav alwaysOpaque />

      {/* Hero */}
      <div className="bg-[#0f0f0e] pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-semibold tracking-widest text-[#6b6b68] uppercase mb-3">Platform · Manufacturers</p>
          <h1 className="text-5xl font-bold text-white leading-tight mb-5" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>
            Fulfil your EPR obligations.<br />
            <span className="text-[#6dba7f]">Prove it with data.</span>
          </h1>
          <p className="text-lg text-[#9b9b98] leading-relaxed max-w-2xl mb-8">
            EcoLedger gives manufacturers a verified, auditable record of every unit registered, transferred, and disposed. Turn compliance from a burden into a competitive advantage.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-white text-[#0f0f0e] text-sm font-semibold rounded-xl hover:bg-[#f5f5f2] transition-colors"
            >
              Apply for manufacturer access
            </button>
            <a href="#obligations" className="px-6 py-3 border border-white/20 text-white text-sm font-semibold rounded-xl hover:border-white/40 transition-colors">
              EPR obligations
            </a>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-[#fafaf8] border-b border-[#e8e5de] py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-wrap gap-8">
          {[
            { value: '2.4M+', label: 'units imported into Liberia annually' },
            { value: '<3%',   label: 'formally recycled without EcoLedger' },
            { value: '100%',  label: 'EPR audit trail from chain data' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-2xl font-bold text-[#0f0f0e]">{s.value}</p>
              <p className="text-xs text-[#9b9b98] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-semibold tracking-widest text-[#9b9b98] uppercase mb-3">What you can do</p>
          <h2 className="text-3xl font-bold text-[#0f0f0e] mb-12 max-w-xl">Full lifecycle visibility from manufacture to disposal.</h2>
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

      {/* EPR Obligations */}
      <div id="obligations" className="py-20 px-6 bg-[#fafaf8] border-t border-[#e8e5de] scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-semibold tracking-widest text-[#9b9b98] uppercase mb-3">EPR Obligations</p>
          <h2 className="text-3xl font-bold text-[#0f0f0e] mb-4">What Liberian law requires of manufacturers.</h2>
          <p className="text-sm text-[#9b9b98] mb-10 max-w-2xl">Extended Producer Responsibility (EPR) regulations require manufacturers who sell electronics into Liberia to take responsibility for end-of-life management. EcoLedger makes compliance straightforward and verifiable.</p>
          <div className="space-y-4">
            {obligations.map((o, i) => (
              <div key={o.label} className="flex gap-5 bg-white rounded-2xl p-5 border border-[#e8e5de]">
                <div className="w-8 h-8 rounded-full bg-[#0f0f0e] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div>
                  <p className="font-bold text-[#0f0f0e] mb-1">{o.label}</p>
                  <p className="text-sm text-[#9b9b98] leading-relaxed">{o.desc}</p>
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
            <h2 className="text-3xl font-bold text-white mb-2">Ready to register your products?</h2>
            <p className="text-[#9b9b98] max-w-md">Manufacturer access requires verification of business registration and EPA Liberia product import records.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="flex-shrink-0 px-8 py-4 bg-white text-[#0f0f0e] text-sm font-bold rounded-xl hover:bg-[#f5f5f2] transition-colors"
          >
            Apply for access
          </button>
        </div>
      </div>

      <LandingFooter />
    </div>
  )
}
