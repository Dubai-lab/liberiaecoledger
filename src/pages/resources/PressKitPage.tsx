import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'
import logoCompactDark from '@/brands/logo-compact-dark.png'
import logoCompactLight from '@/brands/logo-compact-light.png'
import logoDark from '@/brands/logo-dark.png'

function AssetCard({ label, bg, children }: { label: string; bg: string; children: React.ReactNode }) {
  return (
    <div className="border border-brand-line rounded-2xl overflow-hidden">
      <div className={`${bg} h-36 flex items-center justify-center p-6`}>
        {children}
      </div>
      <div className="px-4 py-3 flex items-center justify-between">
        <p className="text-xs font-medium text-brand-muted">{label}</p>
        <span className="text-[10px] text-brand-muted">PNG</span>
      </div>
    </div>
  )
}

export function PressKitPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNav alwaysOpaque />

      <div className="bg-brand-tint border-b border-brand-line pt-32 pb-10 px-5 md:px-8 lg:px-12">
        <div className="max-w-content mx-auto">
          <p className="text-[11px] font-semibold tracking-widest text-brand-muted uppercase mb-2">Resources</p>
          <h1 className="text-4xl font-bold text-brand mb-3 font-display font-bold">
            Press Kit
          </h1>
          <p className="text-sm text-brand-muted">Brand assets, boilerplate copy, and media contact for journalists and partners.</p>
        </div>
      </div>

      <div className="max-w-content mx-auto box-content px-5 md:px-8 lg:px-12 py-12 space-y-12">

        {/* About blurb */}
        <div>
          <p className="text-[10px] font-bold tracking-widest text-brand-muted uppercase mb-4">About EcoLedger</p>
          <div className="space-y-4">
            {[
              {
                label: 'One sentence',
                text: 'EcoLedger is a permissioned blockchain registry that tracks every electronic device in Liberia from point of sale to verified end-of-life disposal.',
              },
              {
                label: 'Short paragraph',
                text: 'EcoLedger is a Liberia-based environmental technology platform that uses blockchain technology to create immutable, verifiable lifecycle records for electronic devices. The system connects manufacturers, recyclers, regulators, and consumers on a single ledger — reducing illegal e-waste dumping, strengthening regulatory compliance, and rewarding responsible disposal through an EcoCredits incentive programme. The platform is live on Ethereum Sepolia and is building toward full integration with EPA Liberia.',
              },
              {
                label: 'Full description',
                text: 'Founded in 2025 as academic research into Liberia\'s informal e-waste economy, EcoLedger has grown into a full-stack environmental management system. Liberia generates approximately 8,000 tonnes of e-waste annually, with less than 3% formally recovered. EcoLedger addresses this by minting an on-chain record for every device sold in the country, creating a chain of custody that is publicly auditable and tamper-proof. Manufacturers fulfil Extended Producer Responsibility obligations through the platform. EPA-certified recyclers log verified disposals that automatically trigger EcoCredit rewards to device owners — redeemable for mobile money via Orange Money and MTN MoMo. Regulators access a national compliance map and investigation tools. The platform is aligned with UN SDGs 12 (Responsible Consumption), 13 (Climate Action), 3 (Health), and 11 (Sustainable Cities).',
              },
            ].map(b => (
              <div key={b.label} className="bg-brand-tint rounded-xl p-5 border border-brand-line">
                <p className="text-[10px] font-bold tracking-widest text-brand-muted uppercase mb-2">{b.label}</p>
                <p className="text-sm text-brand-ink leading-relaxed">{b.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Key facts */}
        <div>
          <p className="text-[10px] font-bold tracking-widest text-brand-muted uppercase mb-4">Key Facts</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { label: 'Founded',         value: '2025' },
              { label: 'Headquarters',    value: 'Monrovia, Liberia' },
              { label: 'Blockchain',      value: 'Ethereum Sepolia (EVM)' },
              { label: 'Stack',           value: 'React · Supabase · Hardhat · Solidity' },
              { label: 'SDGs targeted',   value: '12, 13, 3, 11' },
              { label: 'Stakeholder roles', value: 'Consumer, Manufacturer, Recycler, Regulator, Auditor' },
              { label: 'Mobile app',      value: 'Progressive Web App (PWA) for field recyclers' },
              { label: 'Contact',         value: 'support@liberiaecoledger.com' },
            ].map(f => (
              <div key={f.label} className="flex gap-3 border border-brand-line rounded-xl px-4 py-3">
                <p className="text-xs font-semibold text-brand-muted w-36 flex-shrink-0">{f.label}</p>
                <p className="text-sm text-brand-ink">{f.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Logo assets */}
        <div>
          <p className="text-[10px] font-bold tracking-widest text-brand-muted uppercase mb-2">Logo Assets</p>
          <p className="text-sm text-brand-muted mb-5">Use logos as provided. Do not alter colours, proportions, or add effects. Minimum clear space equals the height of the "E" in EcoLedger.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AssetCard label="Logo dark (on light backgrounds)" bg="bg-brand-tint">
              <img src={logoDark} alt="EcoLedger logo dark" className="max-h-16 w-auto object-contain" />
            </AssetCard>
            <AssetCard label="Compact logo — light variant" bg="bg-brand-tint">
              <img src={logoCompactLight} alt="EcoLedger compact light" className="max-h-16 w-auto object-contain" />
            </AssetCard>
            <AssetCard label="Compact logo — dark variant" bg="bg-brand">
              <img src={logoCompactDark} alt="EcoLedger compact dark" className="max-h-16 w-auto object-contain" />
            </AssetCard>
          </div>
        </div>

        {/* Brand colours */}
        <div>
          <p className="text-[10px] font-bold tracking-widest text-brand-muted uppercase mb-4">Brand Colours</p>
          <div className="flex flex-wrap gap-4">
            {[
              { name: 'Primary Forest Green', hex: '#083D24', text: 'white' },
              { name: 'Secondary Green',      hex: '#0F482E', text: 'white' },
              { name: 'Deep Green',           hex: '#063921', text: 'white' },
              { name: 'Muted Sage',           hex: '#748C7F', text: 'white' },
              { name: 'Light Sage',           hex: '#D7E0D5', text: '#102F27' },
              { name: 'Primary Text',         hex: '#102F27', text: 'white' },
              { name: 'Muted Text',           hex: '#566D62', text: 'white' },
              { name: 'White',                hex: '#FFFFFF', text: '#102F27' },
            ].map(c => (
              <div key={c.name} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl border border-brand-line flex-shrink-0" style={{ background: c.hex }} />
                <div>
                  <p className="text-sm font-semibold text-brand-ink">{c.name}</p>
                  <p className="text-xs font-mono text-brand-muted">{c.hex}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Media contact */}
        <div className="bg-brand-deep rounded-2xl p-8">
          <p className="text-[10px] font-bold tracking-widest text-white/60 uppercase mb-3">Media Contact</p>
          <p className="text-white font-bold text-lg mb-1">EcoLedger Foundation — Press Office</p>
          <p className="text-white/70 text-sm mb-4">For interview requests, editorial use of assets, or partnership enquiries:</p>
          <a href="mailto:support@liberiaecoledger.com" className="text-[#8FD3A8] text-sm font-semibold hover:underline">
            support@liberiaecoledger.com
          </a>
          <p className="text-white/60 text-xs mt-2">We aim to respond to media enquiries within 48 hours.</p>
        </div>

      </div>

      <LandingFooter />
    </div>
  )
}
