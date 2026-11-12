import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Plus, Copy, Trash2, Loader2, CheckCircle, Clock, X, UserCheck, UserX, Mail, Phone, Building2, Briefcase, Inbox } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import type { AccessRequest, AccessRequestStatus, Invitation, UserRole } from '@/types/database'

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'regulator',    label: 'Regulator' },
  { value: 'auditor',      label: 'NGO / Auditor' },
  { value: 'manufacturer', label: 'Manufacturer' },
  { value: 'recycler',     label: 'Recycler' },
  { value: 'admin',        label: 'Platform Admin' },
]

// Roles an access request can be approved as (consumers may request access too)
const APPROVE_ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  ...ROLE_OPTIONS.filter(r => r.value !== 'admin'),
  { value: 'consumer', label: 'Consumer' },
  { value: 'admin',    label: 'Platform Admin' },
]

const REQUESTED_ROLE_LABEL: Record<string, string> = {
  consumer: 'Consumer', manufacturer: 'Manufacturer', recycler: 'Recycler',
  regulator: 'Regulator', auditor: 'Auditor / NGO', other: 'Other',
}

const inputCls = 'w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors'

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

  // ── Access requests (from the public "Request access" form) ────────────────
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [requestFilter, setRequestFilter] = useState<AccessRequestStatus>('pending')
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [approveForm, setApproveForm] = useState({ role: 'regulator' as UserRole, organization: '', expiryDays: '7' })
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null)

  const loadRequests = useCallback(async () => {
    const { data, error } = await supabase
      .from('access_requests')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) { toast.error(`Could not load access requests: ${error.message}`); return }
    setRequests((data ?? []) as AccessRequest[])
  }, [])

  useEffect(() => { loadInvitations(); loadRequests() }, [loadInvitations, loadRequests])

  /** Creates an invitation row and emails the access code. Returns the new invitation id. */
  const createInvitation = async (o: { email: string; role: UserRole; organization: string; expiryDays: number }) => {
    if (!profile) throw new Error('Not signed in')
    const email = o.email.toLowerCase().trim()
    const organization = o.organization.trim()
    const token = generateToken()
    const expiresAt = new Date(Date.now() + o.expiryDays * 86400_000).toISOString()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('invitations') as any)
      .insert({ email, role: o.role, organization, invited_by: profile.id, token, expires_at: expiresAt })
      .select('id')
      .single()
    if (error) throw error

    // Send invitation email automatically via notify edge function
    await supabase.functions.invoke('notify', {
      body: {
        type: 'INSERT',
        table: 'invitations',
        record: { email, role: o.role, organization, token, expiry_days: o.expiryDays },
      },
    })

    return { id: (data as { id: string }).id, token }
  }

  const startApprove = (req: AccessRequest) => {
    const suggested = APPROVE_ROLE_OPTIONS.some(r => r.value === req.requested_role)
      ? (req.requested_role as UserRole)
      : 'auditor'
    setApproveForm({ role: suggested, organization: req.organization ?? '', expiryDays: '7' })
    setApprovingId(req.id)
  }

  const handleApprove = async (req: AccessRequest) => {
    if (!profile) return
    if (!approveForm.organization.trim()) { toast.error('Organization is required'); return }
    setBusyRequestId(req.id)
    try {
      const { id: invitationId, token } = await createInvitation({
        email: req.email,
        role: approveForm.role,
        organization: approveForm.organization,
        expiryDays: Number(approveForm.expiryDays),
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('access_requests') as any)
        .update({
          status: 'approved',
          reviewed_by: profile.id,
          reviewed_at: new Date().toISOString(),
          invitation_id: invitationId,
        })
        .eq('id', req.id)
      if (error) throw error

      toast.success(`Access approved for ${req.full_name}`, {
        duration: 8000,
        description: `An invitation with access code ${token} has been emailed to ${req.email}.`,
      })
      setApprovingId(null)
      loadRequests()
      loadInvitations()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve request')
    } finally {
      setBusyRequestId(null)
    }
  }

  const handleReject = async (req: AccessRequest) => {
    if (!profile) return
    if (!window.confirm(`Reject the access request from ${req.full_name} (${req.email})?`)) return
    setBusyRequestId(req.id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('access_requests') as any)
      .update({ status: 'rejected', reviewed_by: profile.id, reviewed_at: new Date().toISOString() })
      .eq('id', req.id)
    setBusyRequestId(null)
    if (error) { toast.error(error.message); return }
    toast.success('Request rejected')
    loadRequests()
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSubmitting(true)

    try {
      const { token } = await createInvitation({
        email: form.email,
        role: form.role,
        organization: form.organization,
        expiryDays: Number(form.expiryDays),
      })

      toast.success(
        `Invitation sent to ${form.email}`,
        { duration: 8000, description: `Access code ${token} has been emailed. The copy button is available as a backup.` }
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

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const visibleRequests = requests.filter(r => r.status === requestFilter)

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

      {/* Access requests */}
      <section className="mb-8">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Inbox className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Access Requests</h2>
            {pendingRequests.length > 0 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                {pendingRequests.length} pending
              </span>
            )}
          </div>
          <div className="flex gap-1 bg-muted rounded-lg p-0.5">
            {(['pending', 'approved', 'rejected'] as AccessRequestStatus[]).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setRequestFilter(s)}
                className={`px-3 py-1 text-xs rounded-md capitalize transition-colors ${
                  requestFilter === s ? 'bg-white shadow-sm font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {visibleRequests.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground bg-white border border-dashed border-border rounded-xl">
            No {requestFilter} access requests.
          </div>
        ) : (
          <div className="space-y-2">
            {visibleRequests.map(req => {
              const busy = busyRequestId === req.id
              const approving = approvingId === req.id
              return (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-white border border-border rounded-xl"
                >
                  <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{req.full_name}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                          {REQUESTED_ROLE_LABEL[req.requested_role] ?? req.requested_role}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(req.created_at).toLocaleString('en-LR', { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      </div>
                      <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <a href={`mailto:${req.email}`} className="flex items-center gap-1.5 hover:text-foreground truncate">
                          <Mail className="w-3 h-3 flex-shrink-0" />{req.email}
                        </a>
                        {req.phone && (
                          <a href={`tel:${req.phone}`} className="flex items-center gap-1.5 hover:text-foreground truncate">
                            <Phone className="w-3 h-3 flex-shrink-0" />{req.phone}
                          </a>
                        )}
                        {req.organization && (
                          <span className="flex items-center gap-1.5 truncate"><Building2 className="w-3 h-3 flex-shrink-0" />{req.organization}</span>
                        )}
                        {req.job_title && (
                          <span className="flex items-center gap-1.5 truncate"><Briefcase className="w-3 h-3 flex-shrink-0" />{req.job_title}</span>
                        )}
                      </div>
                      {req.message && (
                        <p className="mt-2 text-xs text-foreground/80 bg-muted/50 rounded-lg px-3 py-2 whitespace-pre-wrap break-words">
                          {req.message}
                        </p>
                      )}
                      {req.status !== 'pending' && req.reviewed_at && (
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          {req.status === 'approved' ? 'Approved' : 'Rejected'} {new Date(req.reviewed_at).toLocaleDateString('en-LR', { dateStyle: 'medium' })}
                          {req.status === 'approved' && ' · invitation emailed'}
                        </p>
                      )}
                    </div>

                    {req.status === 'pending' && !approving && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleReject(req)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg text-muted-foreground hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          <UserX className="w-3.5 h-3.5" /> Reject
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => startApprove(req)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                          style={{ background: '#0f1410' }}
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Approve
                        </button>
                      </div>
                    )}
                  </div>

                  {approving && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-3">
                        Approving sends <strong className="text-foreground">{req.email}</strong> an invitation email with an access code.
                        They sign in via Institutional Sign In, then set their password.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Grant role *</label>
                          <select
                            value={approveForm.role}
                            onChange={e => setApproveForm(p => ({ ...p, role: e.target.value as UserRole }))}
                            className={inputCls}
                          >
                            {APPROVE_ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Organization *</label>
                          <input
                            value={approveForm.organization}
                            onChange={e => setApproveForm(p => ({ ...p, organization: e.target.value }))}
                            placeholder="EPA Liberia…"
                            className={inputCls}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Expires in</label>
                          <select
                            value={approveForm.expiryDays}
                            onChange={e => setApproveForm(p => ({ ...p, expiryDays: e.target.value }))}
                            className={inputCls}
                          >
                            <option value="3">3 days</option>
                            <option value="7">7 days</option>
                            <option value="14">14 days</option>
                            <option value="30">30 days</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-3">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setApprovingId(null)}
                          className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={busy || !approveForm.organization.trim()}
                          onClick={() => handleApprove(req)}
                          className="flex items-center gap-1.5 px-4 py-1.5 text-xs rounded-lg text-white disabled:opacity-50"
                          style={{ background: '#0f1410' }}
                        >
                          {busy ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending…</> : 'Approve & Send Invitation'}
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </section>

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
