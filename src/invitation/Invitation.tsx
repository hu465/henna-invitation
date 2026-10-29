import { forwardRef, useEffect, useRef, useState, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { programme, type EventDetails } from '../config/event'
import { WaxSealArt, Divider } from '../art/Ornaments'
import { Baked, CornerBouquet, Rosette, Sprig } from '../art/Relief'
import { ThobeEngraving } from '../art/Engravings'
import { Drift } from '../art/Drift'
import { SoundToggle } from '../audio/SoundToggle'
import { useViewport } from '../lib/useViewport'
import { InvitationFace, CARD_PAPER } from './InvitationFace'
import { Countdown } from './Countdown'
import { Location } from './Location'
import { Rsvp } from './Rsvp'
import { InviteQr, QrActions } from './InviteQr'
import { gregorianDate, hijriDate, timeLabel, weekday } from '../lib/format'
import './invitation.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

interface Props {
  event: EventDetails
  /** The guest this invitation is addressed to ('' when unknown). */
  guestName: string
  /** True once the envelope has handed over; scroll scenes start then. */
  ready: boolean
  /** Plays the envelope opening again from the start. */
  onReplay: () => void
  /** Forgets the guest's name and asks again. */
  onChangeGuest: () => void
}

/** A full-bleed satin surface (turbulence + lighting), baked once and stretched to cover. */
function Satin({ color, priority = 6 }: { color: string; priority?: number }) {
  const { w, h } = useViewport()
  const sw = Math.round(Math.min(w, 900))
  const sh = Math.round(Math.min(h, 1000))
  return (
    <div className="satin" style={{ backgroundColor: color }}>
      <Baked w={sw} h={sh} priority={priority}>
        <rect width={sw} height={sh} fill={color} filter="url(#satin)" />
      </Baked>
    </div>
  )
}

/** Two relief bouquets across the top corners of a paper scene. */
function TopCorners({ w, size }: { w: number; size: number }) {
  return (
    <Baked className="scene-corners" w={w} h={size}>
      <g transform={`translate(${w - size} 0)`}><CornerBouquet size={size} fill={CARD_PAPER} seed={21} /></g>
      <g transform={`translate(${size} 0) scale(-1 1)`}><CornerBouquet size={size} fill={CARD_PAPER} seed={27} /></g>
    </Baked>
  )
}

/** Oval cameo with a ring of pearls, embossed into satin. */
function Cameo({ children }: { children: ReactNode }) {
  const pearls = Array.from({ length: 34 }, (_, i) => {
    const a = (i / 34) * Math.PI * 2
    return { x: 130 + Math.cos(a) * 118, y: 170 + Math.sin(a) * 158 }
  })
  return (
    <div className="cameo">
      <svg className="cameo-art" viewBox="0 0 260 340" aria-hidden="true">
        <defs>
          <radialGradient id="pearl" cx="0.35" cy="0.3" r="0.75">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.5" stopColor="#f1ecdc" />
            <stop offset="1" stopColor="#c6b58a" />
          </radialGradient>
        </defs>
        <ellipse cx="130" cy="170" rx="128" ry="168" fill="#e3e6d6" filter="url(#emboss-deep)" />
        <ellipse cx="130" cy="170" rx="104" ry="142" fill={CARD_PAPER} filter="url(#deboss)" />
        {pearls.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="5.2" fill="url(#pearl)" filter="url(#emboss)" />
        ))}
      </svg>
      <div className="cameo-body">{children}</div>
    </div>
  )
}

export const Invitation = forwardRef<HTMLElement, Props>(function Invitation({ event, guestName, ready, onReplay, onChangeGuest }, heroRef) {
  const main = useRef<HTMLElement>(null)
  const [pillHidden, setPillHidden] = useState(true)
  const { w } = useViewport()
  const cornerSize = Math.min(w * 0.42, 260)
  const hijri = hijriDate(event)

  // Ambient loops run only in scenes that are on screen.
  useEffect(() => {
    const scenes = main.current?.querySelectorAll('section, footer') ?? []
    const io = new IntersectionObserver((entries) => entries.forEach((e) => e.target.classList.toggle('is-offscreen', !e.isIntersecting)))
    scenes.forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [])

  // The RSVP shortcut is hidden over the hero and from the RSVP scene onwards.
  useEffect(() => {
    if (!ready) return
    const hiders = ['.hero', '#rsvp', '.closing'].map((s) => document.querySelector(s)).filter((el): el is Element => !!el)
    const seen = new Map<Element, boolean>()
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => seen.set(e.target, e.isIntersecting))
      setPillHidden(hiders.some((el) => seen.get(el)))
    }, { threshold: 0.05 })
    hiders.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [ready])

  // Scene 4: scroll choreography. Text rises in reading order, engravings draw
  // themselves, drapes part and pearls settle into place.
  useGSAP(
    () => {
      if (!ready) return
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.utils.toArray<HTMLElement>('[data-scene]').forEach((scene) => {
          const tl = gsap.timeline({ scrollTrigger: { trigger: scene, start: 'top 72%' } })
          // Explicit end values: buttons carry a CSS transform transition that would
          // otherwise be read back as their resting position.
          tl.fromTo(scene.querySelectorAll('[data-rise]'), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out' })
          const wipes = scene.querySelectorAll('[data-wipe]')
          if (wipes.length)
            tl.fromTo(wipes, { clipPath: 'inset(-25% 0% -25% 100%)' }, { clipPath: 'inset(-25% 0% -25% 0%)', duration: 1.1, stagger: 0.15, ease: 'power3.inOut', clearProps: 'clipPath' }, 0)
          const engrave = scene.querySelectorAll('.engrave')
          if (engrave.length) tl.fromTo(engrave, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 2.2, stagger: 0.03, ease: 'power1.inOut' }, 0.1)
          const stitches = scene.querySelectorAll('.stitch')
          if (stitches.length) tl.from(stitches, { opacity: 0, duration: 0.8, stagger: 0.2 }, 1.2)
          scene.querySelectorAll('.divider .draw').forEach((d) => tl.fromTo(d, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut' }, 0.2))
        })

        // Pearls catch the light one after another around the cameo.
        gsap.from('.cameo-art circle', { scale: 0, transformOrigin: '50% 50%', stagger: 0.025, duration: 0.4, ease: 'back.out(2)', scrollTrigger: { trigger: '.cameo', start: 'top 75%' } })
        // Gentle parallax on relief corners and the cameo.
        gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
          const depth = Number(el.dataset.parallax)
          gsap.fromTo(el, { yPercent: -depth }, { yPercent: depth, ease: 'none', scrollTrigger: { trigger: el.closest('section, footer'), start: 'top bottom', end: 'bottom top', scrub: 0.6 } })
        })
        // The card recedes slightly as the guest scrolls on.
        gsap.to('.hero .face', { scale: 0.94, opacity: 0.35, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
      })
      ScrollTrigger.refresh()
    },
    { scope: main, dependencies: [ready] },
  )

  return (
    <main ref={main} className="invitation" id="invitation">
      {/* ── The card inside the envelope ── */}
      <section ref={heroRef} className="hero" aria-label="الدعوة">
        <div className="hero-bed" aria-hidden="true"><Satin color="#47542f" priority={2} /></div>
        <InvitationFace event={event} guestName={guestName} />
        <div className="hero-petals" aria-hidden="true"><Drift kind="petal" count={8} seed={21} /></div>
        <a className="scroll-cue" href="#date">
          <span>تفاصيل الدعوة</span>
          <svg viewBox="0 0 24 36" aria-hidden="true">
            <rect x="1" y="1" width="22" height="34" rx="11" fill="none" stroke="currentColor" />
            <circle className="cue-dot" cx="12" cy="10" r="2.6" fill="currentColor" />
          </svg>
        </a>
      </section>

      {/* ── The date: a pearl cameo with the countdown beneath ── */}
      <section id="date" className="scene scene--satin scene--date" data-scene aria-labelledby="cameo-title">
        <Satin color="#b7c19f" />
        <div className="cameo-wrap" data-parallax="6">
          <Cameo>
            <span className="cameo-seal"><WaxSealArt monogram={event.monogram} /></span>
            <h2 id="cameo-title" className="cameo-name">ليلة الحنّة</h2>
            <p className="cameo-date">{weekday(event)}</p>
            <p className="cameo-date">{gregorianDate(event)}</p>
            {hijri && <p className="cameo-hijri">{hijri}</p>}
          </Cameo>
        </div>
        <div className="cd-plaque" data-rise>
          <Countdown event={event} />
        </div>
      </section>

      {/* ── Everything a guest needs, on one embossed card ── */}
      <section id="details" className="scene scene--paper scene--details" data-scene aria-labelledby="details-title">
        <div className="scene-top" data-parallax="8"><TopCorners w={w} size={cornerSize} /></div>
        <div className="scene-inner">
          <p className="eyebrow" data-rise>تفاصيل الليلة</p>
          <h2 id="details-title" className="scene-title script" data-wipe>أهلاً بكم</h2>
          <article className="details-card" data-rise>
            <div className="dc-block">
              <p className="dc-label">المكان</p>
              <h3 className="dc-title">{event.venueName}</h3>
              <Location event={event} />
            </div>
            <div className="dc-block">
              <p className="dc-label">البرنامج</p>
              <ol className="timeline">
                {programme.map((item) => (
                  <li key={item.time + item.title}>
                    <span className="tl-time">{timeLabel(item.time)}</span>
                    <span className="tl-dot" aria-hidden="true" />
                    <span className="tl-text">
                      <span className="tl-title">{item.title}</span>
                      {item.note && <span className="tl-note">{item.note}</span>}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="dc-block dc-dress">
              <ThobeEngraving className="dc-thobe" />
              <div>
                <p className="dc-label">اللباس</p>
                <h3 className="dc-title dc-title--script">{event.dressCode}</h3>
                {event.dressNote && <p className="dc-note">{event.dressNote}</p>}
              </div>
            </div>
            {event.note && <p className="dc-notice">{event.note}</p>}
            <span className="dc-seal" aria-hidden="true"><WaxSealArt monogram={event.monogram} /></span>
          </article>
        </div>
      </section>

      {/* ── RSVP on satin ── */}
      <section id="rsvp" className="scene scene--satin scene--rsvp" data-scene aria-labelledby="rsvp-title">
        <Satin color="#47542f" />
        <div className="scene-inner">
          <p className="eyebrow eyebrow--light" data-rise>تأكيد الحضور</p>
          <h2 id="rsvp-title" className="scene-title scene-title--light" data-wipe>يسعدنا أن نعرف بحضوركِ</h2>
          <Rsvp event={event} guestName={guestName} />
        </div>
      </section>

      {/* ── Closing, with the QR code for passing the invitation on ── */}
      <footer id="share" className="closing" data-scene aria-label="ختام الدعوة">
        <svg className="closing-relief" viewBox="0 0 400 160" aria-hidden="true">
          <Sprig length={170} leaves={10} seed={3} fill={CARD_PAPER} transform="translate(200 120) rotate(-160)" />
          <Sprig length={170} leaves={10} seed={8} fill={CARD_PAPER} transform="translate(200 120) rotate(-20)" />
          <Rosette r={34} x={200} y={110} fill={CARD_PAPER} seed={5} />
        </svg>
        {guestName && <p className="closing-names" data-rise>الغالية {guestName}</p>}
        <p className="closing-line" data-wipe>{guestName ? 'بانتظاركِ بكل الحب' : 'بانتظاركم بكل الحب'}</p>
        <Divider className="closing-divider" />
        <div className="share-layout" data-rise>
          <InviteQr event={event} className="qr-card--compact" />
          <QrActions event={event} />
        </div>
        <button type="button" className="btn btn--text replay" onClick={onReplay}>
          إعادة فتح الدعوة
        </button>
        {guestName && (
          <button type="button" className="btn btn--text not-you" onClick={onChangeGuest}>
            لستِ {guestName}؟ غيّري الاسم
          </button>
        )}
      </footer>

      {ready && (
        <>
          <div className="page-controls">
            <SoundToggle url={event.musicUrl} className="page-sound" />
            {/* Always within reach: go back to the closed envelope and play the opening again. */}
            <button type="button" className="page-replay" onClick={onReplay} aria-label="العودة إلى الافتتاحية وفتح الدعوة من جديد">
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
                <rect x="3" y="6" width="18" height="13" rx="1.5" />
                <path d="M3.5 7 L12 13.5 L20.5 7" />
                <circle cx="12" cy="13.5" r="2.2" fill="currentColor" stroke="none" />
              </svg>
              <span>الافتتاحية</span>
            </button>
          </div>
          <a className="rsvp-pill" href="#rsvp" data-hidden={pillHidden} tabIndex={pillHidden ? -1 : undefined} aria-hidden={pillHidden || undefined}>
            تأكيد الحضور
          </a>
        </>
      )}
    </main>
  )
})
