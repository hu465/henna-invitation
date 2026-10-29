import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import gsap from 'gsap'
import type { EventDetails } from '../config/event'
import { WaxSealArt } from '../art/Ornaments'
import { Baked, BevelStroke, PaperFinish, Sprig, pauseBaking } from '../art/Relief'
import { Drift } from '../art/Drift'
import { SoundToggle } from '../audio/SoundToggle'
import { ambience, soundPreferred } from '../audio/ambience'
import { crack, primeFoley, rustle } from '../audio/foley'
import { useViewport } from '../lib/useViewport'
import { createFlapRenderer, type FlapRenderer, type FlapState } from './flapGL'
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

const toPoly = (pts: Pt[]) => `polygon(${pts.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(',')})`

function Petal({ side, w, h, seed, onTexture }: { side: Side; w: number; h: number; seed: number; onTexture: (side: Side, url: string) => void }) {
  const { pts, origin } = petalGeometry(side, w, h)
  const clipId = `petal-clip-${side}`
  const [texture, setTexture] = useState<string | null>(null)
  const ready = useCallback((url: string) => {
    setTexture(url)
    onTexture(side, url)
  }, [onTexture, side])
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
  const sprigLen = Math.min(art.len * 0.66, 380)

  return (
    <div className={`petal petal--${side}`} style={{ transformOrigin: origin }}>
      <Baked w={w} h={h} priority={0} onTexture={ready}>
        <defs>
          <clipPath id={clipId}>
            <polygon points={art.rim} />
          </clipPath>
          <clipPath id={`${clipId}-paper`}>
            <polygon points={pts.map((p) => p.join(',')).join(' ')} />
          </clipPath>
        </defs>
        {/* Soft cast shadow on the petals beneath, then the paper with a bevelled edge. */}
        <polygon points={pts.map((p) => p.join(',')).join(' ')} fill="rgba(14,18,8,0.55)" transform="translate(3 7)" filter="url(#soft-shadow)" />
        <polygon points={pts.map((p) => p.join(',')).join(' ')} fill="rgba(14,18,8,0.3)" transform="translate(0.8 1.4)" />
        <BevelStroke d={`M${pts.map((p) => p.join(' ')).join(' L')}Z`} paper={PAPER} width={1.4} fill={PAPER} hi="rgba(244,236,210,0.32)" sh="rgba(20,26,12,0.5)" depth={0.9} />
        <BevelStroke d={`M${art.rim.replace(/ /g, ' L').replace(/,/g, ' ')}Z`} paper={PAPER} width={1.4} hi="rgba(244,236,210,0.28)" sh="rgba(20,26,12,0.45)" depth={0.8} />
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
      {/* At rest the flap is one sheet with its soft shadow; WebGL takes over to bend it. */}
      <div className="petal-rest" style={{ backgroundColor: texture ? 'transparent' : PAPER, backgroundImage: texture ? `url(${texture})` : undefined, clipPath: texture ? undefined : toPoly(pts) }} />
    </div>
  )
}

export function EnvelopeIntro({ event, phase, onPhase, buildHeroReveal }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const tl = useRef<gsap.core.Timeline | null>(null)
  const { w, h } = useViewport()
  const canvas = useRef<HTMLCanvasElement>(null)
  const gl = useRef<FlapRenderer | null>(null)
  // Each flap's baked artwork, decoded and ready to upload as a WebGL texture.
  const images = useRef<Partial<Record<Side, HTMLImageElement>>>({})
  const onTexture = useCallback((side: Side, url: string) => {
    const img = new Image()
    img.src = url
    img.decode().then(() => (images.current[side] = img), () => {})
  }, [])

  useEffect(() => () => {
    gl.current?.dispose()
    gl.current = null
  }, [])

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
      .call(crack, [], 'break')
      // The impact travels through the paper: a tiny, quick shudder.
      .to(q('.petals, .flap-canvas'), { keyframes: { x: [0, -2.5, 2, -1.2, 0.8, 0], y: [0, 1.5, -1, 0.6, 0, 0] }, duration: 0.24, ease: 'none' }, 'break')
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
    // Each flap lifts from its hinge and curls as it goes (the free end lagging,
    // as paper does), lit as it turns: in WebGL when available, otherwise as a
    // rigid CSS 3D flap.
    const lift = gsap.parseEase('power2.inOut')
    const sides: Side[] = ['top', 'left', 'right', 'bottom']
    const imgs = images.current
    let renderer: FlapRenderer | null = null
    if (canvas.current && sides.every((s) => imgs[s])) {
      try {
        renderer = createFlapRenderer(canvas.current, w, h, imgs as Record<Side, HTMLImageElement>)
      } catch (err) {
        // Falls back to rigid CSS flaps.
        console.warn('3D flaps unavailable:', err)
        renderer = null
      }
    }
    gl.current = renderer
    const states = Object.fromEntries(sides.map((s) => [s, { angle: 0, curl: 0, alpha: 1 }])) as Record<Side, FlapState>
    let dirty = true
    if (import.meta.env.DEV) Object.assign(window, { __flaps: { states, webgl: !!renderer } })
    const draw = () => {
      if (renderer && dirty) {
        renderer.render(states)
        dirty = false
      }
    }
    if (renderer) {
      draw()
      gsap.ticker.add(draw)
      t.eventCallback('onComplete', () => {
        gsap.ticker.remove(draw)
        finish()
      })
      // Hand over from the resting paper to the live 3D flaps.
      t.set(q('.flap-canvas'), { autoAlpha: 1 }, 'envelopeOpening')
        .set(q('.petal'), { autoAlpha: 0 }, 'envelopeOpening')
    }
    const unfold = (side: Side, at: number, dur = 1.0) => {
      const el = q(`.petal--${side}`)[0] as HTMLElement
      const st = { p: 0 }
      const rigid = { rotationX: { top: 172, bottom: -172 }, rotationY: { left: -172, right: 172 } }
      t.to(st, {
        p: 1,
        duration: dur,
        ease: 'none',
        onUpdate: () => {
          const angle = lift(st.p) * 172
          if (renderer) {
            states[side].angle = angle
            states[side].curl = Math.sin(Math.PI * Math.min(1, st.p * 1.15)) * 38
            states[side].alpha = st.p < 0.66 ? 1 : Math.max(0, 1 - (st.p - 0.66) / 0.3)
            dirty = true
          } else {
            const prop = side === 'top' || side === 'bottom' ? 'rotationX' : 'rotationY'
            const target = prop === 'rotationX' ? rigid.rotationX[side as 'top' | 'bottom'] : rigid.rotationY[side as 'left' | 'right']
            gsap.set(el, { [prop]: (target * angle) / 172, opacity: st.p < 0.66 ? 1 : Math.max(0, 1 - (st.p - 0.66) / 0.3) })
          }
        },
      }, `envelopeOpening+=${at}`)
        .call(rustle, [dur * 0.7], `envelopeOpening+=${at}`)
    }
    // A slow push-in, as if the camera leans toward the opening envelope.
    t.to(q('.petals, .flap-canvas'), { scale: 1.07, duration: 1.7, ease: 'power1.inOut' }, 'envelopeOpening')
    // Warm light spills out of the envelope as it opens.
    t.fromTo(q('.intro-glow'), { opacity: 0, scale: 0.6 }, { opacity: 0.85, scale: 1.25, duration: 0.9, ease: 'power2.out' }, 'envelopeOpening+=0.15')
    unfold('top', 0)
    unfold('left', 0.3)
    unfold('right', 0.38)
    unfold('bottom', 0.6)
    t.set(q('.flap-canvas'), { autoAlpha: 0 }, 'envelopeOpening+=1.6')
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
  }, [buildHeroReveal, finish, onPhase, w, h])

  const open = useCallback(() => {
    if (tl.current || !root.current) return
    pauseBaking(true)
    if (soundPreferred()) {
      primeFoley()
      ambience(event.musicUrl).start()
    }
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
        <Petal side="bottom" w={w} h={h} seed={31} onTexture={onTexture} />
        <Petal side="left" w={w} h={h} seed={7} onTexture={onTexture} />
        <Petal side="right" w={w} h={h} seed={19} onTexture={onTexture} />
        <Petal side="top" w={w} h={h} seed={3} onTexture={onTexture} />
      </div>
      <canvas ref={canvas} className="flap-canvas" aria-hidden="true" />

      <div className="intro-glow" aria-hidden="true" />
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
