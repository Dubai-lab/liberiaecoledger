import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Loader2, User, Lock, Trash2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface ProfileData {
  full_name: string | null
  email: string | null
  phone: string | null
  organization: string | null
  city: string | null
  country: string
  wallet_address: string | null
  created_at: string
}

export function AccountSettingsPage() {
  const { profile, activeRole, signOut } = useAuth()
  const navigate = useNavigate()

  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Editable fields
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [organization, setOrganization] = useState('')
  const [city, setCity] = useState('')

  useEffect(() => {
    if (!profile) return
    supabase
      .from('profiles')
      .select('full_name, email, phone, organization, city, country, wallet_address, created_at')
      .eq('id', profile.id)
      .maybeSingle()
      .then(({ data: p }) => {
        if (p) {
          setData(p)
          setFullName(p.full_name ?? '')
          setPhone(p.phone ?? '')
          setOrganization(p.organization ?? '')
          setCity(p.city ?? '')
        }
        setLoading(false)
      })
  }, [profile])

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone, organization, city })
      .eq('id', profile.id)
    setSaving(false)
    if (error) toast.error('Could not save changes.')
    else toast.success('Profile updated successfully.')
  }

  const handleResetPassword = async () => {
    const email = data?.email ?? profile?.email
    if (!email) return
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) toast.error('Could not send reset email.')
    else {
      setResetSent(true)
      toast.success(`Password reset email sent to ${email}`)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'DELETE') return
    if (!profile) return
    setDeleting(true)
    try {
      await supabase.from('user_roles').delete().eq('user_id', profile.id)
      await supabase.from('profiles').delete().eq('id', profile.id)
      await signOut()
      navigate('/login', { replace: true })
    } catch {
      toast.error('Could not delete account. Please contact support.')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const displayName = data?.full_name ?? data?.email?.split('@')[0] ?? 'User'
  const initials = displayName.slice(0, 2).toUpperCase()
  const memberSince = data?.created_at
    ? new Date(data.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : ''

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Account Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your profile, security and account preferences.</p>
      </div>

      {/* Profile summary */}
      <div className="bg-white rounded-2xl p-5 border border-border mb-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[#0f1410] flex items-center justify-center flex-shrink-0">
          <span className="text-lg font-bold text-white">{initials}</span>
        </div>
        <div>
          <p className="font-semibold text-foreground">{displayName}</p>
          <p className="text-sm text-muted-foreground">{data?.email}</p>
          {memberSince && <p className="text-xs text-muted-foreground mt-0.5">Member since {memberSince}</p>}
        </div>
      </div>

      {/* Profile information */}
      <section className="bg-white rounded-2xl border border-border mb-6 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <User className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm text-foreground">Profile Information</h2>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Read-only */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Email</label>
            <p className="text-sm text-foreground bg-muted/40 rounded-lg px-3 py-2.5 border border-border">{data?.email ?? '—'}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Email cannot be changed here</p>
          </div>
          {data?.wallet_address && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Wallet</label>
              <p className="text-sm text-foreground bg-muted/40 rounded-lg px-3 py-2.5 border border-border font-mono truncate">
                {data.wallet_address.slice(0, 6)}…{data.wallet_address.slice(-4)}
              </p>
            </div>
          )}

          {/* Editable */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Full Name</label>
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Your full name"
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2f6b3a]/30 focus:border-[#2f6b3a]"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Phone</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+231 ..."
              type="tel"
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2f6b3a]/30 focus:border-[#2f6b3a]"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Organization</label>
            <input
              value={organization}
              onChange={e => setOrganization(e.target.value)}
              placeholder="Company or institution"
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2f6b3a]/30 focus:border-[#2f6b3a]"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">City</label>
            <input
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="Monrovia"
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2f6b3a]/30 focus:border-[#2f6b3a]"
            />
          </div>
        </div>
        <div className="px-5 pb-5">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0f1410] text-white rounded-lg text-sm font-semibold hover:bg-[#1a2a1f] transition-colors disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </section>

      {/* Security */}
      <section className="bg-white rounded-2xl border border-border mb-6 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <Lock className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm text-foreground">Security</h2>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Password</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {resetSent
                  ? `Reset link sent to ${data?.email}. Check your inbox.`
                  : 'Send a password reset link to your email address.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={resetSent}
              className="flex-shrink-0 px-4 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-muted/40 transition-colors disabled:opacity-50"
            >
              {resetSent ? 'Sent' : 'Reset Password'}
            </button>
          </div>
        </div>
      </section>

      {/* Danger zone — not available for admin accounts */}
      {activeRole !== 'admin' && <section className="bg-white rounded-2xl border border-red-200 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-red-100">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <h2 className="font-semibold text-sm text-red-600">Danger Zone</h2>
        </div>
        <div className="p-5">
          {!showDeleteConfirm ? (
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">Delete Account</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Permanently removes your profile and all associated data. This cannot be undone.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-200 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-foreground">
                Type <span className="font-mono font-bold">DELETE</span> to confirm permanent deletion of your account.
              </p>
              <input
                value={deleteInput}
                onChange={e => setDeleteInput(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full border border-red-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleteInput !== 'DELETE' || deleting}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-40"
                >
                  {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {deleting ? 'Deleting…' : 'Delete My Account'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowDeleteConfirm(false); setDeleteInput('') }}
                  className="px-4 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-muted/40 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </section>}
    </div>
  )
}
