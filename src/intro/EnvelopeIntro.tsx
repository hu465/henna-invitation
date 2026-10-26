import { useCallback, useEffect, useRef, type KeyboardEvent } from 'react'
import gsap from 'gsap'
import type { EventDetails } from '../config/event'
import { OliveBranch } from '../art/OliveBranch'
import { Crest, WaxSealArt } from '../art/Ornaments'
import { Arch, TatreezBand, TatreezStar } from '../art/Levant'
import { SoundToggle } from '../audio/SoundToggle'
import { Drift } from '../art/Drift'
import { ambience, soundPreferred } from '../audio/ambience'
import './envelope.css'

/** The opening is an explicit state machine; each phase is a label on one GSAP timeline. */
export type Phase = 'closed' | 'sealActivated' | 'envelopeOpening' | 'cardEmerging' | 'invitationRevealing' | 'invitationOpen'

interface Props {
  event: EventDetails
  phase: Phase
  onPhase: (p: Phase) => void
  /** Builds the hero reveal so it can be appended to the master timeline. */
  buildHeroReveal: () => gsap.core.Timeline | null
}

const CRUMBS = 9
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function EnvelopeIntro({ event, phase, onPhase, buildHeroReveal }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const tilt = useRef<HTMLDivElement>(null)
  const float = useRef<HTMLDivElement>(null)
  const tl = useRef<gsap.core.Timeline | null>(null)
  const idle = useRef<gsap.core.Tween | null>(null)

  const unlock = () => document.documentElement.classList.remove('is-locked')

  // Scroll is locked only while the envelope is on screen, and every exit path unlocks it.
  useEffect(() => {
    document.documentElement.classList.add('is-locked')
    addEventListener('pagehide', unlock)
    return () => {
      unlock()
      removeEventListener('pagehide', unlock)
      tl.current?.kill()
      idle.current?.kill()
    }
  }, [])

  // Idle life: the envelope rests at an angle and breathes slowly in 3D.
  useEffect(() => {
    const el = float.current
    if (!el || reducedMotion()) return
    gsap.set(el, { transformPerspective: 1100, rotationX: 12, rotationY: -2, y: 0 })
    idle.current = gsap.to(el, { rotationX: 15, rotationY: 3, y: -8, duration: 3.6, ease: 'sine.inOut', yoyo: true, repeat: -1 })
  }, [])

  // Desktop: the envelope leans toward the cursor.
  useEffect(() => {
    const el = tilt.current
    if (!el || reducedMotion() || !window.matchMedia('(pointer: fine)').matches) return
    gsap.set(el, { transformPerspective: 1400 })
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.9, ease: 'power3.out' })
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.9, ease: 'power3.out' })
    const move = (e: PointerEvent) => {
      if (tl.current) return
      rx((e.clientY / innerHeight - 0.5) * -6)
      ry((e.clientX / innerWidth - 0.5) * 8)
    }
    addEventListener('pointermove', move)
    return () => removeEventListener('pointermove', move)
  }, [])

  const finish = useCallback(() => {
    unlock()
    onPhase('invitationOpen')
  }, [onPhase])

  const build = useCallback(() => {
    const q = gsap.utils.selector(root)
    const stage = q('.stage')[0] as HTMLElement
    const card = q('.card')[0] as HTMLElement
    const rig = q('.rig')
    const flap = q('.env-flap')
    const vw = innerWidth
    const vh = innerHeight

    idle.current?.kill()
    const H = stage.offsetHeight
    const cardTop = card.offsetTop
    const cardH = card.offsetHeight
    const cardW = card.offsetWidth

    // Flatten the resting pose before measuring, so the card's flight is computed in screen space.
    gsap.set([tilt.current, float.current], { rotationX: 0, rotationY: 0, y: 0 })
    const sRect = stage.getBoundingClientRect()
    const sink = H * 0.6
    const rise = sink - cardTop - cardH - H * 0.03
    const centerY = vh / 2 - (sRect.top + sRect.height / 2) - (cardTop + cardH / 2 - H / 2)
    const fit = Math.min((vw * 0.86) / cardW, (vh * 0.8) / cardH, 2.3)
    const cover = Math.max(vw / cardW, vh / cardH) * 1.06

    gsap.set(rig, { transformPerspective: 1500, transformOrigin: '50% 50%' })
    gsap.set(flap, { transformPerspective: 1200, transformOrigin: '50% 0%' })
    gsap.set(card, { transformPerspective: 1500, transformOrigin: '50% 50%' })

    const t = gsap.timeline({ defaults: { ease: 'power2.inOut' }, onComplete: finish })
    if (import.meta.env.DEV) Object.assign(window, { __introTl: t, __builds: ((window as unknown as { __builds?: number }).__builds ?? 0) + 1 })

    // ── sealActivated: a physical press, a hairline crack, the wax parts. ──
    t.addLabel('sealActivated', 0)
      .call(() => onPhase('sealActivated'), [], 'sealActivated')
      .to(q('.seal'), { scale: 0.88, duration: 0.12, ease: 'power2.in' }, 'sealActivated')
      .to(q('.seal-glow'), { opacity: 1, scale: 1.3, duration: 0.3, ease: 'power2.out' }, 'sealActivated')
      .to(q('.seal'), { scale: 1.05, duration: 0.18, ease: 'back.out(3)' }, 'sealActivated+=0.12')
      .to(q('.intro-copy, .intro-ornament'), { autoAlpha: 0, y: -12, duration: 0.45, ease: 'power2.in', stagger: 0.04 }, 'sealActivated+=0.05')
      .to(q('.intro-skip'), { autoAlpha: 0, duration: 0.3 }, 'sealActivated')
      .fromTo(q('.seal-crack path'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.18, ease: 'power1.in' }, 'sealActivated+=0.24')
      .addLabel('break', 'sealActivated+=0.42')
      .to(q('.seal-crack, .seal-glow'), { opacity: 0, duration: 0.15 }, 'break')
      .to(q('.seal-l'), { x: -30, y: 64, rotation: -34, duration: 0.75, ease: 'power2.in' }, 'break')
      .to(q('.seal-r'), { x: 26, y: 76, rotation: 28, duration: 0.75, ease: 'power2.in' }, 'break')
      .to(q('.seal-half'), { opacity: 0, duration: 0.3, ease: 'power1.in' }, 'break+=0.45')
      .set(q('.crumb'), { opacity: 1 }, 'break')
      .to(q('.crumb'), {
        x: () => gsap.utils.random(-80, 80),
        y: () => gsap.utils.random(30, 130),
        rotation: () => gsap.utils.random(-180, 180),
        opacity: 0,
        duration: () => gsap.utils.random(0.5, 0.85),
        ease: 'power2.out',
      }, 'break')

    // ── envelopeOpening: the flap swings over its hinge; the ivory interior appears. ──
      .addLabel('envelopeOpening', 'break+=0.06')
      .call(() => onPhase('envelopeOpening'), [], 'envelopeOpening')
      .to(flap, { rotationX: 180, duration: 0.95, ease: 'power2.inOut' }, 'envelopeOpening')
      .set(q('.env-flap-wrap'), { zIndex: 2 }, 'envelopeOpening+=0.48')
      .to(q('.flap-shadow'), { opacity: 0, duration: 0.4 }, 'envelopeOpening')
      .to(q('.flap-cast'), { opacity: 0.55, duration: 0.5 }, 'envelopeOpening+=0.45')
      .to(rig, { rotationX: 8, y: H * 0.03, duration: 1.0 }, 'envelopeOpening')
      .to(q('.env-shade'), { opacity: 1, duration: 0.6 }, 'envelopeOpening+=0.4')

    // ── cardEmerging: the card slides out, travels forward and up toward the guest. ──
      .addLabel('cardEmerging', 'envelopeOpening+=0.62')
      .call(() => onPhase('cardEmerging'), [], 'cardEmerging')
      .to(card, { y: rise, duration: 1.0, ease: 'power3.inOut' }, 'cardEmerging')
      .to(rig, { y: sink, rotationX: 0, duration: 1.0, ease: 'power3.inOut' }, 'cardEmerging')
      .to(q('.card-shadow'), { opacity: 0.55, duration: 0.9 }, 'cardEmerging')
      .to(q('.env-ground'), { opacity: 0.35, scaleX: 0.9, duration: 1 }, 'cardEmerging')
      .set(card, { zIndex: 9 }, 'cardEmerging+=0.95')
      .addLabel('forward', 'cardEmerging+=0.95')
      .to(card, {
        y: centerY,
        scale: fit,
        duration: 1.0,
        ease: 'expo.inOut',
        keyframes: { rotationX: [0, -16, 0], rotationZ: [0, -1.4, 0], ease: 'none' },
      }, 'forward')
      .to(q('.card-shadow'), { opacity: 1, duration: 0.8 }, 'forward')
      .to(rig, { y: sink + H * 0.75, scale: 0.88, opacity: 0, duration: 0.9, ease: 'power2.in' }, 'forward+=0.05')
      .to(q('.intro-bg'), { '--bg-dim': 1, duration: 1.0 }, 'forward')
      .fromTo(q('.card-face .ob-leaf'), { scale: 0.5 }, { scale: 1, duration: 0.6, stagger: 0.015, ease: 'back.out(2)', transformOrigin: '0% 50%' }, 'forward+=0.4')

    // ── The card opens out to become the page. ──
      .addLabel('expand', 'forward+=1.1')
      .to(q('.card-face'), { opacity: 0, duration: 0.35, ease: 'power1.in' }, 'expand')
      .to(card, { scale: cover, rotationX: 0, duration: 0.8, ease: 'expo.inOut' }, 'expand')
      .to(q('.card-paper'), { borderRadius: 0, duration: 0.5 }, 'expand')
      .to(q('.card-shadow'), { opacity: 0, duration: 0.5 }, 'expand')

    // ── invitationRevealing: the heading is drawn and the composition comes alive. ──
      .addLabel('invitationRevealing', 'expand+=0.8')
      .call(() => onPhase('invitationRevealing'), [], 'invitationRevealing')
      .set(root.current, { autoAlpha: 0 }, 'invitationRevealing')
      .call(unlock, [], 'invitationRevealing+=0.8')

    const hero = buildHeroReveal()
    if (hero) t.add(hero, 'invitationRevealing')
    return t
  }, [buildHeroReveal, finish, onPhase])

  const open = useCallback(() => {
    if (tl.current || !root.current) return
    if (soundPreferred()) ambience(event.musicUrl).start()
    if (reducedMotion()) {
      // Calm alternative: a short cross-fade with the invitation already composed.
      onPhase('sealActivated')
      const hero = buildHeroReveal()
      hero?.progress(1)
      tl.current = gsap.timeline({ onComplete: finish }).to(root.current, { autoAlpha: 0, duration: 0.45, ease: 'power1.out' })
      return
    }
    try {
      tl.current = build()
    } catch (err) {
      // Never trap a guest behind a broken animation.
      console.error(err)
      finish()
    }
    // Failsafe: if anything stalls, finish the sequence.
    // (A timeline paused on purpose, e.g. by frame-by-frame tests, is left alone.)
    setTimeout(() => {
      const t = tl.current
      if (t && !t.paused() && t.progress() < 1) t.progress(1)
    }, 12000)
  }, [build, buildHeroReveal, event.musicUrl, finish, onPhase])

  const skip = () => {
    if (!tl.current) open()
    tl.current?.progress(1)
  }

  const trapFocus = (e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !root.current) return
    const items = [...root.current.querySelectorAll<HTMLElement>('button:not(:disabled)')]
    if (!items.length) return
    const i = items.indexOf(document.activeElement as HTMLElement)
    const next = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : (i + 1) % items.length
    e.preventDefault()
    items[next].focus()
  }

  const closed = phase === 'closed'

  return (
    <div ref={root} className="intro" data-phase={phase} role="dialog" aria-modal="true" aria-label="دعوة ليلة الحنّة" onKeyDown={trapFocus}>
      <div className="intro-bg" aria-hidden="true">
        <div className="intro-sun" />
        <div className="leaf-shadow ls-1"><OliveBranch leaves={16} seed={3} /></div>
        <div className="leaf-shadow ls-2"><OliveBranch leaves={13} seed={9} /></div>
        <div className="intro-light" />
        <Drift kind="mote" count={14} seed={5} />
        <div className="intro-vignette" />
      </div>

      <div className="intro-bar">
        <SoundToggle url={event.musicUrl} className="intro-sound" />
        <button type="button" className="intro-skip" onClick={skip}>
          تخطّي المقدّمة
        </button>
      </div>

      <header className="intro-head">
        <TatreezStar className="intro-ornament" size={2} />
        <p className="intro-copy intro-kicker">لديك دعوة خاصة</p>
        <TatreezBand className="intro-ornament intro-band" stitchSize={1.6} />
      </header>

      <div className="stage-tilt" ref={tilt}>
        <div className="stage-float" ref={float}>
          <div className="stage" onClick={open}>
            <div className="rig env-ground" aria-hidden="true" />
            <div className="rig env-thick" aria-hidden="true" />
            <div className="rig env-back" aria-hidden="true">
              <div className="env-lining" />
              <div className="env-shade" />
            </div>

            <div className="card" aria-hidden="true">
              <div className="card-shadow" />
              <div className="card-paper">
                <div className="card-face">
                  <Arch className="card-arch" />
                  <Crest className="card-crest" />
                  <span className="card-mono">{event.monogram}</span>
                  <span className="card-sub">ليلة الحنّة</span>
                  <TatreezBand className="card-band" stitchSize={1.2} />
                </div>
              </div>
            </div>

            <div className="rig env-pocket" aria-hidden="true">
              <div className="fold fold-left"><i /></div>
              <div className="fold fold-right"><i /></div>
              <div className="fold fold-bottom">
                <i>
                  <span className="foil-band"><TatreezBand stitchSize={1.5} /></span>
                </i>
              </div>
              <OliveBranch className="foil foil-a" tone="champagne" leaves={12} olives={2} seed={61} />
              <OliveBranch className="foil foil-b" tone="champagne" leaves={9} olives={1} seed={67} />
              <div className="pocket-sheen" />
              <div className="flap-cast" />
            </div>

            <div className="rig env-flap-wrap" aria-hidden="true">
              <div className="env-flap">
                <div className="flap-face flap-front">
                  <i>
                    <svg className="flap-foil" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <polyline points="5,2 50,93 95,2" vectorEffect="non-scaling-stroke" />
                    </svg>
                  </i>
                </div>
                <div className="flap-face flap-back"><i /></div>
              </div>
              <div className="flap-shadow" />
            </div>

            <button
              type="button"
              className="seal"
              onClick={(e) => {
                e.stopPropagation()
                open()
              }}
              aria-label="افتحي الدعوة"
              disabled={!closed}
            >
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
        <span className="hint-ring" />
        اضغطي لفتح الدعوة
      </p>
    </div>
  )
}
