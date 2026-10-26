import { useState } from 'react'
import type { EventDetails } from '../config/event'

// Interactive location scene: an original illustrated map (not an embed, so it
// loads instantly over mobile data) with a pin that opens the venue card, and
// direct links to the guest's navigation apps.

export function Location({ event }: { event: EventDetails }) {
  const [open, setOpen] = useState(true)
  const [copied, setCopied] = useState(false)
  const query = encodeURIComponent(`${event.venueName} ${event.venueAddress}`)
  const google = event.mapUrl || `https://www.google.com/maps/search/?api=1&query=${query}`
  const waze = `https://waze.com/ul?q=${query}&navigate=yes`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${event.venueName} — ${event.venueAddress}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      const el = document.getElementById('venue-address')
      if (el) getSelection()?.selectAllChildren(el)
    }
  }

  return (
    <div className="location">
      <div className="map" data-rise>
        <svg className="map-art" viewBox="0 0 400 300" aria-hidden="true">
          <defs>
            <pattern id="map-grove" width="26" height="26" patternUnits="userSpaceOnUse">
              <circle cx="7" cy="8" r="2.6" fill="#66764A" opacity=".3" />
              <circle cx="19" cy="20" r="2.2" fill="#66764A" opacity=".24" />
            </pattern>
          </defs>
          <rect width="400" height="300" fill="#eef0e4" />
          <path d="M0 210 C 70 190 110 240 180 220 S 300 170 400 190 V300 H0Z" fill="url(#map-grove)" />
          <path d="M0 60 C 60 80 120 30 200 50 S 330 90 400 60 V0 H0Z" fill="url(#map-grove)" />
          <path className="map-river" d="M-10 150 C 60 130 110 175 170 160 S 280 120 410 140" fill="none" stroke="#c9d3c0" strokeWidth="12" strokeLinecap="round" />
          <g fill="none" stroke="#fffdf6" strokeLinecap="round">
            <path d="M40 300 C 70 220 120 170 200 150 S 330 110 380 0" strokeWidth="9" />
            <path d="M0 110 C 90 120 150 100 210 150 S 320 230 400 250" strokeWidth="6" />
            <path d="M120 0 C 140 80 150 120 200 150" strokeWidth="4" />
          </g>
          <g fill="none" stroke="#c6b58a" strokeLinecap="round" strokeDasharray="1 7" strokeWidth="2.4">
            <path className="map-route" d="M40 300 C 70 220 120 170 200 150" />
          </g>
          <circle className="pin-pulse anim-loop" cx="200" cy="150" r="16" fill="none" stroke="#465438" strokeWidth="1.5" />
        </svg>

        <button type="button" className="map-pin" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="venue-card" aria-label={`موقع ${event.venueName}`}>
          <svg viewBox="0 0 40 52" aria-hidden="true">
            <path d="M20 51 C 20 51 3 32 3 19 a17 17 0 0 1 34 0 c0 13-17 32-17 32z" fill="#465438" />
            <circle cx="20" cy="19" r="8" fill="#c6b58a" />
            <path d="M20 13 l2.2 4.4 4.8.6-3.5 3.3.9 4.7-4.4-2.3-4.4 2.3.9-4.7-3.5-3.3 4.8-.6z" fill="#465438" />
          </svg>
        </button>

        <div id="venue-card" className="venue-card" data-open={open}>
          <p className="venue-name">{event.venueName}</p>
          <p id="venue-address" className="venue-address">{event.venueAddress}</p>
        </div>
      </div>

      <div className="location-actions" data-rise>
        <a className="btn btn--olive" href={google} target="_blank" rel="noopener noreferrer">
          خرائط Google
        </a>
        <a className="btn btn--ghost" href={waze} target="_blank" rel="noopener noreferrer">
          Waze
        </a>
        <button type="button" className="btn btn--ghost" onClick={copy}>
          {copied ? 'تم نسخ العنوان' : 'نسخ العنوان'}
        </button>
      </div>
    </div>
  )
}
