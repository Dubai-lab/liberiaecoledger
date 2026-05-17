import { Link } from 'react-router-dom'
import logoCompactDark from '@/brands/logo-compact-dark.png'

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
      { label: 'Request access',      href: '/login' },
      { label: 'Recycler onboarding', href: '/login' },
      { label: 'Regulator portal',    href: '/login' },
      { label: 'NGO partnerships',    href: '/login' },
      { label: 'Board of directors',  href: '/#about' },
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
    <footer className="bg-[#0f0f0e] pt-16 pb-10 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 mb-12">
          <div className="flex-shrink-0 max-w-xs">
            <div className="flex items-center gap-2 mb-4">
              <img src={logoCompactDark} alt="EcoLedger" className="h-7 w-auto object-contain" />
            </div>
            <p className="text-sm text-[#6b6b68] leading-relaxed">
              Blockchain-powered e-waste tracking for Liberia. Making accountability verifiable, one device at a time.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 flex-1">
            {cols.map(col => (
              <div key={col.title}>
                <p className="text-[10px] font-bold tracking-widest text-[#6b6b68] uppercase mb-4">{col.title}</p>
                <ul className="space-y-2.5">
                  {col.links.map(l => (
                    <li key={l.label}>
                      {l.href.startsWith('/') && !l.href.startsWith('/#') ? (
                        <Link to={l.href} className="text-sm text-[#9b9b98] hover:text-white transition-colors">
                          {l.label}
                        </Link>
                      ) : (
                        <a href={l.href} className="text-sm text-[#9b9b98] hover:text-white transition-colors">
                          {l.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#6b6b68]">© 2026 EcoLedger Foundation · Liberia, West Africa · Built for the SDGs</p>
          <p className="text-xs text-[#6b6b68]">Sepolia Testnet · EcoToken 0xffEA…1B4 · EcoLedger 0xb4Fa…2E</p>
        </div>
      </div>
    </footer>
  )
}
