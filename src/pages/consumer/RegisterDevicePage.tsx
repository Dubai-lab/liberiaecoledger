import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ChevronLeft, Upload, Loader2, Download, CheckCircle, ShieldCheck, ShieldAlert, Search, Smartphone, Laptop, Tv,
} from 'lucide-react'
import QRCode from 'react-qr-code'
import { supabase } from '@/lib/supabase'
import { uploadToIPFS } from '@/lib/pinata'
import { relayTx, EXPLORER } from '@/lib/contracts'
import { isValidImei } from '@/lib/rates'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import type { ImeiVerifyStatus } from '@/types/database'

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
    ctx.fillStyle = '#102F27'
    ctx.font = 'bold 13px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(label, 150, 295)
    ctx.font = '10px monospace'
    ctx.fillStyle = '#566D62'
    ctx.fillText(deviceId.slice(0, 8) + '…', 150, 315)
    const a = document.createElement('a')
    a.download = `ecoledger-${deviceId.slice(0, 8)}.png`
    a.href = canvas.toDataURL('image/png')
    a.click()
  }
  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(serialized)))
}

interface VerifiedDevice {
  status: ImeiVerifyStatus
  brand: string | null
  model: string | null
  category: string | null
  manufacture_year: number | null
  manufacturer: string | null
}

const STATUS_MESSAGE: Record<Exclude<ImeiVerifyStatus, 'available'>, string> = {
  invalid:            'That is not a valid IMEI. Check the 15-digit number (dial *#06# on a phone).',
  not_found:          'This device is not in the manufacturer registry. Only devices registered by a manufacturer can be added to EcoLedger.',
  ambiguous:          'Several laptops share this serial number. Enter the laptop IMEI instead, or contact the manufacturer.',
  already_registered: 'This device has already been registered by another owner. Ask the current owner to transfer it to you.',
  owned_by_you:       'This device is already registered to your account.',
}

const inputCls =
  'w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors'

// Everything except phones and laptops (those come from the manufacturer registry).
// Must match the list accepted by register_consumer_device() in 20261115_consumer_general_ewaste.sql.
const OTHER_CATEGORIES = [
  'Tablet', 'Desktop Computer', 'Television', 'Refrigerator', 'Washing Machine', 'Air Conditioner', 'Microwave',
  'Printer', 'Monitor', 'Audio Equipment', 'Gaming Console', 'Camera', 'Power Tool', 'Battery / Power Bank',
  'Networking Equipment', 'Other',
]

export function RegisterDevicePage() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  // Phones & laptops come from the manufacturer registry; all other e-waste is registered by its owner
  const [mode, setMode] = useState<'registry' | 'other'>('registry')
  const [other, setOther] = useState({ category: '', brand: '', model: '', serial_number: '', manufacture_year: '', hazard_class: 'none' })
  const setO = (k: keyof typeof other) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setOther(o => ({ ...o, [k]: e.target.value }))
  const otherValid = !!(other.category && other.brand.trim() && other.model.trim())

  const [imei, setImei] = useState('') // IMEI, or a laptop serial number
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState<VerifiedDevice | null>(null)

  const [loading, setLoading] = useState(false)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [purchase, setPurchase] = useState({ purchase_date: '', purchase_price_lrd: '', retailer_name: '' })
  const [registeredDevice, setRegisteredDevice] = useState<{ id: string; brand: string; model: string; credits: number } | null>(null)

  const looksNumeric = /^[\d\s-]+$/.test(imei.trim())
  const digits = imei.replace(/\D/g, '')
  // Phones: 15-digit IMEI with a valid check digit. Laptops: IMEI or serial number (4+ characters).
  const imeiValid = looksNumeric ? isValidImei(digits) : imei.trim().length >= 4
  const setP = (k: keyof typeof purchase) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setPurchase(p => ({ ...p, [k]: e.target.value }))

  const uploadReceipt = async (label: string) => {
    if (!receiptFile || !profile) return { receipt_url: null as string | null, receipt_ipfs_hash: null as string | null }
    const result = await uploadToIPFS(receiptFile, {
      name: `receipt-${label}-${Date.now()}`,
      keyvalues: { owner: profile.id, device: label },
    })
    return { receipt_url: result.url, receipt_ipfs_hash: result.ipfsHash }
  }

  const handleRegisterOther = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile || !otherValid) return
    setLoading(true)
    try {
      const { receipt_url, receipt_ipfs_hash } = await uploadReceipt(`${other.brand}-${other.model}`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('register_consumer_device', {
        p_category:           other.category,
        p_brand:              other.brand.trim(),
        p_model:              other.model.trim(),
        p_serial_number:      other.serial_number.trim() || null,
        p_manufacture_year:   other.manufacture_year ? Number(other.manufacture_year) : null,
        p_hazard_class:       other.hazard_class,
        p_purchase_date:      purchase.purchase_date || null,
        p_purchase_price_lrd: purchase.purchase_price_lrd ? Number(purchase.purchase_price_lrd) : null,
        p_retailer_name:      purchase.retailer_name.trim() || null,
        p_receipt_url:        receipt_url,
        p_receipt_ipfs_hash:  receipt_ipfs_hash,
      })
      if (error) {
        if (/register_consumer_device/i.test(error.message)) {
          throw new Error('Registering other electronics is not enabled yet — the database update (20261115 migration) still needs to be applied.')
        }
        throw error
      }
      const row = (Array.isArray(data) ? data[0] : data) as { device_id: string; credits: number }
      toast.success(row.credits > 0 ? `Device registered — ${row.credits} EcoCredits earned!` : 'Device registered successfully!')
      setRegisteredDevice({ id: row.device_id, brand: other.brand.trim(), model: other.model.trim(), credits: row.credits })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imeiValid) return
    setVerifying(true)
    setVerified(null)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('verify_device', { p_identifier: imei.trim() })
      if (error) throw error
      const row = (Array.isArray(data) ? data[0] : data) as VerifiedDevice | undefined
      setVerified(row ?? { status: 'not_found', brand: null, model: null, category: null, manufacture_year: null, manufacturer: null })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not verify this IMEI')
    } finally {
      setVerifying(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile || verified?.status !== 'available') return
    setLoading(true)

    try {
      let receipt_url: string | null = null
      let receipt_ipfs_hash: string | null = null
      if (receiptFile) {
        const result = await uploadToIPFS(receiptFile, {
          name: `receipt-${verified.brand}-${verified.model}-${Date.now()}`,
          keyvalues: { owner: profile.id, brand: verified.brand ?? '', model: verified.model ?? '' },
        })
        receipt_url = result.url
        receipt_ipfs_hash = result.ipfsHash
      }

      // Verifies the IMEI again, transfers ownership from the manufacturer,
      // writes the 'registered' ledger event and awards EcoCredits — atomically.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('claim_device', {
        p_identifier:         imei.trim(),
        p_purchase_date:      purchase.purchase_date || null,
        p_purchase_price_lrd: purchase.purchase_price_lrd ? Number(purchase.purchase_price_lrd) : null,
        p_retailer_name:      purchase.retailer_name.trim() || null,
        p_receipt_url:        receipt_url,
        p_receipt_ipfs_hash:  receipt_ipfs_hash,
      })
      if (error) throw error
      const claimed = (Array.isArray(data) ? data[0] : data) as { device_id: string; brand: string; model: string; credits: number }

      toast.success(claimed.credits > 0
        ? `Device registered — ${claimed.credits} EcoCredits earned!`
        : 'Device registered successfully!')
      setRegisteredDevice({ id: claimed.device_id, brand: claimed.brand, model: claimed.model, credits: claimed.credits })

      // Anchor on-chain via relay (non-fatal — DB record already saved)
      if (profile.wallet_address) {
        toast.loading('Anchoring to Sepolia blockchain…', { id: 'relay' })
        const result = await relayTx({ action: 'register', deviceId: claimed.device_id, userWallet: profile.wallet_address })
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
            <CheckCircle className="w-10 h-10 text-brand" />
            <h1 className="text-2xl font-semibold">Device Registered</h1>
            <p className="text-sm text-muted-foreground">
              {registeredDevice.brand} {registeredDevice.model} is now registered to you on the EcoLedger chain.
            </p>
          </div>

          <div className="bg-white border border-border rounded-2xl p-6 flex flex-col items-center gap-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Device QR Code</p>
            <div className="p-3 bg-white rounded-xl border border-border">
              <QRCode id="device-qr-svg" value={registeredDevice.id} size={200} fgColor="#102F27" bgColor="#ffffff" />
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
            className="w-full py-3 rounded-lg text-sm font-medium text-white bg-brand hover:bg-brand-secondary transition-colors"
          >
            Done — Go to My Devices
          </button>
        </motion.div>
      </div>
    )
  }

  const available = verified?.status === 'available'
  const CategoryIcon = verified?.category === 'Laptop' ? Laptop : Smartphone

  const purchaseSection = (step: number) => (
    <section className="bg-white border border-border rounded-xl p-5 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{step}. Purchase Information</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Optional, but helps prove ownership if there's ever a dispute.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Purchase Date</label>
          <input type="date" max={new Date().toISOString().slice(0, 10)} value={purchase.purchase_date} onChange={setP('purchase_date')} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Purchase Price (LRD)</label>
          <input type="number" min="0" value={purchase.purchase_price_lrd} onChange={setP('purchase_price_lrd')} placeholder="e.g. 25000" className={inputCls} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Retailer / Seller Name</label>
        <input value={purchase.retailer_name} onChange={setP('retailer_name')} placeholder="Where did you buy it?" className={inputCls} />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Receipt / Proof of Purchase</label>
        <label className="flex items-center gap-3 border border-dashed border-border rounded-lg px-4 py-3 cursor-pointer hover:border-brand/40 transition-colors">
          <Upload className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm text-muted-foreground flex-1">
            {receiptFile ? receiptFile.name : 'Upload image or PDF (optional)'}
          </span>
          <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => setReceiptFile(e.target.files?.[0] ?? null)} />
        </label>
      </div>
    </section>
  )

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
          Register any electronic device you own — from phones and laptops to TVs, fridges and printers — so it can be tracked and recycled responsibly.
        </p>
      </div>

      {/* What kind of device? */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5" role="radiogroup" aria-label="Device type">
        {([
          ['registry', 'Phone or laptop', 'Verified against the manufacturer registry by IMEI or serial number', Smartphone],
          ['other', 'Other electronics', 'TV, fridge, printer, tablet, appliance… registered directly by you', Tv],
        ] as const).map(([key, title, desc, Icon]) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={mode === key}
            onClick={() => setMode(key)}
            className={`flex items-start gap-3 text-left rounded-xl border p-4 transition-colors ${
              mode === key ? 'border-brand bg-brand-tint ring-1 ring-brand' : 'border-border bg-white hover:border-brand/40'
            }`}
          >
            <span className={`flex-shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg ${mode === key ? 'bg-brand text-white' : 'bg-muted text-muted-foreground'}`}>
              <Icon className="w-4 h-4" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-foreground">{title}</span>
              <span className="block text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</span>
            </span>
          </button>
        ))}
      </div>

      {mode === 'other' ? (
        <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleRegisterOther} className="space-y-5">
          <section className="bg-white border border-border rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">1. Device Details</h2>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Category *</label>
              <select required value={other.category} onChange={setO('category')} className={inputCls}>
                <option value="">Select category…</option>
                {OTHER_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Brand *</label>
                <input required maxLength={80} value={other.brand} onChange={setO('brand')} placeholder="Samsung, LG, HP…" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Model *</label>
                <input required maxLength={120} value={other.model} onChange={setO('model')} placeholder='e.g. 43" Smart TV' className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Serial Number</label>
                <input value={other.serial_number} onChange={setO('serial_number')} placeholder="Optional" className={`${inputCls} font-mono`} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Manufacture Year</label>
                <input type="number" min="1950" max={new Date().getFullYear()} value={other.manufacture_year} onChange={setO('manufacture_year')} placeholder="Optional" className={inputCls} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Hazardous material</label>
              <select value={other.hazard_class} onChange={setO('hazard_class')} className={inputCls}>
                <option value="none">None / Unknown</option>
                <option value="li_ion_battery">Li-Ion Battery</option>
                <option value="toner">Toner (printers)</option>
                <option value="mercury_ccfl">Mercury / CCFL (older displays)</option>
                <option value="mixed">Mixed hazardous materials</option>
              </select>
              <p className="text-[11px] text-muted-foreground">Helps the recycler handle the device safely. Fridges and air conditioners also contain refrigerant — choose "Mixed".</p>
            </div>
          </section>

          {purchaseSection(2)}

          <button
            type="submit"
            disabled={loading || !otherValid}
            className="w-full py-3 rounded-lg text-sm font-medium text-white bg-brand hover:bg-brand-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Registering…</> : otherValid ? `Register ${other.brand.trim()} ${other.model.trim()}` : 'Choose a category and enter brand and model'}
          </button>
        </motion.form>
      ) : (<>
      {/* Step 1 — verify IMEI */}
      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleVerify}
        className="bg-white border border-border rounded-xl p-5 space-y-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">1. Verify your device</h2>
          <span className="text-[11px] text-muted-foreground">Phones: dial *#06# for the IMEI · Laptops: serial on the label or box</span>
        </div>
        <div className="flex gap-3">
          <input
            autoComplete="off"
            spellCheck={false}
            value={imei}
            onChange={e => { setImei(e.target.value.slice(0, 40)); setVerified(null) }}
            placeholder="15-digit IMEI or laptop serial number"
            aria-label="IMEI or serial number"
            className={`${inputCls} font-mono tracking-wider flex-1`}
          />
          <button
            type="submit"
            disabled={!imeiValid || verifying}
            className="flex items-center gap-2 px-5 rounded-lg text-sm font-medium text-white bg-brand hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Verify
          </button>
        </div>
        {looksNumeric && digits.length === 15 && !imeiValid && (
          <p className="text-xs text-red-600">This IMEI's check digit is invalid — please re-check the number.</p>
        )}
        {looksNumeric && digits.length > 0 && digits.length < 15 && (
          <p className="text-xs text-muted-foreground">{15 - digits.length} more digit{15 - digits.length === 1 ? '' : 's'} for an IMEI</p>
        )}

        {verified && (
          available ? (
            <div className="flex items-start gap-3 rounded-lg border border-brand/30 bg-brand-tint p-4">
              <ShieldCheck className="w-5 h-5 text-brand flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-brand">Genuine device verified</p>
                <div className="flex items-center gap-2 mt-2">
                  <CategoryIcon className="w-4 h-4 text-brand-muted" />
                  <p className="text-sm font-medium text-foreground">{verified.brand} {verified.model}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {verified.category}{verified.manufacture_year ? ` · ${verified.manufacture_year}` : ''}
                  {verified.manufacturer ? ` · Registered by ${verified.manufacturer}` : ''}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700">
                  {verified.status === 'owned_by_you' ? 'Already yours' : 'Cannot register this device'}
                </p>
                <p className="text-xs text-red-700/90 mt-1 leading-relaxed">{STATUS_MESSAGE[verified.status as Exclude<ImeiVerifyStatus, 'available'>]}</p>
                {verified.brand && (
                  <p className="text-xs text-red-700/70 mt-1">{verified.brand} {verified.model}</p>
                )}
              </div>
            </div>
          )
        )}
      </motion.form>

      {/* Step 2 — purchase details + register */}
      {available && (
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleRegister}
          className="space-y-5 mt-5"
        >
          {purchaseSection(2)}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg text-sm font-medium text-white bg-brand hover:bg-brand-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Registering…</> : `Register ${verified.brand} ${verified.model}`}
          </button>
        </motion.form>
      )}
      </>)}
    </div>
  )
}
