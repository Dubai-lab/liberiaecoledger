import { Recycle } from 'lucide-react'

interface Props {
  /** 'light' = green mark on light backgrounds, 'dark' = white mark on dark green */
  tone?: 'light' | 'dark'
  className?: string
}

export function EcoLedgerLogo({ tone = 'light', className = '' }: Props) {
  const color = tone === 'light' ? 'text-brand' : 'text-white'
  return (
    <span className={`inline-flex items-center gap-2 ${color} ${className}`}>
      <Recycle className="w-7 h-7 flex-shrink-0" strokeWidth={2.25} aria-hidden="true" />
      <span className="font-display text-[22px] font-semibold tracking-tight leading-none">EcoLedger</span>
    </span>
  )
}
