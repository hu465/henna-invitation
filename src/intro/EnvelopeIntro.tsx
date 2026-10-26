import { useCallback, useEffect, useMemo, useRef, type KeyboardEvent } from 'react'
import gsap from 'gsap'
import type { EventDetails } from '../config/event'
import { WaxSealArt } from '../art/Ornaments'
import { Baked, BevelStroke, PaperFinish, Sprig, pauseBaking } from '../art/Relief'
import { Drift } from '../art/Drift'
import { SoundToggle } from '../audio/SoundToggle'
import { ambience, soundPreferred } from '../audio/ambience'
import { useViewport } from '../lib/useViewport'
import './envelope.css'

/** The opening is an explicit state machine; each phase is a label on one GSAP timeline. */
export type Phase = 'closed' | 'sealActivated' | 'envelopeOpening' | 'cardEmerging' | 'invitationRevealing' | 'invitationOpen'

interface Props {
  event: EventDetails
  phase: Phase
  onPhase: (p: Phase) => void
  /** Builds the card reveal (ribbon, lift, writing) so it joins the master timeline. */
  buildHeroReveal: () => gsap.core.Timeline | null
}

type Side = 'top' | 'left' | 'right' | 'bottom'
type Pt = [number, number]

const PAPER = '#5d6d44'
const CRUMBS = 9
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Petal-fold envelope geometry: four triangles meeting under the seal. */
function petalGeometry(side: Side, w: number, h: number): { pts: Pt[]; origin: string } {
  switch (side) {
    case 'top':
      return { pts: [[0, 0], [w, 0], [w / 2, h * 0.56]], origin: '50% 0%' }
    case 'bottom':
      return { pts: [[0, h], [w, h], [w / 2, h * 0.44]], origin: '50% 100%' }
    case 'left':
      return { pts: [[0, 0], [0, h], [w * 0.58, h / 2]], origin: '0% 50%' }
    case 'right':
      return { pts: [[w, 0], [w, h], [w * 0.42, h / 2]], origin: '100% 50%' }
  }
}

/** Darkening toward the free tip, used while a petal turns away from the light. */
const shadeGradient = (side: Side) =>
  `linear-gradient(${{ top: 180, bottom: 0, left: 90, right: 270 }[side]}deg, rgba(10,14,6,0.15), rgba(10,14,6,0.65))`

const toPoly = (pts: Pt[]) => `polygon(${pts.map(([x, y]) => `${x}px ${y}px`).join(',')})`

function Petal({ side, w, h, seed }: { side: Side; w: number; h: number; seed: number }) {
  const { pts, origin } = petalGeometry(side, w, h)
  const clipId = `petal-clip-${side}`
  const art = useMemo(() => {
    const [a, b, tip] = pts
    const base: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
    const dx = base[0] - tip[0], dy = base[1] - tip[1]
    const len = Math.hypot(dx, dy)
    const ang = (Math.atan2(dy, dx) * 180) / Math.PI
    const start: Pt = [tip[0] + (dx / len) * 34, tip[1] + (dy / len) * 34]
    // Inset rim, pulled toward the centroid.
    const c: Pt = [(a[0] + b[0] + tip[0]) / 3, (a[1] + b[1] + tip[1]) / 3]
    const k = 1 - 22 / Math.min(len, 400)
    const rim = pts.map(([x, y]) => `${c[0] + (x - c[0]) * k},${c[1] + (y - c[1]) * k}`).join(' ')
    return { start, ang, len, rim }
  }, [pts])
  // The back face is flipped about the screen centre, so its outline is mirrored.
  const backPts: Pt[] = side === 'top' || side === 'bottom' ? pts.map(([x, y]) => [x, h - y]) : pts.map(([x, y]) => [w - x, y])
  const sprigLen = Math.min(art.len * 0.66, 380)

  return (
    <div className={`petal petal--${side}`} style={{ transformOrigin: origin }}>
      <div className="petal-face petal-front">
        <Baked w={w} h={h} priority={0}>
          <defs>
            <clipPath id={clipId}>
              <polygon points={art.rim} />
            </clipPath>
          </defs>
          {/* Soft cast shadow on the petals beneath, then the paper with a bevelled edge. */}
          <polygon points={pts.map((p) => p.join(',')).join(' ')} fill="rgba(14,18,8,0.55)" transform="translate(3 7)" filter="url(#soft-shadow)" />
          <polygon points={pts.map((p) => p.join(',')).join(' ')} fill="rgba(14,18,8,0.3)" transform="translate(0.8 1.4)" />
          <BevelStroke d={`M${pts.map((p) => p.join(' ')).join(' L')}Z`} paper={PAPER} width={1.4} fill={PAPER} hi="rgba(244,236,210,0.32)" sh="rgba(20,26,12,0.5)" depth={0.9} />
          <BevelStroke d={`M${art.rim.replace(/ /g, ' L').replace(/,/g, ' ')}Z`} paper={PAPER} width={1.4} hi="rgba(244,236,210,0.28)" sh="rgba(20,26,12,0.45)" depth={0.8} />
          <defs>
            <clipPath id={`${clipId}-paper`}>
              <polygon points={pts.map((p) => p.join(',')).join(' ')} />
            </clipPath>
          </defs>
          <PaperFinish w={w} h={h} clip={`${clipId}-paper`} grain={1.1} />
          {/* Each petal carries its own leaves, kept inside its rim. */}
          <g clipPath={`url(#${clipId})`}>
          <g transform={`translate(${art.start[0]} ${art.start[1]}) rotate(${art.ang})`}>
            <Sprig length={sprigLen} leaves={11} seed={seed} fill={PAPER} filter="url(#emboss-olive)" transform="rotate(-21)" leafScale={0.24} curve={0.1} />
            <Sprig length={sprigLen * 0.96} leaves={11} seed={seed + 11} fill={PAPER} filter="url(#emboss-olive)" transform="rotate(21)" leafScale={0.24} curve={-0.1} />
            <Sprig length={sprigLen * 0.5} leaves={7} seed={seed + 23} fill={PAPER} filter="url(#emboss-olive)" leafScale={0.26} curve={0.04} />
          </g>
          </g>
        </Baked>
        <div className="petal-shade" style={{ clipPath: toPoly(pts), background: shadeGradient(side) }} />
      </div>
      <div className="petal-face petal-back" style={{ clipPath: toPoly(backPts) }} />
    </div>
  )
}

export function EnvelopeIntro({ event, phase, onPhase, buildHeroReveal }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const tl = useRef<gsap.core.Timeline | null>(null)
  const { w, h } = useViewport()

  const unlock = () => document.documentElement.classList.remove('is-locked')

  // Scroll is locked only while the envelope is on screen, and every exit path unlocks it.
  useEffect(() => {
    document.documentElement.classList.add('is-locked')
    addEventListener('pagehide', unlock)
    return () => {
      unlock()
      pauseBaking(false)
      removeEventListener('pagehide', unlock)
      tl.current?.kill()
    }
  }, [])

  const finish = useCallback(() => {
    pauseBaking(false)
    unlock()
    onPhase('invitationOpen')
  }, [onPhase])

  const build = useCallback(() => {
    const q = gsap.utils.selector(root)
    const t = gsap.timeline({ defaults: { ease: 'power2.inOut' }, onComplete: finish })
    if (import.meta.env.DEV) Object.assign(window, { __introTl: t })

    // ── sealActivated: a physical press, a hairline crack, the wax parts. ──
    t.addLabel('sealActivated', 0)
      .call(() => onPhase('sealActivated'), [], 'sealActivated')
      .to(q('.seal'), { scale: 0.9, duration: 0.12, ease: 'power2.in' }, 'sealActivated')
      .to(q('.seal-glow'), { opacity: 1, scale: 1.3, duration: 0.3, ease: 'power2.out' }, 'sealActivated')
      .to(q('.seal'), { scale: 1.05, duration: 0.18, ease: 'back.out(3)' }, 'sealActivated+=0.12')
      .to(q('.intro-copy, .intro-skip'), { autoAlpha: 0, duration: 0.4, ease: 'power2.in', stagger: 0.04 }, 'sealActivated+=0.05')
      .fromTo(q('.seal-crack path'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.18, ease: 'power1.in' }, 'sealActivated+=0.24')
      .addLabel('break', 'sealActivated+=0.42')
      .to(q('.seal-crack, .seal-glow'), { opacity: 0, duration: 0.15 }, 'break')
      .to(q('.seal-l'), { x: -36, y: 90, rotation: -34, duration: 0.75, ease: 'power2.in' }, 'break')
      .to(q('.seal-r'), { x: 30, y: 104, rotation: 28, duration: 0.75, ease: 'power2.in' }, 'break')
      .to(q('.seal-half'), { opacity: 0, duration: 0.3, ease: 'power1.in' }, 'break+=0.45')
      .set(q('.crumb'), { opacity: 1 }, 'break')
      .to(q('.crumb'), {
        x: () => gsap.utils.random(-90, 90),
        y: () => gsap.utils.random(40, 160),
        rotation: () => gsap.utils.random(-180, 180),
        opacity: 0,
        duration: () => gsap.utils.random(0.5, 0.85),
        ease: 'power2.out',
      }, 'break')

    // ── envelopeOpening: the four petals unfold on their hinges, top first. ──
      .addLabel('envelopeOpening', 'break+=0.04')
      .call(() => onPhase('envelopeOpening'), [], 'envelopeOpening')
    // Each flap darkens as it turns edge-on to the light, then shows its lining.
    const unfold = (side: Side, prop: 'rotationX' | 'rotationY', to: number, at: number) =>
      t.to(q(`.petal--${side}`), { [prop]: to, duration: 0.95, ease: 'power2.inOut' }, `envelopeOpening+=${at}`)
        .to(q(`.petal--${side} .petal-shade`), { keyframes: { opacity: [0, 0.85, 0] }, duration: 0.7, ease: 'none' }, `envelopeOpening+=${at}`)
        .to(q(`.petal--${side}`), { opacity: 0, duration: 0.3, ease: 'power1.in' }, `envelopeOpening+=${at + 0.62}`)
    // A slow push-in, as if the camera leans toward the opening envelope.
    t.to(q('.petals'), { scale: 1.07, duration: 1.6, ease: 'power1.inOut' }, 'envelopeOpening')
    unfold('top', 'rotationX', 172, 0)
    unfold('left', 'rotationY', -172, 0.3)
    unfold('right', 'rotationY', 172, 0.38)
    unfold('bottom', 'rotationX', -172, 0.6)
    t.to(q('.intro-ambient'), { opacity: 0, duration: 0.6 }, 'envelopeOpening+=0.3')
      .set(root.current, { autoAlpha: 0 }, 'envelopeOpening+=1.55')

    // ── cardEmerging → invitationRevealing: ribbon unties, card lifts, the writing appears. ──
      .addLabel('cardEmerging', 'envelopeOpening+=1.2')
      .call(() => onPhase('cardEmerging'), [], 'cardEmerging')
      .call(unlock, [], 'cardEmerging+=2')
    const hero = buildHeroReveal()
    if (hero) {
      t.add(hero, 'cardEmerging')
      t.call(() => onPhase('invitationRevealing'), [], `cardEmerging+=${hero.labels.writing ?? 1.6}`)
    } else {
      t.call(() => onPhase('invitationRevealing'), [], 'cardEmerging')
    }
    return t
  }, [buildHeroReveal, finish, onPhase])

  const open = useCallback(() => {
    if (tl.current || !root.current) return
    pauseBaking(true)
    if (soundPreferred()) ambience(event.musicUrl).start()
    if (reducedMotion()) {
      // Calm alternative: a short cross-fade with the invitation already composed.
      onPhase('sealActivated')
      buildHeroReveal()?.progress(1)
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
    // Failsafe: finish if the sequence stalls (a deliberately paused timeline is left alone).
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

  return (
    <div ref={root} className="intro" data-phase={phase} role="dialog" aria-modal="true" aria-label="دعوة ليلة الحنّة" onKeyDown={trapFocus} onClick={open}>
      <div className="petals" aria-hidden="true">
        <Petal side="bottom" w={w} h={h} seed={31} />
        <Petal side="left" w={w} h={h} seed={7} />
        <Petal side="right" w={w} h={h} seed={19} />
        <Petal side="top" w={w} h={h} seed={3} />
      </div>

      <div className="intro-ambient" aria-hidden="true">
        <div className="intro-sheen" />
        <Drift kind="mote" count={12} seed={5} />
      </div>

      <p className="intro-copy intro-kicker">لديك دعوة خاصة</p>

      <button
        type="button"
        className="seal"
        onClick={(e) => {
          e.stopPropagation()
          open()
        }}
        aria-label="افتحي الدعوة"
        disabled={phase !== 'closed'}
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

      <p className="intro-copy intro-hint" aria-hidden="true">
        <span className="hint-ring" />
        اضغطي لفتح الدعوة
      </p>

      <div className="intro-bar" onClick={(e) => e.stopPropagation()}>
        <SoundToggle url={event.musicUrl} className="intro-sound" />
        <button type="button" className="intro-skip" onClick={skip}>
          تخطّي المقدّمة
        </button>
      </div>
    </div>
  )
}
