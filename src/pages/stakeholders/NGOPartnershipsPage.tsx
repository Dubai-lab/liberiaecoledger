import { useNavigate } from 'react-router-dom'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'

const partnershipTypes = [
  {
    type: 'Data partner',
    icon: '📊',
    desc: 'Access the full EcoLedger dataset — device registrations, disposal records, compliance flags, and recycler coverage — for research, reporting, and advocacy. Includes CSV export and read-only API access.',
    forWho: 'Academic researchers, environmental think tanks, donor organisations',
  },
  {
    type: 'Field verification partner',
    icon: '🔍',
    desc: 'Conduct independent field audits of recycler facilities and compare findings against on-chain disposal records. Cross-reference physical site visits with the digital trail.',
    forWho: 'Environmental NGOs with field teams in Liberia',
  },
  {
    type: 'Community outreach partner',
    icon: '🤝',
    desc: 'Help communities understand how to register devices, find certified recyclers, and earn EcoCredits. We provide training materials, promotional resources, and dedicated onboarding support.',
    forWho: 'Community organisations, women\'s groups, youth environmental networks',
  },
  {
    type: 'Advocacy partner',
    icon: '📢',
    desc: 'Use EcoLedger compliance data to support policy advocacy — EPR legislation, Basel Convention enforcement, or informal sector formalisation. We share anonymised data for public reporting.',
    forWho: 'Environmental advocacy organisations, Basel Action Network affiliates',
  },
]

const benefits = [
  'Read-only auditor access to the full platform dataset',
  'Dedicated API key for data exports and integration',
  'Named partner on EcoLedger website and press materials',
  'Co-branded public reporting using EcoLedger chain data',
  'Early access to new compliance datasets and features',
  'Quarterly platform briefings with EcoLedger Foundation',
  'Participation in EcoLedger advisory council',
  'Shared visibility in EPA Liberia regulatory communications',
]

const process = [
  { n: '01', title: 'Expression of interest', body: 'Send a brief description of your organisation and the partnership type you\'re interested in to support@liberiaecoledger.com.' },
  { n: '02', title: 'Scoping conversation', body: 'A 30-minute call with our partnerships team to understand your data needs, field capacity, or community reach.' },
  { n: '03', title: 'Partnership agreement', body: 'We draft a lightweight MOU covering data use, attribution, confidentiality, and mutual obligations. No lengthy procurement required.' },
  { n: '04', title: 'Onboarding', body: 'Your team receives auditor credentials, API keys, and a platform walkthrough. You\'re operational within a week of signing.' },
]

export function NGOPartnershipsPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-white">
      <LandingNav alwaysOpaque />

      <div className="bg-[#fafaf8] border-b border-[#e8e5de] pt-24 pb-14 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-semibold tracking-widest text-[#9b9b98] uppercase mb-2">Stakeholders</p>
          <h1 className="text-4xl font-bold text-[#0f0f0e] mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>
            NGO Partnerships
          </h1>
          <p className="text-base text-[#6b6b68] leading-relaxed max-w-2xl">
            EcoLedger is an infrastructure platform, not an advocacy organisation. We partner with NGOs, researchers, and community groups who can turn our data into impact on the ground.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-14 space-y-16">

        {/* Partnership types */}
        <div>
          <p className="text-[10px] font-bold tracking-widest text-[#9b9b98] uppercase mb-4">Partnership types</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {partnershipTypes.map(p => (
              <div key={p.type} className="bg-[#fafaf8] rounded-2xl p-6 border border-[#e8e5de]">
                <p className="text-2xl mb-3">{p.icon}</p>
                <p className="font-bold text-[#0f0f0e] mb-2">{p.type}</p>
                <p className="text-sm text-[#6b6b68] leading-relaxed mb-3">{p.desc}</p>
                <p className="text-[10px] font-semibold tracking-widest text-[#9b9b98] uppercase">{p.forWho}</p>
              </div>
            ))}
          </div>
        </div>

        {/* What partners get */}
        <div>
          <p className="text-[10px] font-bold tracking-widest text-[#9b9b98] uppercase mb-4">What partners receive</p>
          <div className="bg-[#0f0f0e] rounded-2xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {benefits.map(b => (
                <div key={b} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6dba7f] mt-2 flex-shrink-0" />
                  <p className="text-sm text-[#9b9b98]">{b}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Process */}
        <div>
          <p className="text-[10px] font-bold tracking-widest text-[#9b9b98] uppercase mb-4">How to partner with us</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {process.map(s => (
              <div key={s.n} className="bg-[#fafaf8] rounded-2xl p-5 border border-[#e8e5de]">
                <p className="text-[10px] font-bold tracking-widest text-[#9b9b98] mb-3">{s.n}</p>
                <p className="font-bold text-[#0f0f0e] mb-2 text-sm leading-snug">{s.title}</p>
                <p className="text-xs text-[#9b9b98] leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Principles */}
        <div className="border border-[#e8e5de] rounded-2xl p-6">
          <p className="font-bold text-[#0f0f0e] mb-3">Our partnership principles</p>
          <div className="space-y-3 text-sm text-[#6b6b68]">
            <p><strong className="text-[#0f0f0e]">Independence:</strong> Partners are free to publish findings that critique the platform, the recycling sector, or government enforcement. We do not edit or approve partner publications.</p>
            <p><strong className="text-[#0f0f0e]">No greenwashing:</strong> We will not co-brand with organisations whose primary funders profit from e-waste disposal violations.</p>
            <p><strong className="text-[#0f0f0e]">Community benefit first:</strong> Partnership decisions prioritise organisations whose work directly benefits communities affected by e-waste in Liberia.</p>
          </div>
        </div>

      </div>

      {/* CTA */}
      <div className="bg-[#0f0f0e] py-16 px-6">
        <div className="max-w-4xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Interested in partnering?</h2>
            <p className="text-[#9b9b98] text-sm max-w-md">Send us an expression of interest or fill in the access request form to start the conversation.</p>
          </div>
          <div className="flex gap-3 flex-shrink-0 flex-wrap">
            <a
              href="mailto:support@liberiaecoledger.com"
              className="px-6 py-3 border border-white/20 text-white text-sm font-semibold rounded-xl hover:border-white/40 transition-colors"
            >
              Email our team
            </a>
            <button
              type="button"
              onClick={() => navigate('/stakeholders/request-access')}
              className="px-6 py-3 bg-white text-[#0f0f0e] text-sm font-bold rounded-xl hover:bg-[#f5f5f2] transition-colors"
            >
              Start an application →
            </button>
          </div>
        </div>
      </div>

      <LandingFooter />
    </div>
  )
}
