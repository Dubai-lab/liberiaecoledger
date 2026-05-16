import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import logoCompactLight from '@/brands/logo-compact-light.png'
import jsQR from 'jsqr'

interface ScanResult {
  deviceId: string
  brand: string
  model: string
  imei: string | null
}

export function MobileScanPage() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)
  const mountedRef = useRef(true)

  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualInput, setManualInput] = useState('')

  const stopCamera = () => {
    cancelAnimationFrame(rafRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
  }

  useEffect(() => {
    mountedRef.current = true

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        })
        if (!mountedRef.current) { stream.getTracks().forEach(t => t.stop()); return }

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
          setCameraReady(true)
        }

        const startScanLoop = () => {
          // Prefer native BarcodeDetector (faster, GPU-accelerated)
          if ('BarcodeDetector' in window) {
            const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] })
            const scan = async () => {
              if (!mountedRef.current) return
              try {
                if (videoRef.current && videoRef.current.readyState >= 2) {
                  const codes = await detector.detect(videoRef.current)
                  if (codes.length > 0 && mountedRef.current) {
                    stopCamera()
                    lookupDevice(codes[0].rawValue)
                    return
                  }
                }
              } catch { /* ignore individual frame errors */ }
              rafRef.current = requestAnimationFrame(scan)
            }
            rafRef.current = requestAnimationFrame(scan)
          } else {
            // jsQR fallback — works on all browsers including older iOS Safari
            const scan = () => {
              if (!mountedRef.current) return
              const video = videoRef.current
              const canvas = canvasRef.current
              if (video && canvas && video.readyState >= 2 && video.videoWidth > 0) {
                canvas.width = video.videoWidth
                canvas.height = video.videoHeight
                const ctx = canvas.getContext('2d')
                if (ctx) {
                  ctx.drawImage(video, 0, 0)
                  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                  const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: 'dontInvert',
                  })
                  if (code && mountedRef.current) {
                    stopCamera()
                    lookupDevice(code.data)
                    return
                  }
                }
              }
              rafRef.current = requestAnimationFrame(scan)
            }
            rafRef.current = requestAnimationFrame(scan)
          }
        }

        // Wait for video to have actual dimensions before starting scan loop
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = startScanLoop
        } else {
          startScanLoop()
        }
      } catch {
        if (!mountedRef.current) return
        setCameraError('Camera access denied. Use manual input below.')
      }
    }

    startCamera()

    return () => {
      mountedRef.current = false
      stopCamera()
    }
  }, [])

  const lookupDevice = async (query: string) => {
    const clean = query.trim()
    if (!clean) return
    setError(null)
    setResult(null)
    setSearching(true)

    const { data } = await supabase
      .from('devices')
      .select('id, brand, model, imei, serial_number')
      .or(`id.eq.${clean},imei.eq.${clean},serial_number.eq.${clean}`)
      .limit(1)

    if (!mountedRef.current) return
    setSearching(false)

    if (data && data.length > 0) {
      const d = data[0]
      setResult({ deviceId: d.id, brand: d.brand, model: d.model, imei: d.imei })
    } else {
      setError('No device found. Check the code and try again.')
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
      <div className="mx-5 rounded-2xl overflow-hidden relative bg-[#1a1a1a]" style={{ minHeight: 300 }}>
        <video
          ref={videoRef}
          playsInline
          muted
          className="w-full object-cover"
          style={{ minHeight: 300, display: cameraReady ? 'block' : 'none' }}
        />
        {/* Hidden canvas used by jsQR fallback */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Scan overlay */}
        {cameraReady && !result && (
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

        {!cameraReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs text-white/50 text-center px-6">
              {cameraError ?? 'Starting camera…'}
            </p>
          </div>
        )}
      </div>

      {/* Manual input */}
      <div className="mx-5 mt-4">
        <p className="text-[10px] tracking-widest text-[#9b9b98] uppercase mb-2">Or enter manually</p>
        <div className="flex gap-2">
          <input
            value={manualInput}
            onChange={e => setManualInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && lookupDevice(manualInput)}
            placeholder="IMEI, Serial number, or Device ID"
            className="flex-1 bg-white border border-[#e8e5de] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0f0f0e]"
          />
          <button
            type="button"
            onClick={() => lookupDevice(manualInput)}
            disabled={searching}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: '#0f0f0e' }}
          >
            {searching ? '…' : 'Search'}
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
