import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Cpu, ArrowLeftRight, Recycle, ShieldAlert, Tag, Loader2, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { DeviceLifecycleEvent } from '@/types/database'

interface EventRow extends DeviceLifecycleEvent {
  device?: { brand: string; model: string; serial_number: string | null; imei: string | null } | null
}

const EVENT_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  manufactured: { label: 'Manufactured',  color: 'text-blue-700',  bg: 'bg-blue-50',   icon: <Tag className="w-3.5 h-3.5" /> },
  registered:   { label: 'Registered',    color: 'text-indigo-700', bg: 'bg-indigo-50', icon: <Cpu className="w-3.5 h-3.5" /> },
  transferred:  { label: 'Transferred',   color: 'text-yellow-700', bg: 'bg-yellow-50', icon: <ArrowLeftRight className="w-3.5 h-3.5" /> },
  disposed:     { label: 'Disposed',      color: 'text-eco-700',   bg: 'bg-eco-50',    icon: <Recycle className="w-3.5 h-3.5" /> },
  flagged:      { label: 'Flagged',       color: 'text-red-700',   bg: 'bg-red-50',    icon: <ShieldAlert className="w-3.5 h-3.5" /> },
}

const EVENT_TYPES = ['all', 'manufactured', 'registered', 'transferred', 'disposed', 'flagged']

function fmt(d: string) {
  return new Date(d).toLocaleString('en-LR', { dateStyle: 'medium', timeStyle: 'short' })
}

function shortHash(h: string | null) {
  if (!h) return null
  return `${h.slice(0, 8)}…${h.slice(-6)}`
}

export function BlockExplorerPage() {
  const [events, setEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    setLoading(true)
    supabase
      .from('device_lifecycle')
      .select(`
        *,
        device:devices(brand, model, serial_number, imei)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data, count }) => {
        setEvents((data as EventRow[]) ?? [])
        setTotalCount(count ?? 0)
        setLoading(false)
      })
  }, [])

  const filtered = events.filter(e => {
    const matchType = typeFilter === 'all' || e.event_type === typeFilter
    const q = search.toLowerCase()
    const matchSearch = !q || [
      e.device?.brand, e.device?.model, e.device?.serial_number,
      e.device?.imei, e.actor_name, e.location, e.tx_hash, e.device_id,
    ].some(v => v?.toLowerCase().includes(q))
    return matchType && matchSearch
  })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs text-muted-foreground tracking-widest uppercase mb-0.5">NGO / Auditor</p>
        <h1 className="text-2xl font-semibold">Block Explorer</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Immutable event log for every device on the EcoLedger chain · {totalCount.toLocaleString()} total events
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search device, actor, serial, IMEI, tx hash…"
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors"
        >
          {EVENT_TYPES.map(t => (
            <option key={t} value={t}>{t === 'all' ? 'All event types' : EVENT_META[t]?.label ?? t}</option>
          ))}
        </select>
      </div>

      {/* Event type legend */}
      <div className="flex flex-wrap gap-2 mb-5">
        {Object.entries(EVENT_META).map(([key, m]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTypeFilter(typeFilter === key ? 'all' : key)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              typeFilter === key ? `${m.bg} ${m.color} border-current` : 'bg-white border-border text-muted-foreground hover:border-eco-700/30'
            }`}
          >
            {m.icon}
            {m.label}
          </button>
        ))}
      </div>

      {/* Event feed */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-sm text-muted-foreground">No events match your search.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((ev, i) => {
            const meta = EVENT_META[ev.event_type] ?? EVENT_META.registered
            const hash = shortHash(ev.tx_hash)
            return (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                className="flex items-center gap-4 p-4 bg-white border border-border rounded-xl"
              >
                {/* Event badge */}
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${meta.bg} ${meta.color}`}>
                  {meta.icon}
                  {meta.label}
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium truncate">
                      {ev.device ? `${ev.device.brand} ${ev.device.model}` : ev.device_id.slice(0, 8) + '…'}
                    </p>
                    {ev.device?.serial_number && (
                      <span className="text-[10px] text-muted-foreground font-mono">SN: {ev.device.serial_number}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {ev.actor_name ?? 'Unknown actor'}
                    {ev.location && ` · ${ev.location}`}
                  </p>
                </div>

                {/* Tx hash */}
                {hash && (
                  <a
                    href={`https://amoy.polygonscan.com/tx/${ev.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden sm:flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-eco-700 transition-colors flex-shrink-0"
                  >
                    {hash}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                {/* Timestamp */}
                <p className="text-xs text-muted-foreground flex-shrink-0 hidden md:block">
                  {fmt(ev.created_at)}
                </p>
              </motion.div>
            )
          })}
        </div>
      )}

      {filtered.length > 0 && !loading && (
        <p className="text-xs text-center text-muted-foreground mt-4">
          Showing {filtered.length} of {totalCount.toLocaleString()} events
        </p>
      )}
    </div>
  )
}
