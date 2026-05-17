import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'

function Section({ id, tag, title, children }: { id?: string; tag: string; title: string; children: React.ReactNode }) {
  return (
    <div id={id} className="mb-12 scroll-mt-24">
      <p className="text-[11px] font-semibold tracking-widest text-[#9b9b98] uppercase mb-2">{tag}</p>
      <h2 className="text-2xl font-bold text-[#0f0f0e] mb-5">{title}</h2>
      <div className="space-y-4 text-sm text-[#6b6b68] leading-relaxed">{children}</div>
    </div>
  )
}

const toc = [
  { id: 'executive', label: 'Executive Summary' },
  { id: 'problem',   label: 'The Problem' },
  { id: 'solution',  label: 'The EcoLedger Solution' },
  { id: 'arch',      label: 'Technical Architecture' },
  { id: 'contracts', label: 'Smart Contracts' },
  { id: 'credits',   label: 'EcoCredits System' },
  { id: 'stake',     label: 'Stakeholder Model' },
  { id: 'sdg',       label: 'SDG Alignment' },
  { id: 'roadmap',   label: 'Roadmap' },
]

export function WhitepaperPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNav alwaysOpaque />

      <div className="bg-[#0f0f0e] pt-24 pb-14 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-[11px] font-semibold tracking-widest text-[#6b6b68] uppercase mb-3">Resources</p>
          <h1 className="text-5xl font-bold text-white mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>
            EcoLedger Whitepaper
          </h1>
          <p className="text-[#9b9b98] max-w-2xl leading-relaxed mb-6">
            A blockchain-based electronic device lifecycle registry for Liberia — architecture, incentive design, regulatory integration, and SDG alignment.
          </p>
          <div className="flex flex-wrap gap-4 text-xs text-[#6b6b68]">
            <span>Version 1.0 · May 2026</span>
            <span>·</span>
            <span>EcoLedger Foundation · Monrovia, Liberia</span>
            <span>·</span>
            <span>Sepolia Testnet</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-12">
        {/* Table of contents */}
        <aside className="lg:w-56 flex-shrink-0">
          <div className="lg:sticky lg:top-24">
            <p className="text-[10px] font-bold tracking-widest text-[#9b9b98] uppercase mb-4">Contents</p>
            <nav className="space-y-2">
              {toc.map(item => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block text-sm text-[#9b9b98] hover:text-[#0f0f0e] transition-colors py-0.5"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Body */}
        <div className="flex-1 min-w-0">

          <Section id="executive" tag="01" title="Executive Summary">
            <p>Liberia generates an estimated 8,000 tonnes of electronic waste annually, with less than 3% formally recovered or recycled. The remainder enters an informal disposal economy — dismantled by unlicensed collectors, exported without documentation, or abandoned in open dumpsites — releasing lead, cadmium, and mercury into urban soil and water.</p>
            <p>EcoLedger is a permissioned blockchain registry that creates an immutable, verifiable audit trail for every electronic device sold in Liberia — from point of sale to end-of-life disposal. The system integrates manufacturer Extended Producer Responsibility (EPR) obligations, certified recycler verification, consumer reward incentives, and regulator compliance tooling into a single, unified platform.</p>
            <p>The result: every stakeholder in the e-waste chain reads from the same tamper-proof ledger. Illegal disposal becomes detectable. Compliant recyclers gain verified credentials. Consumers earn real economic value for responsible behaviour. Regulators gain national-scale visibility for the first time.</p>
          </Section>

          <Section id="problem" tag="02" title="The Problem">
            <p>Liberia has no national e-waste registry, no EPR framework, and no formal tracking of device end-of-life. The country imports approximately 2.4 million consumer electronic units per year — mobile phones, laptops, televisions, and household appliances — through formal and informal channels.</p>
            <p>Three structural failures compound the problem:</p>
            <div className="space-y-3">
              {[
                { t: 'Untraceable devices', b: 'Once sold, devices vanish from official records. Manufacturers have no lifecycle visibility. Regulators audit by approximation, not data.' },
                { t: 'Unaccountable disposal', b: 'The Basel Convention requires documented transboundary e-waste movement, but Liberia lacks the infrastructure to verify compliance. Export documentation is routinely forged or omitted.' },
                { t: 'No economic incentive for compliance', b: 'Informal collectors extract maximum value quickly — bypassing safe processing standards — because there is no reward structure for proper disposal and no penalty that is consistently enforced.' },
              ].map(p => (
                <div key={p.t} className="bg-[#fafaf8] rounded-xl p-4 border border-[#e8e5de]">
                  <p className="font-semibold text-[#0f0f0e] mb-1">{p.t}</p>
                  <p>{p.b}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="solution" tag="03" title="The EcoLedger Solution">
            <p>EcoLedger addresses each failure with a distinct system component that operates together as a single platform:</p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li><strong className="text-[#0f0f0e]">Immutable device registry:</strong> Every unit sold in Liberia can be registered by its manufacturer or retailer at point of sale. The registration creates a genesis event on-chain — a permanent, public record that cannot be altered.</li>
              <li><strong className="text-[#0f0f0e]">Ownership tracking:</strong> Each transfer of ownership is signed by both parties and recorded on-chain, creating a tamper-proof chain of custody.</li>
              <li><strong className="text-[#0f0f0e]">Verified disposal:</strong> Only EPA-licenced recyclers can write a disposal event. The recycler's licence status is checked on-chain before the event is confirmed.</li>
              <li><strong className="text-[#0f0f0e]">EcoCredits reward system:</strong> Device owners automatically receive EcoCredits when their device is properly disposed of. Credits are redeemable for mobile money, airtime, and partner vouchers — creating a tangible incentive for formal disposal channels.</li>
              <li><strong className="text-[#0f0f0e]">Regulator compliance layer:</strong> EPA Liberia and authorised bodies gain real-time access to a national compliance map, flag-based investigation tools, and exportable reports.</li>
            </ul>
          </Section>

          <Section id="arch" tag="04" title="Technical Architecture">
            <p>EcoLedger uses a two-layer architecture: an immutable on-chain layer for the audit trail, and a permissioned off-chain layer for personal data, role management, and application logic.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {[
                { title: 'On-chain layer', items: ['Ethereum Sepolia (EVM-compatible)', 'EcoLedger.sol — device registry contract', 'EcoToken.sol — ERC-20 credit token', 'Events: DeviceRegistered, Transferred, Disposed, CreditsIssued'] },
                { title: 'Off-chain layer', items: ['Supabase (PostgreSQL + Edge Functions)', 'Row-Level Security for role isolation', 'Privy for wallet + email authentication', 'React + Vite + TypeScript frontend'] },
              ].map(col => (
                <div key={col.title} className="bg-[#0f0f0e] rounded-xl p-5">
                  <p className="text-xs font-bold tracking-widest text-[#6b6b68] uppercase mb-3">{col.title}</p>
                  <ul className="space-y-1.5">
                    {col.items.map(item => (
                      <li key={item} className="flex items-start gap-2 text-xs text-[#9b9b98]">
                        <span className="w-1 h-1 rounded-full bg-[#2d6a3f] mt-1.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-4">Personal identity data (names, emails, phone numbers) is never written to the blockchain. On-chain records reference wallet addresses only — pseudonymous by design. The off-chain database enforces strict role-based access via PostgreSQL Row-Level Security (RLS), ensuring that a consumer cannot read regulator data, and vice versa.</p>
          </Section>

          <Section id="contracts" tag="05" title="Smart Contracts">
            <p>Both contracts are deployed on Ethereum Sepolia testnet and are publicly verifiable on Sepolia Etherscan.</p>
            <div className="space-y-3 mt-2">
              {[
                { name: 'EcoToken.sol', addr: '0xffEA92d6399B191A0e406EF2647cBA2445c821B4', desc: 'ERC-20 token representing EcoCredits. Minted by the EcoLedger contract on verified disposal. Non-transferable between user wallets except through the Platform\'s redemption flow.' },
                { name: 'EcoLedger.sol', addr: '0xb4Fa81E6D8985FE0CbA4285Ce19e81642155872E', desc: 'Core device registry. Handles device registration, ownership transfer, and disposal confirmation. Checks recycler authorisation on-chain before confirming disposal events.' },
              ].map(c => (
                <div key={c.name} className="border border-[#e8e5de] rounded-xl p-5">
                  <div className="flex items-center justify-between gap-4 mb-2 flex-wrap">
                    <p className="font-bold text-[#0f0f0e]">{c.name}</p>
                    <a
                      href={`https://sepolia.etherscan.io/address/${c.addr}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-[#2d6a3f] hover:underline"
                    >
                      {c.addr}
                    </a>
                  </div>
                  <p>{c.desc}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="credits" tag="06" title="EcoCredits System">
            <p>EcoCredits are the economic incentive layer of EcoLedger. They are issued as ERC-20 tokens (EcoToken) on-chain and tracked off-chain for redemption purposes.</p>
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { action: 'Register a device', credits: '+91 EC' },
                { action: 'Transfer ownership', credits: '+5 EC' },
                { action: 'Proper disposal', credits: '+200–500 EC' },
              ].map(r => (
                <div key={r.action} className="bg-[#e8f5ec] rounded-xl p-4 text-center">
                  <p className="text-xl font-bold text-[#2d6a3f] mb-1">{r.credits}</p>
                  <p className="text-xs text-[#2d6a3f]">{r.action}</p>
                </div>
              ))}
            </div>
            <p className="mt-4">EcoCredits are redeemable through the Platform's partner network: Orange Money and MTN MoMo mobile cash-out, supermarket vouchers, and green energy products. The redemption value (≈ LRD 150 per EC) is financed by manufacturer EPR fees — the consumer never pays. This design ensures the reward is available to all income levels.</p>
          </Section>

          <Section id="stake" tag="07" title="Stakeholder Model">
            <p>EcoLedger operates a five-role stakeholder model, each with distinct permissions and obligations enforced at the database and smart contract level.</p>
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-xs border border-[#e8e5de] rounded-xl overflow-hidden">
                <thead className="bg-[#fafaf8]">
                  <tr>
                    {['Role', 'Can write', 'Can read', 'Receives'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-[#0f0f0e]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8e5de] bg-white">
                  {[
                    ['Consumer', 'Register, transfer, initiate disposal', 'Own devices', 'EcoCredits'],
                    ['Manufacturer', 'Bulk register at manufacture', 'Own units, EPR stats', 'Compliance reports'],
                    ['Recycler', 'Confirmed disposals', 'Assigned devices', 'Verified track record'],
                    ['Regulator', 'Compliance flags', 'All device data, national map', 'Resolved flag alerts'],
                    ['Auditor / NGO', 'None (read-only)', 'All public data', 'Flag notifications'],
                  ].map(row => (
                    <tr key={row[0]}>
                      {row.map((cell, i) => (
                        <td key={i} className={`px-4 py-3 ${i === 0 ? 'font-semibold text-[#0f0f0e]' : 'text-[#6b6b68]'}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="sdg" tag="08" title="SDG Alignment">
            <p>EcoLedger was designed to contribute measurably to four United Nations Sustainable Development Goals. Unlike self-reported SDG alignment, EcoLedger's contribution is calculated from live chain data — making it independently verifiable.</p>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {[
                { sdg: 'SDG 12', title: 'Responsible Consumption & Production', body: 'Device lifecycle tracking eliminates unregistered disposal. EPR compliance becomes auditable by default.' },
                { sdg: 'SDG 13', title: 'Climate Action', body: 'Formalising e-waste collection prevents open burning of cables and PCBs — a significant source of toxic emissions.' },
                { sdg: 'SDG 3', title: 'Good Health & Well-being', body: 'Preventing lead and mercury contamination of Liberia\'s water sources through accountable recycler certification.' },
                { sdg: 'SDG 11', title: 'Sustainable Cities & Communities', body: 'County-level compliance mapping enables targeted enforcement by local government and EPA field officers.' },
              ].map(s => (
                <div key={s.sdg} className="border border-[#e8e5de] rounded-xl p-4">
                  <p className="text-[10px] font-bold tracking-widest text-[#9b9b98] mb-1">{s.sdg}</p>
                  <p className="font-semibold text-[#0f0f0e] mb-2 text-sm">{s.title}</p>
                  <p className="text-xs text-[#9b9b98]">{s.body}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="roadmap" tag="09" title="Roadmap">
            <div className="space-y-4">
              {[
                { phase: 'Phase 1 — Testnet (Current)', date: 'Q1–Q2 2026', items: ['Sepolia testnet deployment', 'All five stakeholder dashboards', 'Mobile field agent app', 'EcoCredits pilot with two redemption partners'] },
                { phase: 'Phase 2 — Mainnet Launch', date: 'Q3 2026', items: ['Ethereum mainnet migration', 'EPA Liberia formal integration', 'Bulk manufacturer onboarding', 'Mobile money redemption live'] },
                { phase: 'Phase 3 — Regional Expansion', date: '2027', items: ['Sierra Leone and Guinea pilot', 'Basel Convention reporting module', 'Public API for third-party integrations', 'Carbon credit linkage for verified disposal events'] },
              ].map(p => (
                <div key={p.phase} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-[#2d6a3f] mt-1 flex-shrink-0" />
                    <div className="w-px flex-1 bg-[#e8e5de] mt-1" />
                  </div>
                  <div className="pb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-bold text-[#0f0f0e] text-sm">{p.phase}</p>
                      <span className="text-[10px] font-semibold tracking-widest text-[#9b9b98] border border-[#e8e5de] rounded-full px-2 py-0.5">{p.date}</span>
                    </div>
                    <ul className="space-y-1">
                      {p.items.map(item => (
                        <li key={item} className="flex items-center gap-2 text-sm text-[#6b6b68]">
                          <span className="w-1 h-1 rounded-full bg-[#9b9b98] flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </Section>

        </div>
      </div>

      <LandingFooter />
    </div>
  )
}
