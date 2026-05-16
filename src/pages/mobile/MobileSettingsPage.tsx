import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function MobileSettingsPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [organization, setOrganization] = useState(profile?.organization ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone, organization })
      .eq('id', profile.id)
    setSaving(false)
    if (error) {
      toast.error('Could not save changes.')
    } else {
      toast.success('Profile updated.')
      navigate(-1)
    }
  }

  return (
    <div className="px-5 pt-6 pb-8" style={{ background: '#f0ede6', minHeight: '100vh' }}>
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

      {/* Read-only fields */}
      <div className="bg-white rounded-2xl p-4 mb-4">
        <p className="text-[10px] tracking-widest text-[#9b9b98] uppercase mb-4">Account</p>
        <div className="space-y-3">
          <div>
            <p className="text-[10px] tracking-widest text-[#9b9b98] uppercase mb-1">Email</p>
            <p className="text-sm text-[#0f0f0e]">{profile?.email ?? '—'}</p>
            <p className="text-[10px] text-[#b0afa8] mt-0.5">Email cannot be changed here</p>
          </div>
        </div>
      </div>

      {/* Editable fields */}
      <div className="bg-white rounded-2xl p-4 mb-5">
        <p className="text-[10px] tracking-widest text-[#9b9b98] uppercase mb-4">Profile</p>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] tracking-widest text-[#9b9b98] uppercase block mb-1">
              Full Name
            </label>
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Your full name"
              className="w-full border border-[#e8e5de] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0f0f0e]"
            />
          </div>
          <div>
            <label className="text-[10px] tracking-widest text-[#9b9b98] uppercase block mb-1">
              Phone
            </label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+231 ..."
              type="tel"
              className="w-full border border-[#e8e5de] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0f0f0e]"
            />
          </div>
          <div>
            <label className="text-[10px] tracking-widest text-[#9b9b98] uppercase block mb-1">
              Organization
            </label>
            <input
              value={organization}
              onChange={e => setOrganization(e.target.value)}
              placeholder="Company or school name"
              className="w-full border border-[#e8e5de] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0f0f0e]"
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full py-4 rounded-2xl text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ background: '#0f0f0e' }}
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  )
}
