import { useEffect, useRef, useState, type FormEvent } from 'react'
import gsap from 'gsap'
import type { EventDetails } from '../config/event'
import { WaxSealArt } from '../art/Ornaments'
import { cleanName } from '../lib/guest'
import './nameGate.css'

// Before the envelope: the guest writes her name, the invitation is prepared
// for her, and the card that opens is addressed to her.

export function NameGate({ event, onDone }: { event: EventDetails; onDone: (name: string) => void }) {
  const root = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [preparing, setPreparing] = useState('')

  useEffect(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    const ctx = gsap.context(() => {
      gsap.fromTo('[data-in]', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.09, ease: 'power3.out', delay: 0.15 })
    }, root)
    return () => ctx.revert()
  }, [])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const n = cleanName(name)
    if (n.length < 2) {
      setError('فضلاً اكتبي اسمكِ')
      return input.current?.focus()
    }
    input.current?.blur()
    setPreparing(n)
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return onDone(n)
    // The name is written in ink, held a moment, then the veil lifts off the envelope.
    gsap
      .timeline({ onComplete: () => onDone(n) })
      .fromTo(root.current!.querySelector('.gate-ink'), { clipPath: 'inset(-20% 0 -20% 100%)' }, { clipPath: 'inset(-20% 0 -20% 0%)', duration: 1.1, ease: 'power2.inOut' })
      .to({}, { duration: 0.5 })
      .to(root.current!.querySelector('.gate-card'), { y: -24, opacity: 0, duration: 0.6, ease: 'power2.in' })
      .to(root.current, { opacity: 0, duration: 0.7, ease: 'power1.inOut' }, '-=0.2')
  }

  return (
    <div ref={root} className="name-gate" role="dialog" aria-modal="true" aria-labelledby="gate-title">
      <div className="gate-card">
        <span className="gate-seal" data-in aria-hidden="true"><WaxSealArt monogram={event.monogram} /></span>
        {preparing ? (
          <div className="gate-preparing" role="status">
            <p className="gate-kicker">نُجهّز دعوتكِ الخاصة</p>
            <p className="gate-ink">{preparing}</p>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <p className="gate-kicker" data-in>أهلاً وسهلاً</p>
            <h1 id="gate-title" className="gate-title" data-in>دعوتكِ بانتظاركِ</h1>
            <p className="gate-lead" data-in>اكتبي اسمكِ لنُعدّ لكِ دعوة ليلة الحنّة باسمكِ</p>
            <div className="gate-field" data-in>
              <label htmlFor="gate-name" className="sr-only">الاسم</label>
              <input
                ref={input}
                id="gate-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (error) setError('')
                }}
                autoComplete="name"
                enterKeyHint="go"
                placeholder="اسمكِ الكريم"
                aria-invalid={!!error}
                aria-describedby={error ? 'gate-err' : undefined}
                maxLength={40}
              />
              {error && <p id="gate-err" className="gate-error">{error}</p>}
            </div>
            <button type="submit" className="gate-btn" data-in>افتحي دعوتي</button>
          </form>
        )}
      </div>
    </div>
  )
}
