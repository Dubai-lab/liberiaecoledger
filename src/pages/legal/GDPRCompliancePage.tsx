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

function Right({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-2 h-2 rounded-full bg-[#2d6a3f] mt-1.5 flex-shrink-0" />
      <div>
        <p className="text-sm font-bold text-[#0f0f0e] mb-1">{title}</p>
        <p className="text-sm text-[#6b6b68] leading-relaxed">{body}</p>
      </div>
    </div>
  )
}

export function GDPRCompliancePage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNav alwaysOpaque />

      <div className="bg-[#fafaf8] border-b border-[#e8e5de] pt-24 pb-10 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] font-semibold tracking-widest text-[#9b9b98] uppercase mb-2">Legal</p>
          <h1 className="text-4xl font-bold text-[#0f0f0e] mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>
            GDPR Compliance
          </h1>
          <p className="text-sm text-[#9b9b98]">Last updated: May 2026 · General Data Protection Regulation (EU) 2016/679</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">

        <div className="bg-[#fafaf8] border border-[#e8e5de] rounded-2xl p-6 mb-10">
          <p className="text-sm text-[#6b6b68] leading-relaxed">
            Although EcoLedger Foundation is headquartered in Liberia, we process personal data of individuals who may be located in the European Economic Area (EEA), and we partner with EU-based service providers (Supabase, Vercel). We therefore align our data practices with the General Data Protection Regulation (GDPR) as a matter of best practice and to respect the rights of all users regardless of location.
          </p>
        </div>

        <Section title="1. Data Controller">
          <p>EcoLedger Foundation is the data controller for all personal data processed through the Platform. Contact details:</p>
          <div className="bg-[#fafaf8] rounded-xl p-4 border border-[#e8e5de] mt-2">
            <p><strong className="text-[#0f0f0e]">Organisation:</strong> EcoLedger Foundation</p>
            <p><strong className="text-[#0f0f0e]">Address:</strong> Monrovia, Liberia, West Africa</p>
            <p><strong className="text-[#0f0f0e]">Data contact:</strong> <a href="mailto:support@liberiaecoledger.com" className="text-[#2d6a3f] hover:underline">support@liberiaecoledger.com</a></p>
          </div>
        </Section>

        <Section title="2. Legal Basis for Processing">
          <p>We process personal data under the following GDPR legal bases:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><strong className="text-[#0f0f0e]">Contract performance (Art. 6(1)(b)):</strong> Processing your name and email is necessary to create and maintain your account and deliver the Platform service.</li>
            <li><strong className="text-[#0f0f0e]">Legal obligation (Art. 6(1)(c)):</strong> Certain device lifecycle records are required to be maintained for regulatory compliance with Liberian environmental law.</li>
            <li><strong className="text-[#0f0f0e]">Legitimate interests (Art. 6(1)(f)):</strong> Security monitoring, fraud prevention, and platform integrity checks are carried out under our legitimate interest.</li>
            <li><strong className="text-[#0f0f0e]">Consent (Art. 6(1)(a)):</strong> Where we send optional communications beyond transactional emails, we obtain explicit consent.</li>
          </ul>
        </Section>

        <Section title="3. Your Rights Under GDPR">
          <div className="space-y-4">
            <Right title="Right of access (Art. 15)" body="You may request a copy of all personal data we hold about you, including how it is used, where it is stored, and who it has been shared with. We will respond within 30 days." />
            <Right title="Right to rectification (Art. 16)" body="If personal data we hold about you is inaccurate or incomplete, you have the right to request correction. Update requests can be made by logging into your account or contacting us." />
            <Right title="Right to erasure (Art. 17)" body="You may request deletion of your off-chain personal data. Note: on-chain device records (tied to your wallet address) cannot be erased due to the immutable nature of blockchain technology. This limitation is disclosed at the point of account creation." />
            <Right title="Right to restriction (Art. 18)" body="You may request that we restrict processing of your personal data while a dispute is being investigated or a correction is being made." />
            <Right title="Right to data portability (Art. 20)" body="You may request your personal data in a structured, commonly used, machine-readable format (JSON or CSV) to transfer to another service." />
            <Right title="Right to object (Art. 21)" body="You may object to processing based on our legitimate interest. We will cease processing unless we can demonstrate compelling legitimate grounds that override your interests." />
            <Right title="Rights related to automated decision-making (Art. 22)" body="EcoLedger does not make automated decisions with legal or similarly significant effects. Role assignments are made manually by authorised administrators." />
          </div>
          <p className="mt-4">To exercise any of these rights, submit a request to <a href="mailto:support@liberiaecoledger.com" className="text-[#2d6a3f] hover:underline">support@liberiaecoledger.com</a>. We will acknowledge your request within 5 business days and respond substantively within 30 days.</p>
        </Section>

        <Section title="4. Data Transfers Outside the EEA">
          <p>Our data is processed by Supabase (primary EU data centres in Frankfurt, Germany) and Vercel (global edge network). Both providers are GDPR-compliant and operate under Standard Contractual Clauses (SCCs) where data may transit non-EEA regions.</p>
          <p>On-chain data written to the Ethereum Sepolia network is globally distributed by nature. This data contains only wallet addresses and device metadata — no personal identifiers.</p>
        </Section>

        <Section title="5. Data Retention Under GDPR">
          <p>We retain personal data only as long as necessary for the purposes described. Off-chain account data is retained for the duration of the account plus 3 years for audit purposes. On account deletion, personal identifiers are removed from our database; only anonymised activity logs may be retained for compliance purposes.</p>
        </Section>

        <Section title="6. Supervisory Authority">
          <p>If you are located in the EEA and believe we have not addressed your data protection concern adequately, you have the right to lodge a complaint with your local supervisory authority. A list of EU data protection authorities is available at <span className="text-[#2d6a3f]">edpb.europa.eu/about-edpb/board/members</span>.</p>
        </Section>

        <Section title="7. Changes to This Notice">
          <p>We review our GDPR compliance notice annually or when material changes to our data practices occur. Significant updates will be communicated to registered users by email.</p>
        </Section>

      </div>

      <LandingFooter />
    </div>
  )
}
