import { useNavigate } from 'react-router-dom'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'

const ECOLEDGER = '0xb4Fa81E6D8985FE0CbA4285Ce19e81642155872E'
const ETHERSCAN = 'https://sepolia.etherscan.io'

const publicData = [
  { label: 'Device registrations',   desc: 'Brand, model, hazard class, registration date, and registering wallet address. No owner name.' },
  { label: 'Ownership transfers',     desc: 'From-wallet and to-wallet for every transfer, with timestamp and on-chain tx hash.' },
  { label: 'Disposal confirmations',  desc: 'Recycler wallet, disposal date, and EcoCredits issued. Recycler EPA licence number.' },
  { label: 'EcoLedger contract events', desc: 'All DeviceRegistered, Transferred, Disposed, and CreditsIssued events on Sepolia Etherscan.' },
]

const privateData = [
  { label: 'Owner names and emails',  desc: 'Personal identity data is stored off-chain under strict RLS. Only visible to the owner and admin.' },
  { label: 'Compliance flags detail', desc: 'Flag descriptions and evidence are visible to regulators and auditors only — not the general public.' },
  { label: 'Transaction notes',       desc: 'Free-text notes on lifecycle events are off-chain and role-gated.' },
]

const auditorFeatures = [
  {
    icon: '🔍',
    title: 'Full read-only access',
    body: 'Auditors can see the complete device registry, all lifecycle events, compliance flags, and recycler records. No write access — the ledger remains untouched.',
  },
  {
    icon: '📋',
    title: 'Compliance flag review',
    body: 'Browse all open, investigating, and resolved compliance flags. Review evidence, custody trails, and stakeholder communications attached to each case.',
  },
  {
    icon: '📊',
    title: 'Export for reporting',
    body: 'Export device data, lifecycle histories, and compliance summaries as CSV for inclusion in NGO field reports, academic research, or donor reporting.',
  },
  {
    icon: '🔔',
    title: 'Flag notifications',
    body: 'Receive email notifications when new compliance flags are raised — so your team can review independently and in parallel with regulators.',
  },
  {
    icon: '⛓️',
    title: 'On-chain cross-check',
    body: 'Every disposal logged on the platform has a corresponding on-chain event. Auditors can cross-reference Platform records against Sepolia Etherscan at any time.',
  },
  {
    icon: '🌐',
    title: 'No login for public data',
    body: 'Basic registry stats, contract events, and Etherscan data are publicly accessible without an account — transparency by default.',
  },
]

export function AuditorsPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-white">
      <LandingNav alwaysOpaque />

      {/* Hero */}
      <div className="bg-[#fafaf8] border-b border-[#e8e5de] pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-semibold tracking-widest text-[#9b9b98] uppercase mb-3">Platform · Public & Auditors</p>
          <h1 className="text-5xl font-bold text-[#0f0f0e] leading-tight mb-5" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>
            The ledger is public.<br />
            <span className="text-[#2d6a3f]">Trust doesn't require a login.</span>
          </h1>
          <p className="text-lg text-[#6b6b68] leading-relaxed max-w-2xl mb-8">
            Anyone can verify device registrations, ownership transfers, and disposal confirmations against the Sepolia blockchain. NGOs and accredited auditors get additional read-only access to compliance flags and full registry exports.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href={`${ETHERSCAN}/address/${ECOLEDGER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-[#0f0f0e] text-white text-sm font-semibold rounded-xl hover:bg-[#2a2a28] transition-colors"
            >
              View on Etherscan →
            </a>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-6 py-3 border border-[#e8e5de] text-[#0f0f0e] text-sm font-semibold rounded-xl hover:bg-[#f5f5f2] transition-colors"
            >
              Apply for auditor access
            </button>
          </div>
        </div>
      </div>

      {/* What's public */}
      <div className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-6 h-6 rounded-full bg-[#e8f5ec] flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="#2d6a3f" strokeWidth={2.5}><path d="M20 6L9 17l-5-5" /></svg>
                </div>
                <p className="font-bold text-[#0f0f0e]">Publicly accessible — no account needed</p>
              </div>
              <div className="space-y-3">
                {publicData.map(d => (
                  <div key={d.label} className="bg-[#e8f5ec] rounded-xl p-4">
                    <p className="text-sm font-semibold text-[#1a4a25] mb-1">{d.label}</p>
                    <p className="text-xs text-[#2d6a3f] leading-relaxed">{d.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-6 h-6 rounded-full bg-[#fafaf8] border border-[#e8e5de] flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="#9b9b98" strokeWidth={2}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                </div>
                <p className="font-bold text-[#0f0f0e]">Role-gated — requires authentication</p>
              </div>
              <div className="space-y-3">
                {privateData.map(d => (
                  <div key={d.label} className="bg-[#fafaf8] rounded-xl p-4 border border-[#e8e5de]">
                    <p className="text-sm font-semibold text-[#0f0f0e] mb-1">{d.label}</p>
                    <p className="text-xs text-[#9b9b98] leading-relaxed">{d.desc}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Auditor features */}
      <div className="py-20 px-6 bg-[#fafaf8] border-t border-[#e8e5de]">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-semibold tracking-widest text-[#9b9b98] uppercase mb-3">For accredited auditors</p>
          <h2 className="text-3xl font-bold text-[#0f0f0e] mb-4">Independent verification tools for NGOs and researchers.</h2>
          <p className="text-sm text-[#9b9b98] mb-12 max-w-2xl">Accredited NGOs, academic institutions, and environmental organisations can apply for auditor access — a read-only role that unlocks the full dataset without granting write permissions.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {auditorFeatures.map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-[#e8e5de]">
                <p className="text-2xl mb-3">{f.icon}</p>
                <p className="font-bold text-[#0f0f0e] mb-2">{f.title}</p>
                <p className="text-sm text-[#9b9b98] leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* On-chain verification guide */}
      <div className="py-16 px-6 border-t border-[#e8e5de]">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-semibold tracking-widest text-[#9b9b98] uppercase mb-3">Verify independently</p>
          <h2 className="text-2xl font-bold text-[#0f0f0e] mb-6">How to verify a device record without logging in.</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { n: '01', title: 'Get the device ID', body: 'The device\'s on-chain ID (bytes32 hash) is shown on its detail page. Copy it from the device owner or EcoLedger dashboard.' },
              { n: '02', title: 'Open Sepolia Etherscan', body: `Visit ${ETHERSCAN}/address/${ECOLEDGER} to view all EcoLedger contract events.` },
              { n: '03', title: 'Search the event log', body: 'Filter by event type (DeviceRegistered, Transferred, Disposed) and device ID to verify the full history independently.' },
            ].map(s => (
              <div key={s.n} className="bg-[#fafaf8] rounded-2xl p-5 border border-[#e8e5de]">
                <p className="text-[10px] font-bold tracking-widest text-[#9b9b98] mb-3">{s.n}</p>
                <p className="font-bold text-[#0f0f0e] mb-2 text-sm">{s.title}</p>
                <p className="text-xs text-[#9b9b98] leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-20 px-6 bg-[#0f0f0e]">
        <div className="max-w-4xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Apply for auditor access.</h2>
            <p className="text-[#9b9b98] max-w-md">NGOs, academic institutions, and environmental organisations can apply for read-only auditor credentials.</p>
          </div>
          <div className="flex gap-4 flex-shrink-0 flex-wrap">
            <a
              href={`${ETHERSCAN}/address/${ECOLEDGER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 border border-white/20 text-white text-sm font-semibold rounded-xl hover:border-white/40 transition-colors"
            >
              Public ledger →
            </a>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-white text-[#0f0f0e] text-sm font-bold rounded-xl hover:bg-[#f5f5f2] transition-colors"
            >
              Request auditor access
            </button>
          </div>
        </div>
      </div>

      <LandingFooter />
    </div>
  )
}
