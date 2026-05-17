import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'

function Pillar({ num, title, body }: { num: string; title: string; body: string }) {
  return (
    <div className="bg-[#fafaf8] rounded-2xl p-6 border border-[#e8e5de]">
      <p className="text-[10px] font-bold tracking-widest text-[#9b9b98] mb-2">{num}</p>
      <h3 className="text-base font-bold text-[#0f0f0e] mb-3">{title}</h3>
      <p className="text-sm text-[#6b6b68] leading-relaxed">{body}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="text-lg font-bold text-[#0f0f0e] mb-4 pb-2 border-b border-[#e8e5de]">{title}</h2>
      <div className="space-y-3 text-sm text-[#6b6b68] leading-relaxed">{children}</div>
    </div>
  )
}

export function CodeOfEthicsPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNav alwaysOpaque />

      <div className="bg-[#0f0f0e] pt-24 pb-12 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] font-semibold tracking-widest text-[#6b6b68] uppercase mb-2">Legal</p>
          <h1 className="text-4xl font-bold text-white mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>
            Code of Ethics
          </h1>
          <p className="text-sm text-[#9b9b98]">Environmental accountability extends to how we operate our own platform.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">

        <p className="text-base text-[#6b6b68] leading-relaxed mb-10">
          EcoLedger was built to hold others accountable for the environmental impact of electronics. We hold ourselves to the same standard. This Code of Ethics defines the principles by which we operate, build, and partner.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <Pillar num="01" title="Truthfulness of the ledger" body="We will never alter, suppress, or manipulate records on the EcoLedger registry. The public ledger is the foundation of trust — any interference with it would be a fundamental breach of our mission." />
          <Pillar num="02" title="Environmental priority" body="Every product decision must consider its environmental consequence. Features that increase verifiable recycling rates, reduce illegal dumping, or strengthen regulatory oversight take priority over commercial considerations." />
          <Pillar num="03" title="No data exploitation" body="User data is never sold, profiled, or used for purposes beyond the stated function of the Platform. We collect the minimum data required to operate the registry. This commitment does not change under commercial pressure." />
          <Pillar num="04" title="Community-first design" body="The communities most affected by e-waste — informal settlement residents in Liberia's urban centres — must benefit from this system. EcoCredits, public compliance maps, and transparent recycler listings all serve this commitment." />
          <Pillar num="05" title="Open governance" body="We publish our smart contract addresses, source code, and audit trails publicly. We support independent audits of our platform by NGOs and academic institutions. Accountability cannot be selective." />
          <Pillar num="06" title="No benefit from non-compliance" body="EcoLedger does not receive revenue from devices that are improperly disposed of, illegally exported, or flagged for non-compliance. Our incentive structure is aligned with proper disposal — not volume." />
        </div>

        <Section title="Stakeholder Ethics">
          <p><strong className="text-[#0f0f0e]">Our partners:</strong> We only onboard recyclers who hold valid EPA Liberia licences. We do not grant platform access to informal collectors or unverified operators regardless of volume commitments.</p>
          <p><strong className="text-[#0f0f0e]">Our funders:</strong> We do not accept funding from entities whose business model conflicts with our environmental mission — including manufacturers with a track record of regulatory violations in other markets.</p>
          <p><strong className="text-[#0f0f0e]">Our team:</strong> All team members and contractors are required to uphold this Code of Ethics. Violations — including accepting bribes, falsifying records, or leaking data — are grounds for immediate termination and, where applicable, referral to law enforcement.</p>
        </Section>

        <Section title="Conflict of Interest">
          <p>EcoLedger Foundation operates independently of any manufacturer, recycler, or government body. We do not hold equity in, or receive consulting fees from, any company whose devices are tracked on the Platform. Where institutional funders exist, their identities are disclosed on our website.</p>
          <p>Team members with a financial interest in any registered recycler or manufacturer must declare that interest and recuse themselves from decisions affecting that entity.</p>
        </Section>

        <Section title="Environmental Commitment of Our Own Operations">
          <p>We acknowledge that running cloud infrastructure has an environmental footprint. We commit to:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Using cloud providers with published renewable energy commitments</li>
            <li>Minimising on-chain transaction volume by batching where technically possible</li>
            <li>Not operating validator nodes powered by non-renewable energy</li>
          </ul>
        </Section>

        <Section title="Reporting a Concern">
          <p>If you believe EcoLedger Foundation or any of its team members is acting in breach of this Code, you may report it confidentially to <a href="mailto:ethics@liberiaecoledger.com" className="text-[#2d6a3f] hover:underline">ethics@liberiaecoledger.com</a>. Reports are reviewed by the Board of Directors. Retaliation against anyone who reports in good faith is prohibited.</p>
        </Section>

      </div>

      <LandingFooter />
    </div>
  )
}
