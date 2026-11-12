import { useState } from 'react'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'

const BASE_URL = 'https://ihjooawueqocqpmdbjwi.supabase.co'

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="relative bg-brand rounded-xl overflow-hidden mt-3">
      <button
        onClick={copy}
        className="absolute top-3 right-3 text-[10px] font-semibold text-white/70 hover:text-white transition-colors px-2 py-1 rounded border border-white/10"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <pre className="text-[11px] font-mono text-[#8FD3A8] p-4 pr-16 overflow-x-auto leading-relaxed whitespace-pre-wrap">{code}</pre>
    </div>
  )
}

function Method({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: 'bg-brand-tint text-brand',
    POST: 'bg-blue-50 text-blue-700',
    PATCH: 'bg-amber-50 text-amber-700',
    DELETE: 'bg-red-50 text-red-700',
  }
  return (
    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${colors[method] ?? 'bg-gray-100 text-gray-600'}`}>
      {method}
    </span>
  )
}

function Endpoint({ method, path, desc, example }: { method: string; path: string; desc: string; example: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-brand-line rounded-xl overflow-hidden mb-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-brand-tint transition-colors"
      >
        <Method method={method} />
        <code className="text-sm font-mono text-brand-ink flex-1">{path}</code>
        <p className="text-xs text-brand-muted hidden md:block">{desc}</p>
        <svg viewBox="0 0 24 24" fill="none" className={`w-4 h-4 text-brand-muted flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} stroke="currentColor" strokeWidth={2}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-brand-line bg-white">
          <p className="text-sm text-brand-muted mt-4 mb-2">{desc}</p>
          <p className="text-[10px] font-bold tracking-widest text-brand-muted uppercase mb-1">Example request</p>
          <CodeBlock code={example} />
        </div>
      )}
    </div>
  )
}

export function APIDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNav alwaysOpaque />

      <div className="bg-brand-tint border-b border-brand-line pt-32 pb-10 px-5 md:px-8 lg:px-12">
        <div className="max-w-content mx-auto">
          <p className="text-[11px] font-semibold tracking-widest text-brand-muted uppercase mb-2">Resources</p>
          <h1 className="text-4xl font-bold text-brand mb-3 font-display font-bold">
            API Documentation
          </h1>
          <p className="text-sm text-brand-muted">EcoLedger is powered by a Supabase REST API. All endpoints require authentication except the public stats function.</p>
        </div>
      </div>

      <div className="max-w-content mx-auto box-content px-5 md:px-8 lg:px-12 py-12 space-y-12">

        {/* Base URL */}
        <div>
          <p className="text-[10px] font-bold tracking-widest text-brand-muted uppercase mb-3">Base URL</p>
          <CodeBlock code={`${BASE_URL}/rest/v1`} />
        </div>

        {/* Authentication */}
        <div>
          <h2 className="text-xl font-bold text-brand-ink mb-4">Authentication</h2>
          <p className="text-sm text-brand-muted leading-relaxed mb-4">
            All API requests require two headers: your Supabase anon key as <code className="bg-brand-tint px-1 py-0.5 rounded text-xs font-mono">apikey</code>, and a valid JWT as <code className="bg-brand-tint px-1 py-0.5 rounded text-xs font-mono">Authorization: Bearer &lt;token&gt;</code>. You obtain the JWT by signing in via the Supabase Auth API.
          </p>
          <CodeBlock code={`curl '${BASE_URL}/rest/v1/devices' \\
  -H "apikey: YOUR_ANON_KEY" \\
  -H "Authorization: Bearer YOUR_JWT"`} />
        </div>

        {/* Public stats */}
        <div>
          <h2 className="text-xl font-bold text-brand-ink mb-2">Public Stats (no auth required)</h2>
          <p className="text-sm text-brand-muted mb-4">Returns live platform statistics. Uses a service-role edge function that bypasses RLS — safe for public embedding.</p>
          <Endpoint
            method="GET"
            path="/functions/v1/public-stats"
            desc="Returns device count, recycler count, lifecycle events, EcoCredits issued, and disposal count."
            example={`curl '${BASE_URL}/functions/v1/public-stats' \\
  -H "apikey: YOUR_ANON_KEY" \\
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Response
{
  "devices": 1,
  "recyclers": 0,
  "lifecycleEvents": 1,
  "creditsIssued": 10,
  "disposedCount": 0
}`}
          />
        </div>

        {/* Devices */}
        <div>
          <h2 className="text-xl font-bold text-brand-ink mb-4">Devices</h2>
          <Endpoint
            method="GET"
            path="/rest/v1/devices"
            desc="List devices. Consumers see only their own. Regulators, auditors, and admins see all."
            example={`curl '${BASE_URL}/rest/v1/devices?select=*&order=created_at.desc' \\
  -H "apikey: YOUR_ANON_KEY" \\
  -H "Authorization: Bearer YOUR_JWT"`}
          />
          <Endpoint
            method="GET"
            path="/rest/v1/devices?id=eq.{id}"
            desc="Fetch a single device by UUID."
            example={`curl '${BASE_URL}/rest/v1/devices?id=eq.{device-uuid}&select=*' \\
  -H "apikey: YOUR_ANON_KEY" \\
  -H "Authorization: Bearer YOUR_JWT"`}
          />
          <Endpoint
            method="POST"
            path="/rest/v1/devices"
            desc="Register a new device. Authenticated users only. Returns the created device record."
            example={`curl -X POST '${BASE_URL}/rest/v1/devices' \\
  -H "apikey: YOUR_ANON_KEY" \\
  -H "Authorization: Bearer YOUR_JWT" \\
  -H "Content-Type: application/json" \\
  -H "Prefer: return=representation" \\
  -d '{
    "brand": "Samsung",
    "model": "Galaxy A54",
    "imei": "353456789012345",
    "device_type": "mobile_phone",
    "hazard_class": "B",
    "current_owner_id": "profile-uuid",
    "status": "in_use"
  }'`}
          />
        </div>

        {/* Lifecycle events */}
        <div>
          <h2 className="text-xl font-bold text-brand-ink mb-4">Lifecycle Events</h2>
          <Endpoint
            method="GET"
            path="/rest/v1/device_lifecycle"
            desc="Fetch lifecycle events. Filter by device_id to get the full history of a specific device."
            example={`curl '${BASE_URL}/rest/v1/device_lifecycle?device_id=eq.{device-uuid}&order=created_at.asc' \\
  -H "apikey: YOUR_ANON_KEY" \\
  -H "Authorization: Bearer YOUR_JWT"`}
          />
          <Endpoint
            method="POST"
            path="/rest/v1/device_lifecycle"
            desc="Record a lifecycle event (registered, transferred, disposed, flagged)."
            example={`curl -X POST '${BASE_URL}/rest/v1/device_lifecycle' \\
  -H "apikey: YOUR_ANON_KEY" \\
  -H "Authorization: Bearer YOUR_JWT" \\
  -H "Content-Type: application/json" \\
  -d '{
    "device_id": "device-uuid",
    "event_type": "transferred",
    "actor_id": "profile-uuid",
    "location": "Monrovia, Liberia",
    "notes": "Sold to new owner"
  }'`}
          />
        </div>

        {/* EcoCredits */}
        <div>
          <h2 className="text-xl font-bold text-brand-ink mb-4">EcoCredits</h2>
          <Endpoint
            method="GET"
            path="/rest/v1/eco_credits"
            desc="Fetch credit transactions for the authenticated user. Consumers see their own; admins see all."
            example={`curl '${BASE_URL}/rest/v1/eco_credits?user_id=eq.{profile-uuid}&order=created_at.desc' \\
  -H "apikey: YOUR_ANON_KEY" \\
  -H "Authorization: Bearer YOUR_JWT"`}
          />
        </div>

        {/* Compliance flags */}
        <div>
          <h2 className="text-xl font-bold text-brand-ink mb-4">Compliance Flags</h2>
          <Endpoint
            method="GET"
            path="/rest/v1/compliance_flags"
            desc="List all compliance flags. Regulators and admins only. Filter by status or severity."
            example={`curl '${BASE_URL}/rest/v1/compliance_flags?status=eq.open&order=created_at.desc' \\
  -H "apikey: YOUR_ANON_KEY" \\
  -H "Authorization: Bearer YOUR_JWT"`}
          />
          <Endpoint
            method="PATCH"
            path="/rest/v1/compliance_flags?id=eq.{id}"
            desc="Update a flag status (open → investigating → resolved). Regulators and admins only."
            example={`curl -X PATCH '${BASE_URL}/rest/v1/compliance_flags?id=eq.{flag-uuid}' \\
  -H "apikey: YOUR_ANON_KEY" \\
  -H "Authorization: Bearer YOUR_JWT" \\
  -H "Content-Type: application/json" \\
  -d '{"status": "resolved", "resolved_by": "profile-uuid", "resolved_at": "2026-05-17T10:00:00Z"}'`}
          />
        </div>

        {/* Recycler facilities */}
        <div>
          <h2 className="text-xl font-bold text-brand-ink mb-4">Recycler Facilities</h2>
          <Endpoint
            method="GET"
            path="/rest/v1/recycler_facilities"
            desc="List all EPA-verified recycler facilities. Available to all authenticated users."
            example={`curl '${BASE_URL}/rest/v1/recycler_facilities?is_active=eq.true&select=*' \\
  -H "apikey: YOUR_ANON_KEY" \\
  -H "Authorization: Bearer YOUR_JWT"`}
          />
        </div>

        {/* Rate limits */}
        <div className="border border-brand-line rounded-2xl p-6">
          <h2 className="text-base font-bold text-brand-ink mb-3">Rate Limits & Fair Use</h2>
          <p className="text-sm text-brand-muted leading-relaxed">
            The API is served via Supabase's managed infrastructure. Default rate limits apply per the Supabase free tier. For high-volume integrations (bulk manufacturer imports, NGO data exports), contact <a href="mailto:support@liberiaecoledger.com" className="text-brand hover:underline">support@liberiaecoledger.com</a> to discuss a dedicated access agreement.
          </p>
        </div>

      </div>

      <LandingFooter />
    </div>
  )
}
