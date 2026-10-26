import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import type { EventDetails } from '../config/event'
import { WaxSealArt } from '../art/Ornaments'
import { TatreezBand } from '../art/Levant'

/** The link the QR code opens: the configured invitation URL, or this page. */
export function inviteLink(event: EventDetails) {
  return event.inviteUrl || `${location.origin}${location.pathname}`
}

// High error correction leaves room for the small wax-seal emblem in the centre.
const options = { errorCorrectionLevel: 'H' as const, margin: 1, color: { dark: '#2f3a25', light: '#faf9f4' } }

/** Olive-and-ivory QR code with the bride's seal at its centre, generated locally. */
export function InviteQr({ event, className = '' }: { event: EventDetails; className?: string }) {
  const url = inviteLink(event)
  const [svg, setSvg] = useState('')

  useEffect(() => {
    QRCode.toString(url, { ...options, type: 'svg' }).then(setSvg, () => setSvg(''))
  }, [url])

  return (
    <figure className={`qr-card ${className}`}>
      <TatreezBand className="qr-band" stitchSize={1.6} />
      <div className="qr-code" role="img" aria-label="رمز QR لفتح الدعوة">
        {/* SVG markup comes from the local QR encoder, not from user input. */}
        <div className="qr-svg" dangerouslySetInnerHTML={{ __html: svg }} />
        <span className="qr-seal" aria-hidden="true">
          <WaxSealArt monogram={event.monogram} />
        </span>
      </div>
      <figcaption>امسحي الرمز لفتح الدعوة</figcaption>
    </figure>
  )
}

/** Copy, share and (where downloads are allowed) save the QR code. */
export function QrActions({ event, download = false }: { event: EventDetails; download?: boolean }) {
  const url = inviteLink(event)
  const [copied, setCopied] = useState(false)
  const canShare = typeof navigator !== 'undefined' && !!navigator.share

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      // Clipboard refused: select the link so it can be copied by hand.
      const el = document.getElementById('invite-link')
      if (el) getSelection()?.selectAllChildren(el)
    }
  }

  const save = async () => {
    const data = await QRCode.toDataURL(url, { ...options, width: 1024 })
    const a = Object.assign(document.createElement('a'), { href: data, download: 'henna-invitation-qr.png' })
    a.click()
  }

  return (
    <div className="qr-actions">
      <p id="invite-link" className="qr-link" dir="ltr">{url}</p>
      <div className="qr-buttons">
        <button type="button" className="btn btn--olive" onClick={copy}>
          {copied ? 'تم نسخ الرابط' : 'نسخ رابط الدعوة'}
        </button>
        {canShare && (
          <button type="button" className="btn btn--ghost" onClick={() => navigator.share({ title: `ليلة حنّة ${event.brideName}`, url }).catch(() => {})}>
            مشاركة
          </button>
        )}
        {download && (
          <button type="button" className="btn btn--ghost" onClick={save}>
            تنزيل رمز QR
          </button>
        )}
      </div>
    </div>
  )
}
