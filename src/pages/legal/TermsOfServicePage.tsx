import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="text-lg font-bold text-[#0f0f0e] mb-4 pb-2 border-b border-[#e8e5de]">{title}</h2>
      <div className="space-y-3 text-sm text-[#6b6b68] leading-relaxed">{children}</div>
    </div>
  )
}

export function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNav alwaysOpaque />

      <div className="bg-[#fafaf8] border-b border-[#e8e5de] pt-24 pb-10 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] font-semibold tracking-widest text-[#9b9b98] uppercase mb-2">Legal</p>
          <h1 className="text-4xl font-bold text-[#0f0f0e] mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>
            Terms of Service
          </h1>
          <p className="text-sm text-[#9b9b98]">Last updated: May 2026 · Governing law: Republic of Liberia</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">

        <Section title="1. Acceptance of Terms">
          <p>By accessing or using the Liberia EcoLedger platform ("the Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Platform. These Terms apply to all users regardless of role — consumer, manufacturer, recycler, regulator, auditor, or administrator.</p>
          <p>These Terms form a legally binding agreement between you and EcoLedger Foundation. We reserve the right to update these Terms at any time with notice to registered users.</p>
        </Section>

        <Section title="2. Description of Service">
          <p>EcoLedger is a permissioned blockchain-based registry for electronic device lifecycle tracking in Liberia. The Platform enables:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Registration of electronic devices at point of sale</li>
            <li>Recording of ownership transfers on-chain</li>
            <li>Verified disposal logging by EPA-certified recyclers</li>
            <li>Issuance of EcoCredit rewards for responsible disposal</li>
            <li>Compliance monitoring and reporting for regulators</li>
          </ul>
          <p>EcoLedger is an infrastructure layer. We do not manufacture, sell, collect, or recycle devices. We do not guarantee the actions of any manufacturer, recycler, or consumer on the Platform.</p>
        </Section>

        <Section title="3. Eligibility and Access">
          <p>Access to the Platform is by invitation only. You must be an authorised stakeholder — a licensed manufacturer, EPA-certified recycler, government regulator, accredited NGO, or registered consumer — to hold an account.</p>
          <p>You must provide accurate and complete information when creating your account. You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account.</p>
        </Section>

        <Section title="4. Role-Specific Obligations">
          <p><strong className="text-[#0f0f0e]">Manufacturers</strong> are responsible for accurately registering all units sold into Liberia. Fraudulent registrations or deliberate misclassification of hazard levels may result in account suspension and referral to the EPA Liberia.</p>
          <p><strong className="text-[#0f0f0e]">Recyclers</strong> must hold a valid EPA Liberia licence at all times. You agree not to log disposal events for devices you have not physically received and processed. Misuse of disposal logging constitutes fraud.</p>
          <p><strong className="text-[#0f0f0e]">Consumers</strong> agree that device registrations and transfers accurately reflect real-world ownership. You may not register devices you do not own.</p>
          <p><strong className="text-[#0f0f0e]">Regulators and Auditors</strong> agree to use compliance data solely for lawful regulatory or auditing purposes. Exporting or sharing Platform data with unauthorised parties is prohibited.</p>
        </Section>

        <Section title="5. EcoCredits">
          <p>EcoCredits are platform-issued reward points tied to verified device disposals. They are not currency, securities, or financial instruments. Their redeemable value (approximately LRD 150 per EcoCredit) is indicative only and may change.</p>
          <p>EcoCredits may not be transferred between accounts, sold, or exchanged for cash outside of the Platform's approved redemption partners. Abuse of the reward system — including falsified disposal events — will result in credit reversal and account termination.</p>
        </Section>

        <Section title="6. On-Chain Records">
          <p>You acknowledge that device lifecycle events recorded on the Ethereum Sepolia blockchain are permanent, immutable, and publicly accessible. EcoLedger has no ability to alter or delete on-chain records once confirmed.</p>
          <p>You are solely responsible for ensuring the accuracy of data you submit. Errors in on-chain submissions cannot be corrected — only new corrective events can be appended.</p>
        </Section>

        <Section title="7. Prohibited Conduct">
          <p>You agree not to:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Submit false, misleading, or fraudulent device registrations, transfers, or disposals</li>
            <li>Attempt to circumvent role-based access controls or RLS policies</li>
            <li>Use automated tools to scrape, bulk-download, or manipulate Platform data</li>
            <li>Impersonate another user, organisation, or regulatory body</li>
            <li>Use the Platform in violation of any applicable Liberian law</li>
          </ul>
        </Section>

        <Section title="8. Limitation of Liability">
          <p>EcoLedger provides the Platform on an "as is" basis. To the maximum extent permitted by applicable law, EcoLedger Foundation shall not be liable for:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Any inaccuracies in data submitted by third parties (manufacturers, recyclers, consumers)</li>
            <li>Loss of EcoCredits due to user error or account compromise</li>
            <li>Platform downtime, data loss, or interruption of service</li>
            <li>Any regulatory penalty arising from a user's own non-compliance</li>
          </ul>
          <p>EcoLedger is a tracking infrastructure, not a guarantor of regulatory compliance by any party.</p>
        </Section>

        <Section title="9. Termination">
          <p>We reserve the right to suspend or terminate any account that violates these Terms, at our discretion and without prior notice. Users may request account closure by contacting <a href="mailto:support@liberiaecoledger.com" className="text-[#2d6a3f] hover:underline">support@liberiaecoledger.com</a>. On-chain records associated with a closed account remain on the public ledger.</p>
        </Section>

        <Section title="10. Governing Law">
          <p>These Terms are governed by the laws of the Republic of Liberia. Any dispute arising from the use of the Platform shall be subject to the exclusive jurisdiction of the courts of Monrovia, Liberia, unless otherwise required by applicable international law.</p>
        </Section>

        <Section title="11. Contact">
          <p>For questions about these Terms, contact <a href="mailto:support@liberiaecoledger.com" className="text-[#2d6a3f] hover:underline">support@liberiaecoledger.com</a>.</p>
        </Section>

      </div>

      <LandingFooter />
    </div>
  )
}
