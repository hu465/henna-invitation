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
- `/#/planner`: planner (edit details for preview, RSVP list, task checklist)

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
