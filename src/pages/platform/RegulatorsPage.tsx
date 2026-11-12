import { useNavigate } from 'react-router-dom'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { FeatureIcon } from '@/components/landing/FeatureIcon'

const features = [
  {
    icon: '🗺️',
    title: 'National compliance map',
    body: 'A real-time county-level map showing device density, active recyclers, open compliance flags, and disposal rates across all 15 counties of Liberia.',
  },
  {
    icon: '🚩',
    title: 'Compliance flagging',
    body: 'Raise and manage compliance flags for unauthorized exports, unverified disposals, informal collectors, and missing device ownership. Attach evidence and loop in stakeholders.',
  },
  {
    icon: '🔍',
    title: 'Device investigations',
    body: 'Pull the full custody trail of any registered device — every owner, every transfer, every lifecycle event, with on-chain transaction hashes for court-admissible verification.',
  },
  {
    icon: '📊',
    title: 'County-level analytics',
    body: 'Drill into any county for device counts, recycler coverage, Basel compliance rates, and disposal trends over time. Export data for field team briefings.',
  },
  {
    icon: '📄',
    title: 'Regulatory reports',
    body: 'Generate EPR compliance reports, recycler performance summaries, and Basel Convention documentation — all sourced from the immutable chain, all auditable.',
  },
  {
    icon: '🔔',
    title: 'Real-time alerts',
    body: 'Receive instant notifications when critical compliance flags are raised, when a flagged case is resolved, or when a recycler\'s EPA licence status changes.',
  },
]

const tools = [
  { label: 'Open flags',          desc: 'Track all active compliance investigations with status, severity, and assigned investigators.' },
  { label: 'Flag detail pages',   desc: 'Full case view: linked devices, custody trail, evidence locker, stakeholders, and resolution workflow.' },
  { label: 'Escalate to AG',      desc: 'One-click escalation to Attorney General status for cases requiring legal action.' },
  { label: 'Print warrant brief', desc: 'Generate a formatted warrant brief from any flagged case for field enforcement use.' },
  { label: 'Compliance map',      desc: 'County dots colour-coded by severity: red (critical), orange (open flags), green (compliant).' },
  { label: 'Export reports',      desc: 'Download compliance data as CSV or PDF for submission to EPA Liberia headquarters.' },
]

export function RegulatorsPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-white">
      <LandingNav alwaysOpaque />

      {/* Hero */}
      <div className="bg-brand-deep pt-32 pb-16 px-5 md:px-8 lg:px-12">
        <div className="max-w-content mx-auto">
          <p className="text-[11px] font-semibold tracking-widest text-white/70 uppercase mb-3">Platform · Regulators</p>
          <h1 className="text-5xl font-bold text-white leading-tight mb-5 font-display font-bold">
            National compliance visibility.<br />
            <span className="text-[#8FD3A8]">Finally.</span>
          </h1>
          <p className="text-lg text-white/70 leading-relaxed max-w-2xl mb-8">
            EcoLedger gives EPA Liberia and government regulators a real-time view of every device on the registry — where it is, who owns it, where it was recycled, and whether that recycler was certified.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-white text-brand text-sm font-semibold rounded-xl hover:bg-brand-tint transition-colors"
            >
              Request regulator access
            </button>
            <a href="#tools" className="px-6 py-3 border border-white/20 text-white text-sm font-semibold rounded-xl hover:border-white/40 transition-colors">
              Enforcement tools
            </a>
          </div>
        </div>
      </div>

      {/* Authority callout */}
      <div className="bg-brand-tint border-b border-brand-line py-6 px-5 md:px-8 lg:px-12">
        <div className="max-w-content mx-auto flex flex-wrap gap-8">
          {[
            { value: 'Read + write', label: 'Regulators have full data access' },
            { value: 'Immutable',    label: 'Chain data cannot be altered by any party' },
            { value: 'Court-ready',  label: 'On-chain tx hashes as admissible evidence' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-lg font-bold text-brand-ink">{s.value}</p>
              <p className="text-xs text-brand-muted mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="py-20 px-5 md:px-8 lg:px-12">
        <div className="max-w-content mx-auto">
          <p className="text-[11px] font-semibold tracking-widest text-brand-muted uppercase mb-3">Capabilities</p>
          <h2 className="text-3xl font-bold text-brand-ink mb-12 max-w-xl">Everything a national regulator needs to enforce e-waste law.</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(f => (
              <div key={f.title} className="bg-brand-tint rounded-2xl p-6 border border-brand-line">
                <FeatureIcon emoji={f.icon} />
                <p className="font-bold text-brand-ink mb-2">{f.title}</p>
                <p className="text-sm text-brand-muted leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enforcement tools */}
      <div id="tools" className="py-20 px-5 md:px-8 lg:px-12 bg-brand-tint border-t border-brand-line scroll-mt-20">
        <div className="max-w-content mx-auto">
          <p className="text-[11px] font-semibold tracking-widest text-brand-muted uppercase mb-3">Enforcement Toolkit</p>
          <h2 className="text-3xl font-bold text-brand-ink mb-10">Purpose-built tools for regulatory action.</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tools.map(t => (
              <div key={t.label} className="bg-white rounded-2xl p-5 border border-brand-line flex gap-3">
                <div className="w-2 h-2 rounded-full bg-brand mt-2 flex-shrink-0" />
                <div>
                  <p className="font-bold text-brand-ink mb-1 text-sm">{t.label}</p>
                  <p className="text-xs text-brand-muted leading-relaxed">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Access note */}
      <div className="py-12 px-5 md:px-8 lg:px-12 border-t border-brand-line">
        <div className="max-w-content mx-auto bg-brand-tint rounded-2xl p-6 border border-brand-line">
          <p className="text-sm font-bold text-brand-ink mb-2">Access is by institutional verification only.</p>
          <p className="text-sm text-brand-muted leading-relaxed">Regulator accounts are granted to verified EPA Liberia officers, Ministry of Mines & Energy officials, and designated county environmental officers. Government email address and institutional letter of authorisation required.</p>
        </div>
      </div>

      {/* CTA */}
      <div className="py-20 px-5 md:px-8 lg:px-12 bg-brand">
        <div className="max-w-content mx-auto flex flex-col lg:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Ready to enforce with data?</h2>
            <p className="text-white/70 max-w-md">Contact us to begin the institutional onboarding process for your regulatory body.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="flex-shrink-0 px-8 py-4 bg-white text-brand text-sm font-bold rounded-xl hover:bg-brand-tint transition-colors"
          >
            Request regulator access
          </button>
        </div>
      </div>

      <LandingFooter />
    </div>
  )
}
