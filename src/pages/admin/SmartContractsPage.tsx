import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Code2, ExternalLink, Loader2, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const CHAIN_ID  = import.meta.env.VITE_POLYGON_CHAIN_ID ?? '80002'
const RPC_URL   = import.meta.env.VITE_POLYGON_RPC_URL  ?? 'https://rpc-amoy.polygon.technology'
const EXPLORER  = 'https://amoy.polygonscan.com'

interface OnChainEvent {
  id: string
  event_type: string
  tx_hash: string | null
  created_at: string
  actor_name: string | null
}

interface ChainStats {
  totalEvents: number
  onChainEvents: number
  recentTx: OnChainEvent[]
}

export function SmartContractsPage() {
  const [stats, setStats] = useState<ChainStats>({ totalEvents: 0, onChainEvents: 0, recentTx: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('device_lifecycle')
      .select('id, event_type, tx_hash, created_at, actor_name')
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data }) => {
        const events = data ?? []
        const withTx = events.filter(e => e.tx_hash)
        setStats({
          totalEvents:   events.length,
          onChainEvents: withTx.length,
          recentTx:      withTx.slice(0, 10),
        })
        setLoading(false)
      })
  }, [])

  const EVENT_COLORS: Record<string, string> = {
    registered:   'bg-indigo-50 text-indigo-700',
    transferred:  'bg-yellow-50 text-yellow-700',
    disposed:     'bg-eco-50 text-eco-700',
    flagged:      'bg-red-50 text-red-700',
    manufactured: 'bg-blue-50 text-blue-700',
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <p className="text-xs text-muted-foreground tracking-widest uppercase mb-0.5">Platform Admin</p>
        <h1 className="text-2xl font-semibold">Smart Contracts</h1>
        <p className="text-sm text-muted-foreground mt-1">Blockchain network configuration and on-chain event log.</p>
      </div>

      {/* Network info */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-border rounded-xl p-5 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-eco-700 animate-pulse" />
          <h2 className="text-sm font-semibold">Network: Polygon Amoy Testnet</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Chain ID',      value: CHAIN_ID },
            { label: 'Network',       value: 'Polygon Amoy' },
            { label: 'Token',         value: 'MATIC (test)' },
            { label: 'RPC Endpoint',  value: RPC_URL.replace('https://', '') },
            { label: 'Block Explorer',value: 'amoy.polygonscan.com' },
            { label: 'Environment',   value: 'Testnet' },
          ].map(f => (
            <div key={f.label}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{f.label}</p>
              <p className="text-xs font-mono font-medium truncate">{f.value}</p>
            </div>
          ))}
        </div>
        <a
          href={EXPLORER}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-xs text-eco-700 hover:underline mt-4"
        >
          Open Block Explorer <ExternalLink className="w-3 h-3" />
        </a>
      </motion.div>

      {/* Contract deployment status */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 mb-5">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
          <h2 className="text-sm font-semibold text-yellow-900">Contract Deployment</h2>
        </div>
        <p className="text-sm text-yellow-800 mb-3">
          No smart contract address is configured. Lifecycle events are currently anchored by recording Polygon transaction
          hashes in the database. To fully decentralise the ledger, deploy the EcoLedger ERC-721 contract to Polygon Amoy
          and add <code className="font-mono text-xs bg-yellow-100 px-1 py-0.5 rounded">VITE_CONTRACT_ADDRESS</code> to your environment.
        </p>
        <div className="space-y-1.5">
          {[
            { step: '1', label: 'Deploy EcoLedger.sol to Polygon Amoy via Hardhat or Remix' },
            { step: '2', label: 'Add VITE_CONTRACT_ADDRESS to .env and Vercel environment' },
            { step: '3', label: 'Update device_lifecycle inserts to call mintDevice() on-chain' },
          ].map(s => (
            <div key={s.step} className="flex items-center gap-2.5 text-xs text-yellow-800">
              <div className="w-5 h-5 rounded-full border border-yellow-400 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                {s.step}
              </div>
              {s.label}
            </div>
          ))}
        </div>
      </motion.div>

      {/* On-chain stats */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="bg-white border border-border rounded-xl p-4 text-center">
              <p className="text-2xl font-semibold">{stats.totalEvents}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Total Lifecycle Events</p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 text-center">
              <p className="text-2xl font-semibold text-eco-700">{stats.onChainEvents}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Events with Tx Hash</p>
            </div>
          </div>

          {/* Recent on-chain transactions */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold">Recent On-Chain Transactions</h2>
            </div>
            {stats.recentTx.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <Clock className="w-7 h-7 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No on-chain transactions recorded yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Tx hashes are written when lifecycle events are anchored to Polygon.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {stats.recentTx.map((tx, i) => (
                  <motion.div key={tx.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-4 px-5 py-3.5">
                    <CheckCircle className="w-4 h-4 text-eco-700 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${EVENT_COLORS[tx.event_type] ?? 'bg-muted text-muted-foreground'}`}>
                          {tx.event_type}
                        </span>
                        {tx.actor_name && <span className="text-xs text-muted-foreground">by {tx.actor_name}</span>}
                      </div>
                      <p className="text-xs font-mono text-muted-foreground truncate">{tx.tx_hash}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString('en-LR', { dateStyle: 'medium' })}
                      </span>
                      <a href={`${EXPLORER}/tx/${tx.tx_hash}`} target="_blank" rel="noreferrer"
                        className="text-eco-700 hover:text-eco-800 transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  )
}
