import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

interface ScanResult {
  deviceId: string
  brand: string
  model: string
  imei: string | null
  matchCount: number
}

export function MobileScanPage() {
  const navigate = useNavigate()
  const [result, setResult] = useState<ScanResult | null>(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let scanner: any = null

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        scanner = new Html5Qrcode('qr-reader')
        scannerRef.current = scanner
        setScanning(true)

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 180 } },
          async (decodedText: string) => {
            await scanner.stop()
            setScanning(false)
            await lookupDevice(decodedText)
          },
          () => {}
        )
      } catch {
        setScanning(false)
        setError('Camera access denied. Enter IMEI manually below.')
      }
    }

    startScanner()
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [])

  const lookupDevice = async (query: string) => {
    const clean = query.trim()
    const { data } = await supabase
      .from('devices')
      .select('id, brand, model, imei_serial')
      .or(`id.eq.${clean},imei_serial.eq.${clean}`)
      .limit(1)

    if (data && data.length > 0) {
      const d = data[0]
      setResult({ deviceId: d.id, brand: d.brand, model: d.model, imei: d.imei_serial, matchCount: 1 })
    } else {
      setResult(null)
      setError('No device found on chain for this code.')
    }
  }

  const [manualImei, setManualImei] = useState('')

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#f0ede6' }}>
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#0f0f0e] flex-shrink-0" />
        <div>
          <p className="text-base font-semibold text-[#0f0f0e]">Scan device</p>
          <p className="text-xs text-[#9b9b98]">Point at the QR or IMEI</p>
        </div>
      </div>

      {/* Camera viewfinder */}
      <div className="mx-5 rounded-2xl overflow-hidden relative" style={{ background: '#2a2a2a', minHeight: 320 }}>
        <div id="qr-reader" ref={containerRef} className="w-full" style={{ minHeight: 320 }} />

        {/* Corner brackets overlay */}
        {scanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="relative w-56 h-44">
              {/* TL */}
              <div className="absolute top-0 left-0 w-7 h-7 border-t-2 border-l-2 border-white rounded-tl-md" />
              {/* TR */}
              <div className="absolute top-0 right-0 w-7 h-7 border-t-2 border-r-2 border-white rounded-tr-md" />
              {/* BL */}
              <div className="absolute bottom-0 left-0 w-7 h-7 border-b-2 border-l-2 border-white rounded-bl-md" />
              {/* BR */}
              <div className="absolute bottom-0 right-0 w-7 h-7 border-b-2 border-r-2 border-white rounded-br-md" />
              {/* Scanning line */}
              <div className="absolute left-2 right-2 top-1/2 h-0.5 bg-[#2d6a3f] rounded-full" />
            </div>
            <p className="text-[10px] tracking-widest text-[#9b9b98] uppercase mt-6">Hold steady · Scanning…</p>
          </div>
        )}

        {!scanning && !result && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs text-[#9b9b98] text-center px-6">{error ?? 'Initialising camera…'}</p>
          </div>
        )}
      </div>

      {/* Manual IMEI input */}
      <div className="mx-5 mt-4">
        <div className="flex gap-2">
          <input
            value={manualImei}
            onChange={e => setManualImei(e.target.value)}
            placeholder="Enter IMEI or Device ID manually"
            className="flex-1 bg-white border border-[#e8e5de] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0f0f0e]"
          />
          <button
            onClick={() => manualImei.trim() && lookupDevice(manualImei)}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#0f0f0e' }}
          >
            Look up
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
              <p className="text-sm font-bold text-[#0f0f0e]">{result.brand} {result.model} — recognised</p>
              <p className="text-xs text-[#9b9b98]">
                {result.imei ? `IMEI ${result.imei.slice(0, 6)}...${result.imei.slice(-6)}` : 'ID on chain'} · {result.matchCount} match on chain
              </p>
            </div>
          </div>
          <button
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
