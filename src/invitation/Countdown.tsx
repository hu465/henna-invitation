import { useEffect, useState } from 'react'
import type { EventDetails } from '../config/event'
import { arDigits, eventStart, icsHref } from '../lib/format'

function remaining(target: number) {
  const ms = Math.max(0, target - Date.now())
  return {
    done: ms === 0,
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor(ms / 3_600_000) % 24,
    minutes: Math.floor(ms / 60_000) % 60,
    seconds: Math.floor(ms / 1000) % 60,
  }
}

const units = [
  { key: 'days', label: 'يوم' },
  { key: 'hours', label: 'ساعة' },
  { key: 'minutes', label: 'دقيقة' },
  { key: 'seconds', label: 'ثانية' },
] as const

export function Countdown({ event }: { event: EventDetails }) {
  const target = eventStart(event).getTime()
  const [left, setLeft] = useState(() => remaining(target))

  useEffect(() => {
    setLeft(remaining(target))
    const id = setInterval(() => setLeft(remaining(target)), 1000)
    return () => clearInterval(id)
  }, [target])

  if (left.done) {
    return (
      <p className="countdown-done" data-rise>
        حلّت الليلة السعيدة — أهلاً بكم
      </p>
    )
  }

  return (
    <>
      <div className="countdown" data-rise>
        {units.map((u) => (
          <div className="cd-unit" key={u.key}>
            <span className="cd-value" aria-hidden="true">
              <span key={left[u.key]} className="cd-digit">
                {arDigits(left[u.key], u.key === 'days' ? 0 : 2)}
              </span>
            </span>
            <span className="cd-label" aria-hidden="true">{u.label}</span>
          </div>
        ))}
        <p className="sr-only">
          متبقٍّ {left.days} يوم و{left.hours} ساعة و{left.minutes} دقيقة
        </p>
      </div>
      <a className="btn btn--ghost-light" href={icsHref(event)} download="henna-night.ics" data-rise>
        أضيفي الموعد إلى تقويمك
      </a>
    </>
  )
}
