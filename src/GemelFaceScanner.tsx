import { useEffect, useMemo } from 'react'
import './GemelFaceScanner.css'

export function GemelFaceScanner() {
  const scannerSrc = useMemo(() => {
    const base = import.meta.env.BASE_URL || '/'
    const normalized = base.endsWith('/') ? base : `${base}/`
    return `${normalized}projects/gemel/scanner.html`
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const theme = saved === 'dark' ? 'dark' : 'light'
    document.body.setAttribute('data-theme', theme)
  }, [])

  return (
    <div className="gemel-page">
      <iframe className="gemel-page__frame" title="GEMEL" src={scannerSrc} />
    </div>
  )
}
