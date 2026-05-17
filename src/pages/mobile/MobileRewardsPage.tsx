import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import logoCompactLight from '@/brands/logo-compact-light.png'

const LRD = 150

function fmt(n: number) { return new Intl.NumberFormat().format(n) }

interface CatalogueItem {
  id: string
  title: string
  partner: string
  description: string | null
  cost_ec: number
  image_url: string | null
  category: string | null
  stock: number | null
  is_active: boolean
}

export function MobileRewardsPage() {
  const { profile, isLoading: authLoading } = useAuth()
  const [credits, setCredits] = useState<{ amount: number; type: string; description: string | null; created_at: string }[]>([])
  const [catalogue, setCatalogue] = useState<CatalogueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<CatalogueItem | null>(null)
  const [redeeming, setRedeeming] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!profile) { setLoading(false); return }
    Promise.all([
      supabase.from('eco_credits').select('amount, type, description, created_at').eq('user_id', profile.id).order('created_at', { ascending: false }),
      supabase.from('reward_catalogue').select('id, title, partner, description, cost_ec, image_url, category, stock, is_active').eq('is_active', true).order('cost_ec', { ascending: true }),
    ]).then(([credRes, catRes]) => {
      setCredits(credRes.data ?? [])
      setCatalogue(catRes.data ?? [])
      setLoading(false)
    })
  }, [profile, authLoading])

  const earned   = credits.filter(c => c.type === 'earned' || c.type === 'bonus').reduce((s, c) => s + c.amount, 0)
  const redeemed = credits.filter(c => c.type === 'redeemed').reduce((s, c) => s + c.amount, 0)
  const balance  = earned - redeemed

  const handleRedeem = async () => {
    if (!selected || !profile) return
    if (balance < selected.cost_ec) {
      toast.error(`Not enough EcoCredits. You need ${fmt(selected.cost_ec)} EC.`)
      return
    }
    if (selected.stock !== null && selected.stock <= 0) {
      toast.error('This reward is out of stock.')
      return
    }
    setRedeeming(true)
    try {
      // Decrement stock if limited
      if (selected.stock !== null) {
        const { error: stockErr } = await supabase
          .from('reward_catalogue')
          .update({ stock: selected.stock - 1 })
          .eq('id', selected.id)
          .gt('stock', 0)
        if (stockErr) throw new Error('Item may have just sold out.')
      }

      const { error: redemptionError } = await supabase.from('redemptions').insert({
        user_id: profile.id,
        catalogue_item_id: selected.id,
        item_title: selected.title,
        item_partner: selected.partner,
        ec_cost: selected.cost_ec,
        status: 'pending',
      })
      if (redemptionError) throw redemptionError

      await supabase.from('eco_credits').insert({
        user_id: profile.id,
        amount: selected.cost_ec,
        type: 'redeemed',
        source: 'redemption',
        description: `Redeemed: ${selected.title}`,
      })

      await supabase.from('notifications').insert({
        user_id: profile.id,
        title: 'Redemption submitted!',
        body: `Your request for "${selected.title}" has been submitted and is pending fulfilment.`,
        type: 'success',
        is_read: false,
        link: '/mobile/rewards',
      })

      // Refresh credits balance
      const { data } = await supabase.from('eco_credits').select('amount, type, description, created_at').eq('user_id', profile.id).order('created_at', { ascending: false })
      setCredits(data ?? [])
      setSelected(null)
      toast.success(`"${selected.title}" redemption submitted!`)
    } catch {
      toast.error('Redemption failed. Please try again.')
    } finally {
      setRedeeming(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f0ede6' }}>
        <Loader2 className="w-6 h-6 animate-spin text-[#9b9b98]" />
      </div>
    )
  }

  return (
    <div className="px-5 pt-6 pb-8" style={{ background: '#f0ede6', minHeight: '100vh' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <img src={logoCompactLight} alt="EcoLedger" className="h-8 w-auto object-contain" />
        <p className="text-xs text-[#9b9b98]">EcoCredits</p>
      </div>

      {/* Balance card */}
      <div className="rounded-2xl p-5 mb-6" style={{ background: '#0f0f0e' }}>
        <p className="text-[10px] tracking-widest text-[#6b6b68] uppercase mb-1">Available Balance</p>
        <p className="text-4xl font-bold text-white">{fmt(balance)}</p>
        <p className="text-sm text-[#9b9b98] mb-1">EcoCredits</p>
        <p className="text-xs text-[#6b6b68]">≈ LRD {fmt(balance * LRD)}</p>
        <div className="flex gap-4 mt-4 pt-4 border-t border-white/10">
          <div>
            <p className="text-xs text-[#6b6b68]">Total earned</p>
            <p className="text-sm font-semibold text-white">{fmt(earned)} EC</p>
          </div>
          <div>
            <p className="text-xs text-[#6b6b68]">Redeemed</p>
            <p className="text-sm font-semibold text-white">{fmt(redeemed)} EC</p>
          </div>
        </div>
      </div>

      {/* Catalogue */}
      <p className="text-[10px] tracking-widest text-[#9b9b98] uppercase mb-3">Redeem Rewards</p>
      {catalogue.length === 0 ? (
        <div className="bg-white rounded-2xl p-5 mb-5 text-center">
          <p className="text-sm text-[#9b9b98]">No rewards available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-5">
          {catalogue.map(item => {
            const outOfStock = item.stock !== null && item.stock <= 0
            const canAfford  = balance >= item.cost_ec && !outOfStock
            const isSelected = selected?.id === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelected(isSelected ? null : item)}
                className={`bg-white rounded-2xl p-4 text-left border-2 transition-all ${
                  isSelected ? 'border-[#0f0f0e]' : 'border-transparent'
                } ${!canAfford ? 'opacity-50' : ''}`}
              >
                {item.image_url
                  ? <img src={item.image_url} alt={item.title} className="w-10 h-10 rounded-lg object-cover mb-2" />
                  : <p className="text-xl mb-1">🎁</p>
                }
                <p className="text-sm font-semibold text-[#0f0f0e] leading-tight">{item.title}</p>
                <p className="text-[10px] text-[#b0afa8]">{item.partner}</p>
                {item.description && (
                  <p className="text-xs text-[#9b9b98] mt-0.5 line-clamp-2">{item.description}</p>
                )}
                <p className="text-xs font-bold text-[#2d6a3f] mt-2">{fmt(item.cost_ec)} EC</p>
                {outOfStock ? (
                  <p className="text-[10px] text-red-400 mt-0.5 font-semibold">Out of stock</p>
                ) : item.stock !== null && item.stock <= 3 ? (
                  <p className="text-[10px] text-red-400 mt-0.5">{item.stock} left</p>
                ) : item.stock !== null ? (
                  <p className="text-[10px] text-[#b0afa8] mt-0.5">{item.stock} left</p>
                ) : !canAfford ? (
                  <p className="text-[10px] text-[#b0afa8] mt-0.5">Need {fmt(item.cost_ec - balance)} more</p>
                ) : null}
              </button>
            )
          })}
        </div>
      )}

      {/* Selected item summary + confirm */}
      {selected && (
        <div className="bg-white rounded-2xl p-4 mb-4">
          <p className="text-xs text-[#9b9b98] mb-1">Redeeming</p>
          <p className="text-sm font-semibold text-[#0f0f0e]">{selected.title}</p>
          <p className="text-xs text-[#9b9b98] mt-0.5">Cost: {fmt(selected.cost_ec)} EC · Balance after: {fmt(balance - selected.cost_ec)} EC</p>
        </div>
      )}

      <button
        type="button"
        onClick={handleRedeem}
        disabled={!selected || redeeming || (selected ? balance < selected.cost_ec : false)}
        className="w-full py-4 rounded-2xl text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2"
        style={{ background: '#0f0f0e' }}
      >
        {redeeming ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : 'Redeem'}
      </button>

      {/* History */}
      {credits.length > 0 && (
        <div className="mt-6">
          <p className="text-[10px] tracking-widest text-[#9b9b98] uppercase mb-3">History</p>
          <div className="space-y-2">
            {credits.slice(0, 10).map((c, i) => (
              <div key={i} className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${c.type === 'redeemed' ? 'bg-red-50' : 'bg-[#e8f5ec]'}`}>
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke={c.type === 'redeemed' ? '#c0392b' : '#2d6a3f'} strokeWidth={2}>
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0f0f0e] truncate">{c.description ?? c.type}</p>
                  <p className="text-xs text-[#9b9b98]">{new Date(c.created_at).toLocaleDateString()}</p>
                </div>
                <p className={`text-sm font-bold flex-shrink-0 ${c.type === 'redeemed' ? 'text-red-500' : 'text-[#2d6a3f]'}`}>
                  {c.type === 'redeemed' ? '-' : '+'}{fmt(c.amount)} EC
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
