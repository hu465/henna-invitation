import { useId } from 'react'
import { Baked, Sprig, rng } from './Relief'

// Fine line "engravings" (drawn with thin strokes so they can draw themselves
// on scroll) and the embossed theatre drapes for the programme.

/** A Levantine stone house with arched iwan doors, flanked by olive trees. */
export function VenueEngraving({ className = '' }: { className?: string }) {
  const hatch = Array.from({ length: 26 }, (_, i) => `M${92 + i * 8} 262 l-6 10`).join(' ')
  const stones = Array.from({ length: 7 }, (_, r) =>
    Array.from({ length: 9 }, (_, c) => `M${96 + c * 24 + (r % 2) * 12} ${132 + r * 18} h14`).join(' '),
  ).join(' ')
  const tree = (x: number, s: number) => {
    const r = rng(Math.round(x))
    // A wind-shaped olive canopy: a scalloped outline around an ellipse…
    const cy = 200 - 70 * s
    const rx = 44 * s
    const ry = 34 * s
    const n = 16
    const pts = Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2
      const k = 1 + (r() - 0.5) * 0.22
      return [x + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k * (Math.sin(a) > 0 ? 0.8 : 1)]
    })
    let canopy = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
    for (let i = 1; i <= n; i++) {
      const [px, py] = pts[i % n]
      canopy += ` A ${(7 * s).toFixed(1)} ${(7 * s).toFixed(1)} 0 0 1 ${px.toFixed(1)} ${py.toFixed(1)}`
    }
    // …filled with short leaf strokes for shading, denser on the shadow side.
    const strokes = Array.from({ length: 34 }, () => {
      const a = r() * Math.PI * 2
      const d = Math.sqrt(r()) * 0.8
      const lx = x + Math.cos(a) * rx * d
      const ly = cy + Math.sin(a) * ry * d * 0.85
      const ang = -0.6 + r() * 1.2
      return `M${lx.toFixed(1)} ${ly.toFixed(1)} q ${(4 * s).toFixed(1)} ${(-3 * s * ang).toFixed(1)} ${(8 * s).toFixed(1)} ${(-1 * s).toFixed(1)}`
    }).join(' ')
    const blobs = `${canopy}Z ${strokes}`
    return (
      <g>
        <path className="engrave" pathLength={1} d={`M${x - 4} 262 C ${x - 2} ${240} ${x - 12} ${226} ${x - 6} ${200 - 40 * s} M${x + 4} 262 C ${x + 4} ${236} ${x + 12} ${222} ${x + 6} ${200 - 46 * s}`} />
        <path className="engrave engrave--fine" pathLength={1} d={blobs} />
      </g>
    )
  }
  return (
    <svg className={`engraving ${className}`} viewBox="0 0 400 290" aria-hidden="true">
      {tree(42, 1.05)}
      {tree(358, 0.95)}
      {/* Parapet and cornice */}
      <path className="engrave" pathLength={1} d="M84 112 H316 M80 118 H320 M84 112 V104 H316 V112 M120 104 V96 H280 V104 M190 96 C 190 80 210 80 210 96" />
      {/* Walls */}
      <path className="engrave" pathLength={1} d="M88 118 V262 M312 118 V262 M88 262 H312" />
      <path className="engrave engrave--fine" pathLength={1} d={stones} />
      {/* Upper arched windows */}
      {[120, 176, 232, 288].map((x) => (
        <path key={x} className="engrave" pathLength={1} d={`M${x - 12} 168 V146 C ${x - 12} 132 ${x + 12} 132 ${x + 12} 146 V168 Z M${x} 136 V168 M${x - 12} 154 H${x + 12}`} />
      ))}
      {/* Iwan: three pointed arches */}
      {[130, 200, 270].map((x, i) => (
        <path key={x} className="engrave" pathLength={1} d={`M${x - (i === 1 ? 30 : 22)} 262 V${i === 1 ? 214 : 222} C ${x - (i === 1 ? 30 : 22)} ${i === 1 ? 190 : 202} ${x - 6} ${i === 1 ? 182 : 196} ${x} ${i === 1 ? 176 : 190} C ${x + 6} ${i === 1 ? 182 : 196} ${x + (i === 1 ? 30 : 22)} ${i === 1 ? 190 : 202} ${x + (i === 1 ? 30 : 22)} ${i === 1 ? 214 : 222} V262`} />
      ))}
      <path className="engrave engrave--fine" pathLength={1} d="M176 262 V218 M224 262 V218 M186 262 V226 M214 262 V226" />
      {/* Steps and ground */}
      <path className="engrave" pathLength={1} d="M150 262 H250 M156 268 H244 M40 274 H360" />
      <path className="engrave engrave--fine" pathLength={1} d={hatch} />
    </svg>
  )
}

/** A traditional embroidered thobe, with tatreez on the chest panel and sides. */
export function ThobeEngraving({ className = '' }: { className?: string }) {
  const x = (cx: number, cy: number) => `M${cx - 2} ${cy - 2} l4 4 M${cx + 2} ${cy - 2} l-4 4`
  const chest = [] as string[]
  for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) if ((r + c) % 2 === 0 || r === 2 || c === 2 || c === 3) chest.push(x(88 + c * 5, 64 + r * 5))
  const sides = Array.from({ length: 14 }, (_, i) => `${x(70, 112 + i * 8)} ${x(130, 112 + i * 8)}`).join(' ')
  const hem = Array.from({ length: 13 }, (_, i) => x(52 + i * 8, 222)).join(' ')
  return (
    <svg className={`engraving ${className}`} viewBox="0 0 200 250" aria-hidden="true">
      <path className="engrave" pathLength={1} d="M86 40 C 92 48 108 48 114 40 L 132 46 L 176 96 L 160 112 L 132 84 L 140 230 C 112 236 88 236 60 230 L 68 84 L 40 112 L 24 96 L 68 46 Z" />
      <path className="engrave engrave--fine" pathLength={1} d="M86 40 L 94 58 L 106 58 L 114 40 M84 60 H116 V94 H84 Z M60 218 C 90 224 110 224 140 218" />
      <path className="engrave engrave--fine" pathLength={1} d="M150 104 l8 -8 M156 110 l8 -8 M44 104 l-8 -8 M38 110 l-8 -8" />
      <path className="stitch" d={chest.join(' ')} />
      <path className="stitch" d={sides} />
      <path className="stitch" d={hem} />
      {/* Hanger */}
      <path className="engrave engrave--fine" pathLength={1} d="M100 40 V28 C 100 20 110 20 110 26" />
    </svg>
  )
}

/** Embossed theatre drapes gathered with tie-backs, for one side (the start side). */
export function Drape({ w, h, fill, className = '' }: { w: number; h: number; fill: string; className?: string }) {
  const id = useId().replace(/:/g, '')
  const folds = 6
  const gatherY = h * 0.58
  const gatherX = w * 0.22
  const shapes = Array.from({ length: folds }, (_, i) => {
    const x0 = (w / folds) * i
    const x1 = (w / folds) * (i + 1) + 6
    const gx0 = gatherX * (i / folds)
    const gx1 = gatherX * ((i + 1) / folds) + 2
    const flare = w * 0.12 * (i / folds)
    return `M${x0} 0 L${x1} 0 C ${x1} ${h * 0.25} ${gx1 + 10} ${gatherY - 20} ${gx1} ${gatherY} C ${gx1 + 8} ${gatherY + 40} ${gx1 + flare + 10} ${h * 0.85} ${gx1 + flare + 4} ${h} L ${gx0 + flare * 0.6} ${h} C ${gx0 + flare * 0.5} ${h * 0.85} ${gx0 - 2} ${gatherY + 40} ${gx0} ${gatherY} C ${gx0 + 6} ${gatherY - 20} ${x0} ${h * 0.25} ${x0} 0Z`
  })
  return (
    <Baked className={`drape ${className}`} w={w} h={h}>
      <defs>
        <clipPath id={`dc${id}`}>
          <rect width={w} height={h} />
        </clipPath>
      </defs>
      <g clipPath={`url(#dc${id})`}>
        {shapes.map((d, i) => (
          <path key={i} d={d} fill={fill} filter="url(#emboss-deep)" />
        ))}
        {/* Tie-back with a little olive sprig */}
        <path d={`M0 ${gatherY - 8} C ${gatherX * 0.5} ${gatherY - 2} ${gatherX} ${gatherY - 4} ${gatherX + 14} ${gatherY + 2} L ${gatherX + 12} ${gatherY + 12} C ${gatherX} ${gatherY + 8} ${gatherX * 0.5} ${gatherY + 10} 0 ${gatherY + 6}Z`} fill={fill} filter="url(#emboss)" />
        <Sprig length={w * 0.36} leaves={6} seed={5} fill={fill} transform={`translate(${gatherX + 8} ${gatherY + 4}) rotate(25)`} leafScale={0.26} />
      </g>
    </Baked>
  )
}

/** A scalloped valance across the top of the stage. */
export function Valance({ w, fill }: { w: number; fill: string }) {
  const n = Math.max(4, Math.round(w / 90))
  const sw = w / n
  let d = `M0 0 H${w} V18`
  for (let i = n; i > 0; i--) d += ` Q ${sw * (i - 0.5)} ${58} ${sw * (i - 1)} 18`
  d += 'Z'
  return (
    <Baked className="valance" w={w} h={64}>
      <path d={d} fill={fill} filter="url(#emboss-deep)" />
    </Baked>
  )
}
