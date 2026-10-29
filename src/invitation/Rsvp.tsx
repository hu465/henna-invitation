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
  const [sending, setSending] = useState(false)
  const [failed, setFailed] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)

  const validate = (): Errors => {
    const e: Errors = {}
    if (name.trim().length < 2) e.name = 'فضلاً اكتبي اسمكِ'
    if (!attending) e.attending = 'فضلاً اختاري إن كنتِ ستحضرين'
    return e
  }

  const submit = async (ev: FormEvent) => {
    ev.preventDefault()
    if (sending) return
    const e = validate()
    setErrors(e)
    if (e.name) return nameRef.current?.focus()
    if (e.attending) return document.getElementById(`${id}-yes`)?.focus()
    const reply = { name: name.trim(), attending: attending === 'yes', guests: attending === 'yes' ? guests : 0, message: message.trim() }
    setSending(true)
    setFailed('')
    const problem = await sendRsvp(reply)
    setSending(false)
    if (problem) {
      setFailed(problem)
      return
    }
    addRsvp(reply)
    setSent({ attending: reply.attending })
    requestAnimationFrame(() => statusRef.current?.focus())
  }

  const replyText = (coming: boolean) =>
    `ليلة حنّة ${event.brideName}\nالاسم: ${name.trim()}\n${coming ? `سأحضر بإذن الله (${guests} ${guests > 1 ? 'أشخاص' : 'شخص'})` : 'أعتذر عن الحضور'}${message.trim() ? `\n${message.trim()}` : ''}`
  const waText = sent ? replyText(sent.attending) : ''

  if (sent) {
    return (
      <div className="rsvp-card rsvp-done" ref={statusRef} tabIndex={-1} role="status">
        <svg className="rsvp-stamp" viewBox="0 0 80 80" aria-hidden="true">
          <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="40" cy="40" r="30" fill="none" stroke="currentColor" strokeWidth=".6" strokeDasharray="2 3" />
          <path className="rsvp-check" pathLength={1} d="M26 41 l9 9 l19 -21" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h3>{sent.attending ? 'وصلنا ردّكِ، ننتظركِ بشوق' : 'وصلنا ردّكِ، ستفتقدكِ السهرة'}</h3>
        <p>شكراً {name.trim()} — وصل ردّكِ إلى صاحبة الدعوة.</p>
        {event.hostWhatsapp && (
          <a className="btn btn--olive" href={`https://wa.me/${event.hostWhatsapp}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noopener noreferrer">
            أرسلي الرد لصاحبة الدعوة عبر واتساب
          </a>
        )}
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

      {failed && (
        <div className="rsvp-failed" role="alert">
          <p className="field-error">
            تعذّر حفظ الرد{event.hostWhatsapp ? '، أرسليه لنا عبر واتساب بضغطة واحدة' : '، حاولي مرة أخرى'}.
            <span className="rsvp-code" dir="ltr"> ({failed})</span>
          </p>
          {event.hostWhatsapp && (
            <a className="btn btn--olive btn--block" href={`https://wa.me/${event.hostWhatsapp}?text=${encodeURIComponent(replyText(attending === 'yes'))}`} target="_blank" rel="noopener noreferrer">
              إرسال الرد عبر واتساب
            </a>
          )}
        </div>
      )}
      <button type="submit" className="btn btn--champagne btn--block" disabled={sending} aria-busy={sending}>
        {sending ? 'جارٍ الإرسال…' : 'إرسال الرد'}
      </button>
    </form>
  )
}
