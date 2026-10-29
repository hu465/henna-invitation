import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { EnvelopeIntro, type Phase } from './intro/EnvelopeIntro'
import { Invitation } from './invitation/Invitation'
import { heroRevealTimeline, prepareHero } from './invitation/heroReveal'
import { loadEvent } from './lib/store'
import { ReliefDefs } from './art/Relief'
import { NameGate } from './intro/NameGate'
import { loadGuestName, saveGuestName } from './lib/guest'

// The planner is for the host only, so guests never download it.
const Planner = lazy(() => import('./planner/Planner').then((m) => ({ default: m.Planner })))

function useHashRoute() {
  const [hash, setHash] = useState(() => location.hash)
  useEffect(() => {
    const on = () => setHash(location.hash)
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [])
  return hash
}

export function App() {
  const hash = useHashRoute()
  if (hash.startsWith('#/planner') || hash === '#planner')
    return (
      <Suspense fallback={null}>
        <Planner />
      </Suspense>
    )
  return <GuestInvitation />
}

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function GuestInvitation() {
  const [event] = useState(loadEvent)
  const [guestName, setGuestName] = useState(loadGuestName)
  // `?intro=0` skips the envelope (handy for a direct link to the RSVP).
  const [phase, setPhase] = useState<Phase>(() => (new URLSearchParams(location.search).get('intro') === '0' ? 'invitationOpen' : 'closed'))
  // Bumped on replay so the envelope remounts in its closed state.
  const [run, setRun] = useState(0)
  const hero = useRef<HTMLElement>(null)
  const open = phase === 'invitationOpen'

  useLayoutEffect(() => {
    if (phase === 'closed' && hero.current && !reduced()) prepareHero(hero.current)
  }, [phase, run])

  // Expose the phase for testing and styling hooks.
  useEffect(() => {
    document.documentElement.dataset.invitePhase = phase
  }, [phase])

  const buildHeroReveal = useCallback(() => (hero.current && !reduced() ? heroRevealTimeline(hero.current) : null), [])

  const onPhase = useCallback((p: Phase) => {
    setPhase(p)
    if (p === 'invitationOpen') requestAnimationFrame(() => hero.current?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true }))
  }, [])

  const replay = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    setRun((r) => r + 1)
    setPhase('closed')
  }, [])

  useEffect(() => {
    document.title = guestName ? `دعوة ${guestName} — ليلة حنّة ${event.brideName}` : `ليلة حنّة ${event.brideName}`
  }, [guestName, event.brideName])

  const nameGiven = useCallback((name: string) => {
    saveGuestName(name)
    setGuestName(name)
  }, [])

  // "Not you?": forget the name and start again from the name step.
  const changeGuest = useCallback(() => {
    saveGuestName('')
    setGuestName('')
    replay()
  }, [replay])

  // Development helper: replay from the console with __invite.replay().
  useEffect(() => {
    if (import.meta.env.DEV) Object.assign(window, { __invite: { replay } })
  }, [replay])

  return (
    <>
      <ReliefDefs />
      <div inert={!open || undefined} aria-hidden={!open || undefined}>
        <Invitation ref={hero} event={event} guestName={guestName} ready={open} onReplay={replay} onChangeGuest={changeGuest} />
      </div>
      {!open && <EnvelopeIntro key={run} event={event} guestName={guestName} phase={phase} onPhase={onPhase} buildHeroReveal={buildHeroReveal} />}
      {!open && !guestName && <NameGate event={event} onDone={nameGiven} />}
    </>
  )
}
