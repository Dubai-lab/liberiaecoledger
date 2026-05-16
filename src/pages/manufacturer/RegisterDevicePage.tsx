import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, ChevronDown, Upload, Download, CheckCircle } from 'lucide-react'
import QRCode from 'react-qr-code'
import { supabase } from '@/lib/supabase'
import { uploadToIPFS } from '@/lib/pinata'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import type { HazardClass } from '@/types/database'

function downloadQR(deviceId: string, label: string) {
  const svg = document.getElementById('device-qr-svg')
  if (!svg) return
  const serialized = new XMLSerializer().serializeToString(svg)
  const canvas = document.createElement('canvas')
  canvas.width = 300; canvas.height = 340
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 300, 340)
  const img = new Image()
  img.onload = () => {
    ctx.drawImage(img, 25, 20, 250, 250)
    ctx.fillStyle = '#0f0f0e'; ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center'
    ctx.fillText(label, 150, 295)
    ctx.font = '10px monospace'; ctx.fillStyle = '#9b9b98'
    ctx.fillText(deviceId.slice(0, 8) + '…', 150, 315)
    const a = document.createElement('a')
    a.download = `ecoledger-${deviceId.slice(0, 8)}.png`
    a.href = canvas.toDataURL('image/png'); a.click()
  }
  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(serialized)))
}

const CATEGORIES = ['Laptop', 'Smartphone', 'Tablet', 'Desktop Computer', 'Printer', 'Television', 'Monitor', 'Server', 'Networking Equipment', 'Other']

const HAZARD_OPTIONS: { value: HazardClass; label: string }[] = [
  { value: 'none',          label: 'None' },
  { value: 'li_ion_battery', label: 'Lithium-Ion Battery' },
  { value: 'mercury_ccfl',  label: 'Mercury / CCFL Backlight' },
  { value: 'toner',         label: 'Toner Cartridge' },
  { value: 'mixed',         label: 'Mixed Hazardous Materials' },
]

interface MaterialField { key: string; label: string; unit: string }
const MATERIALS: MaterialField[] = [
  { key: 'material_gold_g',     label: 'Gold',     unit: 'g' },
  { key: 'material_copper_g',   label: 'Copper',   unit: 'g' },
  { key: 'material_aluminum_g', label: 'Aluminum', unit: 'g' },
  { key: 'material_lithium_g',  label: 'Lithium',  unit: 'g' },
  { key: 'material_cobalt_g',   label: 'Cobalt',   unit: 'g' },
  { key: 'material_lead_g',     label: 'Lead',     unit: 'g' },
]

export function RegisterDevicePage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [registeredDevice, setRegisteredDevice] = useState<{ id: string; brand: string; model: string } | null>(null)

  const [form, setForm] = useState({
    brand: '',
    model: '',
    category: '',
    manufacture_year: new Date().getFullYear().toString(),
    serial_number: '',
    imei: '',
    hazard_class: 'none' as HazardClass,
    retailer_name: '',
    purchase_price_lrd: '',
    material_gold_g: '0',
    material_copper_g: '0',
    material_aluminum_g: '0',
    material_lithium_g: '0',
    material_cobalt_g: '0',
    material_lead_g: '0',
  })

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  const isValid = form.brand.trim() && form.model.trim() && form.category

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || !profile) return
    setLoading(true)

    try {
      let receipt_url: string | null = null
      let receipt_ipfs_hash: string | null = null

      if (receiptFile) {
        const result = await uploadToIPFS(receiptFile, {
          name: `receipt-${form.brand.trim()}-${form.model.trim()}-${Date.now()}`,
          keyvalues: { manufacturer: profile.id, brand: form.brand.trim(), model: form.model.trim() },
        })
        receipt_url = result.url
        receipt_ipfs_hash = result.ipfsHash
      }

      const { data: device, error } = await supabase.from('devices').insert({
        brand: form.brand.trim(),
        model: form.model.trim(),
        category: form.category,
        manufacture_year: parseInt(form.manufacture_year) || null,
        serial_number: form.serial_number.trim() || null,
        imei: form.imei.trim() || null,
        hazard_class: form.hazard_class,
        retailer_name: form.retailer_name.trim() || null,
        purchase_price_lrd: form.purchase_price_lrd ? parseFloat(form.purchase_price_lrd) : null,
        current_owner_id: profile.id,
        original_owner_id: profile.id,
        status: 'in_use',
        receipt_url,
        receipt_ipfs_hash,
        co2_kg_avoided: 0,
        material_gold_g: parseFloat(form.material_gold_g) || 0,
        material_copper_g: parseFloat(form.material_copper_g) || 0,
        material_aluminum_g: parseFloat(form.material_aluminum_g) || 0,
        material_lithium_g: parseFloat(form.material_lithium_g) || 0,
        material_cobalt_g: parseFloat(form.material_cobalt_g) || 0,
        material_lead_g: parseFloat(form.material_lead_g) || 0,
      }).select('id').single()

      if (error) throw error

      // Write the registration event to the immutable lifecycle log
      await supabase.from('device_lifecycle').insert({
        device_id: device.id,
        event_type: 'registered',
        actor_id: profile.id,
        actor_name: profile.full_name ?? profile.organization ?? 'Manufacturer',
        location: profile.city ? `${profile.city}, Liberia` : 'Liberia',
        metadata: {
          brand: form.brand.trim(),
          model: form.model.trim(),
          category: form.category,
          hazard_class: form.hazard_class,
        },
      })

      toast.success('Device registered successfully.')
      setRegisteredDevice({ id: device.id, brand: form.brand.trim(), model: form.model.trim() })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (registeredDevice) {
    return (
      <div className="p-6 max-w-md mx-auto text-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
          <div className="flex flex-col items-center gap-2">
            <CheckCircle className="w-10 h-10 text-eco-700" />
            <h1 className="text-2xl font-semibold">Device Registered</h1>
            <p className="text-sm text-muted-foreground">
              {registeredDevice.brand} {registeredDevice.model} is now on the EcoLedger chain.
            </p>
          </div>
          <div className="bg-white border border-border rounded-2xl p-6 flex flex-col items-center gap-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Device QR Code</p>
            <div className="p-3 bg-white rounded-xl border border-border">
              <QRCode id="device-qr-svg" value={registeredDevice.id} size={200} fgColor="#0f0f0e" bgColor="#ffffff" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">{registeredDevice.brand} {registeredDevice.model}</p>
              <p className="text-xs font-mono text-muted-foreground mt-0.5">{registeredDevice.id.slice(0, 8)}…</p>
            </div>
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              Print this label and attach it to the device before shipping. Anyone can scan it to verify authenticity and view the full lifecycle record.
            </p>
            <button
              type="button"
              onClick={() => downloadQR(registeredDevice.id, `${registeredDevice.brand} ${registeredDevice.model}`)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              <Download className="w-4 h-4" />
              Download QR Label
            </button>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setRegisteredDevice(null)}
              className="flex-1 py-3 rounded-lg text-sm font-medium border border-border hover:bg-muted transition-colors"
            >
              Register Another
            </button>
            <button
              type="button"
              onClick={() => navigate('/manufacturer/catalogue')}
              className="flex-1 py-3 rounded-lg text-sm font-medium text-white"
              style={{ background: '#0f1410' }}
            >
              View Catalogue
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <p className="text-xs text-muted-foreground tracking-widest uppercase mb-0.5">Manufacturer</p>
      <h1 className="text-2xl font-semibold mb-1">Register Device</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Enter the details for a device you manufacture or import into Liberia. Each registered device receives a unique tracking record on the ledger.
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic info */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-border p-6 space-y-5">
          <h2 className="text-sm font-semibold">Device Information</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium tracking-widest uppercase text-muted-foreground">Brand *</label>
              <input
                type="text"
                value={form.brand}
                onChange={set('brand')}
                placeholder="e.g. Samsung"
                required
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium tracking-widest uppercase text-muted-foreground">Model *</label>
              <input
                type="text"
                value={form.model}
                onChange={set('model')}
                placeholder="e.g. Galaxy A54"
                required
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium tracking-widest uppercase text-muted-foreground">Category *</label>
              <div className="relative">
                <select
                  value={form.category}
                  onChange={set('category')}
                  required
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors appearance-none"
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium tracking-widest uppercase text-muted-foreground">Manufacture Year</label>
              <input
                type="number"
                value={form.manufacture_year}
                onChange={set('manufacture_year')}
                min="1990"
                max={new Date().getFullYear()}
                placeholder={String(new Date().getFullYear())}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium tracking-widest uppercase text-muted-foreground">Serial Number</label>
              <input
                type="text"
                value={form.serial_number}
                onChange={set('serial_number')}
                placeholder="e.g. SN-1234567890"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium tracking-widest uppercase text-muted-foreground">IMEI (phones only)</label>
              <input
                type="text"
                value={form.imei}
                onChange={set('imei')}
                placeholder="15-digit IMEI"
                maxLength={15}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors"
              />
            </div>
          </div>
        </motion.div>

        {/* Compliance */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-xl border border-border p-6 space-y-5">
          <div>
            <h2 className="text-sm font-semibold">Hazard & Compliance</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Required for EPA e-waste classification</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium tracking-widest uppercase text-muted-foreground">Hazard Class</label>
            <div className="relative">
              <select
                value={form.hazard_class}
                onChange={set('hazard_class')}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors appearance-none"
              >
                {HAZARD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium tracking-widest uppercase text-muted-foreground">Retailer Name</label>
              <input
                type="text"
                value={form.retailer_name}
                onChange={set('retailer_name')}
                placeholder="e.g. Monrovia Electronics Ltd"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium tracking-widest uppercase text-muted-foreground">Price (LRD)</label>
              <input
                type="number"
                value={form.purchase_price_lrd}
                onChange={set('purchase_price_lrd')}
                placeholder="0"
                min="0"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors"
              />
            </div>
          </div>
        </motion.div>

        {/* Material composition */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl border border-border p-6 space-y-5">
          <div>
            <h2 className="text-sm font-semibold">Material Composition</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Estimated recoverable material per unit (grams). Used to calculate EcoCredits at disposal.</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {MATERIALS.map(m => (
              <div key={m.key} className="space-y-1.5">
                <label className="text-xs font-medium tracking-widest uppercase text-muted-foreground">{m.label} ({m.unit})</label>
                <input
                  type="number"
                  value={form[m.key as keyof typeof form]}
                  onChange={set(m.key as keyof typeof form)}
                  min="0"
                  step="0.01"
                  placeholder="0"
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors"
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Receipt / evidence upload */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-xl border border-border p-6 space-y-3">
          <div>
            <h2 className="text-sm font-semibold">Supporting Evidence</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Upload a purchase receipt, import document, or compliance certificate. Stored permanently on IPFS.</p>
          </div>
          <label className="flex items-center gap-3 border border-dashed border-border rounded-lg px-4 py-3 cursor-pointer hover:border-eco-700/40 transition-colors">
            <Upload className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-muted-foreground">
              {receiptFile ? receiptFile.name : 'Upload image or PDF (optional)'}
            </span>
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={e => setReceiptFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </motion.div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/manufacturer')}
            className="flex-1 py-3 rounded-lg text-sm font-medium border border-border bg-white hover:bg-muted/30 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !isValid}
            className="flex-1 py-3 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ background: '#0f1410', color: '#fafaf7' }}
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Registering…</> : 'Register Device'}
          </button>
        </div>
      </form>
    </div>
  )
}
