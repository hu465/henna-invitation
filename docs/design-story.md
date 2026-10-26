# Design story & motion principles

## Reference analysis
The WooowInvites reference page could not be loaded from the build environment: the network
policy returned 403 and DNS failed. The principles below come from the brief's description of
that experience and from the genre of premium tap-to-open invitations. No assets were copied;
all artwork (olive branches, seal, frame, lining) is original SVG/CSS.

Motion principles reproduced:
1. **Physical causality**: every movement has a cause. The seal must break before the flap can move, and the flap must clear before the card can rise.
2. **One camera**: a single GSAP master timeline (labels `press → crack → break → flap → rise → forward → expand → handoff`) drives every layer, so nothing moves independently.
3. **Believable layering**: z-index swaps happen exactly when real paper would pass: the flap goes behind the card at 90° and the card comes in front of the pocket once fully clear.
4. **Depth through counter-motion**: the envelope sinks while the card rises; the backdrop dims as the card comes toward the guest (spotlight).
5. **Continuity of material**: the card scales until its ivory paper *is* the page, then the artwork and Arabic typography are drawn onto it.
6. **Reading direction**: Arabic lines are revealed with a right-to-left wipe that follows the reading direction.

## Opening state machine (one GSAP timeline, ≈6.9 s)
Each phase is a label on the master timeline. `onPhase` reports it to the app, which mirrors it on
`<html data-invite-phase="…">` for styling and tests.

| t (s) | Phase | What happens |
|---|---|---|
| 0.00 | `closed` → `sealActivated` | The seal presses in, glows and springs back. A hairline crack draws through the wax (0.24 s), and at 0.42 s the two halves fall away with crumbs. |
| 0.48 | `envelopeOpening` | The flap swings 180° on its top hinge (CSS 3D, two-faced: olive outside, ivory lining inside). At 90° its z-order passes behind the card, and the inside of the envelope darkens. |
| 1.10 | `cardEmerging` | The card slides up out of the pocket while the envelope sinks (counter-motion). Once the card clears, it travels forward and up with a perspective arc and a deepening shadow while the room dims. |
| 3.15 | (expand) | The card scales until its ivory paper *is* the page. |
| 3.95 | `invitationRevealing` | The deep-olive frame opens from the centre, the arch draws, and the olive crest grows leaf by leaf. Arabic lines wipe in right-to-left. The heading «ليلة الحنّة» is traced as a stroke, then filled with ink. |
| ≈6.85 | `invitationOpen` | Scroll unlocks, focus moves to the heading, and the scenes below come alive on scroll. |

Skipping (button or `tl.progress(1)`), reduced motion (a 0.45 s cross-fade) and a 12 s failsafe all
end in `invitationOpen` with scroll unlocked.

## Why not Three.js
The `threejs` skill was evaluated. CSS 3D transforms already give a real hinge rotation,
perspective travel and backface switching, and they keep Arabic text as live, shaped, selectable,
screen-reader-visible DOM. WebGL text would need an Arabic shaping pipeline, cost roughly 600 KB more, and
add a GPU/battery and accessibility burden without a visible gain for a paper envelope.

## Peak moment
The peak is the instant the card fills the screen and the olive crest grows over the
ivory. Everything after it (countdown, details, quote, RSVP) uses calmer scroll reveals, following the
`aesthetic` skill's "restraint" guidance and `ui-ux-pro-max`'s Standard Scroll Reveal preset.
