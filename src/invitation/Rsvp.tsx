import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import type { EventDetails } from '../config/event'
import { addRsvp, sendRsvp } from '../lib/store'
import { arDigits, gregorianDate } from '../lib/format'

type Errors = Partial<Record<'name' | 'attending', string>>

export function Rsvp({ event, guestName = '' }: { event: EventDetails; guestName?: string }) {
  const id = useId()
  const [name, setName] = useState(guestName)
  // The guest may give her name after this form has mounted (on the name step).
  useEffect(() => {
    if (guestName) setName((n) => n || guestName)
  }, [guestName])
  const [attending, setAttending] = useState<'yes' | 'no' | ''>('')
  const [guests, setGuests] = useState(1)
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [sent, setSent] = useState<null | { attending: boolean }>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)

  const validate = (): Errors => {
    const e: Errors = {}
    if (name.trim().length < 2) e.name = 'فضلاً اكتبي اسمكِ'
    if (!attending) e.attending = 'فضلاً اختاري إن كنتِ ستحضرين'
    return e
  }

  const replyText = (coming: boolean) =>
    `ليلة حنّة ${event.brideName}\nالاسم: ${name.trim()}\n${coming ? `سأحضر بإذن الله (${guests} ${guests > 1 ? 'أشخاص' : 'شخص'})` : 'أعتذر عن الحضور'}${message.trim() ? `\n${message.trim()}` : ''}`
  const waLink = (coming: boolean) => `https://wa.me/${event.hostWhatsapp}?text=${encodeURIComponent(replyText(coming))}`

  // The reply goes to the host on WhatsApp, written out for the guest to send.
  const submit = (ev: FormEvent) => {
    ev.preventDefault()
    const e = validate()
    setErrors(e)
    if (e.name) return nameRef.current?.focus()
    if (e.attending) return document.getElementById(`${id}-yes`)?.focus()
    const reply = { name: name.trim(), attending: attending === 'yes', guests: attending === 'yes' ? guests : 0, message: message.trim() }
    // Opened inside the tap so browsers allow it; fall back to this tab if blocked.
    const url = waLink(reply.attending)
    const tab = window.open(url, '_blank')
    if (tab) tab.opener = null
    else location.href = url
    addRsvp(reply)
    // Also kept in the host's replies list when the site has storage connected.
    void sendRsvp(reply)
    setSent({ attending: reply.attending })
    requestAnimationFrame(() => statusRef.current?.focus())
  }

  if (sent) {
    return (
      <div className="rsvp-card rsvp-done" ref={statusRef} tabIndex={-1} role="status">
        <svg className="rsvp-stamp" viewBox="0 0 80 80" aria-hidden="true">
          <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="40" cy="40" r="30" fill="none" stroke="currentColor" strokeWidth=".6" strokeDasharray="2 3" />
          <path className="rsvp-check" pathLength={1} d="M26 41 l9 9 l19 -21" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h3>{sent.attending ? 'شكراً لكِ، ننتظركِ بشوق' : 'شكراً لكِ، ستفتقدكِ السهرة'}</h3>
        <p>اضغطي «إرسال» في واتساب ليصلنا ردّكِ يا {name.trim()}.</p>
        <a className="btn btn--text" href={waLink(sent.attending)} target="_blank" rel="noopener noreferrer">
          لم يُفتح واتساب؟ اضغطي هنا
        </a>
        <button type="button" className="btn btn--text" onClick={() => setSent(null)}>
          تعديل الرد
        </button>
      </div>
    )
  }

  return (
    <form className="rsvp-card" onSubmit={submit} noValidate data-rise>
      {event.rsvpDeadline && (
        <p className="rsvp-deadline">نرجو التأكيد قبل {gregorianDate({ ...event, date: event.rsvpDeadline, time: '12:00' })}</p>
      )}
      {event.note && <p className="rsvp-note">{event.note}</p>}

      <div className="field">
        <label htmlFor={`${id}-name`}>الاسم</label>
        <input
          ref={nameRef}
          id={`${id}-name`}
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            // Clear the error while typing so the layout never shifts under the next tap.
            if (errors.name && e.target.value.trim().length >= 2) setErrors((p) => ({ ...p, name: undefined }))
          }}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? `${id}-name-err` : undefined}
          placeholder="مثال: ليلى أحمد"
        />
        {errors.name && <p className="field-error" id={`${id}-name-err`}>{errors.name}</p>}
      </div>

      <fieldset className="field" aria-describedby={errors.attending ? `${id}-att-err` : undefined}>
        <legend>هل ستشاركيننا الفرحة؟</legend>
        <div className="choice-row">
          <label className="choice">
            <input type="radio" id={`${id}-yes`} name="attending" value="yes" checked={attending === 'yes'} onChange={() => { setAttending('yes'); setErrors((p) => ({ ...p, attending: undefined })) }} />
            <span>سأحضر بكل سرور</span>
          </label>
          <label className="choice">
            <input type="radio" name="attending" value="no" checked={attending === 'no'} onChange={() => { setAttending('no'); setErrors((p) => ({ ...p, attending: undefined })) }} />
            <span>أعتذر عن الحضور</span>
          </label>
        </div>
        {errors.attending && <p className="field-error" id={`${id}-att-err`}>{errors.attending}</p>}
      </fieldset>

      {attending === 'yes' && (
        <div className="field">
          <span className="field-label" id={`${id}-guests-l`}>عدد الحضور</span>
          <div className="stepper" role="group" aria-labelledby={`${id}-guests-l`}>
            <button type="button" onClick={() => setGuests((g) => Math.min(10, g + 1))} aria-label="زيادة العدد">+</button>
            <output aria-live="polite">{arDigits(guests)}</output>
            <button type="button" onClick={() => setGuests((g) => Math.max(1, g - 1))} aria-label="إنقاص العدد" disabled={guests <= 1}>−</button>
          </div>
        </div>
      )}

      <div className="field">
        <label htmlFor={`${id}-msg`}>كلمة للعروس <span className="optional">(اختياري)</span></label>
        <textarea id={`${id}-msg`} rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="دعواتكِ وتهانيكِ…" />
      </div>

      <button type="submit" className="btn btn--whatsapp btn--block">
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
          <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.4-.3Z" />
        </svg>
        إرسال عبر واتساب
      </button>
    </form>
  )
}
