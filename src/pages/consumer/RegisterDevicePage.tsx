import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ChevronLeft, Upload, Loader2, Download, CheckCircle, ShieldCheck, ShieldAlert, Search, Smartphone, Laptop,
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

export function RegisterDevicePage() {
  const { profile } = useAuth()
  const navigate = useNavigate()

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
          Enter your phone's IMEI or your laptop's serial number. We check it against the manufacturer registry to confirm it's a genuine device before adding it to your account.
        </p>
      </div>

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
          <section className="bg-white border border-border rounded-xl p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">2. Purchase Information</h2>
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg text-sm font-medium text-white bg-brand hover:bg-brand-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Registering…</> : `Register ${verified.brand} ${verified.model}`}
          </button>
        </motion.form>
      )}
    </div>
  )
}
