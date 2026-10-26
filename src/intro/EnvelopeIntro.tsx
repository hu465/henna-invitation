import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import gsap from 'gsap'
import type { EventDetails } from '../config/event'
import { OliveBranch } from '../art/OliveBranch'
import { Crest, WaxSealArt } from '../art/Ornaments'
import './envelope.css'

interface Props {
  event: EventDetails
  /** Builds the hero reveal so it can be appended to the master timeline. */
  buildHeroReveal: () => gsap.core.Timeline | null
  onDone: () => void
}

const CRUMBS = 9
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function EnvelopeIntro({ event, buildHeroReveal, onDone }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const tilt = useRef<HTMLDivElement>(null)
  const tl = useRef<gsap.core.Timeline | null>(null)
  const [state, setState] = useState<'idle' | 'opening' | 'done'>('idle')

  // Pointer parallax: the envelope leans gently toward the cursor.
  useEffect(() => {
    const el = tilt.current
    if (!el || reducedMotion() || !window.matchMedia('(pointer: fine)').matches) return
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.9, ease: 'power3.out' })
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.9, ease: 'power3.out' })
    gsap.set(el, { transformPerspective: 1400 })
    const move = (e: PointerEvent) => {
      if (tl.current) return
      rx(((e.clientY / innerHeight) - 0.5) * -7)
      ry(((e.clientX / innerWidth) - 0.5) * 9)
    }
    addEventListener('pointermove', move)
    return () => removeEventListener('pointermove', move)
  }, [])

  const finish = useCallback(() => {
    setState('done')
    document.documentElement.classList.remove('is-locked')
    onDone()
  }, [onDone])

  const open = useCallback(() => {
    if (tl.current || !root.current) return
    setState('opening')
    const q = gsap.utils.selector(root)
    const stage = q('.stage')[0] as HTMLElement
    const card = q('.card')[0] as HTMLElement
    const rig = q('.rig')
    const flap = q('.env-flap')
    const vw = innerWidth
    const vh = innerHeight

    if (reducedMotion()) {
      // Calm alternative: no flight or rotation, just a cross-fade.
      const t = gsap.timeline({ onComplete: finish })
      t.to(root.current, { autoAlpha: 0, duration: 0.5, ease: 'power1.out' })
      const hero = buildHeroReveal()
      if (hero) t.add(hero.progress(1), 0)
      tl.current = t
      return
    }

    gsap.to(tilt.current, { rotationX: 0, rotationY: 0, duration: 0.6, ease: 'power2.out' })

    const H = stage.offsetHeight
    const sRect = stage.getBoundingClientRect()
    const cardTop = card.offsetTop
    const cardH = card.offsetHeight
    const cardW = card.offsetWidth
    // Envelope sinks while the card rises, so the card clears the pocket while staying on screen.
    const sink = H * 0.62
    const rise = sink - cardTop - cardH - H * 0.03
    const centerY = vh / 2 - (sRect.top + sRect.height / 2) - (cardTop + cardH / 2 - H / 2)
    const fit = Math.min((vw * 0.9) / cardW, (vh * 0.84) / cardH, 2.4)
    const cover = Math.max(vw / cardW, vh / cardH) * 1.08

    gsap.set(rig, { transformPerspective: 1600, transformOrigin: '50% 50%' })
    gsap.set(flap, { transformPerspective: 1300, transformOrigin: '50% 0%' })
    gsap.set(card, { transformPerspective: 1600, transformOrigin: '50% 50%' })

    const t = gsap.timeline({ defaults: { ease: 'power2.inOut' }, onComplete: finish })
    tl.current = t
    // Exposed in development so the sequence can be scrubbed frame by frame in tests.
    if (import.meta.env.DEV) Object.assign(window, { __introTl: t })

    // 1. Seal responds to the touch.
    t.addLabel('press')
      .to(q('.stage-float'), { y: 0, duration: 0.3, ease: 'power2.out' }, 'press')
      .to(q('.seal'), { scale: 0.9, duration: 0.14, ease: 'power2.in' }, 'press')
      .to(q('.seal-glow'), { opacity: 1, scale: 1.25, duration: 0.3, ease: 'power2.out' }, 'press')
      .to(q('.seal'), { scale: 1.04, duration: 0.18, ease: 'back.out(3)' }, 'press+=0.14')
      .to(q('.intro-copy'), { autoAlpha: 0, y: -10, duration: 0.5, ease: 'power2.in', stagger: 0.05 }, 'press+=0.1')
      .to(q('.intro-skip'), { autoAlpha: 0, duration: 0.3 }, 'press')

    // 2. Hairline crack, then the wax breaks into two halves and crumbs.
      .addLabel('crack', 'press+=0.32')
      .fromTo(q('.seal-crack path'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.26, ease: 'power1.in' }, 'crack')
      .addLabel('break', 'crack+=0.28')
      .to(q('.seal-crack, .seal-glow'), { opacity: 0, duration: 0.2 }, 'break')
      .to(q('.seal-l'), { x: -34, y: 70, rotation: -32, duration: 0.9, ease: 'power2.in' }, 'break')
      .to(q('.seal-r'), { x: 30, y: 84, rotation: 26, duration: 0.9, ease: 'power2.in' }, 'break')
      .to(q('.seal-half'), { opacity: 0, duration: 0.35, ease: 'power1.in' }, 'break+=0.55')
      .set(q('.crumb'), { opacity: 1 }, 'break')
      .to(q('.crumb'), {
        x: () => gsap.utils.random(-90, 90),
        y: () => gsap.utils.random(30, 150),
        rotation: () => gsap.utils.random(-180, 180),
        opacity: 0,
        duration: () => gsap.utils.random(0.6, 1),
        ease: 'power2.out',
      }, 'break')

    // 3–4. Flap swings open on its hinge, revealing the lining.
      .addLabel('flap', 'break+=0.12')
      .to(flap, { rotationX: 180, duration: 1.15, ease: 'power2.inOut' }, 'flap')
      .set(q('.env-flap-wrap'), { zIndex: 2 }, 'flap+=0.58')
      .to(q('.flap-shadow'), { opacity: 0, duration: 0.5 }, 'flap')
      .to(rig, { rotationX: 7, y: H * 0.04, duration: 1.3 }, 'flap')
      .to(q('.env-shade'), { opacity: 1, duration: 0.8 }, 'flap+=0.5')

    // 5. The card slides up out of the pocket as the envelope settles down.
      .addLabel('rise', 'flap+=1.0')
      .to(card, { y: rise, duration: 1.35, ease: 'power3.inOut' }, 'rise')
      .to(rig, { y: sink, rotationX: 0, duration: 1.35, ease: 'power3.inOut' }, 'rise')
      .to(q('.card-shadow'), { opacity: 0.6, duration: 1.2 }, 'rise')
      .set(card, { zIndex: 9 }, 'rise+=1.3')

    // 6. The card leaves the envelope and travels toward the guest with depth.
      .addLabel('forward', 'rise+=1.3')
      .to(card, {
        y: centerY,
        scale: fit,
        duration: 1.35,
        ease: 'expo.inOut',
        keyframes: { rotationX: [0, -14, 0], rotationZ: [0, -1.2, 0], ease: 'none' },
      }, 'forward')
      .to(q('.card-shadow'), { opacity: 1, duration: 1.2 }, 'forward')
      .to(rig, { y: sink + H * 0.7, scale: 0.9, opacity: 0, duration: 1.2, ease: 'power2.in' }, 'forward+=0.1')
      .to(q('.intro-bg'), { '--bg-dim': 1, duration: 1.4 }, 'forward')
      .fromTo(q('.card-face .crest .ob-leaf'), { scale: 0.6 }, { scale: 1, duration: 0.8, stagger: 0.02, ease: 'back.out(2)', transformOrigin: '0% 50%' }, 'forward+=0.6')

    // 7. Hold for a beat, then the card expands to become the page itself.
      .addLabel('expand', 'forward+=1.75')
      .to(q('.card-face'), { opacity: 0, duration: 0.45, ease: 'power1.in' }, 'expand')
      .to(card, { scale: cover, rotationX: 0, duration: 1.0, ease: 'expo.inOut' }, 'expand')
      .to(q('.card-paper'), { borderRadius: 0, duration: 0.6 }, 'expand')
      .to(q('.card-shadow'), { opacity: 0, duration: 0.6 }, 'expand')
      .addLabel('handoff', 'expand+=1.0')
      .set(root.current, { autoAlpha: 0 }, 'handoff')

    // 8–9. Hand over to the hero: typography and artwork reveal, then the invitation continues.
    const hero = buildHeroReveal()
    if (hero) t.add(hero, 'handoff')
  }, [buildHeroReveal, finish])

  // Keep keyboard focus inside the dialog while it is open.
  const trapFocus = (e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !root.current) return
    const items = [...root.current.querySelectorAll<HTMLElement>('button:not(:disabled)')]
    if (!items.length) return
    const i = items.indexOf(document.activeElement as HTMLElement)
    const next = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : (i + 1) % items.length
    e.preventDefault()
    items[next].focus()
  }

  const skip = () => {
    if (!tl.current) open()
    tl.current?.progress(1)
  }

  useEffect(() => {
    document.documentElement.classList.add('is-locked')
    return () => {
      document.documentElement.classList.remove('is-locked')
      tl.current?.kill()
    }
  }, [])

  if (state === 'done') return null

  return (
    <div ref={root} className="intro" data-state={state} role="dialog" aria-modal="true" aria-label="دعوة ليلة الحنّة" onKeyDown={trapFocus}>
      <div className="intro-bg" aria-hidden="true">
        <OliveBranch className="leaf-shadow ls-1" leaves={16} seed={3} />
        <OliveBranch className="leaf-shadow ls-2" leaves={13} seed={9} />
        <div className="intro-light" />
      </div>

      <p className="intro-copy intro-kicker">لديك دعوة خاصة</p>

      <div className="stage-tilt" ref={tilt}>
        <div className="stage-float">
          <div className="stage" onClick={open}>
            <div className="rig env-ground" aria-hidden="true" />
            <div className="rig env-back" aria-hidden="true">
              <div className="env-lining" />
              <div className="env-shade" />
            </div>

            <div className="card" aria-hidden="true">
              <div className="card-shadow" />
              <div className="card-paper">
                <div className="card-face">
                  <div className="card-rule" />
                  <Crest className="card-crest" />
                  <span className="card-mono">{event.monogram}</span>
                  <span className="card-sub">ليلة الحنّة</span>
                </div>
              </div>
            </div>

            <div className="rig env-pocket" aria-hidden="true">
              <div className="fold fold-left"><i /></div>
              <div className="fold fold-right"><i /></div>
              <div className="fold fold-bottom"><i /></div>
              <OliveBranch className="foil foil-a" tone="champagne" leaves={12} olives={2} seed={61} />
              <OliveBranch className="foil foil-b" tone="champagne" leaves={9} olives={1} seed={67} />
              <div className="pocket-sheen" />
            </div>

            <div className="rig env-flap-wrap" aria-hidden="true">
              <div className="env-flap">
                <div className="flap-face flap-front"><i /></div>
                <div className="flap-face flap-back"><i /></div>
              </div>
              <div className="flap-shadow" />
            </div>

            <button type="button" className="seal" onClick={(e) => { e.stopPropagation(); open() }} aria-label="افتحي الدعوة" disabled={state !== 'idle'}>
              <span className="seal-glow" aria-hidden="true" />
              <span className="seal-half seal-l" aria-hidden="true"><WaxSealArt monogram={event.monogram} /></span>
              <span className="seal-half seal-r" aria-hidden="true"><WaxSealArt monogram={event.monogram} /></span>
              <svg className="seal-crack" viewBox="0 0 100 100" aria-hidden="true">
                <path pathLength={1} d="M51 6 L47 19 L55 33 L46 52 L54 70 L48 86 L51 96" />
              </svg>
              {Array.from({ length: CRUMBS }, (_, i) => (
                <span key={i} className="crumb" aria-hidden="true" style={{ ['--i' as string]: i }} />
              ))}
            </button>
          </div>
        </div>
      </div>

      <p className="intro-copy intro-hint" aria-hidden="true">
        <span className="hint-dot" />
        اضغطي لفتح الدعوة
      </p>

      <button type="button" className="intro-skip" onClick={skip}>
        تخطّي المقدّمة
      </button>
    </div>
  )
}
