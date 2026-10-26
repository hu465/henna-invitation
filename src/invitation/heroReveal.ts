import gsap from 'gsap'

// Scene 2–3 inside the envelope: the satin ribbon unties and slides away, the
// card lifts to fill the screen, and the Arabic writing appears. The intro
// adds this timeline to its master timeline at `cardEmerging`; the `writing`
// label marks the start of `invitationRevealing`.

const SHADOW_LOW = '0px 3px 8px -3px rgba(15,20,10,0.6), 0px 1px 2px 0px rgba(15,20,10,0.45)'
const SHADOW_HIGH = '0px 36px 70px -18px rgba(15,20,10,0.62), 0px 12px 24px -8px rgba(15,20,10,0.45)'

function parts(hero: HTMLElement) {
  const q = gsap.utils.selector(hero)
  return {
    face: q('.face'),
    loopL: q('.bow-loop--l'),
    loopR: q('.bow-loop--r'),
    tailL: q('.bow-tail--l'),
    tailR: q('.bow-tail--r'),
    knot: q('.bow-knot'),
    ribbonL: q('.ribbon-l'),
    ribbonR: q('.ribbon-r'),
    ribbon: q('.ribbon'),
    wrap: q('.ribbon-wrap'),
    lines: q('[data-reveal="line"]'),
    ink: q('.title-ink'),
    divider: q('.f-divider .draw'),
    dividerAll: q('.f-divider'),
    petals: q('.hero-petals'),
    cue: q('.scroll-cue'),
  }
}

/** Puts the card back inside the envelope, tied with its ribbon. */
export function prepareHero(hero: HTMLElement) {
  const p = parts(hero)
  // Lying in the envelope the card casts a tight shadow; it grows as the card lifts.
  gsap.set(p.face, { scale: 0.86, transformOrigin: '50% 50%', boxShadow: SHADOW_LOW })
  gsap.set([...p.loopL, ...p.loopR, ...p.tailL, ...p.tailR, ...p.knot, ...p.ribbonL, ...p.ribbonR, ...p.wrap], { clearProps: 'all' })
  gsap.set(p.ribbon, { autoAlpha: 1 })
  // Arabic is never split into letters (that breaks the joins): each line is
  // revealed whole with a right-to-left wipe that follows the reading direction.
  gsap.set(p.lines, { clipPath: 'inset(-25% 0% -25% 100%)', opacity: 0, y: 10 })
  // The heading is traced as a stroke, then filled with ink.
  gsap.set(p.ink, { strokeDasharray: 1400, strokeDashoffset: 1400, fillOpacity: 0, strokeOpacity: 1 })
  gsap.set(p.divider, { strokeDashoffset: 1 })
  gsap.set([...p.dividerAll, ...p.petals], { opacity: 0 })
  gsap.set(p.cue, { opacity: 0, y: -8 })
}

export function heroRevealTimeline(hero: HTMLElement) {
  const p = parts(hero)
  const w = hero.offsetWidth
  const [basmala, love, lead, ...rest] = p.lines
  const wipe = { clipPath: 'inset(-25% 0% -25% 0%)', opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }
  const t = gsap.timeline({ defaults: { ease: 'power2.out' } })

  // The bow is pulled: loops collapse into the knot, tails drop, the band parts.
  t.addLabel('untie', 0)
    .to(p.knot, { scale: 1.15, duration: 0.14, ease: 'power2.out', transformOrigin: '50% 50%' }, 'untie')
    .to(p.loopL, { scaleX: 0.15, scaleY: 0.5, opacity: 0, duration: 0.45, ease: 'power2.in', transformOrigin: '100% 50%' }, 'untie+=0.1')
    .to(p.loopR, { scaleX: 0.15, scaleY: 0.5, opacity: 0, duration: 0.45, ease: 'power2.in', transformOrigin: '0% 50%' }, 'untie+=0.1')
    .to(p.tailL, { y: 90, rotation: 22, opacity: 0, duration: 0.6, ease: 'power2.in', transformOrigin: '100% 0%' }, 'untie+=0.15')
    .to(p.tailR, { y: 96, rotation: -20, opacity: 0, duration: 0.6, ease: 'power2.in', transformOrigin: '0% 0%' }, 'untie+=0.18')
    .to(p.knot, { scale: 0, opacity: 0, duration: 0.25, ease: 'power2.in' }, 'untie+=0.35')
    .to(p.wrap, { opacity: 0, duration: 0.3 }, 'untie+=0.9')
    .to(p.ribbonL, { x: -w * 1.05, y: 18, rotation: -3, duration: 0.85, ease: 'power3.in', transformOrigin: '100% 50%' }, 'untie+=0.32')
    .to(p.ribbonR, { x: w * 1.05, y: -14, rotation: 3, duration: 0.85, ease: 'power3.in', transformOrigin: '0% 50%' }, 'untie+=0.36')
    .set(p.ribbon, { autoAlpha: 0 }, 'untie+=1.25')

  // The card lifts out of the envelope until it fills the screen.
    .addLabel('lift', 'untie+=0.75')
    .to(p.face, { scale: 1, boxShadow: SHADOW_HIGH, duration: 0.9, ease: 'power3.inOut' }, 'lift')
    .to(p.petals, { opacity: 1, duration: 1.2 }, 'lift+=0.5')

  // invitationRevealing: the writing appears line by line; the heading is inked.
    .addLabel('writing', 'lift+=0.7')
    .to([basmala, love], { ...wipe, stagger: 0.14 }, 'writing')
    .to(lead, wipe, 'writing+=0.3')
    .to(p.ink, { strokeDashoffset: 0, duration: 1.15, ease: 'power1.inOut' }, 'writing+=0.4')
    .to(p.ink, { fillOpacity: 1, duration: 0.55, ease: 'power1.out' }, 'writing+=1.05')
    .to(p.ink, { strokeOpacity: 0.25, duration: 0.5 }, 'writing+=1.3')
    .to(rest, { ...wipe, stagger: 0.12 }, 'writing+=1.15')
    .to(p.dividerAll, { opacity: 1, duration: 0.2 }, 'writing+=1.3')
    .to(p.divider, { strokeDashoffset: 0, duration: 0.7, ease: 'power2.inOut' }, 'writing+=1.3')
    .to(p.cue, { opacity: 1, y: 0, duration: 0.5 }, 'writing+=1.9')
  // Drop the clip once done so text stays crisp and selectable.
  t.set(p.lines, { clearProps: 'clipPath' })
  return t
}
