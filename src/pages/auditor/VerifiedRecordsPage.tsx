import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Recycle, ArrowLeftRight, Leaf, Cpu, Search, Loader2, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Disposal, Transfer } from '@/types/database'

interface DisposalRow extends Disposal {
  device?: { brand: string; model: string; serial_number: string | null } | null
  facility?: { name: string; location_city: string } | null
}

interface TransferRow extends Transfer {
  device?: { brand: string; model: string; serial_number: string | null } | null
}

interface Stats {
  verifiedDisposals: number
  confirmedTransfers: number
  totalEcoCredits: number
  totalCo2Avoided: number
}

type Tab = 'disposals' | 'transfers'

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-LR', { dateStyle: 'medium' })
}

function shortHash(h: string | null) {
  if (!h) return null
  return `${h.slice(0, 8)}…${h.slice(-6)}`
}

const DISPOSAL_TYPE_LABEL: Record<string, string> = {
  recycle: 'Recycle',
  refurbish: 'Refurbish',
  salvage_parts: 'Salvage Parts',
  hazardous: 'Hazardous Waste',
}

const TRANSFER_REASON_LABEL: Record<string, string> = {
  resale: 'Resale',
  donation: 'Donation',
  gift: 'Gift',
  warranty_return: 'Warranty Return',
}

export function VerifiedRecordsPage() {
  const [tab, setTab] = useState<Tab>('disposals')
  const [disposals, setDisposals] = useState<DisposalRow[]>([])
  const [transfers, setTransfers] = useState<TransferRow[]>([])
  const [stats, setStats] = useState<Stats>({ verifiedDisposals: 0, confirmedTransfers: 0, totalEcoCredits: 0, totalCo2Avoided: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    Promise.all([
      supabase
        .from('disposals')
        .select(`*, device:devices(brand, model, serial_number), facility:recycler_facilities(name, location_city)`)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false }),
      supabase
        .from('transfers')
        .select(`*, device:devices(brand, model, serial_number)`)
        .in('status', ['confirmed', 'accepted', 'completed'])
        .order('created_at', { ascending: false }),
      supabase
        .from('eco_credits')
        .select('amount')
        .eq('type', 'earned'),
    ]).then(([dispRes, transRes, credRes]) => {
      const d = (dispRes.data as DisposalRow[]) ?? []
      const t = (transRes.data as TransferRow[]) ?? []
      setDisposals(d)
      setTransfers(t)
      // CO₂ derived from disposal mass (co2_kg_avoided on devices is always 0)
      const co2Kg = d.reduce((s, r) => s + ((r.final_mass_kg ?? 0) * 1.5), 0)
      setStats({
        verifiedDisposals: d.length,
        confirmedTransfers: t.length,
        totalEcoCredits: (credRes.data ?? []).reduce((s, c) => s + (c.amount ?? 0), 0),
        totalCo2Avoided: co2Kg,
      })
      setLoading(false)
    })
  }, [])

  const filteredDisposals = disposals.filter(d => {
    const q = search.toLowerCase()
    return !q || [d.device?.brand, d.device?.model, d.device?.serial_number, d.facility?.name].some(v => v?.toLowerCase().includes(q))
  })

  const filteredTransfers = transfers.filter(t => {
    const q = search.toLowerCase()
    return !q || [t.device?.brand, t.device?.model, t.device?.serial_number].some(v => v?.toLowerCase().includes(q))
  })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs text-muted-foreground tracking-widest uppercase mb-0.5">NGO / Auditor</p>
        <h1 className="text-2xl font-semibold">Verified Records</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Confirmed disposals and transfers — independently auditable lifecycle events.
        </p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Verified Disposals',   value: stats.verifiedDisposals.toLocaleString(),            icon: <Recycle className="w-5 h-5" />,        color: 'text-eco-700' },
              { label: 'Confirmed Transfers',  value: stats.confirmedTransfers.toLocaleString(),           icon: <ArrowLeftRight className="w-5 h-5" />,  color: 'text-blue-600' },
              { label: 'EcoCredits Issued',    value: stats.totalEcoCredits.toLocaleString(),              icon: <Leaf className="w-5 h-5" />,            color: 'text-eco-700' },
              { label: 'CO₂ Avoided (kg)',     value: stats.totalCo2Avoided.toFixed(1),                   icon: <Cpu className="w-5 h-5" />,             color: 'text-indigo-600' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-white border border-border rounded-xl p-5"
              >
                <div className={`mb-3 ${s.color}`}>{s.icon}</div>
                <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Tabs + search */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              {(['disposals', 'transfers'] as Tab[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    tab === t ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t === 'disposals' ? `Disposals (${stats.verifiedDisposals})` : `Transfers (${stats.confirmedTransfers})`}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search device or facility…"
                className="pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors w-60"
              />
            </div>
          </div>

          {/* Disposals list */}
          {tab === 'disposals' && (
            <div className="space-y-2">
              {filteredDisposals.length === 0 ? (
                <p className="text-center py-12 text-sm text-muted-foreground">No verified disposals yet.</p>
              ) : filteredDisposals.map((d, i) => (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-4 p-4 bg-white border border-border rounded-xl"
                >
                  <CheckCircle className="w-5 h-5 text-eco-700 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">
                        {d.device ? `${d.device.brand} ${d.device.model}` : d.device_id.slice(0, 8)}
                      </p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-eco-50 text-eco-700 font-medium">
                        {DISPOSAL_TYPE_LABEL[d.disposal_type] ?? d.disposal_type}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {d.facility?.name ?? 'Unknown facility'} · {d.final_mass_kg} kg · {d.eco_credits_awarded} credits · {fmt(d.created_at)}
                    </p>
                  </div>
                  {d.tx_hash && (
                    <a
                      href={`https://amoy.polygonscan.com/tx/${d.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-eco-700 transition-colors flex-shrink-0 max-sm:hidden"
                    >
                      {shortHash(d.tx_hash)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* Transfers list */}
          {tab === 'transfers' && (
            <div className="space-y-2">
              {filteredTransfers.length === 0 ? (
                <p className="text-center py-12 text-sm text-muted-foreground">No confirmed transfers yet.</p>
              ) : filteredTransfers.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-4 p-4 bg-white border border-border rounded-xl"
                >
                  <ArrowLeftRight className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">
                        {t.device ? `${t.device.brand} ${t.device.model}` : t.device_id.slice(0, 8)}
                      </p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                        {TRANSFER_REASON_LABEL[t.reason] ?? t.reason}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t.sale_price_lrd ? `LRD ${t.sale_price_lrd.toLocaleString()} · ` : ''}
                      {fmt(t.created_at)}
                    </p>
                  </div>
                  {t.tx_hash && (
                    <a
                      href={`https://amoy.polygonscan.com/tx/${t.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-eco-700 transition-colors flex-shrink-0 max-sm:hidden"
                    >
                      {shortHash(t.tx_hash)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
