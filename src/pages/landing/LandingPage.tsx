import { useState, useEffect, type ReactNode } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight, Smartphone, Recycle, TreePine, Leaf, ShieldCheck,
  SearchX, FlaskConical, Scale, ScanLine, ArrowLeftRight, BadgeCheck, Coins,
  User, Factory, Landmark, SearchCheck, Lock, Eye, KeyRound, ShieldHalf,
  Globe2, FileText, Cookie, HeartHandshake, Code2, Database, Play, ScrollText, Blocks,
} from 'lucide-react'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { usePlatformRates } from '@/lib/rates'

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

// ─── Shared layout primitives ─────────────────────────────────────────────────

const container = 'max-w-content mx-auto px-5 md:px-8 lg:px-12'
const sectionY  = 'py-12 md:py-16 lg:py-20'

function Eyebrow({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <p className={`text-xs font-semibold tracking-[0.14em] uppercase mb-3 ${dark ? 'text-white/60' : 'text-brand-sage'}`}>
      {children}
    </p>
  )
}

function SectionHeading({ children, dark = false, className = '' }: { children: ReactNode; dark?: boolean; className?: string }) {
  return (
    <h2 className={`font-display text-[28px] md:text-[32px] lg:text-[36px] font-bold leading-[1.2] tracking-tight ${dark ? 'text-white' : 'text-brand-ink'} ${className}`}>
      {children}
    </h2>
  )
}

function IconBadge({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <span className={`inline-flex items-center justify-center w-11 h-11 rounded-xl ${dark ? 'bg-white/10 text-white' : 'bg-brand-tint text-brand'}`}>
      {children}
    </span>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

const ORBIT = [
  { top: 'Track',   bottom: 'Devices',                 Icon: Smartphone,  angle: -90 },
  { top: 'Promote', bottom: 'Recycling',               Icon: Recycle,     angle: -18 },
  { top: 'Build a', bottom: 'Greener Liberia',         Icon: TreePine,    angle: 54 },
  { top: 'Protect', bottom: 'Environment',             Icon: Leaf,        angle: 126 },
  { top: 'Ensure',  bottom: 'Compliance',              Icon: ShieldCheck, angle: 198 },
]

function EcosystemDiagram() {
  const r = 40 // orbit radius, % of the square container
  return (
    <div
      className="relative w-full max-w-[460px] aspect-square mx-auto"
      role="img"
      aria-label="EcoLedger at the centre of five outcomes: track devices, promote recycling, build a greener Liberia, protect the environment, ensure compliance"
    >
      {/* Rings */}
      <div className="absolute inset-[10%] rounded-full border border-brand-line" />
      <div className="absolute inset-[24%] rounded-full border border-brand-line/70" />

      {/* Hub */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[38%] aspect-square">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full h-full rounded-full bg-brand flex flex-col items-center justify-center gap-2 shadow-[0_20px_50px_-20px_rgba(8,61,36,0.6)]"
        >
          <Recycle className="w-9 h-9 text-white" strokeWidth={2} />
          <span className="font-display text-lg font-semibold text-white">EcoLedger</span>
        </motion.div>
      </div>

      {/* Orbit cards */}
      {ORBIT.map((o, i) => {
        const rad = (o.angle * Math.PI) / 180
        return (
          <div
            key={o.bottom}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${50 + r * Math.cos(rad)}%`, top: `${50 + r * Math.sin(rad)}%` }}
          >
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.08 }}
              className="bg-white border border-brand-line rounded-2xl px-4 py-3 text-center shadow-[0_8px_24px_-12px_rgba(16,47,39,0.25)] min-w-[112px] whitespace-nowrap"
            >
              <o.Icon className="w-6 h-6 text-brand mx-auto mb-1.5" strokeWidth={1.75} />
              <p className="text-[13px] text-brand-muted leading-tight">{o.top}</p>
              <p className="text-[13px] font-semibold text-brand-ink leading-tight">{o.bottom}</p>
            </motion.div>
          </div>
        )
      })}
    </div>
  )
}

function HeroSection() {
  const navigate = useNavigate()
  return (
    <section className="relative overflow-hidden bg-brand-tint pt-[72px]">
      <div className={`${container} pt-10 md:pt-14 lg:pt-16 pb-10 md:pb-12`}>
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] items-center gap-10">
          <div>
            <p className="text-xs font-semibold tracking-[0.12em] uppercase text-brand-accent mb-5">
              Liberia E-Waste Registry · Sepolia Testnet
            </p>
            <h1 className="font-display text-[36px] sm:text-[44px] lg:text-[48px] xl:text-[50px] font-bold text-brand leading-[1.1] tracking-tight mb-6 text-balance">
              An immutable record for every device, from point of sale to end of life.
            </h1>
            <p className="text-base lg:text-[17px] text-brand-ink/85 leading-relaxed mb-8 max-w-xl">
              EcoLedger turns electronic devices into digital entities on a blockchain — so manufacturers, recyclers, regulators, and the communities they serve can audit the lifecycle of every unit. Stop illegal dumping. Reward proper disposal. Make accountability verifiable.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/stakeholders/request-access')}
                className="inline-flex items-center gap-2 h-12 px-6 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-secondary transition-colors"
              >
                Request stakeholder access <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 h-12 px-6 bg-white border border-brand-line text-brand-ink text-sm font-semibold rounded-lg hover:border-brand/40 transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> See how it works
              </a>
            </div>
          </div>

          <div className="hidden md:block">
            <EcosystemDiagram />
          </div>
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
    { value: fmt(stats.devices),         label: 'devices on chain' },
    { value: fmt(stats.recyclers),       label: 'verified recyclers' },
    { value: fmt(stats.lifecycleEvents), label: 'lifecycle events' },
    { value: fmt(stats.creditsIssued),   label: 'EcoCredits issued' },
    { value: `${complianceRate}%`,       label: 'disposal compliance' },
  ]

  return (
    <section className="bg-brand-tint pb-12 md:pb-16">
      <div className={container}>
        <div className="bg-brand rounded-2xl px-6 py-8 md:py-9 grid grid-cols-2 md:grid-cols-5 gap-y-8">
          {items.map((item, i) => (
            <div
              key={item.label}
              className={`text-center px-2 ${i > 0 ? 'md:border-l md:border-white/20' : ''} ${i === items.length - 1 ? 'col-span-2 md:col-span-1' : ''}`}
            >
              <p className="font-display text-[32px] md:text-[36px] font-semibold text-white tabular-nums leading-none">
                {item.value || '—'}
              </p>
              <p className="text-sm text-white/80 mt-2">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Problem ──────────────────────────────────────────────────────────────────

function ProblemSection() {
  const problems = [
    {
      num: '01', Icon: SearchX,
      title: 'Untraceable',
      body: 'Devices vanish from official records after point of sale. Registries audit on paper, manufacturers report by guess.',
    },
    {
      num: '02', Icon: FlaskConical,
      title: 'Toxic',
      body: 'Informal processors carelessly extract metals with acid baths and open fires, releasing lead, mercury, and cadmium into soil and water.',
    },
    {
      num: '03', Icon: Scale,
      title: 'Unaccountable',
      body: 'Dispose across borders without documentation, bypassing Basel Convention rules. No system makes the chain of custody verifiable.',
    },
  ]

  return (
    <section className={`bg-brand-deep ${sectionY}`}>
      <div className={container}>
        <Eyebrow dark>The problem</Eyebrow>
        <SectionHeading dark className="mb-10 md:mb-12 max-w-3xl">
          60 million tonnes of electronic waste enter the world every year — and most of it disappears from the record the moment it's sold.
        </SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {problems.map(p => (
            <div key={p.num} className="bg-white/[0.04] border border-white/15 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <IconBadge dark><p.Icon className="w-5 h-5" strokeWidth={1.75} /></IconBadge>
                <span className="text-xs font-semibold tracking-widest text-white/40">{p.num}</span>
              </div>
              <h3 className="font-display text-xl font-semibold text-white mb-2">{p.title}</h3>
              <p className="text-[15px] text-white/70 leading-relaxed">{p.body}</p>
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
      num: 'STEP 01', Icon: ScanLine,
      title: 'Register at point of sale',
      body: 'A manufacturer or retailer mints an on-chain record for the device — brand, model, IMEI, hazard class. A smart contract entry creates an immutable genesis event.',
      code: 'registerDevice(bytes32 deviceId, address owner)',
    },
    {
      num: 'STEP 02', Icon: ArrowLeftRight,
      title: 'Track through ownership',
      body: 'Every transfer is signed by both parties and recorded on-chain. The ownership history is public, tamper-proof, and traceable to any auditor.',
      code: 'transferDevice(bytes32 deviceId, address from, address to)',
    },
    {
      num: 'STEP 03', Icon: BadgeCheck,
      title: 'Verify disposal',
      body: 'Certified recyclers log weight, hazard class, and materials recovered. EPA licence is checked on-chain before the disposal event is confirmed.',
      code: 'disposeDevice(bytes32 deviceId, address recycler, uint256 credits)',
    },
    {
      num: 'STEP 04', Icon: Coins,
      title: 'Reward & audit',
      body: 'Device owners earn EcoCredits automatically for responsible disposal, redeemable for mobile money via Orange Money and MTN MoMo. Every credit is an on-chain event.',
      code: 'ecoToken.mint(address owner, uint256 amount)',
    },
  ]

  return (
    <section id="how-it-works" className={`bg-white ${sectionY} scroll-mt-[124px] lg:scroll-mt-[72px]`}>
      <div className={container}>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 md:mb-12">
          <div>
            <Eyebrow>How EcoLedger works</Eyebrow>
            <SectionHeading className="max-w-xl">
              Five smart contracts. One verifiable trail. Every stakeholder reading from the same ledger.
            </SectionHeading>
          </div>
          <div className="flex items-center gap-1 bg-brand-tint border border-brand-line rounded-lg p-1 self-start lg:self-auto flex-shrink-0">
            {(['on-chain', 'off-chain'] as const).map(v => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-md text-xs font-semibold transition-all ${
                  view === v ? 'bg-brand text-white shadow-sm' : 'text-brand-muted hover:text-brand-ink'
                }`}
              >
                {v === 'on-chain' ? <Code2 className="w-3.5 h-3.5" /> : <Database className="w-3.5 h-3.5" />}
                {v.toUpperCase().replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {steps.map((s, i) => (
            <div key={s.num} className="bg-white rounded-2xl p-6 border border-brand-line flex flex-col hover:shadow-[0_12px_32px_-16px_rgba(16,47,39,0.25)] transition-shadow">
              <div className="flex items-center justify-between mb-5">
                <IconBadge><s.Icon className="w-5 h-5" strokeWidth={1.75} /></IconBadge>
                <span className="text-[11px] font-semibold tracking-widest text-brand-sage">{s.num}</span>
              </div>
              <h3 className="font-display text-lg font-semibold text-brand-ink mb-2 leading-snug">{s.title}</h3>
              <p className="text-sm text-brand-muted leading-relaxed mb-5 flex-1">{s.body}</p>
              {view === 'on-chain' && (
                <div className="bg-brand-deep rounded-xl px-3 py-2.5">
                  <p className="text-[11px] font-mono text-[#8FD3A8] break-all leading-relaxed">{s.code}</p>
                </div>
              )}
              {view === 'off-chain' && (
                <div className="bg-brand-tint rounded-xl px-3 py-2.5 border border-brand-line">
                  <p className="text-[11px] text-brand-muted">DB record · Supabase · Step {i + 1} of 4</p>
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
      role: 'Consumer', Icon: User,
      desc: 'Register devices you own, track their lifecycle, initiate transfers, and mark devices for recycling. Every action you take earns EcoCredits.',
      features: ['Device registration', 'Ownership transfer', 'Recycling initiation', 'EcoCredits wallet'],
    },
    {
      role: 'Manufacturer', Icon: Factory,
      desc: 'Register bulk units at manufacture, fulfil EPR obligations, track product end-of-life rates across the country, and report to regulators.',
      features: ['Bulk unit registration', 'EPR compliance reporting', 'Analytics dashboard', 'End-of-life tracking'],
    },
    {
      role: 'Recycler', Icon: Recycle,
      desc: 'Log device disposals, verify EPA certification on-chain, issue EcoCredits to device owners, and build a verified recycling track record.',
      features: ['Disposal logging', 'EPA verification', 'EcoCredit issuance', 'Facility management'],
    },
    {
      role: 'Regulator', Icon: Landmark,
      desc: 'Monitor national compliance, raise compliance flags, track recyclers across all counties, and generate regulatory reports.',
      features: ['National compliance map', 'Compliance flagging', 'County-level analytics', 'Regulatory reports'],
    },
    {
      role: 'NGO / Auditor', Icon: SearchCheck,
      desc: 'Independently verify every chain event. Browse the public block explorer, audit disposal records, and cross-check on-chain data with field reports.',
      features: ['Block explorer', 'Verified records', 'Transaction audit', 'Export for reporting'],
    },
  ]

  return (
    <section id="platforms" className={`bg-brand-tint ${sectionY} scroll-mt-[124px] lg:scroll-mt-[72px]`}>
      <div className={container}>
        <Eyebrow>Built for everyone in the chain</Eyebrow>
        <SectionHeading className="mb-10 md:mb-12 max-w-2xl">
          One platform. Five interfaces. The same source of truth.
        </SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {platforms.map(p => (
            <div key={p.role} className="bg-white rounded-2xl p-5 border border-brand-line flex flex-col">
              <IconBadge><p.Icon className="w-5 h-5" strokeWidth={1.75} /></IconBadge>
              <p className="font-display text-lg font-semibold text-brand-ink mt-4 mb-2">{p.role}</p>
              <p className="text-sm text-brand-muted leading-relaxed mb-5 flex-1">{p.desc}</p>
              <ul className="space-y-2 pt-4 border-t border-brand-line">
                {p.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-[13px] text-brand-ink">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />
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
  // Live values set by admins in Rates & Prices, so the page always matches what the platform pays
  const { values: rates } = usePlatformRates()
  const lrdPerCredit = rates.lrd_per_credit
  const highlights = [
    { value: fmt(stats.creditsIssued), label: 'EcoCredits issued to date' },
    { value: `≈ LRD ${new Intl.NumberFormat().format(lrdPerCredit)}`, label: 'per EcoCredit redeemable value' },
    { value: fmt(stats.disposedCount), label: 'disposal events rewarded' },
  ]

  return (
    <section className={`bg-white ${sectionY}`}>
      <div className={`${container} grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-10 lg:gap-16 items-center`}>
        <div>
          <Eyebrow>EcoCredits</Eyebrow>
          <SectionHeading className="mb-5 max-w-md">
            Doing the right thing should pay you back.
          </SectionHeading>
          <p className="text-base text-brand-muted leading-relaxed mb-8 max-w-lg">
            Every properly disposed device earns the owner EcoCredits — redeemable for mobile airtime, supermarket vouchers, cash via Orange Money / MTN MoMo, and partner payments. The manufacturer EPR fee, not user expenses, finances the reward pool. The consumer never spends a coin.
          </p>
          <div className="flex flex-wrap gap-3">
            {[`+${Math.round(rates.credits_registration)} PER REGISTER`, '+200–500 PER RECYCLE', `+${Math.round(rates.credits_transfer)} PER TRANSFER`].map(s => (
              <span key={s} className="text-[11px] font-semibold tracking-widest bg-brand-tint border border-brand-line rounded-full px-3.5 py-2 text-brand">
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-brand rounded-2xl p-6 md:p-8 relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full border border-white/10" />
          <div className="absolute -right-4 -top-4 w-28 h-28 rounded-full border border-white/10" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Coins className="w-4 h-4 text-white/70" />
              <p className="text-[11px] font-semibold tracking-widest text-white/70 uppercase">EcoCredits issued · Liberia 2026</p>
            </div>
            <p className="font-display text-5xl font-bold text-white tabular-nums mt-3">{fmt(stats.creditsIssued) || '—'}</p>
            <p className="text-sm text-white/70 mt-1 mb-6">EC · ≈ LRD {new Intl.NumberFormat().format(stats.creditsIssued * lrdPerCredit)}</p>
            <div className="space-y-3 border-t border-white/15 pt-5">
              {highlights.map(h => (
                <div key={h.label} className="flex items-center justify-between gap-4">
                  <p className="text-sm text-white/70">{h.label}</p>
                  <p className="text-sm font-semibold text-white tabular-nums">{h.value || '—'}</p>
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
      title: 'Immutable', Icon: Lock,
      body: 'Every registration, transfer, and disposal event is a cryptographically signed entry on Sepolia. No one — not even EcoLedger — can alter or delete a historical record.',
    },
    {
      title: 'Auditable', Icon: Eye,
      body: 'Regulators, NGOs, and journalists can explore every transaction at sepolia.etherscan.io. No login required. The ledger is and always will be public.',
    },
    {
      title: 'Permissioned writes', Icon: KeyRound,
      body: 'Only verified operators — approved recyclers, licensed manufacturers — can write to the chain. Every actor is identified before any event is created.',
    },
    {
      title: 'Privacy-aware', Icon: ShieldHalf,
      body: 'Personal identity stays off-chain in Supabase with strict RLS policies. Only your wallet address appears on-chain — your name and contact details are never published.',
    },
  ]

  return (
    <section id="trust" className={`bg-brand-tint ${sectionY} scroll-mt-[124px] lg:scroll-mt-[72px]`}>
      <div className={container}>
        <Eyebrow>Trust by design</Eyebrow>
        <SectionHeading className="mb-10 md:mb-12 max-w-xl">
          We don't ask you to trust us. The ledger is public.
        </SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {pillars.map((p, i) => (
            <div key={p.title} className="bg-white border border-brand-line rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <IconBadge><p.Icon className="w-5 h-5" strokeWidth={1.75} /></IconBadge>
                <span className="text-[11px] font-semibold tracking-widest text-brand-sage">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="font-display text-lg font-semibold text-brand-ink mb-2">{p.title}</h3>
              <p className="text-sm text-brand-muted leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>

        {/* Public ledger CTA */}
        <div className="mt-8 md:mt-10 bg-white border border-brand-line rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <IconBadge><ScrollText className="w-5 h-5" strokeWidth={1.75} /></IconBadge>
            <div>
              <h3 className="font-display text-lg font-semibold text-brand-ink">See every action on the ledger</h3>
              <p className="text-sm text-brand-muted leading-relaxed mt-1 max-w-xl">
                Browse manufacture, registration, transfer and recycling events in real time — no account needed.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <Link
              to="/block-explorer#ledger"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-secondary transition-colors"
            >
              View ledger <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/block-explorer"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 bg-white border border-brand-line text-brand-ink text-sm font-semibold rounded-lg hover:border-brand/40 transition-colors"
            >
              <Blocks className="w-4 h-4" /> Explorer
            </Link>
          </div>
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
    <section id="sdg" className={`bg-white ${sectionY} scroll-mt-[124px] lg:scroll-mt-[72px]`}>
      <div className={container}>
        <div className="flex items-center gap-4 mb-4">
          <span className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center flex-shrink-0">
            <Globe2 className="w-6 h-6 text-white" strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-brand-sage uppercase">Aligned outcomes</p>
            <p className="font-display text-xl font-semibold text-brand-ink">UN Sustainable Development Goals</p>
          </div>
        </div>
        <p className="text-base text-brand-muted mb-10 max-w-2xl leading-relaxed">
          EcoLedger contributes directly to SDG 12 (Responsible Consumption), 13 (Climate Action), 3 (Health), and 11 (Sustainable Cities). Progress indicators below are calculated from live chain data.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {sdgs.map(s => (
            <div key={s.num} className="bg-brand-tint rounded-2xl p-6 border border-brand-line flex flex-col">
              <span className="self-start text-[11px] font-semibold tracking-widest text-white bg-brand rounded-md px-2 py-1 mb-4">{s.num}</span>
              <p className="font-display text-lg font-semibold text-brand-ink mb-2">{s.title}</p>
              <p className="text-sm text-brand-muted leading-relaxed mb-5 flex-1">{s.desc}</p>
              <div className="h-2 bg-brand-line rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand rounded-full transition-all duration-1000"
                  style={{ width: `${s.pct}%` }}
                />
              </div>
              <p className="text-xs font-medium text-brand-muted mt-2 text-right tabular-nums">{s.pct}% progress</p>
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
    <section className="bg-white pb-12 md:pb-16 lg:pb-20">
      <div className={container}>
        <div className="bg-brand rounded-3xl px-6 py-12 md:px-12 md:py-16 relative overflow-hidden">
          <div className="absolute -right-24 -bottom-24 w-80 h-80 rounded-full border border-white/10" />
          <div className="absolute -right-10 -bottom-10 w-52 h-52 rounded-full border border-white/10" />
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-10">
            <div>
              <h2 className="font-display text-[32px] lg:text-[44px] font-bold text-white leading-[1.15] tracking-tight">
                Start tracking.<br />Start enforcing.<br />Start rewarding.
              </h2>
              <p className="text-white/75 mt-5 max-w-md text-base leading-relaxed">
                Whether you're a regulator wanting verifiable compliance, a manufacturer with EPR obligations, or a community organisation fighting illegal dumping — we'll get you onboarded.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => navigate('/stakeholders/request-access')}
                className="inline-flex items-center justify-center gap-2 h-12 px-6 bg-white text-brand text-sm font-semibold rounded-lg hover:bg-brand-tint transition-colors"
              >
                Request stakeholder access <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center h-12 px-6 border border-white/30 text-white text-sm font-semibold rounded-lg hover:border-white/60 transition-colors"
              >
                Read the whitepaper
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Ethics ───────────────────────────────────────────────────────────────────

function EthicsSection() {
  const docs = [
    { title: 'Terms of Service', Icon: FileText,       sub: 'The legal agreement governing every transaction and relationship on the platform.', updated: 'UPDATED MAY 2026',      href: '/terms' },
    { title: 'Privacy Policy',   Icon: ShieldCheck,    sub: 'How we collect, store and protect your information. GDPR-aligned, no data sold.',      updated: 'GDPR · NO PII ON-CHAIN', href: '/privacy' },
    { title: 'Cookie Policy',    Icon: Cookie,         sub: 'Strictly essential cookies only. No third-party tracking by default.',               updated: 'NO AD TRACKERS',        href: '/cookies' },
    { title: 'Code of Ethics',   Icon: HeartHandshake, sub: 'Environmental accountability extends to how we operate our own platform.',             updated: 'PUBLIC COMMITMENT',     href: '/ethics' },
  ]

  return (
    <section className={`bg-brand-tint ${sectionY}`}>
      <div className={container}>
        <h2 className="font-display text-2xl md:text-[28px] font-semibold text-brand-ink mb-2">Ethics, Accountability & the Small Print</h2>
        <p className="text-base text-brand-muted mb-8">A platform built on accountability holds itself to the same standard.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {docs.map(d => (
            <Link
              key={d.title}
              to={d.href}
              className="group bg-white border border-brand-line rounded-2xl p-6 flex flex-col hover:border-brand/40 transition-colors"
            >
              <IconBadge><d.Icon className="w-5 h-5" strokeWidth={1.75} /></IconBadge>
              <p className="font-display text-lg font-semibold text-brand-ink mt-4 mb-2">{d.title}</p>
              <p className="text-sm text-brand-muted leading-relaxed mb-5 flex-1">{d.sub}</p>
              <div className="flex items-center justify-between pt-4 border-t border-brand-line">
                <p className="text-[10px] font-semibold tracking-widest text-brand-sage">{d.updated}</p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand group-hover:gap-1.5 transition-all">
                  Read <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
        <p className="text-sm text-brand-sage mt-8 max-w-3xl leading-relaxed">
          EcoLedger is a tracking infrastructure, not a regulator. We do not warrant that any recycler operator is safe, or that any regulatory agency will enforce, or that the public ledger is error-free from time to time. Liability is governed by our Terms of Service.
        </p>
      </div>
    </section>
  )
}

// ─── About ────────────────────────────────────────────────────────────────────

function AboutSection() {
  return (
    <section id="about" className={`bg-white ${sectionY} scroll-mt-[124px] lg:scroll-mt-[72px]`}>
      <div className={`${container} grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16`}>
        <div>
          <Eyebrow>Project origins</Eyebrow>
          <SectionHeading className="mb-5">Started in a university dissertation. Now on chain.</SectionHeading>
          <p className="text-base text-brand-muted leading-relaxed mb-4">
            EcoLedger began as academic research into the growing informal e-waste economy in Liberia — a country with no national registry, no EPR framework, and a rapidly urbanising population acquiring more electronics every year.
          </p>
          <p className="text-base text-brand-muted leading-relaxed">
            The platform has since grown into a full-stack environmental management system — combining blockchain immutability with government-grade compliance tooling and a real economic incentive (EcoCredits) for every individual who participates.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 self-start">
          {[
            { label: 'Founded', value: '2025' },
            { label: 'Chain', value: 'Sepolia (EVM)' },
            { label: 'Stack', value: 'React · Supabase · Hardhat' },
            { label: 'Country', value: 'Liberia, West Africa' },
            { label: 'Contact', value: 'support@liberiaecoledger.com' },
          ].map(f => (
            <div key={f.label} className={`bg-brand-tint border border-brand-line rounded-xl p-5 ${f.label === 'Contact' ? 'sm:col-span-2' : ''}`}>
              <p className="text-[11px] font-semibold tracking-widest text-brand-sage uppercase mb-1.5">{f.label}</p>
              <p className="text-[15px] font-semibold text-brand-ink break-words">{f.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function LandingPage() {
  const stats = useLandingStats()

  return (
    <div className="min-h-screen bg-white text-brand-ink">
      <LandingNav />
      <HeroSection />
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
