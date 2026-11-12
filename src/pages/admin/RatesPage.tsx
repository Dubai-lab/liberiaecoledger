import { useEffect, useMemo, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Coins, Gem, History, AlertTriangle, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { usePlatformRates, DEFAULT_RATES } from '@/lib/rates'
import type { PlatformRate, PlatformRateHistory } from '@/types/database'

const inputCls =
  'w-full border border-border rounded-lg pl-3 pr-3 py-2.5 text-sm bg-white tabular-nums focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors'

function fmtNum(n: number, digits = 2) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(n)
}

export function RatesPage() {
  const { rows, loading, reload } = usePlatformRates()
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [history, setHistory] = useState<PlatformRateHistory[]>([])

  const loadHistory = useCallback(async () => {
    const { data } = await supabase
      .from('platform_rate_history')
      .select('*')
      .order('changed_at', { ascending: false })
      .limit(25)
    setHistory((data ?? []) as PlatformRateHistory[])
  }, [])

  useEffect(() => { loadHistory() }, [loadHistory])

  useEffect(() => {
    setDraft(Object.fromEntries(rows.map(r => [r.key, String(Number(r.value))])))
  }, [rows])

  const byCategory = (c: PlatformRate['category']) => rows.filter(r => r.category === c)
  const labelFor = useMemo(() => Object.fromEntries(rows.map(r => [r.key, r.label])), [rows])

  const dirtyKeys = rows.filter(r => draft[r.key] !== undefined && Number(draft[r.key]) !== Number(r.value)).map(r => r.key)
  const invalid = rows.some(r => draft[r.key] === '' || Number.isNaN(Number(draft[r.key])) || Number(draft[r.key]) < 0)
  const lrdPerCredit = Number(draft.lrd_per_credit) || DEFAULT_RATES.lrd_per_credit

  const handleSave = async () => {
    if (!dirtyKeys.length || invalid) return
    setSaving(true)
    try {
      for (const key of dirtyKeys) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from('platform_rates') as any)
          .update({ value: Number(draft[key]) })
          .eq('key', key)
        if (error) throw error
      }
      toast.success(`Updated ${dirtyKeys.length} rate${dirtyKeys.length === 1 ? '' : 's'}`, {
        description: 'New registrations, transfers and disposals use these values immediately.',
      })
      await reload()
      await loadHistory()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not save rates')
    } finally {
      setSaving(false)
    }
  }

  const resetDraft = () => setDraft(Object.fromEntries(rows.map(r => [r.key, String(Number(r.value))])))

  const field = (r: PlatformRate, hint?: string) => {
    const changed = dirtyKeys.includes(r.key)
    return (
      <div key={r.key} className="space-y-1.5">
        <label htmlFor={`rate-${r.key}`} className="flex items-center justify-between text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <span>{r.label}</span>
          {changed && <span className="normal-case tracking-normal text-[10px] font-semibold text-yellow-700">was {fmtNum(Number(r.value), 4)}</span>}
        </label>
        <div className="relative">
          <input
            id={`rate-${r.key}`}
            type="number"
            min="0"
            step="any"
            value={draft[r.key] ?? ''}
            onChange={e => setDraft(d => ({ ...d, [r.key]: e.target.value }))}
            className={`${inputCls} pr-28 ${changed ? 'border-yellow-400 bg-yellow-50/40' : ''}`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">{r.unit}</span>
        </div>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <p className="text-xs text-muted-foreground tracking-widest uppercase mb-0.5">Platform Admin</p>
          <h1 className="text-2xl font-semibold">Rates & Prices</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Set the EcoCredits paid for each transaction and the market price of recovered materials. Disposal rewards are
            calculated as recovered grams × price ÷ EcoCredit value. Every change is logged.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={resetDraft}
            disabled={!dirtyKeys.length || saving}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Discard
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirtyKeys.length || invalid || saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand hover:bg-brand-secondary disabled:opacity-40 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save {dirtyKeys.length ? `${dirtyKeys.length} change${dirtyKeys.length === 1 ? '' : 's'}` : 'changes'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-yellow-200 bg-yellow-50 text-sm text-yellow-800">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>Rates table not found. Run the <code className="font-mono text-xs">20261113_manufacturer_imei_registry_and_rates.sql</code> migration — until then the platform uses its built-in default rates.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Transaction rates */}
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Coins className="w-4 h-4 text-brand" />
              <h2 className="text-sm font-semibold">EcoCredit transaction rates</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {byCategory('credit').map(r => field(r, `≈ LRD ${fmtNum((Number(draft[r.key]) || 0) * lrdPerCredit, 0)} per transaction`))}
              {byCategory('conversion').map(r => field(r, 'Converts material value into EcoCredits'))}
            </div>
          </motion.section>

          {/* Material prices */}
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <Gem className="w-4 h-4 text-brand" />
              <h2 className="text-sm font-semibold">Material market prices</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Update as commodity prices move. Recyclers see the resulting EC-per-gram when logging disposals.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {byCategory('material').map(r =>
                field(r, `= ${fmtNum((Number(draft[r.key]) || 0) / lrdPerCredit)} EC per gram recovered`)
              )}
            </div>
          </motion.section>

          {/* History */}
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-4 h-4 text-brand" />
              <h2 className="text-sm font-semibold">Change history</h2>
            </div>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">No changes yet — values are at their initial settings.</p>
            ) : (
              <div className="divide-y divide-border">
                {history.map(h => (
                  <div key={h.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                    <span className="font-medium">{labelFor[h.key] ?? h.key}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {h.old_value === null ? '—' : fmtNum(Number(h.old_value), 4)} → <span className="text-foreground font-medium">{fmtNum(Number(h.new_value), 4)}</span>
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(h.changed_at).toLocaleString('en-LR', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.section>
        </div>
      )}
    </div>
  )
}
