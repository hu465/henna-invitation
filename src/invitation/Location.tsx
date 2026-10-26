import { useState } from 'react'
import type { EventDetails } from '../config/event'
import { VenueEngraving } from '../art/Engravings'

// The venue as a fine engraving that draws itself, with direct links to the
// guest's navigation apps and a copyable address.

export function Location({ event }: { event: EventDetails }) {
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
      <VenueEngraving className="venue-art" />
      <p id="venue-address" className="venue-address" data-rise>{event.venueAddress}</p>
      <a className="plaque-btn" href={google} target="_blank" rel="noopener noreferrer" data-rise>
        الاتجاهات إلى القاعة
      </a>
      <div className="location-links" data-rise>
        <a href={waze} target="_blank" rel="noopener noreferrer">Waze</a>
        <span aria-hidden="true">·</span>
        <button type="button" onClick={copy}>{copied ? 'تم نسخ العنوان' : 'نسخ العنوان'}</button>
      </div>
    </div>
  )
}
