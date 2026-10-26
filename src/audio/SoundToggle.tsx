import { useEffect, useState } from 'react'
import { ambience, setSoundPreferred } from './ambience'

/** Visible, always-available sound switch. Never starts audio on its own. */
export function SoundToggle({ url, className = '' }: { url: string; className?: string }) {
  const amb = ambience(url)
  const [on, setOn] = useState(amb.playing)

  useEffect(() => {
    const sync = () => setOn(amb.playing)
    const id = setInterval(sync, 500)
    const vis = () => (document.hidden ? amb.stop() : undefined)
    document.addEventListener('visibilitychange', vis)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', vis)
    }
  }, [amb])

  const toggle = () => {
    if (amb.playing) amb.stop()
    else amb.start()
    setSoundPreferred(amb.playing)
    setOn(amb.playing)
  }

  return (
    <button type="button" className={`sound-toggle ${className}`} onClick={toggle} aria-pressed={on} aria-label={on ? 'إيقاف الموسيقى' : 'تشغيل الموسيقى'}>
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" fill="currentColor" fillOpacity=".15" />
        {on ? (
          <g className="sound-waves">
            <path d="M15.5 9.5c1 .8 1 4.2 0 5" />
            <path d="M18 7.5c2.2 2 2.2 7 0 9" />
          </g>
        ) : (
          <path d="M16 10l4 4M20 10l-4 4" />
        )}
      </svg>
      <span className="sound-label">{on ? 'الصوت' : 'بدون صوت'}</span>
    </button>
  )
}
