import type { EventDetails } from '../config/event'

export function eventStart(e: EventDetails): Date {
  return new Date(`${e.date}T${e.time || '00:00'}:00`)
}

export function eventEnd(e: EventDetails): Date {
  const end = new Date(`${e.date}T${e.endTime || e.time}:00`)
  return end > eventStart(e) ? end : new Date(eventStart(e).getTime() + 3 * 3600_000)
}

const num = new Intl.NumberFormat('ar-EG', { useGrouping: false })

export const arDigits = (n: number, pad = 0) => {
  const s = num.format(n)
  return pad ? s.padStart(pad, '٠') : s
}

export function weekday(e: EventDetails) {
  return new Intl.DateTimeFormat('ar', { weekday: 'long' }).format(eventStart(e))
}

export function gregorianDate(e: EventDetails) {
  return new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }).format(eventStart(e))
}

export function hijriDate(e: EventDetails) {
  try {
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-arab', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(eventStart(e))
  } catch {
    return ''
  }
}

export function timeLabel(time: string) {
  const [h, m] = time.split(':').map(Number)
  const d = new Date(2000, 0, 1, h, m)
  return new Intl.DateTimeFormat('ar-EG', { hour: 'numeric', minute: '2-digit' }).format(d)
}

export function shortDate(e: EventDetails) {
  return `${weekday(e)} ${gregorianDate(e)}`
}

/** Builds an .ics calendar file so guests can save the date. */
export function icsHref(e: EventDetails) {
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//henna-invitation//AR',
    'BEGIN:VEVENT',
    `UID:${e.date}-henna@invitation`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(eventStart(e))}`,
    `DTEND:${stamp(eventEnd(e))}`,
    `SUMMARY:ليلة حنّة ${e.brideName}`,
    `LOCATION:${e.venueName} - ${e.venueAddress}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(lines.join('\r\n'))
}
