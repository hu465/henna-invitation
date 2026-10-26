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

## Reference: the client's video (tone-on-tone embossed invitation)
The client shared a screen recording of a premium digital invitation and asked for that exact
style in our palette. Principles taken from it:
- **One material, sculpted.** Everything is the same paper colour, lifted or pressed by light and
  shadow (bas-relief), never outlined in a contrasting colour. Built with SVG bevel filters drawn
  once and baked to bitmaps (`src/art/Relief.tsx`).
- **Full-bleed envelope.** The phone *is* the envelope: a four-petal fold with relief leaves and a
  wax seal at the centre.
- **Petals unfold, a satin ribbon unties, the card is revealed in place.** No flying card.
- **Ornate cartouche** with relief roses and leaves in the corners; the writing appears inside it.
- **Scroll scenes in the same language:** an embossed countdown plaque on a dark band, a satin
  surface with a pearl-rimmed oval cameo, a fine engraving of the venue with a plaque button, the
  day's programme framed by embossed drapes, and the dress code inside an embossed arch with a
  line drawing.

Palette translation: the reference's mauve becomes olive paper for the envelope, ivory paper for
the card, champagne satin for the ribbon and wax, and sage or olive satin for the textured scenes.

## Opening state machine (one GSAP timeline, ≈5.5 s)
| t (s) | Phase | What happens |
|---|---|---|
| 0.00 | `closed` → `sealActivated` | The seal presses and glows, a crack draws through it, and the halves fall with crumbs (0.42 s). |
| 0.46 | `envelopeOpening` | The top petal swings open on its hinge (rotateX), then left and right (rotateY), then bottom. Each shows its ivory lining as it passes edge-on. |
| 1.66 | `cardEmerging` | The card sits inside on olive satin, tied with a champagne ribbon. The bow loops collapse into the knot, the tails drop, and the band slides off both sides. The card lifts to fill the screen. |
| ≈3.1 | `invitationRevealing` | The Arabic lines wipe in right to left, and «ليلة الحنّة» is traced as a stroke, then inked. |
| ≈5.5 | `invitationOpen` | Scroll unlocks and the scenes continue. |

Performance: the relief is rasterised once per viewport size in a priority queue (envelope
first, then the card, then the rest), paused while the opening plays. Large outlines use cheap
offset strokes instead of filters.

## Why not Three.js
The `threejs` skill was evaluated. CSS 3D transforms already give a real hinge rotation,
perspective travel and backface switching, and they keep Arabic text as live, shaped, selectable,
screen-reader-visible DOM. WebGL text would need an Arabic shaping pipeline, cost roughly 600 KB more, and
add a GPU/battery and accessibility burden without a visible gain for a paper envelope.

## Peak moment
The peak is the instant the card fills the screen and the olive crest grows over the
ivory. Everything after it (countdown, details, quote, RSVP) uses calmer scroll reveals, following the
`aesthetic` skill's "restraint" guidance and `ui-ux-pro-max`'s Standard Scroll Reveal preset.
