import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'

const board = [
  {
    name: 'Dr. Amara Kofi Johnson',
    title: 'Chair, Board of Directors',
    bio: 'Former Director of Environmental Affairs at EPA Liberia with 18 years in environmental policy and regulatory reform across West Africa. Dr. Johnson chairs the Foundation\'s strategy and regulatory engagement committee.',
    focus: 'Regulatory strategy · EPA partnerships · Policy advocacy',
    initials: 'AK',
  },
  {
    name: 'Fatima Sesay',
    title: 'Board Director — Technology & Innovation',
    bio: 'Blockchain infrastructure architect with prior roles at Consensys and Stellar Development Foundation. Fatima oversees the technical roadmap, smart contract security, and EcoLedger\'s blockchain governance model.',
    focus: 'Blockchain architecture · Smart contract governance · Security',
    initials: 'FS',
  },
  {
    name: 'Emmanuel Gbolo',
    title: 'Board Director — Operations & Finance',
    bio: 'Former CFO of a Monrovia-based environmental services company and chartered accountant. Emmanuel oversees the Foundation\'s financial sustainability, EPR fee structure, and EcoCredits redemption fund.',
    focus: 'Financial governance · EPR fee management · EcoCredits fund',
    initials: 'EG',
  },
  {
    name: 'Dr. Nadia Mensah',
    title: 'Board Director — Environmental Science',
    bio: 'Environmental toxicologist specialising in e-waste hazard classification and Basel Convention compliance in sub-Saharan Africa. Dr. Mensah advises on hazard class standards and recycler certification criteria.',
    focus: 'Hazard classification · Basel Convention · Recycler standards',
    initials: 'NM',
  },
  {
    name: 'Joseph Kollie',
    title: 'Board Director — Community & Social Impact',
    bio: 'Executive Director of the Monrovia Urban Communities Foundation. Joseph ensures EcoLedger\'s incentive design — particularly EcoCredits redemption — reaches and benefits low-income communities most affected by e-waste dumping.',
    focus: 'Community benefit · EcoCredits equity · Urban outreach',
    initials: 'JK',
  },
]

const governance = [
  {
    title: 'Independence',
    body: 'EcoLedger Foundation operates independently of any manufacturer, recycler, or government agency. No board member holds equity in or receives fees from companies whose devices are tracked on the platform.',
  },
  {
    title: 'Transparency',
    body: 'Board meeting minutes and annual reports are published on this website. Financial accounts are audited annually by an independent Liberian accounting firm. Smart contract addresses are public.',
  },
  {
    title: 'Accountability',
    body: 'Board members serve 3-year terms with a maximum of two consecutive terms. The board is appointed by the Foundation\'s founding trustees and ratified by the EPA Liberia Partnership Committee.',
  },
  {
    title: 'Conflict of interest',
    body: 'Board members with any financial interest in a registered manufacturer or recycler must declare and recuse. Declarations are logged in board minutes and made available on request.',
  },
]

const colors = ['#2d6a3f', '#0f0f0e', '#6b4a2a', '#1a3a5c', '#5c1a4a']

export function BoardPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNav alwaysOpaque />

      <div className="bg-[#0f0f0e] pt-24 pb-14 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-semibold tracking-widest text-[#6b6b68] uppercase mb-2">Stakeholders</p>
          <h1 className="text-4xl font-bold text-white mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>
            Board of Directors
          </h1>
          <p className="text-[#9b9b98] text-base max-w-2xl leading-relaxed">
            EcoLedger Foundation is governed by an independent board of five directors with expertise spanning environmental regulation, blockchain technology, finance, environmental science, and community impact.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-14 space-y-16">

        {/* Board members */}
        <div>
          <p className="text-[10px] font-bold tracking-widest text-[#9b9b98] uppercase mb-6">Board members</p>
          <div className="space-y-5">
            {board.map((m, i) => (
              <div key={m.name} className="bg-[#fafaf8] rounded-2xl p-6 border border-[#e8e5de] flex gap-5">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ background: colors[i % colors.length] }}
                >
                  {m.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#0f0f0e]">{m.name}</p>
                  <p className="text-xs font-semibold text-[#9b9b98] mb-2">{m.title}</p>
                  <p className="text-sm text-[#6b6b68] leading-relaxed mb-3">{m.bio}</p>
                  <div className="flex flex-wrap gap-2">
                    {m.focus.split(' · ').map(tag => (
                      <span key={tag} className="text-[10px] font-semibold text-[#6b6b68] border border-[#e8e5de] rounded-full px-2.5 py-0.5">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Governance */}
        <div>
          <p className="text-[10px] font-bold tracking-widest text-[#9b9b98] uppercase mb-4">Governance principles</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {governance.map(g => (
              <div key={g.title} className="bg-white rounded-2xl p-5 border border-[#e8e5de]">
                <p className="font-bold text-[#0f0f0e] mb-2">{g.title}</p>
                <p className="text-sm text-[#9b9b98] leading-relaxed">{g.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Foundation structure */}
        <div className="border border-[#e8e5de] rounded-2xl p-6">
          <p className="font-bold text-[#0f0f0e] mb-4">Foundation structure</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Entity type',     value: 'Non-profit Foundation' },
              { label: 'Registered',      value: 'Republic of Liberia' },
              { label: 'Founded',         value: '2025' },
              { label: 'Board size',      value: '5 directors' },
              { label: 'Term length',     value: '3 years, max 2 terms' },
              { label: 'Board contact',   value: 'board@liberiaecoledger.com' },
            ].map(f => (
              <div key={f.label} className="bg-[#fafaf8] rounded-xl px-4 py-3 border border-[#e8e5de]">
                <p className="text-[10px] font-semibold tracking-widest text-[#9b9b98] uppercase mb-1">{f.label}</p>
                <p className="text-sm font-semibold text-[#0f0f0e]">{f.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="bg-[#fafaf8] rounded-2xl p-6 border border-[#e8e5de]">
          <p className="font-bold text-[#0f0f0e] mb-2">Contact the board</p>
          <p className="text-sm text-[#9b9b98] leading-relaxed mb-4">
            For governance enquiries, institutional partnership proposals, or to report a concern under our Code of Ethics, contact the Board Secretary directly.
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="mailto:board@liberiaecoledger.com" className="text-sm font-semibold text-[#2d6a3f] hover:underline">
              board@liberiaecoledger.com
            </a>
            <span className="text-[#e8e5de]">·</span>
            <a href="mailto:ethics@liberiaecoledger.com" className="text-sm font-semibold text-[#2d6a3f] hover:underline">
              ethics@liberiaecoledger.com (ethics reports)
            </a>
          </div>
        </div>

      </div>

      <LandingFooter />
    </div>
  )
}
