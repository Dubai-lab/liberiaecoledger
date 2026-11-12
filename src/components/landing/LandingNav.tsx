import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { EcoLedgerLogo } from '@/components/brand/EcoLedgerLogo'

interface Props {
  alwaysOpaque?: boolean
}

const LINKS = [
  { label: 'Platform',         id: 'how-it-works' },
  { label: 'For stakeholders', id: 'platforms' },
  { label: 'Public ledger',    id: 'trust' },
  { label: 'Impact',           id: 'sdg' },
  { label: 'Story',            id: 'about' },
]

/** Tracks which landing section is in view and how far down the page the visitor is. */
function useScrollSpy(enabled: boolean) {
  const [active, setActive] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!enabled) { setActive(null); setProgress(0); return }
    let frame = 0
    const update = () => {
      frame = 0
      const line = window.innerHeight * 0.35
      let current: string | null = null
      for (const { id } of LINKS) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= line) current = id
      }
      setActive(current)
      const max = document.documentElement.scrollHeight - window.innerHeight
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0)
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [enabled])

  return { active, progress }
}

export function LandingNav({ alwaysOpaque = false }: Props) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const onLanding = pathname === '/'
  const { active, progress } = useScrollSpy(onLanding)
  const stripRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (alwaysOpaque) return
    const fn = () => setScrolled(window.scrollY > 20)
    fn()
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [alwaysOpaque])

  // Keep the active tab visible in the mobile section strip
  useEffect(() => {
    if (!active || !stripRef.current) return
    const tab = stripRef.current.querySelector<HTMLElement>(`[data-section="${active}"]`)
    tab?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [active])

  const opaque = alwaysOpaque || scrolled || open
  const showStrip = onLanding && scrolled && !open

  const livePill = (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-brand border border-brand-line bg-white rounded-full px-3 py-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-[#2E9B5B] animate-pulse" />
      LIVE · SEPOLIA
    </span>
  )

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        opaque ? 'bg-white/95 backdrop-blur border-b border-brand-line' : 'bg-transparent'
      }`}
    >
      <div className="max-w-content mx-auto px-5 md:px-8 lg:px-12 h-[72px] flex items-center gap-8">
        <a href="/" className="flex-shrink-0" aria-label="EcoLedger home">
          <EcoLedgerLogo />
        </a>

        <nav className="hidden lg:flex items-center justify-center gap-8 flex-1 h-full" aria-label="Page sections">
          {LINKS.map(l => {
            const isActive = active === l.id
            return (
              <a
                key={l.id}
                href={`/#${l.id}`}
                aria-current={isActive ? 'location' : undefined}
                className={`relative h-full inline-flex items-center text-sm font-medium transition-colors ${
                  isActive ? 'text-brand' : 'text-brand-ink hover:text-brand'
                }`}
              >
                {l.label}
                {isActive && (
                  <motion.span
                    layoutId="nav-active-section"
                    className="absolute left-0 right-0 bottom-3 h-[2px] rounded-full bg-brand"
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  />
                )}
              </a>
            )
          })}
        </nav>

        <div className="hidden lg:flex items-center gap-5 flex-shrink-0">
          {livePill}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-sm font-medium text-brand-ink hover:text-brand transition-colors"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => navigate('/stakeholders/request-access')}
            className="h-11 px-5 rounded-full bg-brand text-white text-sm font-semibold hover:bg-brand-secondary transition-colors"
          >
            Get access
          </button>
        </div>

        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          className="lg:hidden ml-auto p-2 -mr-2 text-brand-ink"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile / tablet: horizontal section strip */}
      {showStrip && (
        <div className="lg:hidden border-t border-brand-line bg-white/95">
          <div
            ref={stripRef}
            className="max-w-content mx-auto px-5 md:px-8 flex gap-2 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Page sections"
          >
            {LINKS.map(l => {
              const isActive = active === l.id
              return (
                <a
                  key={l.id}
                  data-section={l.id}
                  href={`/#${l.id}`}
                  aria-current={isActive ? 'location' : undefined}
                  className={`flex-shrink-0 h-8 px-3.5 inline-flex items-center rounded-full text-xs font-semibold transition-colors ${
                    isActive ? 'bg-brand text-white' : 'bg-brand-tint text-brand-muted'
                  }`}
                >
                  {l.label}
                </a>
              )
            })}
          </div>
        </div>
      )}

      {/* Reading progress */}
      {onLanding && scrolled && (
        <div className="absolute left-0 right-0 bottom-0 h-[2px] bg-transparent" aria-hidden="true">
          <div className="h-full bg-brand origin-left" style={{ transform: `scaleX(${progress})` }} />
        </div>
      )}

      {open && (
        <div className="lg:hidden bg-white border-t border-brand-line px-5 md:px-8 py-4 space-y-1">
          {LINKS.map(l => (
            <a
              key={l.id}
              href={`/#${l.id}`}
              onClick={() => setOpen(false)}
              className={`block text-[15px] font-medium py-2.5 ${active === l.id ? 'text-brand' : 'text-brand-ink'}`}
            >
              {l.label}
            </a>
          ))}
          <div className="pt-3">{livePill}</div>
          <div className="pt-4 mt-2 border-t border-brand-line flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="flex-1 h-11 text-sm font-medium text-brand-ink border border-brand-line rounded-full"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => navigate('/stakeholders/request-access')}
              className="flex-1 h-11 text-sm font-semibold bg-brand text-white rounded-full"
            >
              Get access
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
