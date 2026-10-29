import { useId } from 'react'
import { Baked, Sprig, rng } from './Relief'

// Fine line "engravings" (drawn with thin strokes so they can draw themselves
// on scroll) and the embossed theatre drapes for the programme.

/** The hotel at dusk as a fine engraving: the tower, the long wing, trees,
 *  street lamps and light trails on the road. Drawn from scratch, not traced. */
export function VenueEngraving({ className = '' }: { className?: string }) {
  const rect = (x: number, y: number, w: number, h: number) => `M${x} ${y}h${w}v${h}h${-w}Z`
  // Tower front: a grid of balconied windows with a lit arch in each.
  const towerWin: string[] = []
  const towerLight: string[] = []
  for (let r = 0; r < 13; r++)
    for (let c = 0; c < 5; c++) {
      const x = 206 + c * 15, y = 62 + r * 13.4
      towerWin.push(rect(x, y, 11, 10))
      towerLight.push(`M${x + 3} ${y + 9} Q ${x + 5.5} ${y + 3} ${x + 8} ${y + 9}`)
    }
  // Tower side, in perspective.
  const side: string[] = []
  for (let r = 0; r < 14; r++) side.push(`M286 ${58 + r * 13.4} L306 ${62 + r * 13.2}`)
  for (let c = 0; c < 3; c++) side.push(`M${290 + c * 6} ${60 + c * 1.2} V${232 + c * 1}`)
  // The long wing to the left: rows of windows with small balconies.
  const wing: string[] = []
  for (let r = 0; r < 6; r++)
    for (let c = 0; c < 9; c++) {
      const x = 48 + c * 16, y = 134 + r * 17 + c * 1.1
      wing.push(rect(x, y, 8, 10), `M${x - 1} ${y + 11}h10`)
    }
  const r = rng(7)
  const canopy = (cx: number, cy: number, rx: number, ry: number) => {
    const n = 14
    const pts = Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2
      const k = 1 + (r() - 0.5) * 0.25
      return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]
    })
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
    for (let i = 1; i <= n; i++) d += ` A 6 6 0 0 1 ${pts[i % n][0].toFixed(1)} ${pts[i % n][1].toFixed(1)}`
    const leaves = Array.from({ length: 22 }, () => {
      const a = r() * Math.PI * 2, dd = Math.sqrt(r()) * 0.75
      const x = cx + Math.cos(a) * rx * dd, y = cy + Math.sin(a) * ry * dd
      return `M${x.toFixed(1)} ${y.toFixed(1)} q 3 -2 6 -0.5`
    }).join(' ')
    return { outline: d + 'Z', leaves }
  }
  const trees = [canopy(62, 228, 40, 26), canopy(140, 236, 44, 24), canopy(232, 240, 38, 22), canopy(318, 236, 34, 22)]
  const lamp = (x: number, top: number) => {
    const glint = Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2, l = i % 2 ? 4 : 8
      return `M${x} ${top} l${(Math.cos(a) * l).toFixed(1)} ${(Math.sin(a) * l).toFixed(1)}`
    }).join(' ')
    return `M${x} 262 V${top + 4} ${glint}`
  }
  return (
    <svg className={`engraving ${className}`} viewBox="0 0 400 290" aria-hidden="true">
      {/* Tower */}
      <path className="engrave" pathLength={1} d="M196 26 H292 L312 34 V44 L292 36 H196 Z M200 44 V242 M286 44 V244 M286 44 L306 50 V246" />
      <path className="engrave engrave--fine" pathLength={1} d="M200 36 H286 M214 20 H262 V26 M230 14 V20 M200 50 H286" />
      <path className="engrave engrave--fine" pathLength={1} d={towerWin.join(' ')} />
      <path className="stitch" d={towerLight.join(' ')} />
      <path className="engrave engrave--fine" pathLength={1} d={side.join(' ')} />
      {/* Fire stair down the tower's left flank */}
      <path className="engrave engrave--fine" pathLength={1} d={Array.from({ length: 12 }, (_, i) => `M188 ${66 + i * 14} L199 ${73 + i * 14} L188 ${80 + i * 14}`).join(' ')} />
      {/* Long wing */}
      <path className="engrave" pathLength={1} d="M40 128 L196 142 M40 128 V250 M40 128 L36 124 L196 138" />
      <path className="engrave engrave--fine" pathLength={1} d={wing.join(' ')} />
      {/* Street lamps */}
      <path className="engrave engrave--fine" pathLength={1} d={`${lamp(338, 180)} ${lamp(364, 196)} ${lamp(386, 210)}`} />
      {/* Trees in front, masking the building behind them */}
      {trees.map((t, i) => (
        <g key={i}>
          <path className="engrave engrave--mass" pathLength={1} d={t.outline} />
          <path className="engrave engrave--fine" pathLength={1} d={t.leaves} />
        </g>
      ))}
      {/* The road, with long-exposure light trails */}
      <path className="engrave" pathLength={1} d="M0 262 H400" />
      <path className="engrave engrave--fine" pathLength={1} d="M0 270 C 120 266 260 268 400 264 M0 276 C 140 272 270 274 400 270 M20 283 C 150 279 280 281 400 277" />
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
