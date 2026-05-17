import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'

type EntryType = 'feature' | 'fix' | 'improvement' | 'security'

const TYPE_META: Record<EntryType, { label: string; bg: string; text: string }> = {
  feature:     { label: 'New',         bg: 'bg-[#e8f5ec]',   text: 'text-[#2d6a3f]' },
  fix:         { label: 'Fix',         bg: 'bg-red-50',       text: 'text-red-700' },
  improvement: { label: 'Improved',    bg: 'bg-blue-50',      text: 'text-blue-700' },
  security:    { label: 'Security',    bg: 'bg-amber-50',     text: 'text-amber-700' },
}

interface Release {
  version: string
  date: string
  summary: string
  entries: { type: EntryType; text: string }[]
}

const releases: Release[] = [
  {
    version: '1.0.3',
    date: 'May 2026',
    summary: 'Legal pages, scroll fix, mobile rewards repair, CORS fix for public stats.',
    entries: [
      { type: 'feature',     text: 'Added all footer legal pages: Privacy Policy, Terms of Service, Cookie Policy, Code of Ethics, GDPR Compliance.' },
      { type: 'feature',     text: 'Added Resources section: Whitepaper, API Docs, Block Explorer, Press Kit, Changelog.' },
      { type: 'fix',         text: 'Pages no longer retain scroll position on navigation — scroll-to-top applied globally on route change.' },
      { type: 'fix',         text: 'Mobile rewards page was querying wrong column names (name/cost_credits) — corrected to title/cost_ec.' },
      { type: 'fix',         text: 'CORS preflight was blocking public-stats edge function in browser (apikey/Authorization headers not whitelisted).' },
      { type: 'fix',         text: 'Admin reward catalogue insert returned 403 — added RLS policies for reward_catalogue and redemptions tables.' },
      { type: 'improvement', text: 'LandingNav and LandingFooter extracted to shared components, consumed by all public pages.' },
    ],
  },
  {
    version: '1.0.2',
    date: 'May 2026',
    summary: 'Landing page launch, lifecycle illustration, logo updates.',
    entries: [
      { type: 'feature',     text: 'Public landing page built with real-time stats from Supabase edge function (public-stats).' },
      { type: 'feature',     text: 'public-stats edge function deployed — bypasses RLS for anonymous stat queries.' },
      { type: 'fix',         text: 'Landing page was not the default route — login page was rendering at /. Fixed routing order.' },
      { type: 'fix',         text: 'lifecycle-illustration.png was never committed — Vite import failed at build time, causing Vercel to serve stale deployment.' },
      { type: 'improvement', text: 'Header now uses logo-compact-light; footer uses logo-compact-dark.' },
      { type: 'improvement', text: 'Login page Back to home button added on dark panel.' },
    ],
  },
  {
    version: '1.0.1',
    date: 'May 2026',
    summary: 'Email notifications, duplicate fix, Sepolia migration.',
    entries: [
      { type: 'feature',     text: 'Email notifications added for Manufacturer (device recycled/flagged), Auditor (new flag), Recycler/Stakeholder (flagged), Regulator (flag resolved).' },
      { type: 'fix',         text: 'Device registration was generating 3 notifications — direct inserts in pages removed; notify edge function now handles all via DB webhooks.' },
      { type: 'fix',         text: 'Registration email incorrectly said device was "responsibly recycled" — source-based messaging now used.' },
      { type: 'improvement', text: 'All Polygon Amoy references replaced with Sepolia across admin settings, mobile app, device detail page, and email footer.' },
      { type: 'improvement', text: 'Mobile dispose flow now navigates to /mobile/dispose/:id instead of showing a toast.' },
      { type: 'improvement', text: 'Consumer EcoCredits cash-out toast updated to explain that Redeem Rewards is the correct flow.' },
    ],
  },
  {
    version: '1.0.0',
    date: 'April 2026',
    summary: 'Initial platform launch on Sepolia testnet.',
    entries: [
      { type: 'feature', text: 'Consumer dashboard: device registration, ownership transfer, EcoCredits wallet, disposal initiation.' },
      { type: 'feature', text: 'Manufacturer dashboard: bulk device management, EPR analytics, end-of-life tracking.' },
      { type: 'feature', text: 'Recycler dashboard: disposal logging, facility management, EPA verification status.' },
      { type: 'feature', text: 'Regulator dashboard: national compliance map, flagged cases, county analytics, reports.' },
      { type: 'feature', text: 'Auditor dashboard: read-only block explorer view, transaction audit, export.' },
      { type: 'feature', text: 'Admin dashboard: user management, invitations, reward catalogue, smart contract status.' },
      { type: 'feature', text: 'Mobile PWA for field recyclers: scan devices, log disposals, view rewards.' },
      { type: 'feature', text: 'Privy wallet + email authentication with role-based access control.' },
      { type: 'feature', text: 'EcoToken (ERC-20) and EcoLedger contracts deployed on Sepolia.' },
      { type: 'feature', text: 'In-app notification system and transactional email via notify edge function.' },
    ],
  },
]

export function ChangelogPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNav alwaysOpaque />

      <div className="bg-[#fafaf8] border-b border-[#e8e5de] pt-24 pb-10 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] font-semibold tracking-widest text-[#9b9b98] uppercase mb-2">Resources</p>
          <h1 className="text-4xl font-bold text-[#0f0f0e] mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>
            Changelog
          </h1>
          <p className="text-sm text-[#9b9b98]">A complete record of platform releases, improvements, and fixes.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="space-y-12">
          {releases.map((r, i) => (
            <div key={r.version} className="flex gap-6">
              {/* Timeline */}
              <div className="flex flex-col items-center flex-shrink-0 w-4">
                <div className={`w-3 h-3 rounded-full border-2 mt-1.5 ${i === 0 ? 'border-[#2d6a3f] bg-[#2d6a3f]' : 'border-[#e8e5de] bg-white'}`} />
                {i < releases.length - 1 && <div className="w-px flex-1 bg-[#e8e5de] mt-1" />}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <h2 className="text-xl font-bold text-[#0f0f0e]">v{r.version}</h2>
                  {i === 0 && (
                    <span className="text-[10px] font-bold tracking-widest text-[#2d6a3f] bg-[#e8f5ec] rounded-full px-2.5 py-0.5">LATEST</span>
                  )}
                  <span className="text-xs text-[#9b9b98]">{r.date}</span>
                </div>
                <p className="text-sm text-[#6b6b68] mb-5">{r.summary}</p>

                <div className="space-y-2.5">
                  {r.entries.map((e, j) => {
                    const meta = TYPE_META[e.type]
                    return (
                      <div key={j} className="flex items-start gap-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex-shrink-0 mt-0.5 ${meta.bg} ${meta.text}`}>
                          {meta.label}
                        </span>
                        <p className="text-sm text-[#6b6b68] leading-relaxed">{e.text}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <LandingFooter />
    </div>
  )
}
