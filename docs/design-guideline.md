# Design guideline — Henna Night invitation

Written per the `aesthetic` skill (four-stage framework). Design-system inputs come from the
`ui-ux-pro-max` search tool; deviations from its output are noted.

## Palette (brief-mandated)
| Token | Hex | Use |
|---|---|---|
| `--olive-deep` | #465438 | Envelope, headlines, dark scenes |
| `--olive-rich` | #66764A | Secondary text, leaves, icons |
| `--sage` | #E8EBDD | Soft scenes, lining, intro backdrop |
| `--ivory` | #FAF9F4 | Card, page, form surfaces |
| `--white` | #FFFFFF | Detail cards, inputs |
| `--champagne` | #C6B58A | Wax seal, foil, frame rules (ornament only) |
| `--champagne-text` | #76633A | Champagne-toned *text* on ivory (≥4.5:1) |

Champagne #C6B58A is ~1.9:1 on ivory, so it is never used for text on light backgrounds.

## Typography
- **Aref Ruqaa**: display (Ruqʿa calligraphy) for headlines, names, the seal monogram.
- **Amiri**: body Naskh for the basmala, sentences and numerals. The `ui-ux-pro-max` google-fonts search for "arabic serif elegant" returned Amiri-family and Scheherazade options; Amiri was chosen for its classical book-face quality.
- **Reem Kufi**: labels, dates, buttons, for a geometric counterpoint.
- No letter-spacing and no per-letter splitting on Arabic, because both break cursive joins.
- The `--design-system` query suggested Cormorant/Montserrat (Latin only) and a "Liquid Glass" style. Both were rejected as unsuitable for an Arabic heritage celebration.

## Layout
- RTL throughout (`<html dir="rtl">`), logical properties where direction matters.
- The hero is a full-viewport "card" with a double rule frame, mirrored corner flourishes and an olive crest. It is sized in container-query units (`cqmin`) so it composes in portrait and landscape.
- The envelope is landscape (1.38:1) on wide screens and portrait (0.74:1) below a 4:5 aspect ratio.

## Accessibility
- Seal is a real `<button>` ("افتحي الدعوة"), Enter/Space opens; focus is trapped in the intro dialog; skip button.
- After opening, focus moves to the `<h1>`.
- `prefers-reduced-motion`: the envelope cross-fades in 0.5 s, the hero shows fully composed, and scroll/parallax motion is disabled (GSAP `matchMedia`).
- Touch targets ≥44 px; RSVP errors sit next to their fields with `aria-invalid`/`aria-describedby`; the countdown exposes one `sr-only` sentence instead of ticking digits.
