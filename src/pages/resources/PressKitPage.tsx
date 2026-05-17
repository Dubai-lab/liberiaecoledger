import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'
import logoCompactDark from '@/brands/logo-compact-dark.png'
import logoCompactLight from '@/brands/logo-compact-light.png'
import logoDark from '@/brands/logo-dark.png'

function AssetCard({ label, bg, children }: { label: string; bg: string; children: React.ReactNode }) {
  return (
    <div className="border border-[#e8e5de] rounded-2xl overflow-hidden">
      <div className={`${bg} h-36 flex items-center justify-center p-6`}>
        {children}
      </div>
      <div className="px-4 py-3 flex items-center justify-between">
        <p className="text-xs font-medium text-[#6b6b68]">{label}</p>
        <span className="text-[10px] text-[#9b9b98]">PNG</span>
      </div>
    </div>
  )
}

export function PressKitPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNav alwaysOpaque />

      <div className="bg-[#fafaf8] border-b border-[#e8e5de] pt-24 pb-10 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-semibold tracking-widest text-[#9b9b98] uppercase mb-2">Resources</p>
          <h1 className="text-4xl font-bold text-[#0f0f0e] mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>
            Press Kit
          </h1>
          <p className="text-sm text-[#9b9b98]">Brand assets, boilerplate copy, and media contact for journalists and partners.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">

        {/* About blurb */}
        <div>
          <p className="text-[10px] font-bold tracking-widest text-[#9b9b98] uppercase mb-4">About EcoLedger</p>
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
              <div key={b.label} className="bg-[#fafaf8] rounded-xl p-5 border border-[#e8e5de]">
                <p className="text-[10px] font-bold tracking-widest text-[#9b9b98] uppercase mb-2">{b.label}</p>
                <p className="text-sm text-[#0f0f0e] leading-relaxed">{b.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Key facts */}
        <div>
          <p className="text-[10px] font-bold tracking-widest text-[#9b9b98] uppercase mb-4">Key Facts</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { label: 'Founded',         value: '2025' },
              { label: 'Headquarters',    value: 'Monrovia, Liberia' },
              { label: 'Blockchain',      value: 'Ethereum Sepolia (EVM)' },
              { label: 'Stack',           value: 'React · Supabase · Hardhat · Solidity' },
              { label: 'SDGs targeted',   value: '12, 13, 3, 11' },
              { label: 'Stakeholder roles', value: 'Consumer, Manufacturer, Recycler, Regulator, Auditor' },
              { label: 'Mobile app',      value: 'Progressive Web App (PWA) for field recyclers' },
              { label: 'Contact',         value: 'press@liberiaecoledger.com' },
            ].map(f => (
              <div key={f.label} className="flex gap-3 border border-[#e8e5de] rounded-xl px-4 py-3">
                <p className="text-xs font-semibold text-[#9b9b98] w-36 flex-shrink-0">{f.label}</p>
                <p className="text-sm text-[#0f0f0e]">{f.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Logo assets */}
        <div>
          <p className="text-[10px] font-bold tracking-widest text-[#9b9b98] uppercase mb-2">Logo Assets</p>
          <p className="text-sm text-[#9b9b98] mb-5">Use logos as provided. Do not alter colours, proportions, or add effects. Minimum clear space equals the height of the "E" in EcoLedger.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AssetCard label="Logo dark (on light backgrounds)" bg="bg-[#f5f5f2]">
              <img src={logoDark} alt="EcoLedger logo dark" className="max-h-16 w-auto object-contain" />
            </AssetCard>
            <AssetCard label="Compact logo — light variant" bg="bg-[#fafaf8]">
              <img src={logoCompactLight} alt="EcoLedger compact light" className="max-h-16 w-auto object-contain" />
            </AssetCard>
            <AssetCard label="Compact logo — dark variant" bg="bg-[#0f0f0e]">
              <img src={logoCompactDark} alt="EcoLedger compact dark" className="max-h-16 w-auto object-contain" />
            </AssetCard>
          </div>
        </div>

        {/* Brand colours */}
        <div>
          <p className="text-[10px] font-bold tracking-widest text-[#9b9b98] uppercase mb-4">Brand Colours</p>
          <div className="flex flex-wrap gap-4">
            {[
              { name: 'Forest',     hex: '#2d6a3f', text: 'white' },
              { name: 'Near Black', hex: '#0f0f0e', text: 'white' },
              { name: 'Warm White', hex: '#fafaf8', text: '#0f0f0e' },
              { name: 'Stone',      hex: '#9b9b98', text: 'white' },
              { name: 'Border',     hex: '#e8e5de', text: '#0f0f0e' },
            ].map(c => (
              <div key={c.name} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl border border-[#e8e5de] flex-shrink-0" style={{ background: c.hex }} />
                <div>
                  <p className="text-sm font-semibold text-[#0f0f0e]">{c.name}</p>
                  <p className="text-xs font-mono text-[#9b9b98]">{c.hex}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Media contact */}
        <div className="bg-[#0f0f0e] rounded-2xl p-8">
          <p className="text-[10px] font-bold tracking-widest text-[#6b6b68] uppercase mb-3">Media Contact</p>
          <p className="text-white font-bold text-lg mb-1">EcoLedger Foundation — Press Office</p>
          <p className="text-[#9b9b98] text-sm mb-4">For interview requests, editorial use of assets, or partnership enquiries:</p>
          <a href="mailto:press@liberiaecoledger.com" className="text-[#6dba7f] text-sm font-semibold hover:underline">
            press@liberiaecoledger.com
          </a>
          <p className="text-[#6b6b68] text-xs mt-2">We aim to respond to media enquiries within 48 hours.</p>
        </div>

      </div>

      <LandingFooter />
    </div>
  )
}
