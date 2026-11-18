import { useState } from 'react'
import { createPortal } from 'react-dom'
import QRCode from 'react-qr-code'
import { QrCode, X, Download, Maximize2 } from 'lucide-react'

type QrDevice = {
  id: string
  brand: string
  model: string
  qr_code?: string | null
  qr_issued_at?: string | null
}

/** Saves the rendered QR (by its SVG element id) as a labelled PNG. */
export function downloadDeviceQr(svgId: string, device: { brand: string; model: string }) {
  const svg = document.getElementById(svgId)
  if (!svg) return
  const xml = new XMLSerializer().serializeToString(svg)
  const img = new Image()
  img.onload = () => {
    const size = 1024, pad = 64
    const canvas = document.createElement('canvas')
    canvas.width = size; canvas.height = size + 120
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, pad, pad, size - pad * 2, size - pad * 2)
    ctx.fillStyle = '#102F27'; ctx.textAlign = 'center'
    ctx.font = '600 40px Poppins, Inter, sans-serif'
    ctx.fillText(`${device.brand} ${device.model}`, size / 2, size + 10)
    ctx.font = '28px Inter, sans-serif'; ctx.fillStyle = '#566D62'
    ctx.fillText('EcoLedger · Liberia', size / 2, size + 60)
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `EcoLedger-${device.brand}-${device.model}-QR.png`.replace(/\s+/g, '_')
    a.click()
  }
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml)
}

/**
 * The device's saved QR code shown inline in its record. The code is stored
 * on the device in EcoLedger, so an owner who loses their copy can always
 * view or download it again here.
 */
export function DeviceQrCard({ device, ownerName }: { device: QrDevice; ownerName?: string | null }) {
  const svgId = `qr-card-${device.id}`
  return (
    <div className="bg-white rounded-xl border border-border p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="self-center p-3 bg-white rounded-2xl border border-brand-line">
          <QRCode id={svgId} value={device.qr_code || device.id} size={168} fgColor="#083D24" bgColor="#ffffff" />
        </div>
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <p className="text-xs tracking-widest uppercase text-brand-muted">Device QR code</p>
          <p className="text-sm text-brand-ink mt-1">
            {ownerName ? <>Issued to <strong>{ownerName}</strong></> : 'Issued to the current owner'}
            {device.qr_issued_at && <> · {new Date(device.qr_issued_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</>}
          </p>
          <p className="text-xs text-muted-foreground mt-1.5">
            Saved on EcoLedger with this device. Lost your copy? Download it again here at any time.
            Anyone can scan it in EcoLedger to verify this device and its owner.
          </p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4">
            <button
              type="button"
              onClick={() => downloadDeviceQr(svgId, device)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold active:opacity-80"
            >
              <Download className="w-4 h-4" /> Download QR code
            </button>
            <DeviceQrButton device={device} ownerName={ownerName} variant="enlarge" />
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Button that opens the device's saved EcoLedger QR code (issued to its
 * current owner) in a dialog, with a PNG download.
 */
export function DeviceQrButton({ device, ownerName, variant = 'icon' }: {
  device: QrDevice
  ownerName?: string | null
  variant?: 'icon' | 'full' | 'enlarge'
}) {
  const [open, setOpen] = useState(false)
  const value = device.qr_code || device.id
  const svgId = `qr-${device.id}`

  const download = () => downloadDeviceQr(svgId, device)

  return (
    <>
      <button
        type="button"
        onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(true) }}
        aria-label={`Show QR code for ${device.brand} ${device.model}`}
        className={variant === 'icon'
          ? 'flex-shrink-0 w-9 h-9 rounded-lg border border-brand-line bg-white flex items-center justify-center text-brand hover:bg-brand-tint transition-colors'
          : 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-brand-line bg-white text-sm font-semibold text-brand hover:bg-brand-tint transition-colors'}
      >
        {variant === 'enlarge' ? <Maximize2 className="w-4 h-4" /> : <QrCode className="w-4 h-4" />}
        {variant === 'full' && 'Show QR code'}
        {variant === 'enlarge' && 'Enlarge'}
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Device QR code"
        >
          <div
            className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-6 text-center"
            style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4 text-left">
              <div className="min-w-0">
                <p className="text-xs tracking-widest uppercase text-brand-muted">Device QR code</p>
                <h3 className="text-lg font-semibold text-brand-ink truncate">{device.brand} {device.model}</h3>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="p-1.5 -mr-1.5 text-brand-muted hover:text-brand-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="inline-block p-4 bg-white rounded-2xl border border-brand-line">
              <QRCode id={svgId} value={value} size={220} fgColor="#083D24" bgColor="#ffffff" />
            </div>

            <p className="text-xs text-brand-muted mt-4">
              {ownerName ? <>Issued to <strong className="text-brand-ink">{ownerName}</strong></> : 'Issued to the current owner'}
              {device.qr_issued_at && <> · {new Date(device.qr_issued_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</>}
            </p>
            <p className="text-[11px] text-brand-sage mt-1">Scan it in EcoLedger to verify the device and its owner.</p>

            <button
              type="button"
              onClick={download}
              className="mt-5 w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-brand text-white font-semibold active:opacity-80"
            >
              <Download className="w-4 h-4" /> Download QR code
            </button>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
