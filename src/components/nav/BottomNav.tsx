import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

export type BottomNavItem = {
  label: string
  icon: LucideIcon
  /** Route to open. Omit and pass onClick for actions such as "More". */
  to?: string
  /** Match the path exactly (for a section's home route). */
  end?: boolean
  onClick?: () => void
  /** Force the active look (e.g. "More" while the menu is open). */
  active?: boolean
}

/**
 * Phone bottom navigation: equal-width tabs, the open tab shows a filled
 * green pill behind its icon, bold label and a top indicator bar.
 */
export function BottomNav({ items, id, desktop = false }: { items: BottomNavItem[]; id: string; desktop?: boolean }) {
  return (
    <nav
      aria-label="Primary"
      className={`${desktop ? '' : 'lg:hidden '}fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-brand-line shadow-[0_-6px_20px_-12px_rgba(16,47,39,0.25)]`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="grid max-w-xl mx-auto" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map(item => (
          <li key={item.label} className="min-w-0">
            {item.to ? (
              <NavLink to={item.to} end={item.end} className="block" aria-label={item.label}>
                {({ isActive }) => <Tab item={item} active={item.active ?? isActive} id={id} />}
              </NavLink>
            ) : (
              <button type="button" onClick={item.onClick} className="block w-full" aria-label={item.label} aria-expanded={item.active}>
                <Tab item={item} active={!!item.active} id={id} />
              </button>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}

function Tab({ item, active, id }: { item: BottomNavItem; active: boolean; id: string }) {
  const Icon = item.icon
  return (
    <span className="relative flex flex-col items-center justify-center gap-1 h-16 px-1 select-none">
      {active && (
        <motion.span
          layoutId={`${id}-bar`}
          className="absolute top-0 h-[3px] w-8 rounded-b-full bg-brand"
          transition={{ type: 'spring', stiffness: 500, damping: 38 }}
        />
      )}
      <span className="relative flex items-center justify-center h-8 w-14">
        {active && (
          <motion.span
            layoutId={`${id}-pill`}
            className="absolute inset-0 rounded-full bg-brand"
            transition={{ type: 'spring', stiffness: 500, damping: 38 }}
          />
        )}
        <Icon
          className={`relative w-5 h-5 transition-colors ${active ? 'text-white' : 'text-brand-sage'}`}
          strokeWidth={active ? 2.4 : 1.9}
          aria-hidden="true"
        />
      </span>
      <span
        className={`max-w-full truncate text-[11px] leading-none transition-colors ${
          active ? 'text-brand font-semibold' : 'text-brand-muted font-medium'
        }`}
      >
        {item.label}
      </span>
    </span>
  )
}
