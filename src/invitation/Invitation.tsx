import { forwardRef, useEffect, useRef, useState, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { programme, type EventDetails } from '../config/event'
import { WaxSealArt, Divider } from '../art/Ornaments'
import { Baked, BevelStroke, CornerBouquet, Rosette, Sprig } from '../art/Relief'
import { Drape, ThobeEngraving, Valance } from '../art/Engravings'
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
  /** True once the envelope has handed over; scroll scenes start then. */
  ready: boolean
  /** Plays the envelope opening again from the start. */
  onReplay: () => void
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

export const Invitation = forwardRef<HTMLElement, Props>(function Invitation({ event, ready, onReplay }, heroRef) {
  const main = useRef<HTMLElement>(null)
  const [pillHidden, setPillHidden] = useState(true)
  const { w, h } = useViewport()
  const cornerSize = Math.min(w * 0.42, 260)
  const drapeW = Math.min(w * (w < 600 ? 0.17 : 0.24), 210)
  const drapeH = Math.min(h * 0.9, 760)
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
    const hiders = ['.hero', '#rsvp', '#share', '.closing'].map((s) => document.querySelector(s)).filter((el): el is Element => !!el)
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
          tl.from(scene.querySelectorAll('[data-rise]'), { opacity: 0, y: 26, duration: 0.9, stagger: 0.1, ease: 'power3.out' })
          const wipes = scene.querySelectorAll('[data-wipe]')
          if (wipes.length)
            tl.fromTo(wipes, { clipPath: 'inset(-25% 0% -25% 100%)' }, { clipPath: 'inset(-25% 0% -25% 0%)', duration: 1.1, stagger: 0.15, ease: 'power3.inOut', clearProps: 'clipPath' }, 0)
          const engrave = scene.querySelectorAll('.engrave')
          if (engrave.length) tl.fromTo(engrave, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 2.2, stagger: 0.03, ease: 'power1.inOut' }, 0.1)
          const stitches = scene.querySelectorAll('.stitch')
          if (stitches.length) tl.from(stitches, { opacity: 0, duration: 0.8, stagger: 0.2 }, 1.2)
          scene.querySelectorAll('.divider .draw').forEach((d) => tl.fromTo(d, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut' }, 0.2))
        })

        // The programme's curtains draw open as it arrives.
        const stage = { trigger: '#programme', start: 'top bottom', end: 'top 25%', scrub: 0.6 }
        gsap.from('.drape--start', { xPercent: 30, ease: 'none', scrollTrigger: stage })
        gsap.from('.drape--end', { xPercent: -30, ease: 'none', scrollTrigger: stage })
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
        <InvitationFace event={event} />
        <div className="hero-petals" aria-hidden="true"><Drift kind="petal" count={8} seed={21} /></div>
        <a className="scroll-cue" href="#countdown">
          <span>تفاصيل الدعوة</span>
          <svg viewBox="0 0 24 36" aria-hidden="true">
            <rect x="1" y="1" width="22" height="34" rx="11" fill="none" stroke="currentColor" />
            <circle className="cue-dot" cx="12" cy="10" r="2.6" fill="currentColor" />
          </svg>
        </a>
      </section>

      {/* ── Countdown: an embossed plaque on an olive band ── */}
      <section id="countdown" className="scene scene--paper scene--countdown" data-scene aria-labelledby="countdown-title">
        <div className="scene-top" data-parallax="8"><TopCorners w={w} size={cornerSize} /></div>
        <div className="scene-inner">
          <p className="eyebrow" data-rise>الموعد يقترب</p>
          <h2 id="countdown-title" className="scene-title" data-wipe>العدّ التنازلي</h2>
        </div>
        <div className="cd-band">
          <Satin color="#3a4529" />
          <div className="cd-plaque" data-rise>
            <Countdown event={event} />
          </div>
        </div>
        <p className="script-line" data-wipe>نترقّب لقاءكم</p>
      </section>

      {/* ── Cameo on satin: the bride and the date ── */}
      <section id="cameo" className="scene scene--satin" data-scene aria-labelledby="cameo-title">
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
      </section>

      {/* ── Location: an engraving of the venue ── */}
      <section id="location" className="scene scene--paper" data-scene aria-labelledby="location-title">
        <div className="scene-inner">
          <p className="eyebrow" data-rise>المكان</p>
          <h2 id="location-title" className="scene-title" data-wipe>{event.venueName}</h2>
          <Location event={event} />
        </div>
      </section>

      {/* ── The evening's programme, framed by embossed drapes ── */}
      <section id="programme" className="scene scene--paper scene--programme" data-scene aria-labelledby="programme-title">
        <div className="stage-drapes" aria-hidden="true">
          <Valance w={w} fill={CARD_PAPER} />
          <Drape className="drape--start" w={drapeW} h={drapeH} fill={CARD_PAPER} />
          <Drape className="drape--end" w={drapeW} h={drapeH} fill={CARD_PAPER} />
        </div>
        <div className="scene-inner programme-inner">
          <h2 id="programme-title" className="scene-title script" data-wipe>برنامج الليلة</h2>
          <p className="programme-date" data-rise>
            <bdi>{weekday(event)}</bdi>، <bdi>{gregorianDate(event)}</bdi>
          </p>
          <ol className="timeline">
            {programme.map((item) => (
              <li key={item.time + item.title} data-rise>
                <span className="tl-time">{timeLabel(item.time)}</span>
                <span className="tl-dot" aria-hidden="true" />
                <span className="tl-text">
                  <span className="tl-title">{item.title}</span>
                  {item.note && <span className="tl-note">{item.note}</span>}
                </span>
              </li>
            ))}
          </ol>
          {event.note && <p className="programme-note" data-rise>{event.note}</p>}
        </div>
      </section>

      {/* ── Dress code inside an embossed arch ── */}
      <section id="dress" className="scene scene--paper" data-scene aria-labelledby="dress-title">
        <div className="dress-arch" data-rise>
          <svg className="dress-arch-art" viewBox="0 0 300 470" preserveAspectRatio="none" aria-hidden="true">
            <BevelStroke d="M22 458 V156 C 22 84 88 50 150 26 C 212 50 278 84 278 156 V458 Z" paper={CARD_PAPER} width={1} hi="rgba(60,72,46,0.22)" sh="rgba(255,255,255,0.95)" depth={0.8} />
            <BevelStroke d="M8 466 V150 C 8 70 80 34 150 8 C 220 34 292 70 292 150 V466" paper={CARD_PAPER} width={5} depth={1.1} />
          </svg>
          <div className="dress-body">
            <p className="eyebrow">اللباس</p>
            <h2 id="dress-title" className="dress-title" data-wipe>{event.dressCode}</h2>
            <ThobeEngraving className="thobe-art" />
            {event.dressNote && <p className="dress-note">{event.dressNote}</p>}
          </div>
          <span className="dress-seal" aria-hidden="true"><WaxSealArt monogram={event.monogram} /></span>
        </div>
      </section>

      {/* ── RSVP on satin ── */}
      <section id="rsvp" className="scene scene--satin scene--rsvp" data-scene aria-labelledby="rsvp-title">
        <Satin color="#47542f" />
        <div className="scene-inner">
          <p className="eyebrow eyebrow--light" data-rise>تأكيد الحضور</p>
          <h2 id="rsvp-title" className="scene-title scene-title--light" data-wipe>يسعدنا أن نعرف بحضوركِ</h2>
          <Rsvp event={event} />
        </div>
      </section>

      {/* ── Share: QR code for passing the invitation on ── */}
      <section id="share" className="scene scene--paper scene--share" data-scene aria-labelledby="share-title">
        <div className="scene-inner">
          <p className="eyebrow" data-rise>شاركي الفرحة</p>
          <h2 id="share-title" className="scene-title" data-wipe>رمز الدعوة</h2>
          <div className="share-layout">
            <div data-rise><InviteQr event={event} /></div>
            <div data-rise><QrActions event={event} /></div>
          </div>
        </div>
      </section>

      {/* ── Closing ── */}
      <footer className="closing" data-scene>
        <svg className="closing-relief" viewBox="0 0 400 160" aria-hidden="true">
          <Sprig length={170} leaves={10} seed={3} fill={CARD_PAPER} transform="translate(200 120) rotate(-160)" />
          <Sprig length={170} leaves={10} seed={8} fill={CARD_PAPER} transform="translate(200 120) rotate(-20)" />
          <Rosette r={34} x={200} y={110} fill={CARD_PAPER} seed={5} />
        </svg>
        <p className="closing-line" data-wipe>بانتظاركم بكل الحب</p>
        <Divider className="closing-divider" />
        <button type="button" className="btn btn--text replay" onClick={onReplay}>
          إعادة فتح الدعوة
        </button>
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
