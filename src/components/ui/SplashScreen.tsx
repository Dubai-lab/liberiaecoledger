import { motion } from 'framer-motion'
import { Recycle } from 'lucide-react'

/** Full-screen brand splash shown when the installed app (PWA) launches. */
export function SplashScreen() {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center bg-brand text-white"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      role="status"
      aria-label="Loading EcoLedger"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex flex-col items-center"
      >
        <div className="w-24 h-24 rounded-[28px] bg-white/10 ring-1 ring-white/20 flex items-center justify-center mb-6">
          <Recycle className="w-14 h-14" strokeWidth={2.25} aria-hidden="true" />
        </div>
        <p className="font-display text-[32px] font-semibold tracking-tight leading-none">EcoLedger</p>
        <p className="mt-3 text-sm text-white/70">E-waste accountability for Liberia</p>
      </motion.div>

      <div className="absolute bottom-16 flex gap-1.5" style={{ marginBottom: 'env(safe-area-inset-bottom)' }}>
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full bg-white"
            animate={{ opacity: [0.25, 1, 0.25] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  )
}

/** True when running as an installed app from the home screen. */
export function isStandalone() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}
