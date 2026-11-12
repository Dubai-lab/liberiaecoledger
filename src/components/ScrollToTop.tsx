import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Scroll to the top on navigation — or to the #anchor when the URL has one (e.g. /block-explorer#ledger). */
export function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) { window.scrollTo(0, 0); return }
    const id = decodeURIComponent(hash.slice(1))
    let tries = 0
    // The target may mount a moment after the route renders
    const timer = setInterval(() => {
      const el = document.getElementById(id)
      if (el || ++tries > 20) {
        clearInterval(timer)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        else window.scrollTo(0, 0)
      }
    }, 50)
    return () => clearInterval(timer)
  }, [pathname, hash])

  return null
}
