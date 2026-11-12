import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { EcoLedgerLogo } from '@/components/brand/EcoLedgerLogo'

const cols = [
  {
    title: 'Platform',
    links: [
      { label: 'Consumers',         href: '/platform/consumers' },
      { label: 'Manufacturers',     href: '/platform/manufacturers' },
      { label: 'Recyclers',         href: '/platform/recyclers' },
      { label: 'Regulators',        href: '/platform/regulators' },
      { label: 'Public & Auditors', href: '/platform/auditors' },
    ],
  },
  {
    title: 'Stakeholders',
    links: [
      { label: 'Request access',      href: '/stakeholders/request-access' },
      { label: 'Recycler onboarding', href: '/stakeholders/recycler-onboarding' },
      { label: 'Regulator portal',    href: '/stakeholders/regulator-portal' },
      { label: 'NGO partnerships',    href: '/stakeholders/ngo-partnerships' },
      { label: 'Board of directors',  href: '/stakeholders/board' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Whitepaper',     href: '/whitepaper' },
      { label: 'API docs',       href: '/api-docs' },
      { label: 'Block explorer', href: '/block-explorer' },
      { label: 'Press kit',      href: '/press-kit' },
      { label: 'Changelog',      href: '/changelog' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy',    href: '/privacy' },
      { label: 'Terms of Service',  href: '/terms' },
      { label: 'Cookie Policy',     href: '/cookies' },
      { label: 'Code of Ethics',    href: '/ethics' },
      { label: 'GDPR compliance',   href: '/gdpr' },
    ],
  },
]

export function LandingFooter() {
  return (
    <footer className="bg-brand-deep text-white">
      <div className="max-w-content mx-auto px-5 md:px-8 lg:px-12 pt-14 lg:pt-16 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_repeat(4,max-content)] gap-10 lg:gap-0">
          {/* Brand + CTA */}
          <div className="lg:pr-10">
            <EcoLedgerLogo tone="dark" />
            <p className="text-sm text-white/80 leading-relaxed mt-4 max-w-xs">
              Blockchain-powered e-waste tracking for Liberia. Making accountability verifiable, one device at a time.
            </p>
            <Link
              to="/stakeholders/request-access"
              className="inline-flex items-center gap-2 h-11 px-5 mt-6 rounded-lg bg-white text-brand text-sm font-semibold hover:bg-brand-tint transition-colors whitespace-nowrap"
            >
              Request access <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:contents">
            {cols.map(col => (
              <div key={col.title} className="lg:border-l lg:border-white/15 lg:px-7 xl:px-9">
                <p className="font-display text-[15px] font-semibold text-white mb-4">{col.title}</p>
                <ul className="space-y-2.5">
                  {col.links.map(l => (
                    <li key={l.label}>
                      <Link to={l.href} className="text-sm text-white/75 hover:text-white transition-colors lg:whitespace-nowrap">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/15 mt-12 pt-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <p className="text-xs text-white/75">© 2026 EcoLedger Foundation · Liberia, West Africa · Built for the SDGs</p>
          <Link to="/block-explorer#ledger" className="text-xs text-white/60 hover:text-white md:border-l md:border-white/15 md:pl-6 transition-colors">
            Live on Ethereum Sepolia · View the public ledger →
          </Link>
        </div>
      </div>
    </footer>
  )
}
