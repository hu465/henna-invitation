import { useId, useMemo } from 'react'

// Original Levantine ornament: tatreez (cross-stitch) bands, the eight-point
// star, a pointed arch and a distant olive grove. All procedural SVG so it
// stays crisp at any size and ships no image assets.

/** Cells of an eight-point tatreez star on a 9×9 stitch grid. */
const starCells = (() => {
  const cells: [number, number][] = []
  for (let y = -4; y <= 4; y++)
    for (let x = -4; x <= 4; x++) {
      const ax = Math.abs(x), ay = Math.abs(y)
      const diamond = ax + ay <= 4
      const square = ax <= 2 && ay <= 2
      const hollow = ax + ay <= 1 && !(ax === 0 && ay === 0)
      if ((diamond || square) && !hollow) cells.push([x + 4, y + 4])
    }
  return cells
})()

const stitch = (x: number, y: number, s: number) => `M${x * s} ${y * s}l${s} ${s}M${x * s + s} ${y * s}l${-s} ${s}`

/** A horizontal cross-stitch band: stars alternating with small diamonds. */
export function TatreezBand({ className = '', stitchSize = 2 }: { className?: string; stitchSize?: number }) {
  const id = useId().replace(/:/g, '')
  const s = stitchSize
  const w = 16 * s
  const star = starCells.map(([x, y]) => stitch(x, y, s)).join('')
  const diamond = [[1, 0], [0, 1], [2, 1], [1, 2]].map(([x, y]) => stitch(x + 11, y + 3, s)).join('')
  return (
    <svg className={`tatreez ${className}`} height={9 * s + 2} aria-hidden="true">
      <defs>
        <pattern id={`tz${id}`} width={w} height={9 * s} patternUnits="userSpaceOnUse">
          <path d={star + diamond} stroke="currentColor" strokeWidth={s * 0.42} strokeLinecap="round" fill="none" />
        </pattern>
      </defs>
      <rect y="1" width="100%" height={9 * s} fill={`url(#tz${id})`} />
    </svg>
  )
}

/** A single tatreez star, used as a corner and seal motif. */
export function TatreezStar({ className = '', size = 3 }: { className?: string; size?: number }) {
  return (
    <svg className={`tz-star ${className}`} viewBox={`0 0 ${9 * size} ${9 * size}`} aria-hidden="true">
      <path d={starCells.map(([x, y]) => stitch(x, y, size)).join('')} stroke="currentColor" strokeWidth={size * 0.42} strokeLinecap="round" fill="none" />
    </svg>
  )
}

/** Eight-point star outline (two interlaced squares). */
export function EightStar({ className = '' }: { className?: string }) {
  const sq = 'M50 10 L90 50 L50 90 L10 50Z'
  return (
    <svg className={`eight-star ${className}`} viewBox="0 0 100 100" aria-hidden="true">
      <path className="draw" pathLength={1} d={sq} fill="none" stroke="currentColor" strokeWidth="2" />
      <path className="draw" pathLength={1} d="M22 22 H78 V78 H22Z" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="50" cy="50" r="7" fill="currentColor" />
    </svg>
  )
}

/** A pointed Levantine arch, drawn as two nested strokes. */
export function Arch({ className = '' }: { className?: string }) {
  const outer = 'M3 197 V78 C3 44 26 26 50 6 C74 26 97 44 97 78 V197'
  const inner = 'M9 197 V80 C9 50 29 33 50 15 C71 33 91 50 91 80 V197'
  return (
    <svg className={`arch ${className}`} viewBox="-2 -2 104 202" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <path className="draw arch-outer" pathLength={1} d={outer} fill="none" />
      <path className="draw arch-inner" pathLength={1} d={inner} fill="none" />
      <path className="arch-key" d="M50 0 l4 6 l-4 6 l-4 -6z" />
    </svg>
  )
}

function rng(seed: number) {
  let s = seed
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
}

/** Silhouette of a distant olive grove for the horizon layer. */
export function OliveGrove({ className = '', seed = 4, trees = 9 }: { className?: string; seed?: number; trees?: number }) {
  const shapes = useMemo(() => {
    const r = rng(seed)
    return Array.from({ length: trees }, (_, i) => {
      const x = (i + 0.5) * (1200 / trees) + (r() - 0.5) * 60
      const h = 90 + r() * 70
      const w = 80 + r() * 60
      // A wind-shaped olive canopy: many small, overlapping clusters.
      const blobs = Array.from({ length: 11 }, () => ({
        cx: x + (r() - 0.5) * w * 1.1,
        cy: 220 - h * (0.62 + r() * 0.32),
        rx: w * (0.12 + r() * 0.13),
        ry: h * (0.09 + r() * 0.08),
      }))
      const trunk = `M${x - 5} 220 C ${x - 4} ${220 - h * 0.3} ${x - 14} ${220 - h * 0.45} ${x - 8} ${220 - h * 0.62} L ${x + 4} ${220 - h * 0.6} C ${x + 2} ${220 - h * 0.4} ${x + 9} ${220 - h * 0.3} ${x + 7} 220Z`
      return { trunk, blobs }
    })
  }, [seed, trees])
  return (
    <svg className={`grove ${className}`} viewBox="0 0 1200 220" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      {shapes.map((t, i) => (
        <g key={i}>
          <path d={t.trunk} />
          {t.blobs.map((b, j) => (
            <ellipse key={j} cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} />
          ))}
        </g>
      ))}
      <rect y="214" width="1200" height="6" />
    </svg>
  )
}
