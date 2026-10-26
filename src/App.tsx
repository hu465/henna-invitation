import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { EnvelopeIntro } from './intro/EnvelopeIntro'
import { Invitation } from './invitation/Invitation'
import { heroRevealTimeline, prepareHero } from './invitation/heroReveal'
import { Planner } from './planner/Planner'
import { loadEvent } from './lib/store'

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
  if (hash.startsWith('#/planner') || hash === '#planner') return <Planner />
  return <GuestInvitation />
}

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function GuestInvitation() {
  const [event] = useState(loadEvent)
  // `?intro=0` skips the envelope (handy when sharing a direct link to RSVP).
  const [introDone, setIntroDone] = useState(() => new URLSearchParams(location.search).get('intro') === '0')
  const hero = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    if (!introDone && hero.current && !reduced()) prepareHero(hero.current)
  }, [introDone])

  const buildHeroReveal = useCallback(() => (hero.current && !reduced() ? heroRevealTimeline(hero.current) : null), [])

  const done = useCallback(() => {
    setIntroDone(true)
    requestAnimationFrame(() => hero.current?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true }))
  }, [])

  const replay = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    setIntroDone(false)
  }, [])

  return (
    <>
      <div inert={!introDone || undefined} aria-hidden={!introDone || undefined}>
        <Invitation ref={hero} event={event} ready={introDone} onReplay={replay} />
      </div>
      {!introDone && <EnvelopeIntro event={event} buildHeroReveal={buildHeroReveal} onDone={done} />}
    </>
  )
}
