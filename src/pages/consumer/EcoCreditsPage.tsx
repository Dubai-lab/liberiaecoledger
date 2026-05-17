import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Leaf, Loader2, CheckCircle, Clock, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import type { EcoCredit, RewardCatalogueItem, Redemption } from '@/types/database'

const LRD_PER_CREDIT = 150

const TIERS = [
  { id: 'seedling',  label: 'SEEDLING',  min: 0,    max: 499  },
  { id: 'sapling',   label: 'SAPLING',   min: 500,  max: 1999 },
  { id: 'steward',   label: 'STEWARD',   min: 2000, max: 4999 },
  { id: 'champion',  label: 'CHAMPION',  min: 5000, max: Infinity },
]

const TIER_BENEFITS: Record<string, string> = {
  seedling: 'Seedling tier gets you started earning EcoCredits for every responsibly recycled device.',
  sapling:  'Sapling tier unlocks priority device pickup scheduling and 1.2× credits on bulk disposals.',
  steward:  'Steward tier unlocks free disposal pickup, 1.5× credits on rare-earth recovery, and priority warranty support.',
  champion: 'Champion tier unlocks all benefits plus an annual EcoFund grant match and VIP recycling partner access.',
}

const STATUS_META = {
  pending:   { icon: <Clock className="w-3 h-3" />,        color: '#b87a00', bg: '#fdf3dc', label: 'Pending' },
  fulfilled: { icon: <CheckCircle className="w-3 h-3" />,  color: '#2d6a3f', bg: '#e8f5ec', label: 'Fulfilled' },
  failed:    { icon: <XCircle className="w-3 h-3" />,      color: '#c0392b', bg: '#fde8e8', label: 'Failed' },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  const weeks = Math.floor(days / 7)
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'yesterday'
  if (days < 7)   return `${days}d ago`
  return `${weeks}w ago`
}

function fmt(n: number) { return new Intl.NumberFormat('en-LR').format(Math.round(n)) }

function truncateWallet(addr: string | null) {
  if (!addr) return null
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function historyLabel(c: EcoCredit): string {
  if (c.description) return c.description
  if (c.type === 'redeemed') return `Redeem · ${c.source}`
  if (c.type === 'bonus')    return `Bonus · ${c.source}`
  return `Disposal · ${c.source}`
}

export function EcoCreditsPage() {
  const { profile } = useAuth()
  const [credits,     setCredits]     = useState<EcoCredit[]>([])
  const [catalogue,   setCatalogue]   = useState<RewardCatalogueItem[]>([])
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [loading,     setLoading]     = useState(true)
  const [redeeming,   setRedeeming]   = useState<string | null>(null)
  const [tab,         setTab]         = useState<'catalogue' | 'my-redemptions'>('catalogue')

  const load = async () => {
    if (!profile) return
    const [credRes, catRes, redRes] = await Promise.all([
      supabase.from('eco_credits').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }),
      supabase.from('reward_catalogue').select('*').eq('is_active', true).order('cost_ec', { ascending: true }),
      supabase.from('redemptions').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }),
    ])
    setCredits(credRes.data ?? [])
    setCatalogue(catRes.data ?? [])
    setRedemptions(redRes.data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [profile])

  // Derived values
  const earned   = credits.filter(c => c.type === 'earned' || c.type === 'bonus').reduce((s, c) => s + c.amount, 0)
  const redeemed = credits.filter(c => c.type === 'redeemed').reduce((s, c) => s + c.amount, 0)
  const balance  = earned - redeemed

  const now = new Date()
  const ytdEarned = credits
    .filter(c => (c.type === 'earned' || c.type === 'bonus') && new Date(c.created_at).getFullYear() === now.getFullYear())
    .reduce((s, c) => s + c.amount, 0)

  const currentTier = TIERS.slice().reverse().find(t => earned >= t.min) ?? TIERS[0]
  const nextTier    = TIERS[TIERS.indexOf(currentTier) + 1] ?? null
  const tierPct     = nextTier
    ? Math.min(((earned - currentTier.min) / (nextTier.min - currentTier.min)) * 100, 100)
    : 100

  const pendingRedemptions = redemptions.filter(r => r.status === 'pending').length

  const handleRedeem = async (item: RewardCatalogueItem) => {
    if (!profile) return
    if (balance < item.cost_ec) {
      toast.error(`Not enough EcoCredits. You need ${item.cost_ec} EC but have ${fmt(balance)} EC.`)
      return
    }
    if (item.stock !== null && item.stock <= 0) {
      toast.error('This reward is out of stock.')
      return
    }
    setRedeeming(item.id)
    try {
      // 1. Decrement stock if limited (atomic — only updates if stock > 0)
      if (item.stock !== null) {
        const { error: stockErr } = await supabase
          .from('reward_catalogue')
          .update({ stock: item.stock - 1 })
          .eq('id', item.id)
          .gt('stock', 0)
        if (stockErr) throw new Error('Stock update failed — item may have just sold out.')
      }

      // 2. Deduct from eco_credits
      const { error: creditErr } = await supabase.from('eco_credits').insert({
        user_id:     profile.id,
        amount:      item.cost_ec,
        type:        'redeemed',
        source:      item.title,
        description: `Redeemed: ${item.title} (${item.partner})`,
        device_id:   null,
        disposal_id: null,
      })
      if (creditErr) throw creditErr

      // 3. Create redemption record for admin to fulfill
      const { error: redErr } = await supabase.from('redemptions').insert({
        user_id:           profile.id,
        catalogue_item_id: item.id,
        item_title:        item.title,
        item_partner:      item.partner,
        ec_cost:           item.cost_ec,
        status:            'pending',
      })
      if (redErr) throw redErr

      // 4. Create in-app notification for this user
      await supabase.from('notifications').insert({
        user_id: profile.id,
        title:   `Redemption placed — ${item.title}`,
        body:    `You redeemed ${item.cost_ec} EC for "${item.title}" from ${item.partner}. Your request is pending fulfillment — we'll notify you when it's processed.`,
        type:    'info',
        is_read: false,
        link:    null,
      })

      toast.success(`Redemption placed! "${item.title}" is now pending fulfillment.`)
      setTab('my-redemptions')
      await load()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Redemption failed')
    } finally {
      setRedeeming(null)
    }
  }

  const handleCashOut = () => {
    toast.info('Mobile money cash-out is coming soon. Use "Redeem Rewards" to spend your EcoCredits today.')
  }

  return (
    <div className="min-h-screen p-6" style={{ background: '#f5f5f2' }}>
      <p className="text-xs text-gray-400 mb-5">
        <span>Consumer</span> <span className="mx-1">/</span>
        <span className="text-gray-700 font-medium">Rewards</span>
      </p>

      <div className="flex gap-5 items-start">

        {/* ── Left column ──────────────────────────────────────── */}
        <div className="flex-[3] space-y-5 min-w-0">

          {/* Hero balance card */}
          <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: '#0f1410' }}>
            <div className="absolute right-0 top-0 w-56 h-56 rounded-full opacity-10 translate-x-16 -translate-y-16"
              style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)' }} />

            <p className="text-[10px] tracking-widest text-white/40 uppercase mb-4">
              EcoCredit Balance
              {profile?.wallet_address && (
                <> · Wallet {truncateWallet(profile.wallet_address)?.toUpperCase()}</>
              )}
            </p>

            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin text-white/40" />
            ) : (
              <>
                <div className="flex items-baseline gap-3 mb-1">
                  <p className="text-5xl font-bold text-white leading-none">{fmt(balance)}</p>
                  <p className="text-base text-white/50">EcoCredits · ≈ LRD {fmt(balance * LRD_PER_CREDIT)}</p>
                </div>
                <div className="flex gap-8 mt-5 mb-6">
                  {[
                    { label: 'EARNED YTD', value: `+${fmt(ytdEarned)}`, color: '#6dba7f' },
                    { label: 'REDEEMED',   value: `-${fmt(redeemed)}`,  color: '#f87171' },
                    { label: 'BALANCE',    value: fmt(balance),         color: 'white' },
                  ].map(stat => (
                    <div key={stat.label}>
                      <p className="text-[10px] tracking-widest text-white/40 uppercase mb-1">{stat.label}</p>
                      <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setTab('catalogue')}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[#0f1410] bg-white hover:bg-white/90 transition-colors"
                  >
                    Redeem rewards
                  </button>
                  <button
                    type="button"
                    onClick={handleCashOut}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white border border-white/20 hover:border-white/40 transition-colors"
                  >
                    Cash out to mobile money
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1 w-fit">
            {[
              { id: 'catalogue',       label: 'Redeem catalogue' },
              { id: 'my-redemptions',  label: `My redemptions${pendingRedemptions > 0 ? ` (${pendingRedemptions} pending)` : ''}` },
            ].map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id as typeof tab)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: tab === t.id ? '#0f1410' : 'transparent',
                  color: tab === t.id ? 'white' : '#9b9b98',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Catalogue tab */}
          {tab === 'catalogue' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-1">Redeem catalogue</h2>
              <p className="text-xs text-gray-400 mb-4">Exchange your EcoCredits for real-world rewards from our partners.</p>

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : catalogue.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Leaf className="w-8 h-8 text-gray-200 mb-3" />
                  <p className="text-sm text-gray-400">No catalogue items available yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {catalogue.map((item, i) => {
                    const outOfStock = item.stock !== null && item.stock <= 0
                    const canAfford  = balance >= item.cost_ec && !outOfStock
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="border border-gray-200 rounded-xl overflow-hidden"
                        style={{ opacity: canAfford ? 1 : 0.6 }}
                      >
                        {/* Image */}
                        <div className="aspect-video relative overflow-hidden" style={{ background: '#f0ede6' }}>
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <>
                              <svg className="absolute inset-0 w-full h-full opacity-40">
                                <defs>
                                  <pattern id={`sp-${item.id}`} patternUnits="userSpaceOnUse" width="12" height="12" patternTransform="rotate(45)">
                                    <line x1="0" y1="0" x2="0" y2="12" stroke="#c8c5bd" strokeWidth="6" />
                                  </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill={`url(#sp-${item.id})`} />
                              </svg>
                              <span className="absolute inset-0 flex items-center justify-center text-[9px] tracking-widest text-gray-400 uppercase font-bold">
                                {item.category}
                              </span>
                            </>
                          )}
                        </div>

                        <div className="p-3">
                          <p className="text-sm font-semibold text-gray-900 leading-tight mb-0.5">{item.title}</p>
                          <p className="text-xs text-gray-400 mb-2">{item.partner}</p>
                          {item.description && (
                            <p className="text-[11px] text-gray-400 mb-2 leading-relaxed">{item.description}</p>
                          )}
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-sm font-bold text-gray-900">
                                {item.cost_ec} <span className="font-normal text-gray-400">EC</span>
                              </span>
                              {item.stock !== null && (
                                <p className="text-[10px] mt-0.5" style={{ color: item.stock <= 3 ? '#c0392b' : '#9b9b98' }}>
                                  {item.stock === 0 ? 'Out of stock' : `${item.stock} left`}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              disabled={!!redeeming || !canAfford}
                              onClick={() => handleRedeem(item)}
                              className="text-xs font-semibold hover:underline transition-opacity disabled:opacity-40 disabled:no-underline"
                              style={{ color: canAfford ? '#2d6a3f' : '#9b9b98' }}
                            >
                              {redeeming === item.id
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : outOfStock ? 'Out of stock'
                                : canAfford ? 'Redeem' : 'Not enough EC'}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* My redemptions tab */}
          {tab === 'my-redemptions' && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">My Redemptions</h2>
                <p className="text-xs text-gray-400 mt-0.5">Track the status of your reward requests.</p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : redemptions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <CheckCircle className="w-8 h-8 text-gray-200 mb-3" />
                  <p className="text-sm text-gray-400">No redemptions yet. Pick a reward from the catalogue.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {redemptions.map((r, i) => {
                    const meta = STATUS_META[r.status]
                    return (
                      <motion.div
                        key={r.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-center gap-4 px-5 py-4"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{r.item_title}</p>
                          <p className="text-xs text-gray-400">{r.item_partner} · {timeAgo(r.created_at)}</p>
                          {r.notes && <p className="text-xs text-gray-500 mt-0.5">{r.notes}</p>}
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-sm font-bold text-gray-700">−{r.ec_cost} EC</span>
                          <span
                            className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
                            style={{ background: meta.bg, color: meta.color }}
                          >
                            {meta.icon} {meta.label}
                          </span>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right column ─────────────────────────────────────── */}
        <div className="flex-[2] space-y-5 min-w-0">

          {/* Tier card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">
                Tier · {currentTier.label.charAt(0) + currentTier.label.slice(1).toLowerCase()}
              </h2>
              {nextTier && (
                <span className="text-xs text-gray-400">
                  {fmt(earned)} / {fmt(nextTier.min)} to {nextTier.label.charAt(0) + nextTier.label.slice(1).toLowerCase()}
                </span>
              )}
            </div>
            <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: '#f0ede6' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${tierPct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: '#2d6a3f' }}
              />
            </div>
            <div className="flex justify-between mb-4">
              {TIERS.map(t => {
                const isActive = t.id === currentTier.id
                const isPast   = TIERS.indexOf(t) < TIERS.indexOf(currentTier)
                return (
                  <div key={t.id} className="flex flex-col items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ background: isActive || isPast ? '#2d6a3f' : '#e8e5de' }} />
                    <span className="text-[9px] tracking-widest font-bold" style={{ color: isActive ? '#0f1410' : '#9b9b98' }}>
                      {isActive && '● '}{t.label}
                    </span>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{TIER_BENEFITS[currentTier.id]}</p>
          </div>

          {/* Earning history */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Earning history</h2>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            ) : credits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-5">
                <Leaf className="w-7 h-7 text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">No credits yet. Recycle a device to start earning.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {credits.slice(0, 10).map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center justify-between px-5 py-3.5"
                  >
                    <div className="min-w-0 pr-4">
                      <p className="text-sm font-medium text-gray-900 truncate">{historyLabel(c)}</p>
                      <p className="text-xs text-gray-400">{timeAgo(c.created_at)}</p>
                    </div>
                    <span className="text-sm font-bold flex-shrink-0 font-mono"
                      style={{ color: c.type === 'redeemed' ? '#c0392b' : '#2d6a3f' }}>
                      {c.type === 'redeemed' ? '− ' : '+ '}{fmt(c.amount)} EC
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="rounded-xl p-4 text-xs text-gray-500 leading-relaxed" style={{ background: '#f0ede6' }}>
            <span className="font-semibold text-gray-900">1 EcoCredit = LRD {LRD_PER_CREDIT}.</span>{' '}
            Credits are earned when devices you own are properly recycled at a verified EcoLedger facility.
            Cash-out requires smart contract deployment — coming soon.
          </div>
        </div>
      </div>
    </div>
  )
}
