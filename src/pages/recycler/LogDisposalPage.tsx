import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, Upload, Loader2, Leaf } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { uploadToIPFS } from '@/lib/pinata'
import { relayTx, EXPLORER } from '@/lib/contracts'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import type { Device, RecyclerFacility } from '@/types/database'

const DISPOSAL_TYPES = [
  { value: 'recycle',        label: 'Full Recycling' },
  { value: 'refurbish',      label: 'Refurbishment' },
  { value: 'salvage_parts',  label: 'Parts Salvage' },
  { value: 'hazardous',      label: 'Hazardous Waste Route' },
]

// Credits per gram of recovered material
const CREDIT_RATES = {
  gold:     50,
  copper:   5,
  aluminum: 2,
  lithium:  30,
  cobalt:   20,
  lead:     3,
}

function calcCredits(g: { gold: number; copper: number; aluminum: number; lithium: number; cobalt: number; lead: number }) {
  return Math.round(
    g.gold * CREDIT_RATES.gold +
    g.copper * CREDIT_RATES.copper +
    g.aluminum * CREDIT_RATES.aluminum +
    g.lithium * CREDIT_RATES.lithium +
    g.cobalt * CREDIT_RATES.cobalt +
    g.lead * CREDIT_RATES.lead
  )
}

export function LogDisposalPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [devices, setDevices] = useState<Device[]>([])
  const [facility, setFacility] = useState<RecyclerFacility | null>(null)
  const [loading, setLoading] = useState(false)
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([])

  const [form, setForm] = useState({
    deviceId:    '',
    disposalType: 'recycle',
    finalMassKg: '',
    hazardClass: 'none',
    downstream:  '',
    goldG: '0', copperG: '0', aluminumG: '0', lithiumG: '0', cobaltG: '0', leadG: '0',
  })

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }))

  useEffect(() => {
    if (!profile) return
    Promise.all([
      supabase.from('devices')
        .select('id, brand, model, serial_number, hazard_class, status, material_gold_g, material_copper_g, material_aluminum_g, material_lithium_g, material_cobalt_g, material_lead_g')
        .eq('status', 'ready_for_disposal'),
      supabase.from('recycler_facilities').select('*').eq('owner_id', profile.id).maybeSingle(),
    ]).then(([devRes, facRes]) => {
      setDevices((devRes.data as Device[]) ?? [])
      setFacility(facRes.data ?? null)
    })
  }, [profile])

  // Auto-populate material fields when device is selected
  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    const dev = devices.find(d => d.id === id)
    setForm(p => ({
      ...p,
      deviceId:  id,
      hazardClass: dev?.hazard_class ?? 'none',
      goldG:     String(dev?.material_gold_g     ?? 0),
      copperG:   String(dev?.material_copper_g   ?? 0),
      aluminumG: String(dev?.material_aluminum_g ?? 0),
      lithiumG:  String(dev?.material_lithium_g  ?? 0),
      cobaltG:   String(dev?.material_cobalt_g   ?? 0),
      leadG:     String(dev?.material_lead_g     ?? 0),
    }))
  }

  // Auto-calculate EcoCredits from current material weights
  const calculatedCredits = useMemo(() => calcCredits({
    gold:     Number(form.goldG)     || 0,
    copper:   Number(form.copperG)   || 0,
    aluminum: Number(form.aluminumG) || 0,
    lithium:  Number(form.lithiumG)  || 0,
    cobalt:   Number(form.cobaltG)   || 0,
    lead:     Number(form.leadG)     || 0,
  }), [form.goldG, form.copperG, form.aluminumG, form.lithiumG, form.cobaltG, form.leadG])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile || !facility) {
      toast.error('Set up your facility profile before logging disposals.')
      return
    }
    if (!form.deviceId) { toast.error('Select a device'); return }
    setLoading(true)

    try {
      // Fetch device owner + wallet before any mutations
      const { data: deviceData } = await supabase
        .from('devices')
        .select('current_owner_id, brand, model')
        .eq('id', form.deviceId)
        .single()

      const { data: ownerProfile } = await supabase
        .from('profiles')
        .select('wallet_address')
        .eq('id', deviceData?.current_owner_id ?? '')
        .maybeSingle()

      // Upload evidence files to IPFS
      const evidenceUrls: string[] = []
      for (const file of evidenceFiles) {
        const result = await uploadToIPFS(file, {
          name: `evidence-${form.deviceId}-${Date.now()}`,
          keyvalues: { recycler: profile.id, facility: facility.id, device: form.deviceId },
        })
        evidenceUrls.push(result.url)
      }

      const { data: disposal, error } = await supabase.from('disposals').insert({
        device_id:    form.deviceId,
        recycler_id:  profile.id,
        facility_id:  facility.id,
        disposal_type: form.disposalType as 'recycle' | 'refurbish' | 'salvage_parts' | 'hazardous',
        final_mass_kg: Number(form.finalMassKg) || 0,
        hazard_class:  form.hazardClass as 'li_ion_battery' | 'toner' | 'mercury_ccfl' | 'mixed' | 'none',
        downstream_destination: form.downstream || null,
        evidence_urls: evidenceUrls,
        component_breakdown: {
          gold_g:     Number(form.goldG)     || 0,
          copper_g:   Number(form.copperG)   || 0,
          aluminum_g: Number(form.aluminumG) || 0,
          lithium_g:  Number(form.lithiumG)  || 0,
          cobalt_g:   Number(form.cobaltG)   || 0,
          lead_g:     Number(form.leadG)     || 0,
        },
        eco_credits_awarded: calculatedCredits,
        status: 'pending',
      }).select('id').single()
      if (error) throw error

      // Mark device as disposed
      await supabase.from('devices').update({ status: 'disposed' }).eq('id', form.deviceId)

      // Write immutable lifecycle event
      await supabase.from('device_lifecycle').insert({
        device_id:  form.deviceId,
        event_type: 'disposed',
        actor_id:   profile.id,
        actor_name: profile.full_name ?? profile.organization ?? 'Recycler',
        location:   `${facility.location_city}, ${facility.location_county}`,
        metadata: {
          facility:      facility.name,
          disposal_type: form.disposalType,
          final_mass_kg: Number(form.finalMassKg) || 0,
          eco_credits:   calculatedCredits,
          downstream:    form.downstream || null,
        },
      })

      // Award EcoCredits directly to device owner
      if (calculatedCredits > 0 && deviceData) {
        await supabase.from('eco_credits').insert({
          user_id:     deviceData.current_owner_id,
          amount:      calculatedCredits,
          type:        'earned',
          source:      'recycling',
          device_id:   form.deviceId,
          disposal_id: disposal?.id ?? null,
          description: `Recycled at ${facility.name} — ${calculatedCredits} EC earned`,
        })

        // Notify device owner
        await supabase.from('notifications').insert({
          user_id: deviceData.current_owner_id,
          title:   `${calculatedCredits} EcoCredits awarded for recycling!`,
          body:    `Your ${deviceData.brand} ${deviceData.model} was recycled at ${facility.name}. You earned ${calculatedCredits} EcoCredits.`,
          type:    'success',
          is_read: false,
          link:    '/consumer/credits',
        })
      }

      toast.success(`Disposal logged! ${calculatedCredits > 0 ? `${calculatedCredits} EcoCredits awarded to device owner.` : ''}`)

      // Anchor on-chain via relay — mints ECO tokens to device owner's wallet
      const ownerWallet = ownerProfile?.wallet_address
      if (ownerWallet) {
        toast.loading('Anchoring disposal to Sepolia blockchain…', { id: 'relay' })
        const result = await relayTx({
          action: 'dispose',
          deviceId: form.deviceId,
          userWallet: ownerWallet,
          creditsAmount: calculatedCredits,
        })
        if (result) {
          toast.success(
            <span>On-chain confirmed! <a href={`${EXPLORER}/tx/${result.txHash}`} target="_blank" rel="noreferrer" className="underline">View tx</a></span>,
            { id: 'relay', duration: 6000 }
          )
        } else {
          toast.dismiss('relay')
        }
      }

      navigate('/recycler')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to log disposal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button type="button" onClick={() => navigate('/recycler')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ChevronLeft className="w-4 h-4" /> Hub Overview
      </button>

      <div className="mb-6">
        <p className="text-xs text-muted-foreground tracking-widest uppercase mb-0.5">Recycler</p>
        <h1 className="text-2xl font-semibold">Log Disposal</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Record a completed recycling event. EcoCredits are calculated automatically from recovered materials.
        </p>
      </div>

      {!facility && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-5 text-sm text-yellow-800">
          You need to register your facility before logging disposals.{' '}
          <button type="button" onClick={() => navigate('/recycler/facility')} className="font-medium underline">
            Set up facility →
          </button>
        </div>
      )}

      <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="space-y-5">

        {/* Device selection */}
        <section className="bg-white border border-border rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold">Device</h2>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Device to Dispose *</label>
            <select required value={form.deviceId} onChange={handleDeviceChange}
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors">
              <option value="">Select a device…</option>
              {devices.map(d => (
                <option key={d.id} value={d.id}>
                  {d.brand} {d.model}{d.serial_number ? ` (${d.serial_number})` : ''}
                </option>
              ))}
            </select>
            {devices.length === 0 && (
              <p className="text-xs text-muted-foreground">No devices marked "ready for disposal" yet.</p>
            )}
          </div>
        </section>

        {/* Disposal details */}
        <section className="bg-white border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold">Disposal Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Disposal Type *</label>
              <select value={form.disposalType} onChange={set('disposalType')}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors">
                {DISPOSAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Final Mass (kg) *</label>
              <input type="number" min="0" step="0.01" required value={form.finalMassKg} onChange={set('finalMassKg')}
                placeholder="e.g. 1.8"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Hazard Class</label>
              <select value={form.hazardClass} onChange={set('hazardClass')}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors">
                <option value="none">None</option>
                <option value="li_ion_battery">Li-Ion Battery</option>
                <option value="toner">Toner</option>
                <option value="mercury_ccfl">Mercury / CCFL</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Downstream Destination</label>
              <input value={form.downstream} onChange={set('downstream')} placeholder="e.g. Monrovia Central Smelter"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors" />
            </div>
          </div>
        </section>

        {/* Material breakdown — auto-populated from device, editable */}
        <section className="bg-white border border-border rounded-xl p-5 space-y-3">
          <div>
            <h2 className="text-sm font-semibold">Material Recovery (grams)</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pre-filled from the device record. Adjust to actual recovered weights.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { k: 'goldG', label: 'Gold', rate: CREDIT_RATES.gold },
              { k: 'copperG', label: 'Copper', rate: CREDIT_RATES.copper },
              { k: 'aluminumG', label: 'Aluminum', rate: CREDIT_RATES.aluminum },
              { k: 'lithiumG', label: 'Lithium', rate: CREDIT_RATES.lithium },
              { k: 'cobaltG', label: 'Cobalt', rate: CREDIT_RATES.cobalt },
              { k: 'leadG', label: 'Lead', rate: CREDIT_RATES.lead },
            ].map(({ k, label, rate }) => (
              <div key={k} className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {label} <span className="text-eco-700">{rate} EC/g</span>
                </label>
                <input type="number" min="0" step="0.001"
                  value={form[k as keyof typeof form]}
                  onChange={set(k as keyof typeof form)}
                  placeholder="0"
                  className="w-full border border-border rounded-lg px-2.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors" />
              </div>
            ))}
          </div>

          {/* Live EcoCredits preview */}
          <div className="flex items-center justify-between bg-eco-50 border border-eco-200 rounded-lg px-4 py-3 mt-1">
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-eco-700" />
              <span className="text-sm font-medium text-eco-900">EcoCredits to award</span>
            </div>
            <span className="text-lg font-bold text-eco-700">{calculatedCredits}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Calculated automatically: Gold×{CREDIT_RATES.gold} + Copper×{CREDIT_RATES.copper} + Aluminum×{CREDIT_RATES.aluminum} + Lithium×{CREDIT_RATES.lithium} + Cobalt×{CREDIT_RATES.cobalt} + Lead×{CREDIT_RATES.lead}
          </p>
        </section>

        {/* Evidence upload */}
        <section className="bg-white border border-border rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold">Evidence Files</h2>
          <label className="flex items-center gap-3 border border-dashed border-border rounded-lg px-4 py-3 cursor-pointer hover:border-eco-700/40 transition-colors">
            <Upload className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-muted-foreground">
              {evidenceFiles.length > 0
                ? `${evidenceFiles.length} file(s) selected`
                : 'Upload photos, certificates or weight tickets'}
            </span>
            <input type="file" multiple accept="image/*,.pdf" className="hidden"
              onChange={e => setEvidenceFiles(Array.from(e.target.files ?? []))} />
          </label>
        </section>

        <button type="submit" disabled={loading || !facility}
          className="w-full py-3 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ background: '#0f1410', color: '#fafaf7' }}>
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Logging…</>
            : `Log Disposal & Award ${calculatedCredits} EcoCredits`}
        </button>
      </motion.form>
    </div>
  )
}
