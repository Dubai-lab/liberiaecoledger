import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Plus, Copy, Trash2, Loader2, CheckCircle, Clock, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import type { Invitation, UserRole } from '@/types/database'

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'regulator',    label: 'Regulator' },
  { value: 'auditor',      label: 'NGO / Auditor' },
  { value: 'manufacturer', label: 'Manufacturer' },
  { value: 'recycler',     label: 'Recycler' },
  { value: 'admin',        label: 'Platform Admin' },
]

function generateToken() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const seg = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `ECO-${seg(4)}-${seg(4)}`
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function InvitationsPage() {
  const { profile } = useAuth()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    email: '',
    role: 'regulator' as UserRole,
    organization: '',
    expiryDays: '7',
  })

  const loadInvitations = useCallback(async () => {
    const { data } = await supabase
      .from('invitations')
      .select('*')
      .order('created_at', { ascending: false })
    setInvitations(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { loadInvitations() }, [loadInvitations])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSubmitting(true)

    try {
      const token = generateToken()
      const expiresAt = new Date(Date.now() + Number(form.expiryDays) * 86400_000).toISOString()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('invitations') as any).insert({
        email: form.email.toLowerCase().trim(),
        role: form.role,
        organization: form.organization.trim(),
        invited_by: profile.id,
        token,
        expires_at: expiresAt,
      })

      if (error) throw error

      // Send notification email via Supabase Edge Function (or just show the code)
      toast.success(
        `Invitation created! Access code: ${token}`,
        { duration: 10000, description: `Send this code to ${form.email}` }
      )

      setForm({ email: '', role: 'regulator', organization: '', expiryDays: '7' })
      setShowForm(false)
      loadInvitations()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create invitation')
    } finally {
      setSubmitting(false)
    }
  }

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token)
    toast.success('Access code copied to clipboard')
  }

  const revokeInvitation = async (id: string) => {
    const { error } = await supabase.from('invitations').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    setInvitations(prev => prev.filter(i => i.id !== id))
    toast.success('Invitation revoked')
  }

  const pending = invitations.filter(i => !i.accepted_at && new Date(i.expires_at) > new Date())
  const accepted = invitations.filter(i => i.accepted_at)
  const expired = invitations.filter(i => !i.accepted_at && new Date(i.expires_at) <= new Date())

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs text-muted-foreground tracking-widest uppercase mb-0.5">Platform Admin</p>
          <h1 className="text-2xl font-semibold">Invitations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate access codes for government bodies, recyclers, and institutional stakeholders.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90 flex-shrink-0"
          style={{ background: '#0f1410' }}
        >
          <Plus className="w-4 h-4" />
          New Invitation
        </button>
      </div>

      {/* Create invitation form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-border rounded-xl p-5 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">New Invitation</h2>
            <button type="button" aria-label="Close" onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Official Email *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="official@epa.gov.lr"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Role *</label>
              <select
                value={form.role}
                onChange={e => setForm(p => ({ ...p, role: e.target.value as UserRole }))}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors"
              >
                {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Organization *</label>
              <input
                required
                value={form.organization}
                onChange={e => setForm(p => ({ ...p, organization: e.target.value }))}
                placeholder="EPA Liberia, MOCI…"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Expires in</label>
              <select
                value={form.expiryDays}
                onChange={e => setForm(p => ({ ...p, expiryDays: e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors"
              >
                <option value="3">3 days</option>
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
              </select>
            </div>

            <div className="sm:col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-colors"
                style={{ background: '#0f1410' }}
              >
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : 'Create & Copy Code'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Pending', count: pending.length, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Accepted', count: accepted.length, color: 'text-eco-700', bg: 'bg-eco-50' },
          { label: 'Expired', count: expired.length, color: 'text-muted-foreground', bg: 'bg-muted' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-border rounded-xl p-4 text-center">
            <p className={`text-2xl font-semibold ${s.color}`}>{s.count}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Invitation list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : invitations.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-sm">No invitations yet. Create one to grant institutional access.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {invitations.map((inv, i) => {
            const isAccepted = !!inv.accepted_at
            const isExpired = !isAccepted && new Date(inv.expires_at) <= new Date()
            const daysLeft = !isAccepted && !isExpired ? daysUntil(inv.expires_at) : null

            return (
              <motion.div
                key={inv.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 p-4 bg-white border border-border rounded-xl"
              >
                {/* Status icon */}
                <div className="flex-shrink-0">
                  {isAccepted
                    ? <CheckCircle className="w-5 h-5 text-eco-700" />
                    : isExpired
                    ? <X className="w-5 h-5 text-muted-foreground" />
                    : <Clock className="w-5 h-5 text-yellow-500" />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium truncate">{inv.email}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium capitalize">
                      {inv.role}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {inv.organization}
                    {isAccepted && ` · Accepted ${new Date(inv.accepted_at!).toLocaleDateString('en-LR', { dateStyle: 'medium' })}`}
                    {isExpired && ' · Expired'}
                    {daysLeft !== null && ` · Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`}
                  </p>
                </div>

                {/* Token + actions */}
                {!isAccepted && !isExpired && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <code className="text-xs font-mono px-2.5 py-1 bg-muted rounded-md text-foreground">
                      {inv.token}
                    </code>
                    <button
                      type="button"
                      aria-label="Copy access code"
                      onClick={() => copyToken(inv.token)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Revoke invitation"
                      onClick={() => revokeInvitation(inv.id)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
