import gsap from 'gsap'

// Scene 3: the Arabic invitation reveal. The intro appends this timeline to
// its master timeline at the `invitationRevealing` label, so the whole opening
// is one sequence (≈2.9 s here).

function parts(hero: HTMLElement) {
  const q = gsap.utils.selector(hero)
  return {
    band: q('.frame-band'),
    inner: q('.frame-key'),
    corners: q('.corner'),
    arch: q('.face-arch .draw'),
    archKey: q('.face-arch .arch-key'),
    stems: q('.face-crest .ob-stem'),
    leaves: q('.face-crest .ob-leaf'),
    olives: q('.face-crest .ob-olive'),
    gem: q('.crest-gem'),
    lines: q('[data-reveal="line"]'),
    ink: q('.title-ink'),
    divider: q('.f-divider .draw'),
    dividerAll: q('.f-divider'),
    art: q('.hero-layer'),
    cue: q('.scroll-cue'),
  }
}

/** Puts the hero in its pre-reveal state (called while the envelope is on screen). */
export function prepareHero(hero: HTMLElement) {
  const p = parts(hero)
  gsap.set([...p.arch, ...p.stems, ...p.divider], { strokeDashoffset: 1 })
  // The frame opens out from the centre like light spreading across paper.
  gsap.set([...p.band, ...p.inner], { clipPath: 'inset(50% 50% 50% 50%)' })
  gsap.set([...p.corners, ...p.archKey, ...p.dividerAll], { opacity: 0 })
  gsap.set([...p.leaves, ...p.olives], { scale: 0, transformOrigin: '0% 50%' })
  gsap.set(p.gem, { scale: 0, rotation: 45 })
  // Arabic is never split into letters (that breaks the joins): each line is
  // revealed whole with a right-to-left wipe that follows the reading direction.
  gsap.set(p.lines, { clipPath: 'inset(-25% 0% -25% 100%)', opacity: 0, y: 12 })
  // The heading is traced as a stroke, then filled with ink.
  gsap.set(p.ink, { strokeDasharray: 1400, strokeDashoffset: 1400, fillOpacity: 0, strokeOpacity: 1 })
  gsap.set(p.art, { opacity: 0 })
  gsap.set(p.cue, { opacity: 0, y: -8 })
}

export function heroRevealTimeline(hero: HTMLElement) {
  const p = parts(hero)
  const [basmala, love, lead, ...rest] = p.lines
  const wipe = { clipPath: 'inset(-25% 0% -25% 0%)', opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }
  const t = gsap.timeline({ defaults: { ease: 'power2.out' } })
  t.addLabel('frame')
    .to(p.art, { opacity: 1, duration: 1.4, stagger: 0.12, ease: 'power1.out' }, 'frame')
    .to(p.band, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'expo.inOut' }, 'frame')
    .to(p.inner, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.0, ease: 'expo.inOut' }, 'frame+=0.15')
    .to(p.corners, { opacity: 1, duration: 0.5, stagger: 0.06 }, 'frame+=0.6')
    .to(p.arch, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut', stagger: 0.12 }, 'frame+=0.1')
    .to(p.archKey, { opacity: 1, duration: 0.4 }, 'frame+=0.9')
    .addLabel('crest', 'frame+=0.2')
    .to(p.stems, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' }, 'crest')
    .to(p.leaves, { scale: 1, duration: 0.45, stagger: 0.022, ease: 'back.out(1.8)' }, 'crest+=0.2')
    .to(p.olives, { scale: 1, duration: 0.4, stagger: 0.06, ease: 'back.out(2.2)' }, 'crest+=0.65')
    .to(p.gem, { scale: 1, rotation: 45, duration: 0.5, ease: 'back.out(2)' }, 'crest+=0.4')
    .to([basmala, love], { ...wipe, stagger: 0.14 }, 'frame+=0.35')
    .addLabel('heading', 'frame+=0.6')
    .to(lead, wipe, 'heading')
    .to(p.ink, { strokeDashoffset: 0, duration: 1.25, ease: 'power1.inOut' }, 'heading+=0.1')
    .to(p.ink, { fillOpacity: 1, duration: 0.6, ease: 'power1.out' }, 'heading+=0.85')
    .to(p.ink, { strokeOpacity: 0.25, duration: 0.6 }, 'heading+=1.1')
    .to(rest, { ...wipe, stagger: 0.12 }, 'heading+=1.0')
    .to(p.dividerAll, { opacity: 1, duration: 0.2 }, 'heading+=1.15')
    .to(p.divider, { strokeDashoffset: 0, duration: 0.7, ease: 'power2.inOut' }, 'heading+=1.15')
    .to(p.cue, { opacity: 1, y: 0, duration: 0.5 }, 'heading+=1.8')
  // Drop the clip once done so text stays crisp and selectable.
  t.set(p.lines, { clearProps: 'clipPath' })
  return t
}
