import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import logoCompactLight from '@/brands/logo-compact-light.png'

interface Props {
  alwaysOpaque?: boolean
}

export function LandingNav({ alwaysOpaque = false }: Props) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (alwaysOpaque) return
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [alwaysOpaque])

  const opaque = alwaysOpaque || scrolled

  const links = [
    { label: 'Platform',         href: '/#how-it-works' },
    { label: 'For stakeholders', href: '/#platforms' },
    { label: 'Public ledger',    href: '/#trust' },
    { label: 'Impact',           href: '/#sdg' },
    { label: 'Story',            href: '/#about' },
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        opaque ? 'bg-white/95 backdrop-blur border-b border-[#e8e5de]' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-8">
        <a href="/" className="flex items-center gap-2 flex-shrink-0">
          <img src={logoCompactLight} alt="EcoLedger" className="h-7 w-auto object-contain" />
        </a>

        <nav className="hidden lg:flex items-center gap-7 flex-1">
          {links.map(l => (
            <a
              key={l.label}
              href={l.href}
              className="text-sm text-[#6b6b68] hover:text-[#0f0f0e] transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-4 ml-auto">
          <span className="flex items-center gap-1.5 text-[10px] font-semibold tracking-widest text-[#9b9b98] border border-[#e8e5de] rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2d6a3f] animate-pulse" />
            LIVE · SEPOLIA
          </span>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-sm text-[#0f0f0e] hover:text-[#6b6b68] transition-colors font-medium"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-sm font-semibold px-4 py-2 rounded-lg bg-[#0f0f0e] text-white hover:bg-[#2a2a28] transition-colors"
          >
            Get access
          </button>
        </div>

        <button type="button" className="lg:hidden ml-auto" onClick={() => setOpen(!open)}>
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="#0f0f0e" strokeWidth={2}>
            {open ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M3 12h18M3 6h18M3 18h18" />}
          </svg>
        </button>
      </div>

      {open && (
        <div className="lg:hidden bg-white border-t border-[#e8e5de] px-6 py-4 space-y-3">
          {links.map(l => (
            <a key={l.label} href={l.href} onClick={() => setOpen(false)} className="block text-sm text-[#0f0f0e] py-1">{l.label}</a>
          ))}
          <div className="pt-3 border-t border-[#e8e5de] flex gap-3">
            <button type="button" onClick={() => navigate('/login')} className="flex-1 py-2 text-sm border border-[#e8e5de] rounded-lg">Sign in</button>
            <button type="button" onClick={() => navigate('/login')} className="flex-1 py-2 text-sm bg-[#0f0f0e] text-white rounded-lg font-semibold">Get access</button>
          </div>
        </div>
      )}
    </header>
  )
}
