import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ProfileData {
  full_name: string | null
  email: string | null
  phone: string | null
  organization: string | null
  city: string | null
  created_at: string
}

export function MobileSettingsPage() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Editable
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [organization, setOrganization] = useState('')
  const [city, setCity] = useState('')

  useEffect(() => {
    if (!profile) return
    supabase
      .from('profiles')
      .select('full_name, email, phone, organization, city, created_at')
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
    else toast.success('Profile updated.')
  }

  const handleResetPassword = async () => {
    const email = data?.email ?? profile?.email
    if (!email) return
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) toast.error('Could not send reset email.')
    else {
      setResetSent(true)
      toast.success(`Reset link sent to ${email}`)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'DELETE' || !profile) return
    setDeleting(true)
    try {
      await supabase.from('user_roles').delete().eq('user_id', profile.id)
      await supabase.from('profiles').delete().eq('id', profile.id)
      await signOut()
      navigate('/mobile/login', { replace: true })
    } catch {
      toast.error('Could not delete account. Please contact support.')
      setDeleting(false)
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
    <div className="px-5 pt-6 pb-10" style={{ background: '#f0ede6', minHeight: '100vh' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-[#0f0f0e] flex items-center justify-center flex-shrink-0"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="white" strokeWidth={2}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <p className="text-base font-semibold text-[#0f0f0e]">Account Settings</p>
      </div>

      {/* Profile summary */}
      <div className="bg-white rounded-2xl p-4 mb-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-[#0f0f0e] flex items-center justify-center flex-shrink-0">
          <span className="text-base font-bold text-white">
            {(data?.full_name ?? data?.email ?? 'U').slice(0, 2).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#0f0f0e] truncate">{data?.full_name ?? 'No name set'}</p>
          <p className="text-xs text-[#9b9b98] truncate">{data?.email}</p>
          {data?.created_at && (
            <p className="text-[10px] text-[#b0afa8] mt-0.5">
              Member since {new Date(data.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
      </div>

      {/* Read-only */}
      <div className="bg-white rounded-2xl p-4 mb-4">
        <p className="text-[10px] tracking-widest text-[#9b9b98] uppercase mb-3">Account</p>
        <div>
          <p className="text-[10px] tracking-widest text-[#9b9b98] uppercase mb-0.5">Email</p>
          <p className="text-sm text-[#0f0f0e]">{data?.email ?? '—'}</p>
          <p className="text-[10px] text-[#b0afa8] mt-0.5">Cannot be changed here</p>
        </div>
      </div>

      {/* Editable profile */}
      <div className="bg-white rounded-2xl p-4 mb-4">
        <p className="text-[10px] tracking-widests text-[#9b9b98] uppercase mb-4">Profile</p>
        <div className="space-y-4">
          {[
            { label: 'Full Name', value: fullName, set: setFullName, placeholder: 'Your full name', type: 'text' },
            { label: 'Phone', value: phone, set: setPhone, placeholder: '+231 ...', type: 'tel' },
            { label: 'Organization', value: organization, set: setOrganization, placeholder: 'Company or institution', type: 'text' },
            { label: 'City', value: city, set: setCity, placeholder: 'Monrovia', type: 'text' },
          ].map(f => (
            <div key={f.label}>
              <label className="text-[10px] tracking-widests text-[#9b9b98] uppercase block mb-1">{f.label}</label>
              <input
                value={f.value}
                onChange={e => f.set(e.target.value)}
                placeholder={f.placeholder}
                type={f.type}
                className="w-full border border-[#e8e5de] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0f0f0e]"
              />
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full py-4 rounded-2xl text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 mb-6"
        style={{ background: '#0f0f0e' }}
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        {saving ? 'Saving…' : 'Save Changes'}
      </button>

      {/* Security */}
      <div className="bg-white rounded-2xl p-4 mb-4">
        <p className="text-[10px] tracking-widests text-[#9b9b98] uppercase mb-3">Security</p>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#0f0f0e]">Password</p>
            <p className="text-xs text-[#9b9b98] mt-0.5">
              {resetSent ? 'Reset link sent — check your email' : 'Send a reset link to your email'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetPassword}
            disabled={resetSent}
            className="flex-shrink-0 px-4 py-2 rounded-xl border border-[#e8e5de] text-sm font-semibold text-[#0f0f0e] disabled:opacity-50"
          >
            {resetSent ? 'Sent' : 'Reset'}
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-2xl p-4 border border-red-100">
        <p className="text-[10px] tracking-widests uppercase mb-3" style={{ color: '#c0392b' }}>Danger Zone</p>
        {!showDelete ? (
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#0f0f0e]">Delete Account</p>
              <p className="text-xs text-[#9b9b98] mt-0.5">Permanently removes your profile and data.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowDelete(true)}
              className="flex-shrink-0 px-4 py-2 rounded-xl border border-red-200 text-sm font-semibold text-red-600"
            >
              Delete
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-[#0f0f0e]">
              Type <span className="font-mono font-bold">DELETE</span> to confirm.
            </p>
            <input
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="w-full border border-red-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteInput !== 'DELETE' || deleting}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                {deleting ? 'Deleting…' : 'Delete My Account'}
              </button>
              <button
                type="button"
                onClick={() => { setShowDelete(false); setDeleteInput('') }}
                className="flex-1 py-3 rounded-xl border border-[#e8e5de] text-sm font-semibold text-[#0f0f0e]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
