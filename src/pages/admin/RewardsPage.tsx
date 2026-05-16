import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Gift, Plus, Check, X, ChevronDown, ChevronUp, Loader2,
  Package, AlertCircle, ToggleLeft, ToggleRight, Edit3, Inbox,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import type { RewardCatalogueItem, Redemption } from '@/types/database'

interface RedemptionWithUser extends Redemption {
  user_full_name: string | null
  user_email: string | null
}

const STATUS_META = {
  pending:   { label: 'Pending',   bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-400' },
  fulfilled: { label: 'Fulfilled', bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500' },
  failed:    { label: 'Failed',    bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500'   },
}

const CATEGORIES = ['Mobile money', 'Grocery', 'Green energy', 'Conservation', 'OEM partner', 'Charity', 'General']

interface CatalogueFormState {
  title: string
  partner: string
  category: string
  cost_ec: string
  description: string
  image_url: string
  stock: string
}

const BLANK_FORM: CatalogueFormState = {
  title: '', partner: '', category: 'General', cost_ec: '',
  description: '', image_url: '', stock: '',
}

export function RewardsPage() {
  const { profile } = useAuth()
  const [tab, setTab] = useState<'catalogue' | 'redemptions'>('catalogue')

  // ── Catalogue state ───────────────────────────────────────────────────────
  const [items, setItems] = useState<RewardCatalogueItem[]>([])
  const [loadingItems, setLoadingItems] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CatalogueFormState>(BLANK_FORM)
  const [savingItem, setSavingItem] = useState(false)

  // ── Redemptions state ─────────────────────────────────────────────────────
  const [redemptions, setRedemptions] = useState<RedemptionWithUser[]>([])
  const [loadingR, setLoadingR] = useState(true)
  const [fulfillId, setFulfillId] = useState<string | null>(null)
  const [fulfillNotes, setFulfillNotes] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)

  const loadItems = useCallback(async () => {
    setLoadingItems(true)
    const { data } = await supabase
      .from('reward_catalogue')
      .select('*')
      .order('created_at', { ascending: false })
    setItems((data ?? []) as RewardCatalogueItem[])
    setLoadingItems(false)
  }, [])

  const loadRedemptions = useCallback(async () => {
    setLoadingR(true)
    // Fetch redemptions, then join user profile info manually
    const { data: rows } = await supabase
      .from('redemptions')
      .select('*')
      .order('created_at', { ascending: false })

    if (!rows || rows.length === 0) {
      setRedemptions([])
      setLoadingR(false)
      return
    }

    const userIds = [...new Set(rows.map((r: Redemption) => r.user_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds)

    const profileMap = new Map((profiles ?? []).map((p: { id: string; full_name: string | null; email: string | null }) => [p.id, p]))

    const merged: RedemptionWithUser[] = rows.map((r: Redemption) => {
      const p = profileMap.get(r.user_id)
      return { ...r, user_full_name: p?.full_name ?? null, user_email: p?.email ?? null }
    })
    setRedemptions(merged)
    setLoadingR(false)
  }, [])

  useEffect(() => { loadItems() }, [loadItems])
  useEffect(() => { loadRedemptions() }, [loadRedemptions])

  // ── Catalogue CRUD ────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingId(null)
    setForm(BLANK_FORM)
    setShowForm(true)
  }

  const openEdit = (item: RewardCatalogueItem) => {
    setEditingId(item.id)
    setForm({
      title: item.title,
      partner: item.partner,
      category: item.category,
      cost_ec: String(item.cost_ec),
      description: item.description ?? '',
      image_url: item.image_url ?? '',
      stock: item.stock != null ? String(item.stock) : '',
    })
    setShowForm(true)
  }

  const handleSaveItem = async () => {
    if (!form.title.trim() || !form.partner.trim() || !form.cost_ec) {
      toast.error('Title, partner and cost are required')
      return
    }
    const costNum = parseInt(form.cost_ec)
    if (isNaN(costNum) || costNum <= 0) { toast.error('Cost must be a positive number'); return }

    setSavingItem(true)
    const payload = {
      title: form.title.trim(),
      partner: form.partner.trim(),
      category: form.category,
      cost_ec: costNum,
      description: form.description.trim() || null,
      image_url: form.image_url.trim() || null,
      stock: form.stock ? parseInt(form.stock) || null : null,
    }

    if (editingId) {
      const { error } = await supabase.from('reward_catalogue').update(payload).eq('id', editingId)
      if (error) { toast.error('Update failed'); setSavingItem(false); return }
      toast.success('Item updated')
    } else {
      const { error } = await supabase.from('reward_catalogue').insert({ ...payload, is_active: true })
      if (error) { toast.error('Insert failed'); setSavingItem(false); return }
      toast.success('Item added to catalogue')
    }

    setSavingItem(false)
    setShowForm(false)
    setEditingId(null)
    setForm(BLANK_FORM)
    loadItems()
  }

  const toggleActive = async (item: RewardCatalogueItem) => {
    const { error } = await supabase
      .from('reward_catalogue')
      .update({ is_active: !item.is_active })
      .eq('id', item.id)
    if (error) { toast.error('Failed to update'); return }
    toast.success(item.is_active ? 'Item deactivated' : 'Item activated')
    loadItems()
  }

  // ── Redemption fulfillment ────────────────────────────────────────────────
  const handleFulfill = async (id: string, status: 'fulfilled' | 'failed') => {
    if (!profile) return
    setProcessingId(id)
    const { error } = await supabase
      .from('redemptions')
      .update({
        status,
        notes: fulfillNotes.trim() || null,
        fulfilled_by: profile.id,
        fulfilled_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) { toast.error('Update failed'); setProcessingId(null); return }

    // Notify consumer
    const redemption = redemptions.find(r => r.id === id)
    if (redemption) {
      const notifTitle = status === 'fulfilled'
        ? `Your reward has been fulfilled!`
        : `Reward redemption update`
      const notifBody = status === 'fulfilled'
        ? `"${redemption.item_title}" from ${redemption.item_partner} has been fulfilled. ${fulfillNotes ? fulfillNotes : ''}`
        : `Your redemption for "${redemption.item_title}" could not be processed. ${fulfillNotes ? fulfillNotes : 'Please contact support.'}`

      await supabase.from('notifications').insert({
        user_id: redemption.user_id,
        title: notifTitle,
        body: notifBody,
        type: status === 'fulfilled' ? 'success' : 'warning',
        is_read: false,
        link: '/consumer/credits',
      })

      // Also refund EcoCredits if failed
      if (status === 'failed') {
        await supabase.from('eco_credits').insert({
          user_id: redemption.user_id,
          amount: redemption.ec_cost,
          type: 'bonus',
          source: 'redemption_refund',
          device_id: null,
          disposal_id: null,
          description: `Refund for failed redemption: ${redemption.item_title}`,
        })
      }
    }

    toast.success(status === 'fulfilled' ? 'Marked as fulfilled — consumer notified' : 'Marked as failed — credits refunded')
    setFulfillId(null)
    setFulfillNotes('')
    setProcessingId(null)
    loadRedemptions()
  }

  const pendingCount = redemptions.filter(r => r.status === 'pending').length

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs text-muted-foreground tracking-widest uppercase mb-0.5">Admin</p>
        <h1 className="text-2xl font-semibold">Rewards Management</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage the reward catalogue and fulfil consumer redemptions</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/40 p-1 rounded-lg w-fit">
        {(['catalogue', 'redemptions'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === t ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'catalogue' ? 'Catalogue' : `Redemptions${pendingCount > 0 ? ` (${pendingCount})` : ''}`}
          </button>
        ))}
      </div>

      {/* ── CATALOGUE TAB ─────────────────────────────────────────────────── */}
      {tab === 'catalogue' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{items.length} items in catalogue</p>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: '#0f1410' }}
            >
              <Plus className="w-4 h-4" />
              Add item
            </button>
          </div>

          {/* Add / Edit Form */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-white rounded-xl border border-border p-6 space-y-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">{editingId ? 'Edit item' : 'New catalogue item'}</h3>
                  <button onClick={() => { setShowForm(false); setEditingId(null) }} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs text-muted-foreground block mb-1">Title *</label>
                    <input
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="LRD 500 mobile airtime"
                      className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-[#2f6b3a]"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs text-muted-foreground block mb-1">Partner *</label>
                    <input
                      value={form.partner}
                      onChange={e => setForm(f => ({ ...f, partner: e.target.value }))}
                      placeholder="Lonestar / Orange MTN"
                      className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-[#2f6b3a]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Category</label>
                    <select
                      value={form.category}
                      onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-[#2f6b3a] bg-white"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Cost (EC) *</label>
                    <input
                      type="number"
                      value={form.cost_ec}
                      onChange={e => setForm(f => ({ ...f, cost_ec: e.target.value }))}
                      placeholder="250"
                      min={1}
                      className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-[#2f6b3a]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Stock (blank = unlimited)</label>
                    <input
                      type="number"
                      value={form.stock}
                      onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                      placeholder="unlimited"
                      min={0}
                      className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-[#2f6b3a]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Image URL (optional)</label>
                    <input
                      value={form.image_url}
                      onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                      placeholder="https://..."
                      className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-[#2f6b3a]"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground block mb-1">Description</label>
                    <textarea
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Brief description visible to consumers..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-[#2f6b3a] resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    onClick={() => { setShowForm(false); setEditingId(null) }}
                    className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted/30 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveItem}
                    disabled={savingItem}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60"
                    style={{ background: '#2f6b3a' }}
                  >
                    {savingItem ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {editingId ? 'Save changes' : 'Add item'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Items list */}
          {loadingItems ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-border">
              <Package className="w-8 h-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No catalogue items yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Add your first reward item to get started</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-border divide-y divide-border">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                  {/* Image / placeholder */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center">
                    {item.image_url
                      ? <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                      : <Gift className="w-5 h-5 text-muted-foreground/40" />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      {!item.is_active && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">Inactive</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{item.partner} · {item.category}</p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">{item.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[#2f6b3a]">{item.cost_ec} EC</p>
                      <p className="text-[10px] text-muted-foreground">
                        {item.stock != null ? `${item.stock} left` : 'Unlimited'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(item)}
                        className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                        title="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleActive(item)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          item.is_active
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-muted-foreground hover:bg-muted/50'
                        }`}
                        title={item.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {item.is_active
                          ? <ToggleRight className="w-4 h-4" />
                          : <ToggleLeft className="w-4 h-4" />
                        }
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── REDEMPTIONS TAB ───────────────────────────────────────────────── */}
      {tab === 'redemptions' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{redemptions.length} total redemptions · {pendingCount} pending</p>

          {loadingR ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : redemptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-border">
              <Inbox className="w-8 h-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No redemptions yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Consumer redemptions will appear here</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-border divide-y divide-border">
              {redemptions.map(r => {
                const meta = STATUS_META[r.status]
                const isExpanded = fulfillId === r.id
                return (
                  <div key={r.id} className="px-5 py-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full font-medium ${meta.bg} ${meta.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                            {meta.label}
                          </span>
                          <p className="text-sm font-medium">{r.item_title}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {r.item_partner} · <span className="font-medium text-[#2f6b3a]">{r.ec_cost} EC</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Consumer: <span className="font-medium text-foreground">{r.user_full_name ?? r.user_email ?? r.user_id.slice(0, 8)}</span>
                          {r.user_email && r.user_full_name && <> · {r.user_email}</>}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                          Requested {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        {r.notes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">Note: {r.notes}</p>
                        )}
                      </div>

                      {r.status === 'pending' && (
                        <button
                          onClick={() => { setFulfillId(isExpanded ? null : r.id); setFulfillNotes('') }}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted/30 transition-colors flex-shrink-0"
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          Actions
                        </button>
                      )}
                    </div>

                    {/* Action panel */}
                    <AnimatePresence>
                      {isExpanded && r.status === 'pending' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 pt-3 border-t border-border space-y-3">
                            <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg p-2.5">
                              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                              <span>Once fulfilled, manually deliver the reward to the consumer and add a note for reference. If failed, the consumer's EcoCredits will be automatically refunded.</span>
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground block mb-1">Note (optional)</label>
                              <input
                                value={fulfillNotes}
                                onChange={e => setFulfillNotes(e.target.value)}
                                placeholder="e.g. Airtime sent to 0776-123-456 at 14:32"
                                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-[#2f6b3a]"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleFulfill(r.id, 'fulfilled')}
                                disabled={processingId === r.id}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60"
                                style={{ background: '#2f6b3a' }}
                              >
                                {processingId === r.id
                                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  : <Check className="w-3.5 h-3.5" />
                                }
                                Mark fulfilled
                              </button>
                              <button
                                onClick={() => handleFulfill(r.id, 'failed')}
                                disabled={processingId === r.id}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-60"
                              >
                                <X className="w-3.5 h-3.5" />
                                Mark failed + refund
                              </button>
                              <button
                                onClick={() => { setFulfillId(null); setFulfillNotes('') }}
                                className="px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted/30 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
