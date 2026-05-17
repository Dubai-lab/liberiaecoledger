import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="text-lg font-bold text-[#0f0f0e] mb-4 pb-2 border-b border-[#e8e5de]">{title}</h2>
      <div className="space-y-3 text-sm text-[#6b6b68] leading-relaxed">{children}</div>
    </div>
  )
}

const cookies = [
  { name: 'sb-access-token', purpose: 'Supabase session authentication token. Required for secure login and API access.', duration: 'Session', essential: true },
  { name: 'sb-refresh-token', purpose: 'Supabase token used to refresh your session without re-entering credentials.', duration: '7 days', essential: true },
  { name: 'privy-token', purpose: 'Privy embedded wallet authentication state. Required for wallet-based login.', duration: 'Session', essential: true },
  { name: '__cf_bm', purpose: 'Cloudflare bot management cookie. Used to distinguish automated from human traffic for security.', duration: '30 minutes', essential: true },
]

export function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNav alwaysOpaque />

      <div className="bg-[#fafaf8] border-b border-[#e8e5de] pt-24 pb-10 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] font-semibold tracking-widest text-[#9b9b98] uppercase mb-2">Legal</p>
          <h1 className="text-4xl font-bold text-[#0f0f0e] mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>
            Cookie Policy
          </h1>
          <p className="text-sm text-[#9b9b98]">Last updated: May 2026 · Strictly essential cookies only · No ad trackers</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">

        <div className="bg-[#e8f5ec] border border-[#c5e0cb] rounded-2xl p-5 mb-10 flex gap-4">
          <div className="w-8 h-8 rounded-full bg-[#2d6a3f] flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="white" strokeWidth={2.5}>
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-[#1a4a25] mb-1">We only use essential cookies.</p>
            <p className="text-sm text-[#2d6a3f]">EcoLedger does not use advertising, marketing, analytics, or third-party tracking cookies. No cookie consent banner is shown because no non-essential cookies are set.</p>
          </div>
        </div>

        <Section title="1. What Are Cookies">
          <p>Cookies are small text files stored on your device by your browser when you visit a website. They help websites remember your session and preferences. Cookies can be "session" cookies (deleted when you close your browser) or "persistent" cookies (stored for a set duration).</p>
        </Section>

        <Section title="2. Cookies We Use">
          <p>We use only strictly essential cookies — those required for the Platform to function. The table below lists every cookie set by the EcoLedger Platform.</p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-[#e8e5de]">
            <table className="w-full text-xs">
              <thead className="bg-[#fafaf8]">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-[#0f0f0e] w-1/4">Cookie name</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#0f0f0e]">Purpose</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#0f0f0e] w-24">Duration</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#0f0f0e] w-20">Essential</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8e5de]">
                {cookies.map(c => (
                  <tr key={c.name} className="bg-white">
                    <td className="px-4 py-3 font-mono text-[#0f0f0e]">{c.name}</td>
                    <td className="px-4 py-3 text-[#6b6b68]">{c.purpose}</td>
                    <td className="px-4 py-3 text-[#6b6b68]">{c.duration}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-[#2d6a3f] font-semibold">
                        <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={2.5}>
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                        Yes
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="3. Cookies We Do Not Use">
          <p>We explicitly do not set any of the following:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Google Analytics or any other analytics tracking cookies</li>
            <li>Facebook Pixel, Google Ads, or other advertising cookies</li>
            <li>Social media tracking cookies (Twitter, LinkedIn, etc.)</li>
            <li>Heatmap or session-recording cookies (Hotjar, FullStory, etc.)</li>
            <li>A/B testing or personalisation cookies</li>
          </ul>
        </Section>

        <Section title="4. Third-Party Services">
          <p>Our infrastructure providers (Supabase, Vercel, Cloudflare) may set their own cookies as part of their service delivery. These are infrastructure-level cookies and are not used for tracking or profiling. Links to their respective cookie policies are below:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Supabase: <span className="text-[#2d6a3f]">supabase.com/privacy</span></li>
            <li>Vercel: <span className="text-[#2d6a3f]">vercel.com/legal/privacy-policy</span></li>
            <li>Cloudflare: <span className="text-[#2d6a3f]">cloudflare.com/privacypolicy</span></li>
          </ul>
        </Section>

        <Section title="5. Managing Cookies">
          <p>Because we only use strictly essential cookies, disabling them via your browser settings will prevent the Platform from functioning correctly — you will be unable to log in or maintain a session. We do not support a "reject all" option because the Platform cannot operate without session authentication.</p>
          <p>If you wish to clear all cookies, use your browser's built-in data management tools. This will log you out of the Platform.</p>
        </Section>

        <Section title="6. Contact">
          <p>If you have questions about our use of cookies, contact <a href="mailto:support@liberiaecoledger.com" className="text-[#2d6a3f] hover:underline">support@liberiaecoledger.com</a>.</p>
        </Section>

      </div>

      <LandingFooter />
    </div>
  )
}
