import gsap from 'gsap'

// Scene 3: the Arabic invitation reveal. The intro appends this timeline to its
// master timeline at the hand-off label, so the whole opening is one sequence.

function parts(hero: HTMLElement) {
  const q = gsap.utils.selector(hero)
  return {
    rules: q('.face-rule .draw'),
    corners: q('.corner'),
    cornerLines: q('.corner .draw'),
    stems: q('.face-crest .ob-stem'),
    leaves: q('.face-crest .ob-leaf'),
    olives: q('.face-crest .ob-olive'),
    gem: q('.crest-gem'),
    lines: q('[data-reveal="line"]'),
    divider: q('.f-divider .draw'),
    dividerAll: q('.f-divider'),
    art: q('.hero-art'),
    cue: q('.scroll-cue'),
  }
}

/** Puts the hero in its pre-reveal state (called while the envelope is on screen). */
export function prepareHero(hero: HTMLElement) {
  const p = parts(hero)
  gsap.set([...p.rules, ...p.cornerLines, ...p.stems, ...p.divider], { strokeDashoffset: 1 })
  gsap.set(p.corners, { opacity: 0 })
  gsap.set([...p.leaves, ...p.olives], { scale: 0, transformOrigin: '0% 50%' })
  gsap.set(p.gem, { scale: 0, rotation: 45 })
  // Arabic must never be split into letters (it breaks the joins), so each line
  // is revealed whole with a right-to-left wipe that follows the reading direction.
  gsap.set(p.lines, { clipPath: 'inset(-20% 0% -20% 100%)', opacity: 0, y: 14, filter: 'blur(6px)' })
  gsap.set(p.dividerAll, { opacity: 0 })
  gsap.set(p.art, { opacity: 0, y: 30 })
  gsap.set(p.cue, { opacity: 0, y: -8 })
}

export function heroRevealTimeline(hero: HTMLElement) {
  const p = parts(hero)
  const t = gsap.timeline({ defaults: { ease: 'power2.out' } })
  t.addLabel('frame')
    .to(p.rules, { strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut', stagger: 0.25 }, 'frame')
    .to(p.corners, { opacity: 1, duration: 0.9, stagger: 0.08, ease: 'power3.out' }, 'frame+=0.35')
    .to(p.cornerLines, { strokeDashoffset: 0, duration: 1.1, stagger: 0.04, ease: 'power2.inOut' }, 'frame+=0.35')
    .addLabel('crest', 'frame+=0.25')
    .to(p.stems, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' }, 'crest')
    .to(p.leaves, { scale: 1, duration: 0.55, stagger: { each: 0.035, from: 'start' }, ease: 'back.out(1.8)' }, 'crest+=0.3')
    .to(p.olives, { scale: 1, duration: 0.5, stagger: 0.08, ease: 'back.out(2.2)' }, 'crest+=0.9')
    .to(p.gem, { scale: 1, rotation: 45, duration: 0.6, ease: 'back.out(2)' }, 'crest+=0.5')
    .addLabel('type', 'frame+=0.75')
    .to(p.lines, {
      clipPath: 'inset(-20% 0% -20% 0%)',
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      duration: 1.05,
      ease: 'power3.out',
      stagger: 0.34,
    }, 'type')
    .to(p.dividerAll, { opacity: 1, duration: 0.3 }, 'type+=1.75')
    .to(p.divider, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' }, 'type+=1.75')
    .to(p.art, { opacity: 1, y: 0, duration: 1.8, stagger: 0.15, ease: 'power2.out' }, 'type')
    .to(p.cue, { opacity: 1, y: 0, duration: 0.7 }, '>-0.6')
  // Drop the filter/clip once done so text stays crisp and selectable.
  t.set(p.lines, { clearProps: 'filter,clipPath' })
  return t
}
