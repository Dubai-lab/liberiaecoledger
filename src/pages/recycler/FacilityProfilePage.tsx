import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Save, Clock, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import type { RecyclerFacility } from '@/types/database'

const LIBERIA_COUNTIES = [
  'Bomi', 'Bong', 'Gbarpolu', 'Grand Bassa', 'Grand Cape Mount',
  'Grand Gedeh', 'Grand Kru', 'Lofa', 'Margibi', 'Maryland',
  'Montserrado', 'Nimba', 'River Cess', 'River Gee', 'Sinoe',
]

export function FacilityProfilePage() {
  const { profile } = useAuth()
  const [facility, setFacility] = useState<RecyclerFacility | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', license_number: '', location_city: '', location_county: 'Montserrado',
    operating_hours: '', accepts_free_pickup: false, is_basel_certified: false,
  })

  useEffect(() => {
    if (!profile) return
    supabase.from('recycler_facilities').select('*').eq('owner_id', profile.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setFacility(data)
          setForm({
            name: data.name,
            license_number: data.license_number,
            location_city: data.location_city,
            location_county: data.location_county,
            operating_hours: data.operating_hours ?? '',
            accepts_free_pickup: data.accepts_free_pickup,
            is_basel_certified: data.is_basel_certified,
          })
        }
        setLoading(false)
      })
  }, [profile])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSaving(true)

    try {
      if (facility) {
        const { error } = await supabase.from('recycler_facilities')
          .update({
            name: form.name,
            license_number: form.license_number,
            location_city: form.location_city,
            location_county: form.location_county,
            operating_hours: form.operating_hours || null,
            accepts_free_pickup: form.accepts_free_pickup,
            is_basel_certified: form.is_basel_certified,
          })
          .eq('id', facility.id)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('recycler_facilities').insert({
          owner_id: profile.id,
          name: form.name,
          license_number: form.license_number,
          location_city: form.location_city,
          location_county: form.location_county,
          operating_hours: form.operating_hours || null,
          accepts_free_pickup: form.accepts_free_pickup,
          is_basel_certified: form.is_basel_certified,
          is_active: false,
          total_devices_processed: 0,
        }).select().single()
        if (error) throw error
        setFacility(data)
      }
      toast.success('Facility profile saved!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-96"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <p className="text-xs text-muted-foreground tracking-widest uppercase mb-0.5">Recycler</p>
        <h1 className="text-2xl font-semibold">Facility Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {facility ? 'Update your facility details.' : 'Register your recycling facility to start logging disposals.'}
        </p>
      </div>

      {/* Approval status banner */}
      {facility && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border mb-5 ${
          facility.is_active
            ? 'bg-eco-50 border-eco-200'
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          {facility.is_active
            ? <CheckCircle className="w-5 h-5 text-eco-700 flex-shrink-0" />
            : <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          }
          <div>
            <p className={`text-sm font-medium ${facility.is_active ? 'text-eco-900' : 'text-yellow-900'}`}>
              {facility.is_active ? 'Facility active and verified' : 'Pending admin approval'}
            </p>
            <p className={`text-xs mt-0.5 ${facility.is_active ? 'text-eco-700' : 'text-yellow-700'}`}>
              {facility.is_active
                ? 'Your EPA license has been verified. You can log disposals.'
                : 'An admin will verify your EPA license number and activate your facility. You will be able to log disposals once approved.'}
            </p>
          </div>
        </div>
      )}

      <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSave} className="space-y-5">
        <section className="bg-white border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold">Facility Details</h2>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Facility Name *</label>
            <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Monrovia Green Hub"
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">EPA License Number *</label>
            <input required value={form.license_number} onChange={e => setForm(p => ({ ...p, license_number: e.target.value }))}
              placeholder="EPA-LR-2024-XXXX"
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors font-mono" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">City *</label>
              <input required value={form.location_city} onChange={e => setForm(p => ({ ...p, location_city: e.target.value }))}
                placeholder="Monrovia"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">County *</label>
              <select value={form.location_county} onChange={e => setForm(p => ({ ...p, location_county: e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors">
                {LIBERIA_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Operating Hours</label>
            <input value={form.operating_hours} onChange={e => setForm(p => ({ ...p, operating_hours: e.target.value }))}
              placeholder="Mon–Fri 8am–5pm, Sat 9am–1pm"
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors" />
          </div>
        </section>

        <section className="bg-white border border-border rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold">Certifications & Services</h2>
          {[
            { key: 'accepts_free_pickup', label: 'Accepts free device pickup from consumers' },
            { key: 'is_basel_certified', label: 'Basel Convention certified facility' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form[key as 'accepts_free_pickup' | 'is_basel_certified']}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))}
                className="w-4 h-4 rounded border-border accent-eco-700"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </section>

        <button type="submit" disabled={saving}
          className="w-full py-3 rounded-lg text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: '#0f1410', color: '#fafaf7' }}>
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> {facility ? 'Update Facility' : 'Register Facility'}</>}
        </button>
      </motion.form>
    </div>
  )
}
