import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import logoCompactLight from '@/brands/logo-compact-light.png'

const LRD = 150

function fmt(n: number) { return new Intl.NumberFormat().format(n) }

const REDEEM_OPTIONS = [
  { id: 'orange', label: 'Orange Money', sub: 'Mobile money transfer', icon: '🟠' },
  { id: 'momo',   label: 'MTN MoMo',     sub: 'Mobile money transfer', icon: '🟡' },
  { id: 'airtime',label: 'Airtime',       sub: 'Top up any network',    icon: '📱' },
  { id: 'voucher',label: 'Voucher',       sub: 'Partner store credit',  icon: '🎟️' },
]

export function MobileRewardsPage() {
  const { profile } = useAuth()
  const [credits, setCredits] = useState<{ amount: number; type: string; description: string | null; created_at: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [amount, setAmount] = useState('')

  useEffect(() => {
    if (!profile) return
    supabase.from('eco_credits').select('amount, type, description, created_at').eq('user_id', profile.id).order('created_at', { ascending: false })
      .then(({ data }) => {
        setCredits(data ?? [])
        setLoading(false)
      })
  }, [profile])

  const earned   = credits.filter(c => c.type === 'earned' || c.type === 'bonus').reduce((s, c) => s + c.amount, 0)
  const redeemed = credits.filter(c => c.type === 'redeemed').reduce((s, c) => s + c.amount, 0)
  const balance  = earned - redeemed

  const handleRedeem = () => {
    if (!selected) return toast.error('Select a cashout method')
    const n = Number(amount)
    if (!n || n <= 0 || n > balance) return toast.error('Invalid amount')
    toast.success(`Cashout of ${fmt(n)} EcoCredits (≈ LRD ${fmt(n * LRD)}) submitted via ${selected}`)
    setAmount('')
    setSelected(null)
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

      {/* Cashout section */}
      <p className="text-[10px] tracking-widest text-[#9b9b98] uppercase mb-3">Cash Out Via</p>
      <div className="grid grid-cols-2 gap-3 mb-5">
        {REDEEM_OPTIONS.map(opt => (
          <button
            key={opt.id}
            onClick={() => setSelected(opt.id)}
            className={`bg-white rounded-2xl p-4 text-left border-2 transition-all ${selected === opt.id ? 'border-[#0f0f0e]' : 'border-transparent'}`}
          >
            <p className="text-xl mb-1">{opt.icon}</p>
            <p className="text-sm font-semibold text-[#0f0f0e]">{opt.label}</p>
            <p className="text-xs text-[#9b9b98]">{opt.sub}</p>
          </button>
        ))}
      </div>

      {selected && (
        <div className="bg-white rounded-2xl p-4 mb-4">
          <p className="text-xs text-[#9b9b98] mb-2">Amount (EcoCredits)</p>
          <div className="flex gap-2">
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder={`Max ${fmt(balance)}`}
              className="flex-1 border border-[#e8e5de] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0f0f0e]"
            />
          </div>
          {amount && Number(amount) > 0 && (
            <p className="text-xs text-[#9b9b98] mt-2">≈ LRD {fmt(Number(amount) * LRD)}</p>
          )}
        </div>
      )}

      <button
        onClick={handleRedeem}
        disabled={!selected || !amount}
        className="w-full py-4 rounded-2xl text-white text-sm font-bold disabled:opacity-40"
        style={{ background: '#0f0f0e' }}
      >
        Cash Out
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
