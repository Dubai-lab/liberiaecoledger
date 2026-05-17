import { useState } from 'react'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'

const roles = [
  { value: 'consumer',     label: 'Consumer — I own devices I want to register' },
  { value: 'manufacturer', label: 'Manufacturer — I produce or import electronics' },
  { value: 'recycler',     label: 'Recycler — I hold an EPA Liberia recycler licence' },
  { value: 'regulator',    label: 'Regulator — I work for EPA Liberia or a government body' },
  { value: 'auditor',      label: 'Auditor / NGO — I audit or research e-waste compliance' },
  { value: 'other',        label: 'Other — Investor, press, academic, or partner' },
]

export function RequestAccessPage() {
  const [form, setForm] = useState({ name: '', email: '', org: '', role: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const subject = encodeURIComponent(`EcoLedger Access Request — ${form.role} — ${form.org}`)
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\nOrganisation: ${form.org}\nRole: ${form.role}\n\nMessage:\n${form.message}`
    )
    window.location.href = `mailto:support@liberiaecoledger.com?subject=${subject}&body=${body}`
    setSubmitted(true)
  }

  const ready = form.name && form.email && form.role

  return (
    <div className="min-h-screen bg-white">
      <LandingNav alwaysOpaque />

      <div className="bg-[#fafaf8] border-b border-[#e8e5de] pt-24 pb-12 px-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-[11px] font-semibold tracking-widest text-[#9b9b98] uppercase mb-2">Stakeholders</p>
          <h1 className="text-4xl font-bold text-[#0f0f0e] mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>
            Request stakeholder access
          </h1>
          <p className="text-sm text-[#9b9b98] leading-relaxed">
            EcoLedger is an invite-only platform. Tell us who you are and we'll get you onboarded within 2 business days.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">

        {submitted ? (
          <div className="bg-[#e8f5ec] border border-[#c5e0cb] rounded-2xl p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[#2d6a3f] flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="white" strokeWidth={2.5}>
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <p className="font-bold text-[#1a4a25] text-lg mb-2">Request sent!</p>
            <p className="text-sm text-[#2d6a3f]">Your email client has opened with your request pre-filled. Send it to complete your application. We'll be in touch within 2 business days.</p>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="mt-6 text-sm text-[#2d6a3f] hover:underline"
            >
              Submit another request
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-[#0f0f0e] mb-1.5">Full name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="George Emmanuel"
                  required
                  className="w-full border border-[#e8e5de] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a3f]/20 focus:border-[#2d6a3f] transition-colors bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0f0f0e] mb-1.5">Work email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="you@organisation.com"
                  required
                  className="w-full border border-[#e8e5de] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a3f]/20 focus:border-[#2d6a3f] transition-colors bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0f0f0e] mb-1.5">Organisation / company</label>
              <input
                type="text"
                value={form.org}
                onChange={e => set('org', e.target.value)}
                placeholder="EPA Liberia, Samsung West Africa, EcoRecycle Ltd…"
                className="w-full border border-[#e8e5de] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a3f]/20 focus:border-[#2d6a3f] transition-colors bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0f0f0e] mb-1.5">I am requesting access as a *</label>
              <select
                value={form.role}
                onChange={e => set('role', e.target.value)}
                required
                className="w-full border border-[#e8e5de] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a3f]/20 focus:border-[#2d6a3f] transition-colors bg-white"
              >
                <option value="">Select your role…</option>
                {roles.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0f0f0e] mb-1.5">Tell us more (optional)</label>
              <textarea
                value={form.message}
                onChange={e => set('message', e.target.value)}
                placeholder="What do you need the platform for? Any relevant context about your organisation or licence status helps us onboard you faster."
                rows={4}
                className="w-full border border-[#e8e5de] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a3f]/20 focus:border-[#2d6a3f] transition-colors bg-white resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={!ready}
              className="w-full py-4 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: '#0f0f0e' }}
            >
              Send access request →
            </button>

            <p className="text-xs text-center text-[#9b9b98]">
              This opens your email client pre-filled. Clicking send delivers your request to our team.
            </p>
          </form>
        )}

        {/* What to expect */}
        <div className="mt-12 border-t border-[#e8e5de] pt-10">
          <p className="text-[10px] font-bold tracking-widest text-[#9b9b98] uppercase mb-5">What happens next</p>
          <div className="space-y-4">
            {[
              { n: '01', title: 'We review your request',      body: 'Our team verifies your role, organisation, and any relevant credentials (EPA licence, government email, etc.) within 2 business days.' },
              { n: '02', title: 'You receive an invitation',   body: 'A secure invitation link is sent to your email. It sets up your account with the correct role and permissions.' },
              { n: '03', title: 'Complete account setup',      body: 'Set your password, verify your identity, and optionally connect a wallet. The process takes under 5 minutes.' },
              { n: '04', title: 'Start using the platform',    body: 'Your dashboard is ready. Register devices, log disposals, raise flags — whatever your role allows.' },
            ].map(s => (
              <div key={s.n} className="flex gap-4">
                <span className="text-[10px] font-bold text-[#9b9b98] mt-0.5 w-6 flex-shrink-0">{s.n}</span>
                <div>
                  <p className="text-sm font-semibold text-[#0f0f0e] mb-0.5">{s.title}</p>
                  <p className="text-sm text-[#9b9b98] leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <LandingFooter />
    </div>
  )
}
