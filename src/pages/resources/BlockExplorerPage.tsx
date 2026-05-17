import { useEffect, useState } from 'react'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'

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
    <div className="bg-[#fafaf8] rounded-2xl p-5 border border-[#e8e5de] text-center">
      <p className="text-3xl font-bold text-[#0f0f0e] tabular-nums mb-1">{value}</p>
      <p className="text-[10px] font-semibold tracking-widest text-[#9b9b98] uppercase">{label}</p>
    </div>
  )
}

function ContractCard({ name, address, desc, link }: { name: string; address: string; desc: string; link: string }) {
  return (
    <div className="border border-[#e8e5de] rounded-2xl p-6">
      <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
        <div>
          <p className="font-bold text-[#0f0f0e] mb-0.5">{name}</p>
          <p className="text-[10px] font-semibold tracking-widest text-[#9b9b98] uppercase">{CHAIN_NAME}</p>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-semibold tracking-widest text-[#2d6a3f] bg-[#e8f5ec] rounded-full px-3 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2d6a3f] animate-pulse" />
          LIVE
        </span>
      </div>
      <p className="text-sm text-[#6b6b68] mb-4 leading-relaxed">{desc}</p>
      <div className="bg-[#0f0f0e] rounded-xl px-4 py-3 flex items-center justify-between gap-4">
        <code className="text-xs font-mono text-[#6dba7f] break-all">{address}</code>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 text-[10px] font-semibold text-white/60 hover:text-white transition-colors border border-white/10 rounded-lg px-2.5 py-1"
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

      <div className="bg-[#0f0f0e] pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-semibold tracking-widest text-[#6b6b68] uppercase mb-2">Resources</p>
          <h1 className="text-4xl font-bold text-white mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>
            Block Explorer
          </h1>
          <p className="text-[#9b9b98] text-sm">Live on-chain data for EcoLedger smart contracts — publicly verifiable, permanently recorded.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">

        {/* Live stats */}
        <div>
          <p className="text-[10px] font-bold tracking-widest text-[#9b9b98] uppercase mb-4">Live Chain Stats</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Devices on chain"   value={fmt(stats.devices) || '—'} />
            <StatCard label="Lifecycle events"   value={fmt(stats.lifecycleEvents) || '—'} />
            <StatCard label="EcoCredits issued"  value={fmt(stats.creditsIssued) || '—'} />
            <StatCard label="Verified recyclers" value={fmt(stats.recyclers) || '—'} />
          </div>
        </div>

        {/* Contracts */}
        <div>
          <p className="text-[10px] font-bold tracking-widest text-[#9b9b98] uppercase mb-4">Deployed Contracts</p>
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
          <p className="text-[10px] font-bold tracking-widest text-[#9b9b98] uppercase mb-4">Network Information</p>
          <div className="bg-[#fafaf8] border border-[#e8e5de] rounded-2xl overflow-hidden">
            {[
              { label: 'Network',      value: 'Ethereum Sepolia Testnet' },
              { label: 'Chain ID',     value: '11155111' },
              { label: 'RPC',          value: 'ethereum-sepolia-rpc.publicnode.com' },
              { label: 'Block explorer', value: 'sepolia.etherscan.io' },
              { label: 'Consensus',    value: 'Proof-of-Stake (Ethereum)' },
              { label: 'Finality',     value: '~12 seconds (2 epochs)' },
            ].map((row, i, arr) => (
              <div key={row.label} className={`flex items-center justify-between px-5 py-3.5 ${i < arr.length - 1 ? 'border-b border-[#e8e5de]' : ''}`}>
                <p className="text-xs font-semibold text-[#9b9b98]">{row.label}</p>
                <p className="text-sm font-mono text-[#0f0f0e]">{row.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-[#0f0f0e] rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="font-bold text-white mb-1">View all transactions on Sepolia Etherscan</p>
            <p className="text-sm text-[#9b9b98]">Every device registration, transfer, and disposal event is publicly accessible — no login required.</p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <a
              href={`${ETHERSCAN}/address/${ECOLEDGER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-white text-[#0f0f0e] text-sm font-semibold rounded-xl hover:bg-[#f5f5f2] transition-colors"
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
