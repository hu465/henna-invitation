# دعوة ليلة الحنّة — Cinematic Henna Invitation

React 19 + Vite + TypeScript, GSAP 3 (core + ScrollTrigger), CSS 3D, original SVG art.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build
```

## Routes
- `/`: guest invitation (envelope → card → invitation)
- `/?intro=0`: skip the envelope (direct link to details/RSVP)
- `/#planner` (or `/#/planner`): planner (edit details for preview, RSVP list, task checklist). It is code-split, so guests never download it.

## The opening animation
`src/intro/EnvelopeIntro.tsx` holds one GSAP master timeline whose labels are the phases
`closed → sealActivated → envelopeOpening → cardEmerging → invitationRevealing → invitationOpen`.
The hero reveal (`src/invitation/heroReveal.ts`) is appended to it.

To replay it, use the «إعادة فتح الدعوة» button at the end of the page or, in development,
`__invite.replay()` in the console. `window.__introTl` exposes the timeline in development so you
can step through it (`__introTl.pause(); __introTl.seek(2)`).

## Sound and video
- Sound starts only after the guest taps the seal, and a toggle stays visible. The guest's choice is remembered.
- Set `musicUrl` to use your own track. Without one, a soft ambience in maqam Hijaz is generated live with the Web Audio API.
- `ambientVideo` / `ambientPoster` add an optional muted looping video behind the hero. It hides itself if it fails to load.

## Editing the invitation
Edit `src/config/event.ts` (names, monogram, date/time, venue, map link, dress code,
RSVP deadline, `hostWhatsapp`) and redeploy. Planner edits are saved only in that browser's
localStorage, for previewing.

## RSVP
Responses are validated and saved in the guest's own browser. If `hostWhatsapp` is set, the guest
gets a button that sends the response to the host on WhatsApp. That is the only channel that
reaches the host without a backend. Collecting responses centrally needs a backend or form service.

## Structure
- `src/intro/`: envelope scene and the master GSAP timeline
- `src/invitation/`: hero reveal (appended to the master timeline), countdown, details, RSVP, scroll scenes
- `src/art/`: procedural olive branch, wax seal, ornaments
- `docs/`: design guideline and design story (motion principles)
