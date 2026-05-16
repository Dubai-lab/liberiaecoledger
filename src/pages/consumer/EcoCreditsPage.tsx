import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Leaf, TrendingUp, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { EcoCredit } from '@/types/database'

const LRD_PER_CREDIT = 150

function fmt(n: number) {
  return new Intl.NumberFormat('en-LR').format(n)
}

export function EcoCreditsPage() {
  const { profile } = useAuth()
  const [credits, setCredits] = useState<EcoCredit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    supabase
      .from('eco_credits')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setCredits(data ?? [])
        setLoading(false)
      })
  }, [profile])

  const balance = credits
    .filter(c => c.type === 'earned' || c.type === 'bonus')
    .reduce((sum, c) => sum + c.amount, 0)
  const redeemed = credits
    .filter(c => c.type === 'redeemed')
    .reduce((sum, c) => sum + c.amount, 0)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <p className="text-xs text-muted-foreground tracking-widest uppercase mb-0.5">Consumer</p>
        <h1 className="text-2xl font-semibold">EcoCredits</h1>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          {
            label: 'Available Balance',
            value: fmt(balance - redeemed),
            sub: `≈ LRD ${fmt((balance - redeemed) * LRD_PER_CREDIT)}`,
            icon: <Leaf className="w-5 h-5 text-eco-700" />,
            highlight: true,
          },
          {
            label: 'Total Earned',
            value: fmt(balance),
            sub: 'All time',
            icon: <TrendingUp className="w-5 h-5 text-muted-foreground" />,
            highlight: false,
          },
          {
            label: 'Redeemed',
            value: fmt(redeemed),
            sub: 'All time',
            icon: <Leaf className="w-5 h-5 text-muted-foreground" />,
            highlight: false,
          },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className={`p-5 rounded-xl border ${card.highlight ? 'bg-eco-700 text-white border-eco-700' : 'bg-white border-border'}`}
          >
            <div className={`mb-3 ${card.highlight ? 'opacity-80' : ''}`}>{card.icon}</div>
            <p className={`text-2xl font-semibold ${card.highlight ? 'text-white' : 'text-foreground'}`}>
              {card.value}
            </p>
            <p className={`text-xs mt-0.5 ${card.highlight ? 'text-white/70' : 'text-muted-foreground'}`}>
              {card.label}
            </p>
            <p className={`text-xs mt-1 font-medium ${card.highlight ? 'text-white/90' : 'text-muted-foreground'}`}>
              {card.sub}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Rate info */}
      <div className="bg-eco-50 border border-eco-200 rounded-xl p-4 mb-6 flex items-center gap-3">
        <Leaf className="w-4 h-4 text-eco-700 flex-shrink-0" />
        <p className="text-sm text-eco-800">
          1 EcoCredit = <strong>LRD {fmt(LRD_PER_CREDIT)}</strong>.
          Credits are earned when devices you own are properly recycled at a verified facility.
        </p>
      </div>

      {/* Transaction history */}
      <h2 className="text-sm font-semibold mb-3">Transaction History</h2>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : credits.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Leaf className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No EcoCredits yet. Properly recycle a device to start earning.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {credits.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-4 p-4 bg-white border border-border rounded-xl"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${c.type === 'redeemed' ? 'bg-red-50' : 'bg-eco-50'}`}>
                <Leaf className={`w-4 h-4 ${c.type === 'redeemed' ? 'text-red-500' : 'text-eco-700'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{c.description ?? c.source}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(c.created_at).toLocaleDateString('en-LR', { dateStyle: 'medium' })}
                </p>
              </div>
              <p className={`text-sm font-semibold flex-shrink-0 ${c.type === 'redeemed' ? 'text-red-600' : 'text-eco-700'}`}>
                {c.type === 'redeemed' ? '-' : '+'}{fmt(c.amount)} EC
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
