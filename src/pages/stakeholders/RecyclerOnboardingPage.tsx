import { useNavigate } from 'react-router-dom'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'

const steps = [
  {
    n: '01',
    title: 'Submit your application',
    duration: 'Day 1',
    body: 'Complete the access request form with your full name, EPA Liberia licence number, facility address, and accepted hazard classes. Attach a scanned copy of your licence.',
    action: 'Fill access request form',
    href: '/stakeholders/request-access',
  },
  {
    n: '02',
    title: 'Licence verification',
    duration: 'Days 1–2',
    body: 'Our team cross-references your licence number with the EPA Liberia registry. We verify your facility address and confirm your licence is current and in good standing.',
    action: null,
    href: null,
  },
  {
    n: '03',
    title: 'Account setup',
    duration: 'Day 2–3',
    body: 'You receive a secure invitation email. Set your password and optionally connect a crypto wallet for on-chain signing. Your facility profile is pre-populated from your application.',
    action: null,
    href: null,
  },
  {
    n: '04',
    title: 'Platform orientation',
    duration: 'Day 3',
    body: 'A 30-minute video walkthrough covers the disposal logging workflow, how to scan device QR codes on the mobile app, and how EcoCredits are automatically issued to device owners.',
    action: null,
    href: null,
  },
  {
    n: '05',
    title: 'Go live',
    duration: 'Day 3–4',
    body: 'Your facility is published on the platform and becomes visible to consumers searching for nearby recyclers. You can begin logging disposals and issuing EcoCredits immediately.',
    action: null,
    href: null,
  },
]

const checklist = [
  'Valid EPA Liberia recycler licence (current, not expired)',
  'Physical processing facility in Liberia with confirmed address',
  'Declared hazard classes your facility is certified to process',
  'Business registration certificate (for corporate applicants)',
  'Designated platform administrator (name + email) for your facility',
  'Signed EcoLedger Recycler Operator Agreement',
]

const benefits = [
  {
    title: 'Verified credentials on-chain',
    body: 'Your EPA licence is linked to your on-chain identity. Every disposal you log carries cryptographic proof that it was performed by a verified, licensed operator.',
  },
  {
    title: 'Consumer discovery',
    body: 'Your facility appears on the public recycler map. Consumers searching for disposal points near them will find and trust you based on your verified track record.',
  },
  {
    title: 'Automatic EcoCredit issuance',
    body: 'No manual reward processing. When you confirm a disposal, EcoCredits are minted and delivered to the device owner automatically by the smart contract.',
  },
  {
    title: 'Regulatory trust',
    body: 'Every disposal you log builds an immutable record visible to EPA Liberia and auditors. Your compliance record speaks for itself — no paper reporting required.',
  },
]

export function RecyclerOnboardingPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-white">
      <LandingNav alwaysOpaque />

      <div className="bg-[#0f0f0e] pt-24 pb-14 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-semibold tracking-widest text-[#6b6b68] uppercase mb-2">Stakeholders</p>
          <h1 className="text-4xl font-bold text-white mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>
            Recycler Onboarding
          </h1>
          <p className="text-[#9b9b98] text-base max-w-2xl leading-relaxed">
            From application to your first verified disposal in under 4 days. Here's exactly what the process looks like.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-14 space-y-16">

        {/* Checklist */}
        <div>
          <p className="text-[10px] font-bold tracking-widest text-[#9b9b98] uppercase mb-4">What you'll need</p>
          <div className="bg-[#fafaf8] rounded-2xl p-6 border border-[#e8e5de]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {checklist.map(item => (
                <div key={item} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#e8f5ec] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3" stroke="#2d6a3f" strokeWidth={2.5}>
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                  <p className="text-sm text-[#6b6b68] leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Steps */}
        <div>
          <p className="text-[10px] font-bold tracking-widest text-[#9b9b98] uppercase mb-4">The onboarding process</p>
          <div className="space-y-0">
            {steps.map((s, i) => (
              <div key={s.n} className="flex gap-6">
                <div className="flex flex-col items-center flex-shrink-0 w-8">
                  <div className="w-8 h-8 rounded-full bg-[#0f0f0e] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {s.n}
                  </div>
                  {i < steps.length - 1 && <div className="w-px flex-1 bg-[#e8e5de] my-1" />}
                </div>
                <div className="pb-8 flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <p className="font-bold text-[#0f0f0e]">{s.title}</p>
                    <span className="text-[10px] font-semibold tracking-widest text-[#9b9b98] border border-[#e8e5de] rounded-full px-2.5 py-0.5">{s.duration}</span>
                  </div>
                  <p className="text-sm text-[#6b6b68] leading-relaxed mb-3">{s.body}</p>
                  {s.action && s.href && (
                    <button
                      type="button"
                      onClick={() => navigate(s.href!)}
                      className="text-xs font-semibold text-[#2d6a3f] hover:underline"
                    >
                      → {s.action}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div>
          <p className="text-[10px] font-bold tracking-widest text-[#9b9b98] uppercase mb-4">Why join the network</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {benefits.map(b => (
              <div key={b.title} className="bg-[#fafaf8] rounded-2xl p-5 border border-[#e8e5de]">
                <p className="font-bold text-[#0f0f0e] mb-2">{b.title}</p>
                <p className="text-sm text-[#9b9b98] leading-relaxed">{b.body}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* CTA */}
      <div className="bg-[#0f0f0e] py-16 px-6">
        <div className="max-w-4xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Ready to get verified?</h2>
            <p className="text-[#9b9b98] max-w-md text-sm">The application takes 10 minutes. Onboarding takes under 4 days. Your facility can be live before the end of the week.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/stakeholders/request-access')}
            className="flex-shrink-0 px-8 py-4 bg-white text-[#0f0f0e] text-sm font-bold rounded-xl hover:bg-[#f5f5f2] transition-colors"
          >
            Start your application →
          </button>
        </div>
      </div>

      <LandingFooter />
    </div>
  )
}
