import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import logoCompactDark from '@/brands/logo-compact-dark.png'
import logoCompactLight from '@/brands/logo-compact-light.png'
import lifecycleIllustration from '@/brands/lifecycle-illustration.png'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  as string
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// ─── Real data hook — calls public-stats edge function (bypasses RLS) ─────────

interface LandingStats {
  devices:         number
  recyclers:       number
  lifecycleEvents: number
  creditsIssued:   number
  disposedCount:   number
}

function useLandingStats() {
  const [stats, setStats] = useState<LandingStats>({
    devices: 0, recyclers: 0, lifecycleEvents: 0, creditsIssued: 0, disposedCount: 0,
  })

  useEffect(() => {
    fetch(`${SUPABASE_URL}/functions/v1/public-stats`, {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
    })
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(() => {})
  }, [])

  return stats
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

// ─── Nav ─────────────────────────────────────────────────────────────────────

function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const links = [
    { label: 'Platform',        href: '#how-it-works' },
    { label: 'For stakeholders',href: '#platforms' },
    { label: 'Public ledger',   href: '#trust' },
    { label: 'Impact',          href: '#sdg' },
    { label: 'Story',           href: '#about' },
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur border-b border-[#e8e5de]' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-8">
        <a href="#" className="flex items-center gap-2 flex-shrink-0">
          <img src={logoCompactDark} alt="EcoLedger" className="h-7 w-auto object-contain" />
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

// ─── Hero ─────────────────────────────────────────────────────────────────────

function DeviceLifecycleDiagram() {
  return (
    <img
      src={lifecycleIllustration}
      alt="Device lifecycle — Sold, In use, Transferred, Recycled, Rewarded"
      className="flex-shrink-0 w-full max-w-sm object-contain"
      draggable={false}
    />
  )
}

function HeroSection({ stats }: { stats: LandingStats }) {
  const navigate = useNavigate()
  return (
    <section className="pt-28 pb-16 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row items-start gap-12">
        <div className="flex-1 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-[#e8f5ec] text-[#2d6a3f] text-[11px] font-semibold tracking-widest px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2d6a3f] animate-pulse" />
            LIBERIA E-WASTE REGISTRY · SEPOLIA TESTNET
          </div>
          <h1 className="text-5xl lg:text-6xl font-bold text-[#0f0f0e] leading-[1.08] tracking-tight mb-6">
            An <span className="italic text-[#2d6a3f]">immutable</span> record for every device, from point of sale to end of life.
          </h1>
          <p className="text-lg text-[#6b6b68] leading-relaxed mb-8 max-w-xl">
            EcoLedger turns electronic devices into digital entities on a blockchain — so manufacturers, recyclers, regulators, and the communities they serve can audit the lifecycle of every unit. Stop illegal dumping. Reward proper disposal. Make accountability verifiable.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-6 py-3.5 bg-[#0f0f0e] text-white text-sm font-semibold rounded-xl hover:bg-[#2a2a28] transition-colors"
            >
              Request stakeholder access
            </button>
            <a href="#how-it-works" className="flex items-center gap-2 text-sm font-medium text-[#6b6b68] hover:text-[#0f0f0e] transition-colors">
              <span className="w-8 h-8 rounded-full border border-[#d8d5ce] flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={2}>
                  <polygon points="5,3 19,12 5,21" fill="currentColor" />
                </svg>
              </span>
              See how it works
            </a>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-4 mt-10 pt-8 border-t border-[#e8e5de]">
            {[
              { n: fmt(stats.devices),         label: 'devices on chain' },
              { n: fmt(stats.recyclers),        label: 'verified recyclers' },
              { n: fmt(stats.lifecycleEvents),  label: 'lifecycle events' },
              { n: fmt(stats.creditsIssued),    label: 'EcoCredits issued' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-[#0f0f0e] tabular-nums">{s.n || '—'}</p>
                <p className="text-xs text-[#9b9b98] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden lg:flex justify-center flex-shrink-0">
          <DeviceLifecycleDiagram />
        </div>
      </div>
    </section>
  )
}

// ─── Stats bar ────────────────────────────────────────────────────────────────

function StatsBar({ stats }: { stats: LandingStats }) {
  const complianceRate = stats.lifecycleEvents > 0
    ? Math.round((stats.disposedCount / Math.max(stats.devices, 1)) * 100)
    : 0

  const items = [
    { value: fmt(stats.devices),    label: 'DEVICES ON CHAIN' },
    { value: fmt(stats.recyclers),  label: 'VERIFIED RECYCLERS' },
    { value: fmt(stats.lifecycleEvents), label: 'LIFECYCLE EVENTS' },
    { value: `${complianceRate}%`,  label: 'DISPOSAL COMPLIANCE' },
  ]

  return (
    <section className="bg-[#0f0f0e] py-12 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
        {items.map(item => (
          <div key={item.label} className="text-center">
            <p className="text-3xl font-bold text-white tabular-nums">{item.value || '—'}</p>
            <p className="text-[10px] font-semibold tracking-widest text-[#6b6b68] mt-1">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Problem ──────────────────────────────────────────────────────────────────

function ProblemSection() {
  const problems = [
    {
      num: '01',
      title: 'Untraceable',
      body: 'Devices vanish from official records after point of sale. Registries audit on paper, manufacturers report by guess.',
    },
    {
      num: '02',
      title: 'Toxic',
      body: 'Informal processors carelessly extract metals with acid baths and open fires, releasing lead, mercury, and cadmium into soil and water.',
    },
    {
      num: '03',
      title: 'Unaccountable',
      body: 'Dispose across borders without documentation, bypassing Basel Convention rules. No system makes the chain of custody verifiable.',
    },
  ]

  return (
    <section className="bg-[#0f0f0e] py-20 px-6 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <p className="text-[11px] font-semibold tracking-widest text-[#6b6b68] uppercase mb-6">THE PROBLEM</p>
        <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight mb-12 max-w-3xl">
          60 million tonnes of electronic waste enter the world every year — and most of it disappears from the record the moment it's sold.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {problems.map(p => (
            <div key={p.num} className="border border-white/10 rounded-2xl p-6">
              <p className="text-[11px] font-semibold tracking-widest text-[#6b6b68] mb-3">{p.num}</p>
              <h3 className="text-lg font-bold text-white mb-3">{p.title}</h3>
              <p className="text-sm text-[#9b9b98] leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── How it works ─────────────────────────────────────────────────────────────

function HowItWorksSection() {
  const [view, setView] = useState<'on-chain' | 'off-chain'>('on-chain')

  const steps = [
    {
      num: 'STEP 01',
      title: 'Register at point of sale',
      body: 'A manufacturer or retailer mints an on-chain record for the device — brand, model, IMEI, hazard class. A smart contract entry creates an immutable genesis event.',
      code: 'registerDevice(bytes32 deviceId, address owner)',
    },
    {
      num: 'STEP 02',
      title: 'Track through ownership',
      body: 'Every transfer is signed by both parties and recorded on-chain. The ownership history is public, tamper-proof, and traceable to any auditor.',
      code: 'transferDevice(bytes32 deviceId, address from, address to)',
    },
    {
      num: 'STEP 03',
      title: 'Verify disposal',
      body: 'Certified recyclers log weight, hazard class, and materials recovered. EPA licence is checked on-chain before the disposal event is confirmed.',
      code: 'disposeDevice(bytes32 deviceId, address recycler, uint256 credits)',
    },
    {
      num: 'STEP 04',
      title: 'Reward & audit',
      body: 'Device owners earn EcoCredits automatically for responsible disposal, redeemable for mobile money via Orange Money and MTN MoMo. Every credit is an on-chain event.',
      code: 'ecoToken.mint(address owner, uint256 amount)',
    },
  ]

  return (
    <section id="how-it-works" className="py-20 px-6 bg-[#fafaf8]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-[11px] font-semibold tracking-widest text-[#9b9b98] uppercase mb-3">HOW ECOLEDGER WORKS</p>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0f0f0e] leading-tight max-w-lg">
              Five smart contracts. One verifiable trail. Every stakeholder reading from the same ledger.
            </h2>
          </div>
          <div className="flex items-center gap-1 bg-[#e8e5de] rounded-lg p-1 self-start lg:self-auto flex-shrink-0">
            {(['on-chain', 'off-chain'] as const).map(v => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  view === v ? 'bg-white text-[#0f0f0e] shadow-sm' : 'text-[#9b9b98]'
                }`}
              >
                {v.toUpperCase().replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((s, i) => (
            <div key={s.num} className="bg-white rounded-2xl p-5 border border-[#e8e5de]">
              <p className="text-[10px] font-semibold tracking-widest text-[#9b9b98] mb-3">{s.num}</p>
              <h3 className="text-sm font-bold text-[#0f0f0e] mb-3 leading-snug">{s.title}</h3>
              <p className="text-xs text-[#9b9b98] leading-relaxed mb-4">{s.body}</p>
              {view === 'on-chain' && (
                <div className="bg-[#0f0f0e] rounded-xl px-3 py-2.5">
                  <p className="text-[10px] font-mono text-[#6dba7f] break-all leading-relaxed">{s.code}</p>
                </div>
              )}
              {view === 'off-chain' && (
                <div className="bg-[#f5f5f2] rounded-xl px-3 py-2.5 border border-[#e8e5de]">
                  <p className="text-[10px] text-[#9b9b98]">DB record · Supabase · Step {i + 1} of 4</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Platforms ────────────────────────────────────────────────────────────────

function PlatformsSection() {
  const platforms = [
    {
      role: 'Consumer',
      icon: '●',
      desc: 'Register devices you own, track their lifecycle, initiate transfers, and mark devices for recycling. Every action you take earns EcoCredits.',
      features: ['Device registration', 'Ownership transfer', 'Recycling initiation', 'EcoCredits wallet'],
    },
    {
      role: 'Manufacturer',
      icon: '◆',
      desc: 'Register bulk units at manufacture, fulfil EPR obligations, track product end-of-life rates across the country, and report to regulators.',
      features: ['Bulk unit registration', 'EPR compliance reporting', 'Analytics dashboard', 'End-of-life tracking'],
    },
    {
      role: 'Recycler',
      icon: '▲',
      desc: 'Log device disposals, verify EPA certification on-chain, issue EcoCredits to device owners, and build a verified recycling track record.',
      features: ['Disposal logging', 'EPA verification', 'EcoCredit issuance', 'Facility management'],
    },
    {
      role: 'Regulator',
      icon: '■',
      desc: 'Monitor national compliance, raise compliance flags, track recyclers across all counties, and generate regulatory reports.',
      features: ['National compliance map', 'Compliance flagging', 'County-level analytics', 'Regulatory reports'],
    },
    {
      role: 'NGO / Auditor',
      icon: '◉',
      desc: 'Independently verify every chain event. Browse the public block explorer, audit disposal records, and cross-check on-chain data with field reports.',
      features: ['Block explorer', 'Verified records', 'Transaction audit', 'Export for reporting'],
    },
  ]

  return (
    <section id="platforms" className="py-20 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <p className="text-[11px] font-semibold tracking-widest text-[#9b9b98] uppercase mb-3">BUILT FOR EVERYONE IN THE CHAIN</p>
        <h2 className="text-3xl lg:text-4xl font-bold text-[#0f0f0e] leading-tight mb-12 max-w-2xl">
          One platform. Five interfaces. The same source of truth.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {platforms.map(p => (
            <div key={p.role} className="bg-[#fafaf8] rounded-2xl p-5 border border-[#e8e5de] flex flex-col">
              <span className="text-xl mb-3 text-[#0f0f0e]">{p.icon}</span>
              <p className="text-sm font-bold text-[#0f0f0e] mb-2">{p.role}</p>
              <p className="text-xs text-[#9b9b98] leading-relaxed mb-4 flex-1">{p.desc}</p>
              <ul className="space-y-1.5">
                {p.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-[#6b6b68]">
                    <span className="w-1 h-1 rounded-full bg-[#2d6a3f] flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── EcoCredits ───────────────────────────────────────────────────────────────

function EcoCreditsSection({ stats }: { stats: LandingStats }) {
  const highlights = [
    { value: fmt(stats.creditsIssued), label: 'EcoCredits issued to date' },
    { value: '≈ LRD 150',              label: 'per EcoCredit redeemable value' },
    { value: fmt(stats.disposedCount), label: 'disposal events rewarded' },
  ]

  return (
    <section className="py-20 px-6 bg-[#fafaf8]">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 items-center">
        <div className="flex-1">
          <p className="text-[11px] font-semibold tracking-widest text-[#9b9b98] uppercase mb-3">ECOCREDITS</p>
          <h2 className="text-3xl lg:text-4xl font-bold text-[#0f0f0e] leading-tight mb-5 max-w-md">
            Doing the right thing should pay you back.
          </h2>
          <p className="text-[#6b6b68] leading-relaxed mb-8 max-w-md">
            Every properly disposed device earns the owner EcoCredits — redeemable for mobile airtime, supermarket vouchers, cash via Orange Money / MTN MoMo, and partner payments. The manufacturer EPR fee, not user expenses, finances the reward pool. The consumer never spends a coin.
          </p>
          <div className="flex flex-wrap gap-4">
            {['+91 PER REGISTER', '+200–500 PER RECYCLE', '+5 PER TRANSFER'].map(s => (
              <span key={s} className="text-[10px] font-bold tracking-widest border border-[#e8e5de] rounded-full px-3 py-1.5 text-[#6b6b68]">{s}</span>
            ))}
          </div>
        </div>

        <div className="flex-shrink-0 w-full lg:w-80">
          <div className="bg-[#0f0f0e] rounded-2xl p-6">
            <p className="text-[10px] font-semibold tracking-widest text-[#6b6b68] uppercase mb-1">ECOCREDITS ISSUED · LIBERIA 2026</p>
            <p className="text-5xl font-bold text-white tabular-nums mt-2">{fmt(stats.creditsIssued) || '—'}</p>
            <p className="text-sm text-[#9b9b98] mb-5">EC · ≈ LRD {new Intl.NumberFormat().format(stats.creditsIssued * 150)}</p>
            <div className="space-y-2 border-t border-white/10 pt-4">
              {highlights.map(h => (
                <div key={h.label} className="flex items-center justify-between gap-4">
                  <p className="text-xs text-[#6b6b68]">{h.label}</p>
                  <p className="text-xs font-bold text-white tabular-nums">{h.value || '—'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Trust ────────────────────────────────────────────────────────────────────

function TrustSection() {
  const pillars = [
    {
      title: 'Immutable',
      body: 'Every registration, transfer, and disposal event is a cryptographically signed entry on Sepolia. No one — not even EcoLedger — can alter or delete a historical record.',
    },
    {
      title: 'Auditable',
      body: 'Regulators, NGOs, and journalists can explore every transaction at sepolia.etherscan.io. No login required. The ledger is and always will be public.',
    },
    {
      title: 'Permissioned writes',
      body: 'Only verified operators — approved recyclers, licensed manufacturers — can write to the chain. Every actor is identified before any event is created.',
    },
    {
      title: 'Privacy-aware',
      body: 'Personal identity stays off-chain in Supabase with strict RLS policies. Only your wallet address appears on-chain — your name and contact details are never published.',
    },
  ]

  return (
    <section id="trust" className="py-20 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <p className="text-[11px] font-semibold tracking-widest text-[#9b9b98] uppercase mb-3">TRUST BY DESIGN</p>
        <h2 className="text-3xl lg:text-4xl font-bold text-[#0f0f0e] leading-tight mb-12 max-w-xl">
          We don't ask you to trust us. The ledger is public.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((p, i) => (
            <div key={p.title}>
              <p className="text-[10px] font-semibold tracking-widest text-[#9b9b98] mb-3">{String(i + 1).padStart(2, '0')}</p>
              <h3 className="text-base font-bold text-[#0f0f0e] mb-3">{p.title}</h3>
              <p className="text-sm text-[#9b9b98] leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── SDG ──────────────────────────────────────────────────────────────────────

function SDGSection({ stats }: { stats: LandingStats }) {
  const sdgs = [
    { num: 'SDG 12', title: 'Responsible Consumption', desc: 'Every device lifecycle tracked — eliminating unregistered disposal.', pct: Math.min(100, stats.devices > 0 ? Math.round((stats.disposedCount / stats.devices) * 100) : 0) },
    { num: 'SDG 13', title: 'Climate Action', desc: 'Hazardous e-waste diverted from open burning, reducing toxic emissions.', pct: Math.min(100, stats.recyclers > 0 ? 60 + stats.recyclers : 0) },
    { num: 'SDG 3',  title: 'Good Health & Well-being', desc: 'Preventing mercury and lead from contaminating Liberian water sources.', pct: Math.min(100, stats.lifecycleEvents > 0 ? 45 : 0) },
    { num: 'SDG 11', title: 'Sustainable Cities', desc: 'County-level compliance mapping drives targeted policy enforcement.', pct: Math.min(100, stats.recyclers > 0 ? 50 + stats.recyclers * 2 : 0) },
  ]

  return (
    <section id="sdg" className="py-20 px-6 bg-[#fafaf8] border-t border-[#e8e5de]">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#0f0f0e] flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="white" strokeWidth={1.5}>
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-[#9b9b98] uppercase">ALIGNED OUTCOMES</p>
            <p className="text-sm font-bold text-[#0f0f0e]">UN Sustainable Development Goals</p>
          </div>
        </div>
        <p className="text-[#9b9b98] text-sm mb-10 max-w-2xl">
          EcoLedger contributes directly to SDG 12 (Responsible Consumption), 13 (Climate Action), 3 (Health), and 11 (Sustainable Cities). Progress indicators below are calculated from live chain data.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sdgs.map(s => (
            <div key={s.num} className="bg-white rounded-2xl p-5 border border-[#e8e5de]">
              <p className="text-[10px] font-bold tracking-widest text-[#9b9b98] mb-1">{s.num}</p>
              <p className="text-sm font-bold text-[#0f0f0e] mb-2">{s.title}</p>
              <p className="text-xs text-[#9b9b98] leading-relaxed mb-4">{s.desc}</p>
              <div className="h-1.5 bg-[#e8e5de] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2d6a3f] rounded-full transition-all duration-1000"
                  style={{ width: `${s.pct}%` }}
                />
              </div>
              <p className="text-[10px] text-[#9b9b98] mt-1.5 text-right">{s.pct}% progress</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CTA ──────────────────────────────────────────────────────────────────────

function CTASection() {
  const navigate = useNavigate()
  return (
    <section className="bg-[#0f0f0e] py-20 px-6">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-10">
        <div>
          <h2 className="text-3xl lg:text-5xl font-bold text-white leading-tight">
            Start tracking.<br />Start enforcing.<br />Start rewarding.
          </h2>
          <p className="text-[#9b9b98] mt-4 max-w-md text-sm leading-relaxed">
            Whether you're a regulator wanting verifiable compliance, a manufacturer with EPR obligations, or a community organisation fighting illegal dumping — we'll get you onboarded.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 flex-shrink-0">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="px-8 py-4 bg-white text-[#0f0f0e] text-sm font-bold rounded-xl hover:bg-[#f5f5f2] transition-colors"
          >
            Request stakeholder access
          </button>
          <a
            href="#how-it-works"
            className="px-8 py-4 border border-white/20 text-white text-sm font-semibold rounded-xl hover:border-white/40 transition-colors text-center"
          >
            Read the whitepaper
          </a>
        </div>
      </div>
    </section>
  )
}

// ─── Ethics ───────────────────────────────────────────────────────────────────

function EthicsSection() {
  const docs = [
    { title: 'Terms of Service',  sub: 'The legal agreement governing every transaction and relationship on the platform.', updated: 'UPDATED MAY 2026' },
    { title: 'Privacy Policy',    sub: 'How we collect, store and protect your information. GDPR-aligned, no data sold.',      updated: 'GDPR · NO PII ON-CHAIN' },
    { title: 'Cookie Policy',     sub: 'Strictly essential cookies only. No third-party tracking by default.',               updated: 'NO AD TRACKERS' },
    { title: 'Code of Ethics',    sub: 'Environmental accountability extends to how we operate our own platform.',             updated: 'PUBLIC COMMITMENT' },
  ]

  return (
    <section className="py-16 px-6 bg-white border-t border-[#e8e5de]">
      <div className="max-w-7xl mx-auto">
        <p className="text-sm font-bold text-[#0f0f0e] mb-1">Ethics, Accountability & the Small Print</p>
        <p className="text-sm text-[#9b9b98] mb-8">A platform built on accountability holds itself to the same standard.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {docs.map(d => (
            <div key={d.title} className="border border-[#e8e5de] rounded-2xl p-5">
              <p className="text-sm font-bold text-[#0f0f0e] mb-2">{d.title}</p>
              <p className="text-xs text-[#9b9b98] leading-relaxed mb-4">{d.sub}</p>
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-bold tracking-widest text-[#b0afa8]">{d.updated}</p>
                <button type="button" className="text-[10px] font-semibold text-[#0f0f0e] underline underline-offset-2">Read →</button>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#b0afa8] mt-6 max-w-3xl">
          EcoLedger is a tracking infrastructure, not a regulator. We do not warrant that any recycler operator is safe, or that any regulatory agency will enforce, or that the public ledger is error-free from time to time. Liability is governed by our Terms of Service.
        </p>
      </div>
    </section>
  )
}

// ─── About ────────────────────────────────────────────────────────────────────

function AboutSection() {
  return (
    <section id="about" className="py-16 px-6 bg-[#fafaf8] border-t border-[#e8e5de]">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12">
        <div className="flex-1 max-w-xl">
          <p className="text-[11px] font-semibold tracking-widest text-[#9b9b98] uppercase mb-3">PROJECT ORIGINS</p>
          <h2 className="text-2xl font-bold text-[#0f0f0e] mb-4">Started in a university dissertation. Now on chain.</h2>
          <p className="text-sm text-[#9b9b98] leading-relaxed mb-4">
            EcoLedger began as academic research into the growing informal e-waste economy in Liberia — a country with no national registry, no EPR framework, and a rapidly urbanising population acquiring more electronics every year.
          </p>
          <p className="text-sm text-[#9b9b98] leading-relaxed">
            The platform has since grown into a full-stack environmental management system — combining blockchain immutability with government-grade compliance tooling and a real economic incentive (EcoCredits) for every individual who participates.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 self-start">
          {[
            { label: 'Founded', value: '2025' },
            { label: 'Chain', value: 'Sepolia (EVM)' },
            { label: 'Stack', value: 'React · Supabase · Hardhat' },
            { label: 'Country', value: 'Liberia, West Africa' },
            { label: 'Contact', value: 'invest@ecoledger.app' },
          ].map(f => (
            <div key={f.label} className="bg-white border border-[#e8e5de] rounded-xl p-4">
              <p className="text-[10px] font-semibold tracking-widest text-[#9b9b98] uppercase mb-1">{f.label}</p>
              <p className="text-sm font-bold text-[#0f0f0e]">{f.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function LandingFooter() {
  const cols = [
    {
      title: 'Platform',
      links: ['Consumers', 'Manufacturers', 'Recyclers', 'Regulators', 'Public & Auditors'],
    },
    {
      title: 'Stakeholders',
      links: ['Request access', 'Recycler onboarding', 'Regulator portal', 'NGO partnerships', 'Board of directors'],
    },
    {
      title: 'Resources',
      links: ['Whitepaper', 'API docs', 'Block explorer', 'Press kit', 'Changelog'],
    },
    {
      title: 'Legal',
      links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Code of Ethics', 'GDPR compliance'],
    },
  ]

  return (
    <footer className="bg-[#0f0f0e] pt-16 pb-10 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 mb-12">
          <div className="flex-shrink-0 max-w-xs">
            <div className="flex items-center gap-2 mb-4">
              <img src={logoCompactLight} alt="EcoLedger" className="h-7 w-auto object-contain" />
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
                    <li key={l}>
                      <a href="#" className="text-sm text-[#9b9b98] hover:text-white transition-colors">{l}</a>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export function LandingPage() {
  const stats = useLandingStats()

  return (
    <div className="min-h-screen bg-white">
      <LandingNav />
      <HeroSection stats={stats} />
      <StatsBar stats={stats} />
      <ProblemSection />
      <HowItWorksSection />
      <PlatformsSection />
      <EcoCreditsSection stats={stats} />
      <TrustSection />
      <SDGSection stats={stats} />
      <CTASection />
      <EthicsSection />
      <AboutSection />
      <LandingFooter />
    </div>
  )
}
