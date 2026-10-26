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

## Emotional journey (≈9.6 s)
| t (s) | Beat |
|---|---|
| 0.00 | Tap: the seal presses in, glows and springs back |
| 0.32 | A hairline crack draws through the wax |
| 0.60 | Wax splits into two halves that fall, with crumbs |
| 0.72 | Flap swings 180° on its top hinge (CSS 3D, two-faced), revealing the olive lining |
| 1.72 | Card slides out as the envelope settles downward |
| 3.02 | Card travels forward: perspective arc (rotateX −14°→0), deeper shadow, backdrop dims |
| 4.77 | Card expands to cover the screen and becomes the page |
| 5.77 | Frame rules draw, the crest grows leaf by leaf, then seven lines of Arabic reveal in sequence |
| ~9.6 | Scroll cue appears; page unlocks |

## Why not Three.js
The `threejs` skill was evaluated. CSS 3D transforms already give a real hinge rotation,
perspective travel and backface switching, and they keep Arabic text as live, shaped, selectable,
screen-reader-visible DOM. WebGL text would need a Arabic shaping pipeline, cost roughly 600 KB more, and
add a GPU/battery and accessibility burden without a visible gain for a paper envelope.

## Peak moment
The peak is the instant the card fills the screen and the olive crest grows over the
ivory. Everything after it (countdown, details, quote, RSVP) uses calmer scroll reveals, following the
`aesthetic` skill's "restraint" guidance and `ui-ux-pro-max`'s Standard Scroll Reveal preset.
