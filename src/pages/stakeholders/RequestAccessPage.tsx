import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
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

const EMPTY_FORM = { name: '', email: '', phone: '', org: '', jobTitle: '', role: '', message: '' }

export function RequestAccessPage() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const set = (k: keyof typeof EMPTY_FORM, v: string) => setForm(f => ({ ...f, [k]: v }))

  const ready = form.name.trim().length >= 2 && form.email.trim() !== '' && form.role !== ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ready || submitting) return
    setSubmitting(true)

    // Generate the id client-side: anonymous visitors can insert but not read rows back.
    const id = crypto.randomUUID()
    const trimOrNull = (v: string) => v.trim() || null

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('access_requests') as any).insert({
        id,
        full_name:      form.name.trim(),
        email:          form.email.toLowerCase().trim(),
        phone:          trimOrNull(form.phone),
        organization:   trimOrNull(form.org),
        job_title:      trimOrNull(form.jobTitle),
        requested_role: form.role,
        message:        trimOrNull(form.message),
      })
      if (error) throw error

      // Alert admins (email + in-app notification). Non-blocking: the request is already saved.
      supabase.functions
        .invoke('notify', { body: { type: 'INSERT', table: 'access_requests', record: { id } } })
        .catch(() => {})

      setSubmitted(true)
      setForm(EMPTY_FORM)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not submit your request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

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
            <p className="font-bold text-[#1a4a25] text-lg mb-2">Request received!</p>
            <p className="text-sm text-[#2d6a3f]">Our team will review your details. Once approved, you'll receive an email with your access code and a link to set up your password. We'll be in touch within 2 business days.</p>
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
                  autoComplete="name"
                  maxLength={120}
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
                  autoComplete="email"
                  maxLength={254}
                  required
                  className="w-full border border-[#e8e5de] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a3f]/20 focus:border-[#2d6a3f] transition-colors bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-[#0f0f0e] mb-1.5">Phone / contact number</label>
                <input
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="+231 77 000 0000"
                  maxLength={40}
                  className="w-full border border-[#e8e5de] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a3f]/20 focus:border-[#2d6a3f] transition-colors bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0f0f0e] mb-1.5">Job title / position</label>
                <input
                  type="text"
                  autoComplete="organization-title"
                  value={form.jobTitle}
                  onChange={e => set('jobTitle', e.target.value)}
                  placeholder="Compliance Officer, Director…"
                  maxLength={120}
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
                maxLength={160}
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
                maxLength={2000}
                className="w-full border border-[#e8e5de] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a3f]/20 focus:border-[#2d6a3f] transition-colors bg-white resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={!ready || submitting}
              className="w-full py-4 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: '#0f0f0e' }}
            >
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : 'Send access request →'}
            </button>

            <p className="text-xs text-center text-[#9b9b98]">
              Your request goes straight to the EcoLedger admin team for review.
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
