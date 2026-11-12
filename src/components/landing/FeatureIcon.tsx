import {
  Search, ClipboardList, BarChart3, Bell, Link2, Globe2, Smartphone, RefreshCw,
  Recycle, Coins, Gift, Package, MapPin, FileText, Handshake, BadgeCheck, Map,
  Flag, Megaphone, Sparkles, type LucideIcon,
} from 'lucide-react'

// Content keeps its original emoji keys; the UI renders a consistent line icon instead.
const MAP: Record<string, LucideIcon> = {
  '🔍': Search,
  '📋': ClipboardList,
  '📊': BarChart3,
  '🔔': Bell,
  '⛓️': Link2,
  '🌐': Globe2,
  '📱': Smartphone,
  '🔄': RefreshCw,
  '♻️': Recycle,
  '💰': Coins,
  '🎁': Gift,
  '📦': Package,
  '📍': MapPin,
  '📄': FileText,
  '🤝': Handshake,
  '✅': BadgeCheck,
  '🗺️': Map,
  '🚩': Flag,
  '📢': Megaphone,
}

export function FeatureIcon({ emoji, dark = false }: { emoji: string; dark?: boolean }) {
  const Icon = MAP[emoji] ?? Sparkles
  return (
    <span
      className={`inline-flex items-center justify-center w-11 h-11 rounded-xl mb-4 ${
        dark ? 'bg-white/10 text-white' : 'bg-white border border-brand-line text-brand'
      }`}
    >
      <Icon className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
    </span>
  )
}
