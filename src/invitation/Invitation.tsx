import { forwardRef, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import type { EventDetails } from '../config/event'
import { OliveBranch } from '../art/OliveBranch'
import { Divider, WaxSealArt } from '../art/Ornaments'
import { Arch, OliveGrove, TatreezBand, TatreezStar } from '../art/Levant'
import { Drift } from '../art/Drift'
import { SoundToggle } from '../audio/SoundToggle'
import { InvitationFace } from './InvitationFace'
import { Countdown } from './Countdown'
import { Location } from './Location'
import { Rsvp } from './Rsvp'
import { InviteQr, QrActions } from './InviteQr'
import { arDigits, eventStart, hijriDate, timeLabel, weekday } from '../lib/format'
import './invitation.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

interface Props {
  event: EventDetails
  /** True once the envelope has handed over; scroll scenes start then. */
  ready: boolean
  /** Plays the envelope opening again from the start. */
  onReplay: () => void
}

const monthName = (e: EventDetails) => new Intl.DateTimeFormat('ar-EG', { month: 'long' }).format(eventStart(e))

export const Invitation = forwardRef<HTMLElement, Props>(function Invitation({ event, ready, onReplay }, heroRef) {
  const main = useRef<HTMLElement>(null)
  const [pillHidden, setPillHidden] = useState(true)

  // Ambient loops run only in scenes that are on screen.
  useEffect(() => {
    const scenes = main.current?.querySelectorAll('section, footer') ?? []
    const io = new IntersectionObserver((entries) => entries.forEach((e) => e.target.classList.toggle('is-offscreen', !e.isIntersecting)))
    scenes.forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [])

  // The RSVP shortcut appears between the hero and the RSVP scene.
  useEffect(() => {
    if (!ready) return
    // Hidden over the hero and from the RSVP scene onwards, where it would cover controls.
    const hiders = ['.hero', '#rsvp', '#share', '.closing'].map((s) => document.querySelector(s)).filter((el): el is Element => !!el)
    const seen = new Map<Element, boolean>()
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => seen.set(e.target, e.isIntersecting))
      setPillHidden(hiders.some((el) => seen.get(el)))
    }, { threshold: 0.05 })
    hiders.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [ready])

  // Scene 4: scroll choreography. Each scene enters like a curtain lifting,
  // its text is revealed in reading order and its artwork moves in parallax.
  useGSAP(
    () => {
      if (!ready) return
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.utils.toArray<HTMLElement>('[data-scene]').forEach((scene) => {
          const tl = gsap.timeline({ scrollTrigger: { trigger: scene, start: 'top 72%' } })
          tl.from(scene.querySelectorAll('[data-rise]'), { opacity: 0, y: 30, duration: 0.9, stagger: 0.1, ease: 'power3.out' })
          const wipes = scene.querySelectorAll('[data-wipe]')
          if (wipes.length)
            tl.fromTo(wipes, { clipPath: 'inset(-25% 0% -25% 100%)' }, { clipPath: 'inset(-25% 0% -25% 0%)', duration: 1.1, stagger: 0.15, ease: 'power3.inOut', clearProps: 'clipPath' }, 0)
          scene.querySelectorAll('.divider .draw, .arch .draw').forEach((d) => tl.fromTo(d, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut' }, 0.1))
          const edge = scene.querySelector('.scene-edge')
          if (edge)
            gsap.fromTo(edge, { scaleY: 1 }, { scaleY: 0.15, ease: 'none', scrollTrigger: { trigger: scene, start: 'top bottom', end: 'top 35%', scrub: true } })
        })

        gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
          const depth = Number(el.dataset.parallax)
          gsap.fromTo(el, { yPercent: -depth }, {
            yPercent: depth,
            ease: 'none',
            scrollTrigger: { trigger: el.closest('section, footer'), start: 'top bottom', end: 'bottom top', scrub: 0.6 },
          })
        })

        // The hero card recedes and the grove rises as the guest scrolls on.
        const out = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
        gsap.to('.hero .face', { scale: 0.92, opacity: 0.2, ease: 'none', scrollTrigger: out })
        gsap.to('.hero .grove-far', { yPercent: -14, ease: 'none', scrollTrigger: out })
        gsap.to('.hero .hero-sun', { yPercent: 25, ease: 'none', scrollTrigger: out })

        gsap.utils.toArray<SVGElement>('.grow-branch').forEach((svg) => {
          const st = { trigger: svg, start: 'top 88%' }
          gsap.fromTo(svg.querySelectorAll('.ob-stem'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut', scrollTrigger: st })
          gsap.fromTo(svg.querySelectorAll('.ob-leaf, .ob-olive'), { scale: 0, transformOrigin: '0% 50%' }, { scale: 1, duration: 0.6, stagger: 0.035, delay: 0.3, ease: 'back.out(1.8)', scrollTrigger: st })
        })
      })

      // Desktop: hero layers drift with the pointer for depth.
      mm.add('(pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
        const movers = gsap.utils.toArray<HTMLElement>('[data-depth]').map((l) => ({
          x: gsap.quickTo(l, 'x', { duration: 1.4, ease: 'power3.out' }),
          y: gsap.quickTo(l, 'y', { duration: 1.4, ease: 'power3.out' }),
          d: Number(l.dataset.depth),
        }))
        const move = (e: PointerEvent) => {
          const nx = e.clientX / innerWidth - 0.5
          const ny = e.clientY / innerHeight - 0.5
          movers.forEach((m) => {
            m.x(nx * m.d)
            m.y(ny * m.d)
          })
        }
        addEventListener('pointermove', move)
        return () => removeEventListener('pointermove', move)
      })
      ScrollTrigger.refresh()
    },
    { scope: main, dependencies: [ready] },
  )

  const hijri = hijriDate(event)
  const day = arDigits(eventStart(event).getDate())

  return (
    <main ref={main} className="invitation" id="invitation">
      {/* ── Scene 3: the hero artwork ── */}
      <section ref={heroRef} className="hero" aria-label="الدعوة">
        <div className="hero-layer hero-sun anim-loop" aria-hidden="true" />
        <div className="hero-layer hero-rays anim-loop" aria-hidden="true" />
        {event.ambientVideo && (
          <video className="hero-layer hero-video" src={event.ambientVideo} poster={event.ambientPoster || undefined} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" onError={(e) => (e.currentTarget.style.display = 'none')} />
        )}
        <div className="hero-layer grove-far" data-depth="6" aria-hidden="true"><OliveGrove seed={4} trees={11} /></div>
        <div className="hero-layer hero-shade anim-loop" aria-hidden="true"><OliveBranch leaves={16} seed={12} /></div>
        <div className="hero-layer hero-branch hero-branch--tr" data-depth="22" aria-hidden="true"><OliveBranch leaves={16} olives={3} seed={5} /></div>
        <div className="hero-layer hero-branch hero-branch--bl" data-depth="30" aria-hidden="true"><OliveBranch leaves={14} olives={2} seed={17} /></div>
        <div className="hero-layer hero-petals" aria-hidden="true"><Drift kind="petal" count={9} seed={21} /></div>
        <InvitationFace event={event} />
        <a className="scroll-cue" href="#countdown">
          <span>تفاصيل الدعوة</span>
          <svg viewBox="0 0 24 36" aria-hidden="true">
            <rect x="1" y="1" width="22" height="34" rx="11" fill="none" stroke="currentColor" />
            <circle className="cue-dot" cx="12" cy="10" r="2.6" fill="currentColor" />
          </svg>
        </a>
      </section>

      {/* ── Countdown: night falls over the grove ── */}
      <section id="countdown" className="scene scene--night" data-scene aria-labelledby="countdown-title">
        <div className="scene-edge" aria-hidden="true" />
        <Drift kind="mote" count={10} seed={33} />
        <div className="scene-art scene-art--a" data-parallax="16" aria-hidden="true">
          <OliveBranch className="grow-branch" tone="ivory" leaves={13} olives={2} seed={31} />
        </div>
        <div className="scene-art scene-art--b" data-parallax="-12" aria-hidden="true">
          <OliveBranch className="grow-branch" tone="champagne" leaves={10} olives={1} seed={37} />
        </div>
        <div className="scene-grove" aria-hidden="true"><OliveGrove seed={8} trees={9} /></div>
        <div className="scene-inner">
          <TatreezStar className="scene-star" size={2} />
          <p className="eyebrow" data-rise>الموعد يقترب</p>
          <h2 id="countdown-title" className="scene-title" data-wipe>نعدّ اللحظات حتى نلقاكم</h2>
          <Countdown event={event} />
        </div>
      </section>

      {/* ── The date, set like a page of calligraphy ── */}
      <section id="date" className="scene scene--paper" data-scene aria-labelledby="date-title">
        <div className="scene-art scene-art--c" data-parallax="14" aria-hidden="true">
          <OliveBranch className="grow-branch" leaves={14} olives={3} seed={43} />
        </div>
        <div className="scene-inner date-layout">
          <div className="date-arch" data-rise>
            <Arch className="date-arch-art" />
            <p className="date-weekday">{weekday(event)}</p>
            <p className="date-day" aria-hidden="true">{day}</p>
            <p className="date-month">{monthName(event)}</p>
          </div>
          <div className="date-text">
            <p className="eyebrow" data-rise>الموعد</p>
            <h2 id="date-title" className="scene-title" data-wipe>
              {weekday(event)} {day} {monthName(event)}
            </h2>
            {hijri && <p className="date-hijri" data-rise>{hijri}</p>}
            <Divider className="date-divider" />
            <dl className="date-facts">
              <div data-rise>
                <dt>الاستقبال</dt>
                <dd>{timeLabel(event.time)}</dd>
              </div>
              <div data-rise>
                <dt>حتى</dt>
                <dd>{timeLabel(event.endTime)}</dd>
              </div>
              <div data-rise>
                <dt>اللباس</dt>
                <dd>{event.dressCode}</dd>
              </div>
            </dl>
            {event.note && <p className="date-note" data-rise>{event.note}</p>}
          </div>
        </div>
      </section>

      {/* ── Location ── */}
      <section id="location" className="scene scene--sage" data-scene aria-labelledby="location-title">
        <div className="scene-inner">
          <p className="eyebrow" data-rise>المكان</p>
          <h2 id="location-title" className="scene-title" data-wipe>{event.venueName}</h2>
          <Location event={event} />
        </div>
      </section>

      {/* ── A breath: henna quote over the grove ── */}
      <section className="scene scene--quote" data-scene aria-label="كلمة">
        <div className="quote-light anim-loop" aria-hidden="true" />
        <Drift kind="petal" count={7} seed={52} />
        <div className="scene-art scene-art--d" data-parallax="22" aria-hidden="true">
          <OliveBranch className="grow-branch" leaves={15} olives={3} seed={41} />
        </div>
        <div className="scene-art scene-art--e" data-parallax="-16" aria-hidden="true">
          <OliveBranch className="grow-branch" leaves={11} olives={2} seed={53} />
        </div>
        <blockquote className="quote">
          <p data-wipe>ليلةٌ تتزيّن فيها الأيادي بالحنّة</p>
          <p data-wipe>وتتزيّن القلوب بالفرح</p>
        </blockquote>
        <TatreezBand className="quote-band" stitchSize={2} />
        <p className="quote-sub" data-rise>وحضوركم أجمل ما فيها</p>
      </section>

      {/* ── RSVP ── */}
      <section id="rsvp" className="scene scene--night" data-scene aria-labelledby="rsvp-title">
        <div className="scene-edge scene-edge--sage" aria-hidden="true" />
        <Drift kind="mote" count={8} seed={61} />
        <div className="scene-inner">
          <TatreezStar className="scene-star" size={2} />
          <p className="eyebrow" data-rise>تأكيد الحضور</p>
          <h2 id="rsvp-title" className="scene-title" data-wipe>يسعدنا أن نعرف بحضوركِ</h2>
          <Rsvp event={event} />
        </div>
      </section>

      {/* ── Share: QR code for passing the invitation on ── */}
      <section id="share" className="scene scene--paper scene--share" data-scene aria-labelledby="share-title">
        <div className="scene-art scene-art--c" data-parallax="12" aria-hidden="true">
          <OliveBranch className="grow-branch" leaves={12} olives={2} seed={71} />
        </div>
        <div className="scene-inner">
          <p className="eyebrow" data-rise>شاركي الفرحة</p>
          <h2 id="share-title" className="scene-title" data-wipe>رمز الدعوة</h2>
          <div className="share-layout">
            <div data-rise>
              <InviteQr event={event} />
            </div>
            <div data-rise>
              <QrActions event={event} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Closing ── */}
      <footer className="closing" data-scene>
        <div className="closing-grove" aria-hidden="true"><OliveGrove seed={27} trees={10} /></div>
        <div className="closing-seal" data-rise aria-hidden="true">
          <WaxSealArt monogram={event.monogram} />
        </div>
        <p className="closing-line" data-wipe>بانتظاركم بكل الحب</p>
        <p className="closing-names" data-rise>
          {event.brideName}
          {event.groomName && (
            <>
              {' '}<span aria-hidden="true">·</span> {event.groomName}
            </>
          )}
        </p>
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
