import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import logoCompactLight from '@/brands/logo-compact-light.png'

interface ScanResult {
  deviceId: string
  brand: string
  model: string
  imei: string | null
}

export function MobileScanPage() {
  const navigate = useNavigate()
  const [result, setResult] = useState<ScanResult | null>(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualImei, setManualImei] = useState('')
  const scannerRef = useRef<any>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    let scanner: any = null

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        if (!mountedRef.current) return
        scanner = new Html5Qrcode('qr-reader')
        scannerRef.current = scanner
        setScanning(true)

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 180 } },
          async (decodedText: string) => {
            try { await scanner.stop() } catch { /* ignore */ }
            if (!mountedRef.current) return
            setScanning(false)
            lookupDevice(decodedText)
          },
          () => {}
        )
      } catch {
        if (!mountedRef.current) return
        setScanning(false)
        setError('Camera access denied. Enter IMEI or Device ID below.')
      }
    }

    startScanner()

    return () => {
      mountedRef.current = false
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
        scannerRef.current = null
      }
    }
  }, [])

  const lookupDevice = async (query: string) => {
    const clean = query.trim()
    if (!clean) return
    setError(null)
    setResult(null)

    const { data } = await supabase
      .from('devices')
      .select('id, brand, model, imei, serial_number')
      .or(`id.eq.${clean},imei.eq.${clean},serial_number.eq.${clean}`)
      .limit(1)

    if (!mountedRef.current) return

    if (data && data.length > 0) {
      const d = data[0]
      setResult({ deviceId: d.id, brand: d.brand, model: d.model, imei: d.imei })
    } else {
      setError('No device found for this code. Check the QR or IMEI and try again.')
    }
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#f0ede6' }}>
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <img src={logoCompactLight} alt="EcoLedger" className="h-8 w-auto object-contain" />
        <p className="text-xs text-[#9b9b98]">Scan device</p>
      </div>

      {/* Camera viewfinder */}
      <div className="mx-5 rounded-2xl overflow-hidden relative" style={{ background: '#1a1a1a', minHeight: 300 }}>
        <div id="qr-reader" className="w-full" style={{ minHeight: 300 }} />

        {scanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="relative w-56 h-44">
              <div className="absolute top-0 left-0 w-7 h-7 border-t-2 border-l-2 border-white rounded-tl-md" />
              <div className="absolute top-0 right-0 w-7 h-7 border-t-2 border-r-2 border-white rounded-tr-md" />
              <div className="absolute bottom-0 left-0 w-7 h-7 border-b-2 border-l-2 border-white rounded-bl-md" />
              <div className="absolute bottom-0 right-0 w-7 h-7 border-b-2 border-r-2 border-white rounded-br-md" />
              <div className="absolute left-2 right-2 top-1/2 h-0.5 bg-[#2d6a3f] rounded-full" />
            </div>
            <p className="text-[10px] tracking-widest text-white/60 uppercase mt-6">Hold steady · Scanning…</p>
          </div>
        )}

        {!scanning && !result && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs text-white/50 text-center px-6">{error ?? 'Starting camera…'}</p>
          </div>
        )}
      </div>

      {/* Manual input */}
      <div className="mx-5 mt-4">
        <p className="text-[10px] tracking-widest text-[#9b9b98] uppercase mb-2">Or enter manually</p>
        <div className="flex gap-2">
          <input
            value={manualImei}
            onChange={e => setManualImei(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && lookupDevice(manualImei)}
            placeholder="IMEI, Serial number, or Device ID"
            className="flex-1 bg-white border border-[#e8e5de] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0f0f0e]"
          />
          <button
            type="button"
            onClick={() => lookupDevice(manualImei)}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#0f0f0e' }}
          >
            Search
          </button>
        </div>
        {error && <p className="text-xs text-red-500 mt-2 px-1">{error}</p>}
      </div>

      {/* Result card */}
      {result && (
        <div className="mx-5 mt-4 bg-white rounded-2xl p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-[#2d6a3f] flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="white" strokeWidth={2.5}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-[#0f0f0e]">{result.brand} {result.model}</p>
              <p className="text-xs text-[#9b9b98]">
                {result.imei ? `IMEI ${result.imei.slice(0, 6)}…${result.imei.slice(-4)}` : 'Device found on chain'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/mobile/device/${result.deviceId}`)}
            className="w-full py-3.5 rounded-xl text-white text-sm font-bold"
            style={{ background: '#0f0f0e' }}
          >
            Open device record
          </button>
        </div>
      )}
    </div>
  )
}
