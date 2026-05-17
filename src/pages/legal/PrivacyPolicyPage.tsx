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

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNav alwaysOpaque />

      {/* Page header */}
      <div className="bg-[#fafaf8] border-b border-[#e8e5de] pt-24 pb-10 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] font-semibold tracking-widest text-[#9b9b98] uppercase mb-2">Legal</p>
          <h1 className="text-4xl font-bold text-[#0f0f0e] mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>
            Privacy Policy
          </h1>
          <p className="text-sm text-[#9b9b98]">Last updated: May 2026 · GDPR-aligned · No personal data sold</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-12">

        <Section title="1. Who We Are">
          <p>EcoLedger Foundation ("EcoLedger", "we", "us", "our") operates the Liberia EcoLedger platform — a blockchain-based electronic device lifecycle tracking registry for the Republic of Liberia. Our registered address is Monrovia, Liberia, West Africa.</p>
          <p>For questions about this policy or your personal data, contact us at <a href="mailto:privacy@liberiaecoledger.com" className="text-[#2d6a3f] hover:underline">privacy@liberiaecoledger.com</a>.</p>
        </Section>

        <Section title="2. What Data We Collect">
          <p><strong className="text-[#0f0f0e]">Account data:</strong> When you register or are invited to the platform, we collect your full name, email address, organisation name, and role. This is stored securely in our off-chain database (Supabase) and is never published publicly.</p>
          <p><strong className="text-[#0f0f0e]">Wallet address:</strong> If you use a blockchain wallet to authenticate, your public wallet address is stored. Wallet addresses are pseudonymous — they do not directly identify you by name.</p>
          <p><strong className="text-[#0f0f0e]">Device data:</strong> Device registrations (brand, model, IMEI, hazard class), ownership transfers, and disposal events are recorded on-chain (Ethereum Sepolia). This data is permanently public by design, as it forms the immutable audit trail of the registry.</p>
          <p><strong className="text-[#0f0f0e]">Usage data:</strong> Standard server logs may include IP addresses and browser user agents for security and performance monitoring purposes. These are not used for profiling.</p>
        </Section>

        <Section title="3. How We Use Your Data">
          <p>We use personal data strictly for the following purposes:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Providing access to the platform and verifying your role (consumer, manufacturer, recycler, regulator, auditor, or admin)</li>
            <li>Sending transactional emails about devices you own or events you triggered</li>
            <li>Compliance monitoring and regulatory reporting as required by Liberian e-waste law</li>
            <li>Issuing and tracking EcoCredit rewards tied to your account</li>
          </ul>
          <p>We do not use your data for advertising, profiling, or sale to third parties.</p>
        </Section>

        <Section title="4. On-Chain Data">
          <p>Any data written to the Ethereum Sepolia blockchain is irreversible and permanently public. This includes device registration events, ownership transfers, and disposal confirmations. We link these events to wallet addresses only — your name and email address are never written to the blockchain.</p>
          <p>By using the platform to register or transfer a device, you acknowledge that the associated on-chain record is permanent and globally visible.</p>
        </Section>

        <Section title="5. Data Sharing">
          <p><strong className="text-[#0f0f0e]">With regulators:</strong> The Environmental Protection Agency of Liberia (EPA Liberia) and authorised government bodies may access compliance data as part of their regulatory mandate.</p>
          <p><strong className="text-[#0f0f0e]">With auditors:</strong> Authorised NGO auditors can read device lifecycle records and compliance flags. They cannot access your personal contact details.</p>
          <p><strong className="text-[#0f0f0e]">Service providers:</strong> We use Supabase (EU data centres) for off-chain data storage, and Vercel for application hosting. Both providers operate under data processing agreements.</p>
          <p><strong className="text-[#0f0f0e]">No other sharing:</strong> We do not sell, rent, or share personal data with any other third party.</p>
        </Section>

        <Section title="6. Data Retention">
          <p>Account data is retained for as long as your account is active, plus a 3-year period after account closure to meet regulatory and audit requirements. Device lifecycle records on-chain are permanent and cannot be deleted.</p>
          <p>You may request deletion of your off-chain account data at any time (see Section 8). Note that on-chain records associated with your wallet address cannot be deleted due to the immutable nature of blockchain technology.</p>
        </Section>

        <Section title="7. Cookies">
          <p>We use only strictly essential cookies for session management and authentication. No advertising, tracking, or analytics cookies are set. See our <a href="/cookies" className="text-[#2d6a3f] hover:underline">Cookie Policy</a> for full details.</p>
        </Section>

        <Section title="8. Your Rights">
          <p>You have the right to:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><strong className="text-[#0f0f0e]">Access</strong> — request a copy of the personal data we hold about you</li>
            <li><strong className="text-[#0f0f0e]">Rectification</strong> — request correction of inaccurate data</li>
            <li><strong className="text-[#0f0f0e]">Erasure</strong> — request deletion of your off-chain account data</li>
            <li><strong className="text-[#0f0f0e]">Data portability</strong> — request your data in a structured, machine-readable format</li>
            <li><strong className="text-[#0f0f0e]">Objection</strong> — object to processing based on legitimate interest</li>
          </ul>
          <p>To exercise any of these rights, email <a href="mailto:privacy@liberiaecoledger.com" className="text-[#2d6a3f] hover:underline">privacy@liberiaecoledger.com</a>. We will respond within 30 days.</p>
        </Section>

        <Section title="9. Security">
          <p>All off-chain data is stored with row-level security (RLS) policies enforced at the database layer. Access is role-gated — a consumer cannot see a regulator's data, and vice versa. Data in transit is encrypted with TLS 1.3. Wallet authentication is handled through Privy's embedded wallet infrastructure.</p>
        </Section>

        <Section title="10. Changes to This Policy">
          <p>We may update this policy to reflect changes in our practices or applicable law. Material changes will be communicated by email to registered users. Continued use of the platform after changes constitutes acceptance of the revised policy.</p>
        </Section>

      </div>

      <LandingFooter />
    </div>
  )
}
