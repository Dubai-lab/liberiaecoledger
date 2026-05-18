import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, Upload, Loader2, ExternalLink, Download, CheckCircle } from 'lucide-react'
import QRCode from 'react-qr-code'
import { supabase } from '@/lib/supabase'
import { uploadToIPFS } from '@/lib/pinata'
import { relayTx, EXPLORER } from '@/lib/contracts'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

const CATEGORIES = ['Smartphone', 'Laptop', 'Desktop', 'Tablet', 'Television', 'Refrigerator', 'Printer', 'Monitor', 'Other']

function downloadQR(deviceId: string, label: string) {
  const svg = document.getElementById('device-qr-svg')
  if (!svg) return
  const serialized = new XMLSerializer().serializeToString(svg)
  const canvas = document.createElement('canvas')
  canvas.width = 300
  canvas.height = 340
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 300, 340)
  const img = new Image()
  img.onload = () => {
    ctx.drawImage(img, 25, 20, 250, 250)
    ctx.fillStyle = '#0f0f0e'
    ctx.font = 'bold 13px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(label, 150, 295)
    ctx.font = '10px monospace'
    ctx.fillStyle = '#9b9b98'
    ctx.fillText(deviceId.slice(0, 8) + '…', 150, 315)
    const a = document.createElement('a')
    a.download = `ecoledger-${deviceId.slice(0, 8)}.png`
    a.href = canvas.toDataURL('image/png')
    a.click()
  }
  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(serialized)))
}

export function RegisterDevicePage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [ipfsUrl, setIpfsUrl] = useState<string | null>(null)
  const [registeredDevice, setRegisteredDevice] = useState<{ id: string; brand: string; model: string } | null>(null)

  const [form, setForm] = useState({
    brand: '',
    model: '',
    category: '',
    serial_number: '',
    imei: '',
    manufacture_year: '',
    purchase_price_lrd: '',
    retailer_name: '',
    hazard_class: 'none' as const,
  })

  const set = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setLoading(true)

    try {
      let receipt_url: string | null = null
      let receipt_ipfs_hash: string | null = null

      if (receiptFile) {
        const result = await uploadToIPFS(receiptFile, {
          name: `receipt-${form.brand}-${form.model}-${Date.now()}`,
          keyvalues: { owner: profile.id, brand: form.brand, model: form.model },
        })
        receipt_url = result.url
        receipt_ipfs_hash = result.ipfsHash
      }

      const { data: device, error } = await supabase.from('devices').insert({
        brand: form.brand,
        model: form.model,
        category: form.category,
        serial_number: form.serial_number || null,
        imei: form.imei || null,
        manufacture_year: form.manufacture_year ? Number(form.manufacture_year) : null,
        purchase_price_lrd: form.purchase_price_lrd ? Number(form.purchase_price_lrd) : null,
        retailer_name: form.retailer_name || null,
        hazard_class: form.hazard_class,
        current_owner_id: profile.id,
        original_owner_id: profile.id,
        status: 'in_use',
        receipt_url,
        receipt_ipfs_hash,
        co2_kg_avoided: 0,
        material_gold_g: 0,
        material_copper_g: 0,
        material_aluminum_g: 0,
        material_lithium_g: 0,
        material_cobalt_g: 0,
        material_lead_g: 0,
      }).select('id').single()

      if (error) throw error

      // Write the registration event to the immutable lifecycle log
      const { error: lifecycleError } = await supabase.from('device_lifecycle').insert({
        device_id: device.id,
        event_type: 'registered',
        actor_id: profile.id,
        actor_name: profile.full_name ?? profile.email ?? 'Consumer',
        location: profile.city ? `${profile.city}, Liberia` : 'Liberia',
        metadata: {
          brand: form.brand,
          model: form.model,
          category: form.category,
          serial_number: form.serial_number || null,
        },
      })
      if (lifecycleError) console.error('[RegisterDevice] device_lifecycle insert failed:', lifecycleError)

      if (receipt_url) setIpfsUrl(receipt_url)

      // Award 10 EcoCredits in Supabase
      const { error: creditError } = await supabase.from('eco_credits').insert({
        user_id: profile.id,
        amount: 10,
        type: 'earned',
        source: 'registration',
        device_id: device.id,
        description: `Registered ${form.brand} ${form.model} on EcoLedger`,
      })

      if (creditError) {
        console.error('[RegisterDevice] eco_credits insert failed:', creditError)
        toast.success('Device registered successfully!')
        toast.error(`EcoCredits could not be awarded: ${creditError.message}`)
      } else {
        toast.success('Device registered — 10 EcoCredits earned!')
      }
      setRegisteredDevice({ id: device.id, brand: form.brand, model: form.model })

      // Anchor on-chain via relay (non-fatal — DB record already saved)
      if (profile.wallet_address) {
        toast.loading('Anchoring to Sepolia blockchain…', { id: 'relay' })
        const result = await relayTx({
          action: 'register',
          deviceId: device.id,
          userWallet: profile.wallet_address,
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
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Registration failed')
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

          {/* QR Code */}
          <div className="bg-white border border-border rounded-2xl p-6 flex flex-col items-center gap-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Device QR Code</p>
            <div className="p-3 bg-white rounded-xl border border-border">
              <QRCode
                id="device-qr-svg"
                value={registeredDevice.id}
                size={200}
                fgColor="#0f0f0e"
                bgColor="#ffffff"
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">{registeredDevice.brand} {registeredDevice.model}</p>
              <p className="text-xs font-mono text-muted-foreground mt-0.5">{registeredDevice.id.slice(0, 8)}…</p>
            </div>
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              Save or print this code and keep it with your device. Anyone can scan it to view the device record.
            </p>
            <button
              type="button"
              onClick={() => downloadQR(registeredDevice.id, `${registeredDevice.brand} ${registeredDevice.model}`)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              <Download className="w-4 h-4" />
              Download QR Code
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigate('/consumer')}
            className="w-full py-3 rounded-lg text-sm font-medium text-white"
            style={{ background: '#0f1410' }}
          >
            Done — Go to My Devices
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button
        type="button"
        onClick={() => navigate('/consumer')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        My Devices
      </button>

      <div className="mb-6">
        <p className="text-xs text-muted-foreground tracking-widest uppercase mb-0.5">Consumer</p>
        <h1 className="text-2xl font-semibold">Register a Device</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Adding your device creates an immutable record on the EcoLedger chain.
        </p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {/* Device identity */}
        <section className="bg-white border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Device Identity</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Brand *</label>
              <input
                required
                value={form.brand}
                onChange={set('brand')}
                placeholder="Samsung, Apple, HP…"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Model *</label>
              <input
                required
                value={form.model}
                onChange={set('model')}
                placeholder="Galaxy S22, iPhone 14…"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Category *</label>
            <select
              required
              value={form.category}
              onChange={set('category')}
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors"
            >
              <option value="">Select category…</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className={`grid gap-4 ${['Smartphone', 'Tablet'].includes(form.category) ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Serial Number</label>
              <input
                value={form.serial_number}
                onChange={set('serial_number')}
                placeholder="Optional"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors font-mono"
              />
            </div>
            {['Smartphone', 'Tablet'].includes(form.category) && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">IMEI</label>
                <input
                  value={form.imei}
                  onChange={set('imei')}
                  placeholder="15-digit IMEI number"
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors font-mono"
                />
              </div>
            )}
          </div>
        </section>

        {/* Purchase info */}
        <section className="bg-white border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Purchase Information</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Manufacture Year</label>
              <input
                type="number"
                min="1990"
                max={new Date().getFullYear()}
                value={form.manufacture_year}
                onChange={set('manufacture_year')}
                placeholder={String(new Date().getFullYear())}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Purchase Price (LRD)</label>
              <input
                type="number"
                min="0"
                value={form.purchase_price_lrd}
                onChange={set('purchase_price_lrd')}
                placeholder="e.g. 25000"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Retailer / Seller Name</label>
            <input
              value={form.retailer_name}
              onChange={set('retailer_name')}
              placeholder="Where did you buy it?"
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors"
            />
          </div>

          {/* Receipt upload */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Receipt / Proof of Purchase</label>
            <label className="flex items-center gap-3 border border-dashed border-border rounded-lg px-4 py-3 cursor-pointer hover:border-eco-700/40 transition-colors">
              <Upload className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-muted-foreground flex-1">
                {receiptFile ? receiptFile.name : 'Upload image or PDF (optional)'}
              </span>
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={e => { setReceiptFile(e.target.files?.[0] ?? null); setIpfsUrl(null) }}
              />
            </label>
            {ipfsUrl && (
              <a
                href={ipfsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-eco-700 hover:underline mt-1"
              >
                <ExternalLink className="w-3 h-3" />
                Stored on IPFS
              </a>
            )}
          </div>
        </section>

        {/* Hazard class */}
        <section className="bg-white border border-border rounded-xl p-5 space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Hazard Classification</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Select the primary hazardous material in this device.</p>
          </div>
          <select
            value={form.hazard_class}
            onChange={set('hazard_class')}
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors"
          >
            <option value="none">None / Unknown</option>
            <option value="li_ion_battery">Li-Ion Battery</option>
            <option value="toner">Toner (printers)</option>
            <option value="mercury_ccfl">Mercury / CCFL (displays)</option>
            <option value="mixed">Mixed hazardous materials</option>
          </select>
        </section>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ background: '#0f1410', color: '#fafaf7' }}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Registering…
            </>
          ) : (
            'Register Device'
          )}
        </button>
      </motion.form>
    </div>
  )
}
