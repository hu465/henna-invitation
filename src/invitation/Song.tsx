import { useState } from 'react'
import type { EventDetails } from '../config/event'
import { ambience } from '../audio/ambience'
import { Sprig } from '../art/Relief'

// The evening's song in a framed player. Nothing loads from YouTube until the
// guest taps play (keeping the page light on mobile data); the background
// ambience steps aside while the song plays. A direct link is always offered,
// for places where embedded players are blocked.

export function Song({ event }: { event: EventDetails }) {
  const [playing, setPlaying] = useState(false)
  const id = event.songYoutubeId
  if (!id) return null
  const watch = `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`

  const start = () => {
    ambience(event.musicUrl).stop()
    setPlaying(true)
  }

  return (
    <div className="song">
      <div className="song-frame" data-rise>
        {playing ? (
          <iframe
            className="song-player"
            src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&playsinline=1&modestbranding=1`}
            title="أغنية الليلة"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button type="button" className="song-cover" onClick={start} aria-label="تشغيل أغنية الليلة">
            <svg className="song-relief" viewBox="0 0 320 180" aria-hidden="true">
              <Sprig length={120} leaves={9} seed={4} fill="#4e5c39" filter="url(#emboss-olive)" transform="translate(160 150) rotate(-158)" />
              <Sprig length={120} leaves={9} seed={9} fill="#4e5c39" filter="url(#emboss-olive)" transform="translate(160 150) rotate(-22)" />
            </svg>
            <span className="song-play" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg>
            </span>
            <span className="song-hint">اضغطي للاستماع</span>
          </button>
        )}
      </div>
      <a className="song-link" href={watch} target="_blank" rel="noopener noreferrer" data-rise>
        استمعي على YouTube
      </a>
    </div>
  )
}
