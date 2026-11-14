import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { Camera, CameraOff } from 'lucide-react'

/**
 * Live camera QR scanner. Uses the native BarcodeDetector when available
 * (Android Chrome), otherwise decodes frames with jsQR (iOS Safari etc.).
 * Calls onScan once per detection, then pauses until `active` toggles again.
 */
export function QrScanner({ active, onScan }: { active: boolean; onScan: (code: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const onScanRef = useRef(onScan)
  onScanRef.current = onScan
  const [state, setState] = useState<'starting' | 'live' | 'denied' | 'unsupported'>('starting')

  useEffect(() => {
    if (!active) return
    let stream: MediaStream | null = null
    let raf = 0
    let stopped = false

    const stop = () => {
      stopped = true
      cancelAnimationFrame(raf)
      stream?.getTracks().forEach(t => t.stop())
      if (videoRef.current) videoRef.current.srcObject = null
    }

    const found = (code: string) => {
      if (stopped || !code) return
      if (navigator.vibrate) navigator.vibrate(60)
      stop()
      onScanRef.current(code)
    }

    ;(async () => {
      if (!navigator.mediaDevices?.getUserMedia) { setState('unsupported'); return }
      setState('starting')
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })
      } catch {
        if (!stopped) setState('denied')
        return
      }
      if (stopped) { stream.getTracks().forEach(t => t.stop()); return }

      const video = videoRef.current!
      video.srcObject = stream
      video.setAttribute('playsinline', 'true')
      await video.play().catch(() => {})
      setState('live')

      const Detector = (window as unknown as { BarcodeDetector?: new (o: object) => { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector
      const detector = Detector ? new Detector({ formats: ['qr_code'] }) : null

      const tick = async () => {
        if (stopped) return
        try {
          if (video.readyState >= 2 && video.videoWidth > 0) {
            if (detector) {
              const codes = await detector.detect(video)
              if (codes[0]?.rawValue) return found(codes[0].rawValue)
            } else {
              const canvas = canvasRef.current!
              // Decode a downscaled frame — much faster on phones
              const scale = Math.min(1, 720 / video.videoWidth)
              canvas.width = Math.round(video.videoWidth * scale)
              canvas.height = Math.round(video.videoHeight * scale)
              const ctx = canvas.getContext('2d', { willReadFrequently: true })
              if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
                const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' })
                if (code?.data) return found(code.data)
              }
            }
          }
        } catch { /* skip a bad frame */ }
        raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    })()

    return stop
  }, [active])

  return (
    <div className="relative w-full aspect-square sm:aspect-video max-h-[60vh] rounded-2xl overflow-hidden bg-brand-deep">
      <video ref={videoRef} muted playsInline className={`absolute inset-0 w-full h-full object-cover ${state === 'live' ? '' : 'opacity-0'}`} />
      <canvas ref={canvasRef} className="hidden" />

      {state === 'live' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="relative w-[62%] aspect-square max-w-[260px]">
            {['top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-xl', 'top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-xl',
              'bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-xl', 'bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-xl',
            ].map(c => <span key={c} className={`absolute w-9 h-9 border-white ${c}`} />)}
            <span className="absolute inset-x-3 h-0.5 bg-white/90 rounded-full shadow-[0_0_12px_rgba(255,255,255,0.8)] animate-[scanline_2.2s_ease-in-out_infinite]" />
          </div>
          <p className="mt-5 text-[11px] tracking-widest uppercase text-white/80">Point at the device QR code</p>
        </div>
      )}

      {state !== 'live' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 text-white/80">
          {state === 'starting' ? <Camera className="w-8 h-8 mb-3 animate-pulse" /> : <CameraOff className="w-8 h-8 mb-3" />}
          <p className="text-sm">
            {state === 'starting' && 'Starting camera…'}
            {state === 'denied' && 'Camera access was blocked. Allow camera access for this site in your browser settings, or enter the code below.'}
            {state === 'unsupported' && 'This browser cannot open the camera. Enter the IMEI, serial number or device ID below.'}
          </p>
        </div>
      )}
    </div>
  )
}
