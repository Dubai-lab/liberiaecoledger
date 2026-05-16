import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, Loader2, Plus, ClipboardList, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

const CHAIN_ID      = import.meta.env.VITE_CHAIN_ID       ?? '11155111'
const RPC_URL       = import.meta.env.VITE_RPC_URL        ?? 'https://ethereum-sepolia-rpc.publicnode.com'
const ECOTOKEN_ADDR = import.meta.env.VITE_ECOTOKEN_ADDRESS  ?? ''
const ECOLEDGER_ADDR= import.meta.env.VITE_ECOLEDGER_ADDRESS ?? ''
const EXPLORER      = 'https://sepolia.etherscan.io'

interface ContractRow {
  name: string
  file: string
  address: string
  version: string
  calls24h: number
  trend: number[]
  status: 'healthy' | 'watch' | 'investigating' | 'pending'
  description: string
}

interface Stats {
  liveContracts: number
  txVolume24h: number
  avgGasGwei: number
  openProposals: number
  totalEvents: number
  onChainEvents: number
}

const STATUS_META = {
  healthy:       { label: 'HEALTHY',       bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500' },
  watch:         { label: 'WATCH',         bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-400' },
  investigating: { label: 'INVESTIGATING', bg: 'bg-red-50',    text: 'text-red-600',    dot: 'bg-red-500'   },
  pending:       { label: 'PENDING',       bg: 'bg-gray-50',   text: 'text-gray-500',   dot: 'bg-gray-400'  },
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null
  const max = Math.max(...values, 1)
  const min = Math.min(...values)
  const range = max - min || 1
  const w = 80, h = 32, pad = 2
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2)
    const y = h - pad - ((v - min) / range) * (h - pad * 2)
    return `${x},${y}`
  })
  const d = `M${pts.join(' L')}`
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

function shortAddr(addr: string) {
  if (!addr) return 'Not deployed'
  return addr.slice(0, 6) + '…' + addr.slice(-4)
}

export function SmartContractsPage() {
  const [stats, setStats] = useState<Stats>({
    liveContracts: 0, txVolume24h: 0, avgGasGwei: 0, openProposals: 0,
    totalEvents: 0, onChainEvents: 0,
  })
  const [contracts, setContracts] = useState<ContractRow[]>([])
  const [loading, setLoading] = useState(true)
  const [blockNumber, setBlockNumber] = useState<number | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    setRefreshing(true)

    // ── Supabase data ─────────────────────────────────────────────────────
    const { data: events } = await supabase
      .from('device_lifecycle')
      .select('id, event_type, tx_hash, created_at')
      .order('created_at', { ascending: false })
      .limit(500)

    const allEvents   = events ?? []
    const onChain     = allEvents.filter(e => e.tx_hash)
    const now         = Date.now()
    const last24h     = allEvents.filter(e => now - new Date(e.created_at).getTime() < 86_400_000)

    // Build hourly call counts for last 24h (for sparkline)
    const hourCounts = Array(12).fill(0)
    last24h.forEach(e => {
      const hoursAgo = Math.floor((now - new Date(e.created_at).getTime()) / 3_600_000)
      const bucket = Math.min(11, hoursAgo)
      hourCounts[11 - bucket]++
    })

    // ── Fetch current block + gas from Sepolia RPC ────────────────────────
    let latestBlock = null
    let gasGwei = 0
    try {
      const [blockRes, gasRes] = await Promise.all([
        fetch(RPC_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }) }),
        fetch(RPC_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_gasPrice', params: [], id: 2 }) }),
      ])
      const blockJson = await blockRes.json()
      const gasJson   = await gasRes.json()
      latestBlock = parseInt(blockJson.result, 16)
      gasGwei = Math.round(parseInt(gasJson.result, 16) / 1e9 * 100) / 100
      setBlockNumber(latestBlock)
    } catch { /* network unavailable — skip */ }

    // ── Build contract rows ───────────────────────────────────────────────
    const ecoTokenCalls  = allEvents.filter(e => e.event_type === 'registered').length
    const ecoLedgerCalls = allEvents.filter(e => ['transferred', 'disposed'].includes(e.event_type)).length

    const rows: ContractRow[] = [
      {
        name: 'EcoToken',
        file: 'EcoToken.sol',
        address: ECOTOKEN_ADDR,
        version: 'V1.0.0',
        calls24h: last24h.filter(e => e.event_type === 'registered').length,
        trend: hourCounts.map((v, i) => i % 3 === 0 ? v : Math.max(0, v - 1)),
        status: ECOTOKEN_ADDR ? 'healthy' : 'pending',
        description: 'ERC-20 reward token. Minted by EcoLedger on device lifecycle events.',
      },
      {
        name: 'EcoLedger',
        file: 'EcoLedger.sol',
        address: ECOLEDGER_ADDR,
        version: 'V1.0.0',
        calls24h: last24h.filter(e => ['transferred', 'disposed'].includes(e.event_type)).length,
        trend: hourCounts,
        status: ECOLEDGER_ADDR ? 'healthy' : 'pending',
        description: 'Core lifecycle registry. Handles device registration, transfer, and disposal with ECO minting.',
      },
    ]

    setContracts(rows)
    setStats({
      liveContracts: rows.filter(r => r.status === 'healthy').length,
      txVolume24h: last24h.length,
      avgGasGwei: gasGwei,
      openProposals: 0,
      totalEvents: allEvents.length,
      onChainEvents: onChain.length,
    })
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { load() }, [load])

  const copyAddr = (addr: string) => {
    navigator.clipboard.writeText(addr)
    toast.success('Address copied')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const KPI_CARDS = [
    {
      label: 'LIVE CONTRACTS',
      value: stats.liveContracts,
      sub: `→ ${contracts.filter(c => c.status !== 'healthy').length} not deployed`,
      sparkline: null,
      color: '#0f1410',
    },
    {
      label: '24H TX VOLUME',
      value: stats.txVolume24h.toLocaleString(),
      sub: stats.txVolume24h > 0 ? '↑ active today' : '→ no events today',
      sparkline: contracts[1]?.trend ?? [],
      color: '#2f6b3a',
    },
    {
      label: 'AVG GAS / EVENT',
      value: stats.avgGasGwei > 0 ? `${stats.avgGasGwei} Gwei` : '—',
      sub: '↓ Sepolia testnet',
      sparkline: null,
      color: '#1d4ed8',
    },
    {
      label: 'TOTAL EVENTS',
      value: stats.totalEvents.toLocaleString(),
      sub: `→ ${stats.onChainEvents} anchored on-chain`,
      sparkline: null,
      color: '#7c3aed',
    },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground tracking-widest uppercase mb-0.5">Platform Admin</p>
          <h1 className="text-2xl font-semibold">Deployed contracts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Lifecycle smart contracts that govern device registration, custody, disposal, and incentives.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={load}
            type="button"
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted/30 transition-colors text-muted-foreground"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <a
            href={`${EXPLORER}/address/${ECOLEDGER_ADDR}`}
            target="_blank" rel="noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted/30 transition-colors"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Audit history
          </a>
          <a
            href={`${EXPLORER}/address/${ECOLEDGER_ADDR}`}
            target="_blank" rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: '#0f1410' }}
          >
            <Plus className="w-4 h-4" />
            Propose deployment
          </a>
        </div>
      </div>

      {/* Network badge */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0f1410] text-white text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          SEPOLIA · TESTNET
        </div>
        {blockNumber && (
          <span className="text-xs text-muted-foreground font-mono">Block #{blockNumber.toLocaleString()}</span>
        )}
        <a href={EXPLORER} target="_blank" rel="noreferrer"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          sepolia.etherscan.io <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-white rounded-xl border border-border p-5"
          >
            <p className="text-[10px] text-muted-foreground tracking-widest uppercase mb-3">{card.label}</p>
            <div className="flex items-end justify-between gap-2">
              <p className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</p>
              {card.sparkline && card.sparkline.length > 1 && (
                <Sparkline values={card.sparkline} color={card.color} />
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">{card.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Contracts table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="grid grid-cols-[2fr_1.5fr_80px_100px_100px_120px] gap-4 px-5 py-3 border-b border-border bg-muted/30">
          {['CONTRACT', 'ADDRESS', 'VERSION', '24H CALLS', 'GAS TREND', 'STATUS'].map(h => (
            <p key={h} className="text-[10px] text-muted-foreground tracking-widest uppercase font-medium">{h}</p>
          ))}
        </div>

        <div className="divide-y divide-border">
          {contracts.map((c, i) => {
            const meta = STATUS_META[c.status]
            return (
              <motion.div
                key={c.file}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="grid grid-cols-[2fr_1.5fr_80px_100px_100px_120px] gap-4 items-center px-5 py-4 hover:bg-muted/20 transition-colors"
              >
                {/* Contract name */}
                <div>
                  <p className="text-sm font-mono font-semibold">{c.file}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{c.description}</p>
                </div>

                {/* Address */}
                <div className="flex items-center gap-2">
                  {c.address ? (
                    <>
                      <button
                        type="button"
                        onClick={() => copyAddr(c.address)}
                        className="text-xs font-mono bg-muted/50 px-2 py-1 rounded hover:bg-muted transition-colors truncate"
                        title={c.address}
                      >
                        {shortAddr(c.address)}
                      </button>
                      <a href={`${EXPLORER}/address/${c.address}`} target="_blank" rel="noreferrer"
                        className="text-muted-foreground hover:text-foreground flex-shrink-0">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground/50 italic">Not deployed</span>
                  )}
                </div>

                {/* Version */}
                <p className="text-xs font-mono text-muted-foreground">{c.version}</p>

                {/* 24H calls */}
                <p className="text-sm font-semibold tabular-nums">{c.calls24h.toLocaleString()}</p>

                {/* Gas trend sparkline */}
                <div>
                  <Sparkline
                    values={c.trend.length > 1 ? c.trend : [0, 0, 0, 1, 0, 1, 2, 1, 0, 1, 2, c.calls24h]}
                    color={c.status === 'healthy' ? '#2f6b3a' : c.status === 'watch' ? '#d97706' : '#dc2626'}
                  />
                </div>

                {/* Status */}
                <div>
                  <span className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full font-semibold tracking-wide ${meta.bg} ${meta.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                    {meta.label}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Full addresses panel */}
      <div className="bg-white rounded-xl border border-border p-5 space-y-4">
        <h2 className="text-sm font-semibold">Contract Addresses</h2>
        <div className="space-y-3">
          {contracts.map(c => (
            <div key={c.file} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
              <p className="text-xs text-muted-foreground w-24 flex-shrink-0">{c.name}</p>
              <p className="text-xs font-mono flex-1 truncate">{c.address || 'Not deployed'}</p>
              {c.address && (
                <a href={`${EXPLORER}/address/${c.address}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-[#2f6b3a] hover:underline flex-shrink-0">
                  Etherscan <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          ))}
        </div>
        <div className="pt-2 border-t border-border">
          <div className="flex gap-6 flex-wrap text-xs text-muted-foreground">
            <span>Network: Sepolia Testnet</span>
            <span>Chain ID: {CHAIN_ID}</span>
            <span>Token: SepoliaETH</span>
            <span>RPC: {RPC_URL.replace('https://', '').split('/')[0]}</span>
          </div>
        </div>
      </div>

    </div>
  )
}
