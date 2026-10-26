import { forwardRef, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import type { EventDetails } from '../config/event'
import { OliveBranch } from '../art/OliveBranch'
import { Divider, WaxSealArt } from '../art/Ornaments'
import { InvitationFace } from './InvitationFace'
import { Countdown } from './Countdown'
import { Details } from './Details'
import { Rsvp } from './Rsvp'
import './invitation.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

interface Props {
  event: EventDetails
  /** True once the envelope has handed over; scroll scenes start then. */
  ready: boolean
}

export const Invitation = forwardRef<HTMLElement, Props>(function Invitation({ event, ready }, heroRef) {
  const main = useRef<HTMLElement>(null)
  const [pillHidden, setPillHidden] = useState(true)

  useEffect(() => {
    if (!ready) return
    const hero = document.querySelector('.hero')
    const rsvp = document.getElementById('rsvp')
    if (!hero || !rsvp) return
    const seen = new Map<Element, boolean>()
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => seen.set(e.target, e.isIntersecting))
      setPillHidden(!!seen.get(hero) || !!seen.get(rsvp))
    }, { threshold: 0.05 })
    io.observe(hero)
    io.observe(rsvp)
    return () => io.disconnect()
  }, [ready])

  // Scene 4: scroll choreography (ui-ux-pro-max "Scroll Reveal / Standard" preset,
  // plus scrubbed parallax for the botanical layers).
  useGSAP(
    () => {
      if (!ready) return
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.utils.toArray<HTMLElement>('[data-scene]').forEach((scene) => {
          const items = scene.querySelectorAll('[data-rise]')
          gsap.from(items, {
            opacity: 0,
            y: 28,
            duration: 0.8,
            stagger: 0.09,
            ease: 'power2.out',
            scrollTrigger: { trigger: scene, start: 'top 78%' },
          })
          scene.querySelectorAll('.f-divider .draw, .divider .draw').forEach((d) => {
            gsap.fromTo(d, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut', scrollTrigger: { trigger: d, start: 'top 88%' } })
          })
        })

        gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
          const depth = Number(el.dataset.parallax)
          gsap.fromTo(el, { yPercent: -depth }, {
            yPercent: depth,
            ease: 'none',
            scrollTrigger: { trigger: el.closest('section'), start: 'top bottom', end: 'bottom top', scrub: 0.6 },
          })
        })

        // The hero recedes like a card being set down as the guest scrolls on.
        gsap.to('.hero .face', {
          scale: 0.93,
          opacity: 0.25,
          ease: 'none',
          scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
        })

        // Botanical growth on scroll for each section branch.
        gsap.utils.toArray<SVGElement>('.grow-branch').forEach((svg) => {
          const st = { trigger: svg, start: 'top 85%' }
          gsap.fromTo(svg.querySelectorAll('.ob-stem'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut', scrollTrigger: st })
          gsap.fromTo(svg.querySelectorAll('.ob-leaf, .ob-olive'), { scale: 0, transformOrigin: '0% 50%' }, { scale: 1, duration: 0.6, stagger: 0.04, delay: 0.3, ease: 'back.out(1.8)', scrollTrigger: st })
        })
      })

      // Pointer parallax on the hero art for desktop depth.
      mm.add('(pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
        const layers = gsap.utils.toArray<HTMLElement>('.hero-art')
        const movers = layers.map((l) => ({
          x: gsap.quickTo(l, 'x', { duration: 1.2, ease: 'power3.out' }),
          y: gsap.quickTo(l, 'y', { duration: 1.2, ease: 'power3.out' }),
          d: Number(l.dataset.depth ?? 10),
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

  return (
    <main ref={main} className="invitation" id="invitation">
      <section ref={heroRef} className="hero" aria-label="الدعوة">
        <div className="hero-art hero-art--tr" data-depth="18" aria-hidden="true">
          <OliveBranch leaves={16} olives={3} seed={5} />
        </div>
        <div className="hero-art hero-art--bl" data-depth="26" aria-hidden="true">
          <OliveBranch leaves={14} olives={2} seed={17} />
        </div>
        <InvitationFace event={event} />
        <a className="scroll-cue" href="#countdown">
          <span>تفاصيل الدعوة</span>
          <svg viewBox="0 0 24 36" aria-hidden="true">
            <rect x="1" y="1" width="22" height="34" rx="11" fill="none" stroke="currentColor" />
            <circle className="cue-dot" cx="12" cy="10" r="2.6" fill="currentColor" />
          </svg>
        </a>
      </section>

      <section id="countdown" className="scene scene--olive" data-scene aria-labelledby="countdown-title">
        <div className="scene-edge" aria-hidden="true" />
        <div className="scene-art scene-art--start" data-parallax="18" aria-hidden="true">
          <OliveBranch className="grow-branch" tone="ivory" leaves={13} olives={2} seed={31} />
        </div>
        <div className="scene-inner">
          <p className="eyebrow" data-rise>الموعد يقترب</p>
          <h2 id="countdown-title" className="scene-title" data-rise>نعدّ اللحظات حتى نلقاكم</h2>
          <Countdown event={event} />
        </div>
      </section>

      <section id="details" className="scene scene--ivory" data-scene aria-labelledby="details-title">
        <div className="scene-inner">
          <p className="eyebrow" data-rise>تفاصيل السهرة</p>
          <h2 id="details-title" className="scene-title" data-rise>أين ومتى</h2>
          <Divider className="scene-divider" />
          <Details event={event} />
        </div>
      </section>

      <section className="scene scene--sage scene--quote" data-scene aria-label="كلمة">
        <div className="scene-art scene-art--end" data-parallax="22" aria-hidden="true">
          <OliveBranch className="grow-branch" leaves={15} olives={3} seed={41} />
        </div>
        <div className="scene-art scene-art--start2" data-parallax="-16" aria-hidden="true">
          <OliveBranch className="grow-branch" leaves={11} olives={2} seed={53} />
        </div>
        <blockquote className="quote" data-rise>
          <p>ليلةٌ تتزيّن فيها الأيادي بالحنّة، وتتزيّن القلوب بالفرح</p>
        </blockquote>
        <p className="quote-sub" data-rise>وحضوركم أجمل ما فيها</p>
      </section>

      <section id="rsvp" className="scene scene--olive" data-scene aria-labelledby="rsvp-title">
        <div className="scene-edge" aria-hidden="true" />
        <div className="scene-inner">
          <p className="eyebrow" data-rise>تأكيد الحضور</p>
          <h2 id="rsvp-title" className="scene-title" data-rise>يسعدنا أن نعرف بحضوركِ</h2>
          <Rsvp event={event} />
        </div>
      </section>

      <footer className="closing" data-scene>
        <div className="closing-seal" data-rise aria-hidden="true">
          <WaxSealArt monogram={event.monogram} />
        </div>
        <p className="closing-line" data-rise>بانتظاركم بكل الحب</p>
        <p className="closing-names" data-rise>
          {event.brideName} <span aria-hidden="true">·</span> {event.groomName}
        </p>
      </footer>

      {ready && (
        <a className="rsvp-pill" href="#rsvp" data-hidden={pillHidden} tabIndex={pillHidden ? -1 : undefined} aria-hidden={pillHidden || undefined}>
          تأكيد الحضور
        </a>
      )}
    </main>
  )
})
