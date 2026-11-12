import { useNavigate } from 'react-router-dom'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { FeatureIcon } from '@/components/landing/FeatureIcon'

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

      <div className="bg-brand-tint border-b border-brand-line pt-32 pb-14 px-5 md:px-8 lg:px-12">
        <div className="max-w-content mx-auto">
          <p className="text-[11px] font-semibold tracking-widest text-brand-muted uppercase mb-2">Stakeholders</p>
          <h1 className="text-4xl font-bold text-brand mb-3 font-display font-bold">
            NGO Partnerships
          </h1>
          <p className="text-base text-brand-muted leading-relaxed max-w-2xl">
            EcoLedger is an infrastructure platform, not an advocacy organisation. We partner with NGOs, researchers, and community groups who can turn our data into impact on the ground.
          </p>
        </div>
      </div>

      <div className="max-w-content mx-auto box-content px-5 md:px-8 lg:px-12 py-14 space-y-16">

        {/* Partnership types */}
        <div>
          <p className="text-[10px] font-bold tracking-widest text-brand-muted uppercase mb-4">Partnership types</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {partnershipTypes.map(p => (
              <div key={p.type} className="bg-brand-tint rounded-2xl p-6 border border-brand-line">
                <FeatureIcon emoji={p.icon} />
                <p className="font-bold text-brand-ink mb-2">{p.type}</p>
                <p className="text-sm text-brand-muted leading-relaxed mb-3">{p.desc}</p>
                <p className="text-[10px] font-semibold tracking-widest text-brand-muted uppercase">{p.forWho}</p>
              </div>
            ))}
          </div>
        </div>

        {/* What partners get */}
        <div>
          <p className="text-[10px] font-bold tracking-widest text-brand-muted uppercase mb-4">What partners receive</p>
          <div className="bg-brand-deep rounded-2xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {benefits.map(b => (
                <div key={b} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#8FD3A8] mt-2 flex-shrink-0" />
                  <p className="text-sm text-white/70">{b}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Process */}
        <div>
          <p className="text-[10px] font-bold tracking-widest text-brand-muted uppercase mb-4">How to partner with us</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {process.map(s => (
              <div key={s.n} className="bg-brand-tint rounded-2xl p-5 border border-brand-line">
                <p className="text-[10px] font-bold tracking-widest text-brand-muted mb-3">{s.n}</p>
                <p className="font-bold text-brand-ink mb-2 text-sm leading-snug">{s.title}</p>
                <p className="text-xs text-brand-muted leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Principles */}
        <div className="border border-brand-line rounded-2xl p-6">
          <p className="font-bold text-brand-ink mb-3">Our partnership principles</p>
          <div className="space-y-3 text-sm text-brand-muted">
            <p><strong className="text-brand-ink">Independence:</strong> Partners are free to publish findings that critique the platform, the recycling sector, or government enforcement. We do not edit or approve partner publications.</p>
            <p><strong className="text-brand-ink">No greenwashing:</strong> We will not co-brand with organisations whose primary funders profit from e-waste disposal violations.</p>
            <p><strong className="text-brand-ink">Community benefit first:</strong> Partnership decisions prioritise organisations whose work directly benefits communities affected by e-waste in Liberia.</p>
          </div>
        </div>

      </div>

      {/* CTA */}
      <div className="bg-brand-deep py-16 px-5 md:px-8 lg:px-12">
        <div className="max-w-content mx-auto flex flex-col lg:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Interested in partnering?</h2>
            <p className="text-white/70 text-sm max-w-md">Send us an expression of interest or fill in the access request form to start the conversation.</p>
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
              className="px-6 py-3 bg-white text-brand text-sm font-bold rounded-xl hover:bg-brand-tint transition-colors"
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
