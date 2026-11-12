import { useCallback, useEffect, useState } from 'react'
import { Factory, UserCheck, ArrowLeftRight, Recycle, Flag, Loader2, ExternalLink, RefreshCw, Smartphone, Laptop } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const ETHERSCAN = 'https://sepolia.etherscan.io'
const PAGE = 25

interface LedgerEvent {
  id: string
  event_type: 'manufactured' | 'registered' | 'transferred' | 'disposed' | 'flagged'
  created_at: string
  brand: string
  model: string
  category: string
  device_ref: string
  identifier_hint: string | null
  actor_label: string
  location: string | null
  tx_hash: string | null
  block_number: number | null
}

const EVENT_META: Record<LedgerEvent['event_type'], { label: string; Icon: typeof Factory; tone: string }> = {
  manufactured: { label: 'Manufactured', Icon: Factory,        tone: 'bg-brand-tint text-brand' },
  registered:   { label: 'Registered',   Icon: UserCheck,      tone: 'bg-[#E6F2EA] text-[#1F6B43]' },
  transferred:  { label: 'Transferred',  Icon: ArrowLeftRight, tone: 'bg-[#EAF0F7] text-[#2B5A8A]' },
  disposed:     { label: 'Recycled',     Icon: Recycle,        tone: 'bg-[#F1EEE4] text-[#7A5B12]' },
  flagged:      { label: 'Flagged',      Icon: Flag,           tone: 'bg-red-50 text-red-700' },
}

const FILTERS: { key: 'all' | LedgerEvent['event_type']; label: string }[] = [
  { key: 'all',          label: 'All events' },
  { key: 'manufactured', label: 'Manufactured' },
  { key: 'registered',   label: 'Registered' },
  { key: 'transferred',  label: 'Transferred' },
  { key: 'disposed',     label: 'Recycled' },
  { key: 'flagged',      label: 'Flagged' },
]

function timeAgo(iso: string) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.round(s / 60); if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60); if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24); if (d < 30) return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-LR', { dateStyle: 'medium' })
}

/** Read-only, privacy-safe feed of every lifecycle event (public_ledger() RPC — no login needed). */
export function PublicLedgerFeed() {
  const [events, setEvents] = useState<LedgerEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [more, setMore] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | LedgerEvent['event_type']>('all')

  const load = useCallback(async (before?: string) => {
    setLoading(true)
    setError(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('public_ledger', { p_limit: PAGE, p_before: before ?? null })
    if (error) {
      setError('The public ledger is temporarily unavailable.')
    } else {
      const rows = (data ?? []) as LedgerEvent[]
      setEvents(prev => (before ? [...prev, ...rows] : rows))
      setMore(rows.length === PAGE)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const visible = filter === 'all' ? events : events.filter(e => e.event_type === filter)

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTERS.map(f => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`flex-shrink-0 h-8 px-3.5 rounded-full text-xs font-semibold transition-colors ${
                filter === f.key ? 'bg-brand text-white' : 'bg-brand-tint text-brand-muted hover:text-brand-ink'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => load()}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-brand-line text-xs font-medium text-brand-muted hover:text-brand-ink disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="bg-white border border-brand-line rounded-2xl overflow-hidden">
        {error ? (
          <p className="px-5 py-10 text-sm text-center text-brand-muted">{error}</p>
        ) : loading && events.length === 0 ? (
          <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-brand-muted" /></div>
        ) : visible.length === 0 ? (
          <p className="px-5 py-10 text-sm text-center text-brand-muted">No events of this type yet.</p>
        ) : (
          <ul className="divide-y divide-brand-line">
            {visible.map(e => {
              const meta = EVENT_META[e.event_type] ?? EVENT_META.registered
              const DeviceIcon = e.category === 'Laptop' ? Laptop : Smartphone
              return (
                <li key={e.id} className="flex items-start gap-3 sm:gap-4 px-4 sm:px-5 py-4">
                  <span className={`flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl ${meta.tone}`}>
                    <meta.Icon className="w-[18px] h-[18px]" strokeWidth={1.9} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-brand-ink">{meta.label}</span>
                      <span className="inline-flex items-center gap-1 text-sm text-brand-ink/80 min-w-0">
                        <DeviceIcon className="w-3.5 h-3.5 text-brand-sage flex-shrink-0" />
                        <span className="truncate">{e.brand} {e.model}</span>
                      </span>
                    </div>
                    <p className="text-xs text-brand-muted mt-1">
                      {e.actor_label}{e.location ? ` · ${e.location}` : ''}
                      {e.identifier_hint ? <> · <span className="font-mono">{e.identifier_hint}</span></> : null}
                    </p>
                    <p className="text-[11px] text-brand-sage mt-1 font-mono">
                      device {e.device_ref}
                      {e.tx_hash && (
                        <>
                          {' · '}
                          <a
                            href={`${ETHERSCAN}/tx/${e.tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 text-brand hover:underline"
                          >
                            tx {e.tx_hash.slice(0, 10)}… <ExternalLink className="w-3 h-3" />
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                  <time dateTime={e.created_at} title={new Date(e.created_at).toLocaleString()} className="flex-shrink-0 text-[11px] text-brand-sage whitespace-nowrap pt-0.5">
                    {timeAgo(e.created_at)}
                  </time>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {more && events.length > 0 && !error && (
        <div className="flex justify-center mt-4">
          <button
            type="button"
            onClick={() => load(events[events.length - 1]?.created_at)}
            disabled={loading}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-lg border border-brand-line text-sm font-medium text-brand-ink hover:bg-brand-tint disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Load older events
          </button>
        </div>
      )}

      <p className="text-[11px] text-brand-sage mt-3 leading-relaxed">
        Organisations (manufacturers, recyclers, regulators) are named. Private device owners are never identified, and device identifiers are partially masked.
      </p>
    </div>
  )
}
