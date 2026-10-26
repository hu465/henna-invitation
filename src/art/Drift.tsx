import { useMemo, type CSSProperties } from 'react'

// Lightweight ambient particles: a handful of absolutely positioned elements
// animated with transform/opacity only. Parameters are precomputed so no
// per-frame JavaScript runs.

function rng(seed: number) {
  let s = seed
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
}

export function Drift({ count = 10, kind = 'petal', seed = 7, className = '' }: { count?: number; kind?: 'petal' | 'mote'; seed?: number; className?: string }) {
  const items = useMemo(() => {
    const r = rng(seed)
    return Array.from({ length: count }, () => ({
      '--x': `${(r() * 100).toFixed(1)}%`,
      '--size': `${(kind === 'petal' ? 7 + r() * 7 : 2.5 + r() * 3.5).toFixed(1)}px`,
      '--dur': `${(kind === 'petal' ? 11 + r() * 9 : 9 + r() * 8).toFixed(1)}s`,
      '--delay': `${(-r() * 18).toFixed(1)}s`,
      '--sway': `${((r() - 0.5) * 120).toFixed(0)}px`,
      '--spin': `${((r() - 0.5) * 540).toFixed(0)}deg`,
      '--tone': r() < 0.5 ? 'var(--champagne)' : 'var(--olive-rich)',
    }) as CSSProperties)
  }, [count, kind, seed])
  return (
    <div className={`drift drift--${kind} ${className}`} aria-hidden="true">
      {items.map((style, i) => (
        <span key={i} style={style} />
      ))}
    </div>
  )
}
