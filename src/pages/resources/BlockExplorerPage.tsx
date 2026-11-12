import { useEffect, useState } from 'react'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { PublicLedgerFeed } from '@/components/ledger/PublicLedgerFeed'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  as string
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string

const ECOTOKEN   = '0xffEA92d6399B191A0e406EF2647cBA2445c821B4'
const ECOLEDGER  = '0xb4Fa81E6D8985FE0CbA4285Ce19e81642155872E'
const CHAIN_NAME = 'Sepolia Testnet'
const ETHERSCAN  = 'https://sepolia.etherscan.io'

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-brand-tint rounded-2xl p-5 border border-brand-line text-center">
      <p className="text-3xl font-bold text-brand-ink tabular-nums mb-1">{value}</p>
      <p className="text-[10px] font-semibold tracking-widest text-brand-muted uppercase">{label}</p>
    </div>
  )
}

function ContractCard({ name, address, desc, link }: { name: string; address: string; desc: string; link: string }) {
  return (
    <div className="border border-brand-line rounded-2xl p-6">
      <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
        <div>
          <p className="font-bold text-brand-ink mb-0.5">{name}</p>
          <p className="text-[10px] font-semibold tracking-widest text-brand-muted uppercase">{CHAIN_NAME}</p>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-semibold tracking-widest text-brand bg-brand-tint rounded-full px-3 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
          LIVE
        </span>
      </div>
      <p className="text-sm text-brand-muted mb-4 leading-relaxed">{desc}</p>
      <div className="bg-brand-deep rounded-xl px-4 py-3 flex items-center justify-between gap-4">
        <code className="text-xs font-mono text-[#8FD3A8] break-all">{address}</code>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 text-[10px] font-semibold text-white/60 hover:text-white transition-colors border border-white/15 rounded-lg px-2.5 py-1"
        >
          Etherscan →
        </a>
      </div>
    </div>
  )
}

export function BlockExplorerPage() {
  const [stats, setStats] = useState({ devices: 0, recyclers: 0, lifecycleEvents: 0, creditsIssued: 0, disposedCount: 0 })

  useEffect(() => {
    fetch(`${SUPABASE_URL}/functions/v1/public-stats`, {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
    }).then(r => r.json()).then(setStats).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <LandingNav alwaysOpaque />

      <div className="bg-brand-deep pt-32 pb-12 px-5 md:px-8 lg:px-12">
        <div className="max-w-content mx-auto">
          <p className="text-[11px] font-semibold tracking-widest text-white/70 uppercase mb-2">Resources</p>
          <h1 className="text-4xl font-bold text-white mb-3 font-display font-bold">
            Block Explorer
          </h1>
          <p className="text-white/70 text-sm">Live on-chain data for EcoLedger smart contracts — publicly verifiable, permanently recorded.</p>
          <a href="#ledger" className="inline-flex items-center gap-2 mt-6 h-11 px-5 rounded-lg bg-white text-brand text-sm font-semibold hover:bg-brand-tint transition-colors">View the public ledger ↓</a>
        </div>
      </div>

      <div className="max-w-content mx-auto box-content px-5 md:px-8 lg:px-12 py-12 space-y-10">

        {/* Live stats */}
        <div>
          <p className="text-[10px] font-bold tracking-widest text-brand-muted uppercase mb-4">Live Chain Stats</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Devices on chain"   value={fmt(stats.devices) || '—'} />
            <StatCard label="Lifecycle events"   value={fmt(stats.lifecycleEvents) || '—'} />
            <StatCard label="EcoCredits issued"  value={fmt(stats.creditsIssued) || '—'} />
            <StatCard label="Verified recyclers" value={fmt(stats.recyclers) || '—'} />
          </div>
        </div>

        {/* Public ledger — every lifecycle action, readable by anyone */}
        <section id="ledger" className="scroll-mt-28">
          <div className="flex items-end justify-between gap-4 mb-4 flex-wrap">
            <div>
              <p className="text-[10px] font-bold tracking-widest text-brand-muted uppercase mb-1">Public Ledger</p>
              <h2 className="text-2xl font-bold text-brand-ink">Every action, as it happens</h2>
              <p className="text-sm text-brand-muted mt-1 max-w-2xl">
                Manufacture, registration, transfer, recycling and compliance events from across Liberia. No login required.
              </p>
            </div>
          </div>
          <PublicLedgerFeed />
        </section>

        {/* Contracts */}
        <div>
          <p className="text-[10px] font-bold tracking-widest text-brand-muted uppercase mb-4">Deployed Contracts</p>
          <div className="space-y-4">
            <ContractCard
              name="EcoToken.sol"
              address={ECOTOKEN}
              desc="ERC-20 token representing EcoCredits. Minted on verified disposal events. View total supply, holder balances, and transfer history on Etherscan."
              link={`${ETHERSCAN}/address/${ECOTOKEN}`}
            />
            <ContractCard
              name="EcoLedger.sol"
              address={ECOLEDGER}
              desc="Core device registry contract. Handles device registration, ownership transfers, and disposal confirmation with recycler licence verification."
              link={`${ETHERSCAN}/address/${ECOLEDGER}`}
            />
          </div>
        </div>

        {/* Network info */}
        <div>
          <p className="text-[10px] font-bold tracking-widest text-brand-muted uppercase mb-4">Network Information</p>
          <div className="bg-brand-tint border border-brand-line rounded-2xl overflow-hidden">
            {[
              { label: 'Network',      value: 'Ethereum Sepolia Testnet' },
              { label: 'Chain ID',     value: '11155111' },
              { label: 'RPC',          value: 'ethereum-sepolia-rpc.publicnode.com' },
              { label: 'Block explorer', value: 'sepolia.etherscan.io' },
              { label: 'Consensus',    value: 'Proof-of-Stake (Ethereum)' },
              { label: 'Finality',     value: '~12 seconds (2 epochs)' },
            ].map((row, i, arr) => (
              <div key={row.label} className={`flex items-center justify-between px-5 py-3.5 ${i < arr.length - 1 ? 'border-b border-brand-line' : ''}`}>
                <p className="text-xs font-semibold text-brand-muted">{row.label}</p>
                <p className="text-sm font-mono text-brand-ink">{row.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-brand-deep rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="font-bold text-white mb-1">View all transactions on Sepolia Etherscan</p>
            <p className="text-sm text-white/70">Every device registration, transfer, and disposal event is publicly accessible — no login required.</p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <a
              href={`${ETHERSCAN}/address/${ECOLEDGER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-white text-brand text-sm font-semibold rounded-xl hover:bg-brand-tint transition-colors"
            >
              EcoLedger contract →
            </a>
            <a
              href={`${ETHERSCAN}/address/${ECOTOKEN}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 border border-white/20 text-white text-sm font-semibold rounded-xl hover:border-white/40 transition-colors"
            >
              EcoToken →
            </a>
          </div>
        </div>

      </div>

      <LandingFooter />
    </div>
  )
}
