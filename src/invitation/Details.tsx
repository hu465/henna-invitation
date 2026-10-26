import type { ReactNode } from 'react'
import type { EventDetails } from '../config/event'
import { gregorianDate, hijriDate, timeLabel, weekday } from '../lib/format'

const Icon = ({ children }: { children: ReactNode }) => (
  <svg className="detail-icon" viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
)

export function Details({ event }: { event: EventDetails }) {
  const hijri = hijriDate(event)
  return (
    <div className="details">
      <article className="detail" data-rise>
        <Icon>
          <rect x="5" y="7" width="22" height="20" rx="2" />
          <path d="M5 13 H27 M11 4 V9 M21 4 V9" />
          <path d="M16 17 c 1.5 -2 4 -1 3 1 c -0.6 1.3 -3 3 -3 3 s -2.4 -1.7 -3 -3 c -1 -2 1.5 -3 3 -1z" />
        </Icon>
        <h3>الموعد</h3>
        <p className="detail-main">{weekday(event)}</p>
        <p>{gregorianDate(event)}</p>
        {hijri && <p className="detail-soft">{hijri}</p>}
        <p className="detail-time">
          من {timeLabel(event.time)} حتى {timeLabel(event.endTime)}
        </p>
      </article>

      <article className="detail" data-rise>
        <Icon>
          <path d="M16 28 s -9 -8.5 -9 -15 a 9 9 0 0 1 18 0 c 0 6.5 -9 15 -9 15z" />
          <circle cx="16" cy="13" r="3.2" />
        </Icon>
        <h3>المكان</h3>
        <p className="detail-main">{event.venueName}</p>
        <p>{event.venueAddress}</p>
        <a className="btn btn--olive" href={event.mapUrl} target="_blank" rel="noopener noreferrer">
          افتحي الموقع على الخريطة
        </a>
      </article>

      <article className="detail" data-rise>
        <Icon>
          <path d="M16 5 c -3 4 -3 7 0 9 c 3 -2 3 -5 0 -9z" />
          <path d="M16 14 V27 M16 20 c -4 0 -7 -2 -8 -5 c 4 0 7 2 8 5z M16 22 c 4 0 7 -2 8 -5 c -4 0 -7 2 -8 5z" />
        </Icon>
        <h3>اللباس</h3>
        <p className="detail-main">{event.dressCode}</p>
        {event.note && <p className="detail-soft">{event.note}</p>}
      </article>
    </div>
  )
}
