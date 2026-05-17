import { useNavigate } from 'react-router-dom'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'

const capabilities = [
  {
    icon: '🗺️',
    title: 'National compliance map',
    body: 'Real-time county-level view of device density, recycler locations, open compliance flags, and disposal rates. Colour-coded by severity so your team knows exactly where to focus enforcement.',
  },
  {
    icon: '🚩',
    title: 'Compliance flag management',
    body: 'Raise, investigate, escalate, and resolve compliance flags. Each case has a full evidence locker, device custody trail, stakeholder list, and a printable warrant brief.',
  },
  {
    icon: '🔍',
    title: 'Device investigation',
    body: 'Search any registered device by IMEI or ID. Pull the complete custody chain — every owner, transfer, and disposal event — with on-chain transaction hashes for legal proceedings.',
  },
  {
    icon: '📊',
    title: 'County analytics',
    body: 'Drill into any of Liberia\'s 15 counties for recycler counts, device registration totals, Basel Convention compliance rates, and flag history.',
  },
  {
    icon: '📄',
    title: 'Export & reporting',
    body: 'Generate EPR compliance reports, recycler performance audits, and Basel Convention annexure documentation — all sourced from the immutable ledger.',
  },
  {
    icon: '🔔',
    title: 'Instant alert system',
    body: 'Receive email and in-app notifications when critical flags are raised, when a case is escalated to AG, or when a recycler\'s licence status is flagged for renewal.',
  },
]

const eligible = [
  'EPA Liberia officers (national and county level)',
  'Ministry of Mines, Energy & Natural Resources officials',
  'Ministry of Justice — environmental enforcement division',
  'Designated county environmental protection officers',
  'Customs & Border Protection — e-waste export monitoring unit',
]

const accessLevels = [
  {
    role: 'National Regulator',
    access: 'Full read + write. Can raise flags, resolve cases, view all counties, generate all reports, and access the full device registry.',
    badge: 'EPA Liberia HQ',
  },
  {
    role: 'County Officer',
    access: 'Read + write limited to assigned county or counties. Can raise flags and view devices within their jurisdiction.',
    badge: 'County level',
  },
  {
    role: 'Read-only Observer',
    access: 'Full read access without write permissions. Suitable for ministerial oversight, international observers, and Basel Convention monitors.',
    badge: 'Observer',
  },
]

export function RegulatorPortalPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-white">
      <LandingNav alwaysOpaque />

      <div className="bg-[#fafaf8] border-b border-[#e8e5de] pt-24 pb-14 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-semibold tracking-widest text-[#9b9b98] uppercase mb-2">Stakeholders</p>
          <h1 className="text-4xl font-bold text-[#0f0f0e] mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>
            Regulator Portal
          </h1>
          <p className="text-base text-[#6b6b68] leading-relaxed max-w-2xl">
            Purpose-built enforcement and compliance tooling for EPA Liberia and authorised government bodies. Real-time national visibility. Court-ready evidence. One platform.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-14 space-y-16">

        {/* Capabilities */}
        <div>
          <p className="text-[10px] font-bold tracking-widest text-[#9b9b98] uppercase mb-4">Portal capabilities</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {capabilities.map(c => (
              <div key={c.title} className="bg-[#fafaf8] rounded-2xl p-5 border border-[#e8e5de]">
                <p className="text-2xl mb-3">{c.icon}</p>
                <p className="font-bold text-[#0f0f0e] mb-2">{c.title}</p>
                <p className="text-sm text-[#9b9b98] leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Access levels */}
        <div>
          <p className="text-[10px] font-bold tracking-widest text-[#9b9b98] uppercase mb-4">Access tiers</p>
          <div className="space-y-3">
            {accessLevels.map(a => (
              <div key={a.role} className="bg-white rounded-2xl p-5 border border-[#e8e5de] flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <p className="font-bold text-[#0f0f0e]">{a.role}</p>
                    <span className="text-[10px] font-bold tracking-widest text-[#6b6b68] border border-[#e8e5de] rounded-full px-2.5 py-0.5">{a.badge}</span>
                  </div>
                  <p className="text-sm text-[#9b9b98] leading-relaxed">{a.access}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Who is eligible */}
        <div>
          <p className="text-[10px] font-bold tracking-widest text-[#9b9b98] uppercase mb-4">Eligible institutions</p>
          <div className="bg-[#fafaf8] rounded-2xl p-6 border border-[#e8e5de]">
            <div className="space-y-3">
              {eligible.map(e => (
                <div key={e} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#0f0f0e] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3" stroke="white" strokeWidth={2.5}>
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                  <p className="text-sm text-[#6b6b68]">{e}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-[#9b9b98] mt-3">Access requires a government-issued email address and a letter of authorisation from your department head. All applications are reviewed by EcoLedger Foundation and EPA Liberia jointly.</p>
        </div>

        {/* Integration note */}
        <div className="border border-[#e8e5de] rounded-2xl p-6">
          <p className="font-bold text-[#0f0f0e] mb-2">EPA Liberia institutional integration</p>
          <p className="text-sm text-[#9b9b98] leading-relaxed">
            EcoLedger is designed to work alongside EPA Liberia's existing enforcement processes — not replace them. The portal generates reports in the formats required for internal EPA Liberia filing, Basel Convention annexures, and court submissions. We can arrange a live demonstration for your department's senior officers.
          </p>
          <a
            href="mailto:support@liberiaecoledger.com"
            className="inline-block mt-4 text-sm font-semibold text-[#2d6a3f] hover:underline"
          >
            Contact our regulatory partnerships team →
          </a>
        </div>

      </div>

      {/* CTA */}
      <div className="bg-[#0f0f0e] py-16 px-6">
        <div className="max-w-4xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Enforce e-waste law with real data.</h2>
            <p className="text-[#9b9b98] text-sm max-w-md">Request access for your institution or schedule a demonstration for your regulatory team.</p>
          </div>
          <div className="flex gap-3 flex-shrink-0 flex-wrap">
            <a
              href="mailto:support@liberiaecoledger.com"
              className="px-6 py-3 border border-white/20 text-white text-sm font-semibold rounded-xl hover:border-white/40 transition-colors"
            >
              Request a demo
            </a>
            <button
              type="button"
              onClick={() => navigate('/stakeholders/request-access')}
              className="px-6 py-3 bg-white text-[#0f0f0e] text-sm font-bold rounded-xl hover:bg-[#f5f5f2] transition-colors"
            >
              Apply for access →
            </button>
          </div>
        </div>
      </div>

      <LandingFooter />
    </div>
  )
}
