import { useId, useMemo } from 'react'

// Original, procedurally laid-out olive branch. Each leaf and olive is its own
// element so timelines can "grow" the branch (stem draws, leaves unfurl from
// their base) and CSS can give it a slow, wind-like sway.

type Tone = 'olive' | 'ivory' | 'champagne'

const palette: Record<Tone, { leafA: string; leafB: string; stem: string; rib: string; fruitA: string; fruitB: string }> = {
  olive: { leafA: '#7A8A5A', leafB: '#465438', stem: '#465438', rib: 'rgba(250,249,244,.38)', fruitA: '#5E6E43', fruitB: '#2F3A25' },
  ivory: { leafA: '#FAF9F4', leafB: '#D5DAC4', stem: '#E8EBDD', rib: 'rgba(70,84,56,.25)', fruitA: '#E8EBDD', fruitB: '#B9C0A2' },
  champagne: { leafA: '#E2D6B2', leafB: '#C6B58A', stem: '#B7A577', rib: 'rgba(255,255,255,.45)', fruitA: '#D8CBA3', fruitB: '#A8955F' },
}

// Cubic bezier for the stem, in a 400 x 130 viewBox.
const P = [
  [8, 96],
  [120, 52],
  [250, 104],
  [392, 34],
] as const

function bez(t: number): [number, number] {
  const u = 1 - t
  const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t
  return [a * P[0][0] + b * P[1][0] + c * P[2][0] + d * P[3][0], a * P[0][1] + b * P[1][1] + c * P[2][1] + d * P[3][1]]
}

function angleAt(t: number) {
  const u = 1 - t
  const dx = 3 * u * u * (P[1][0] - P[0][0]) + 6 * u * t * (P[2][0] - P[1][0]) + 3 * t * t * (P[3][0] - P[2][0])
  const dy = 3 * u * u * (P[1][1] - P[0][1]) + 6 * u * t * (P[2][1] - P[1][1]) + 3 * t * t * (P[3][1] - P[2][1])
  return (Math.atan2(dy, dx) * 180) / Math.PI
}

function rng(seed: number) {
  let s = seed % 2147483647 || 1
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
}

function leafPath(L: number, w: number) {
  return `M0 0 C ${L * 0.22} ${-w} ${L * 0.68} ${-w * 1.05} ${L} 0 C ${L * 0.68} ${w * 0.95} ${L * 0.22} ${w} 0 0Z`
}

interface Props {
  className?: string
  tone?: Tone
  leaves?: number
  olives?: number
  seed?: number
  title?: string
}

export function OliveBranch({ className, tone = 'olive', leaves = 14, olives = 3, seed = 7, title }: Props) {
  const id = useId().replace(/:/g, '')
  const c = palette[tone]
  const parts = useMemo(() => {
    const r = rng(seed)
    const out: { x: number; y: number; a: number; L: number; w: number }[] = []
    for (let i = 0; i < leaves; i++) {
      const t = 0.07 + (0.88 * i) / (leaves - 1)
      const [x, y] = bez(t)
      const side = i % 2 ? 1 : -1
      const a = angleAt(t) + side * (34 + r() * 18)
      const L = 46 - 16 * t + r() * 8
      out.push({ x, y, a, L, w: L * (0.2 + r() * 0.05) })
    }
    const [tx, ty] = bez(1)
    out.push({ x: tx, y: ty, a: angleAt(1) - 6, L: 30, w: 6.5 })
    const fruit: { x: number; y: number; a: number }[] = []
    for (let i = 0; i < olives; i++) {
      const t = 0.22 + (0.55 * i) / Math.max(1, olives - 1) + r() * 0.04
      const [x, y] = bez(t)
      fruit.push({ x, y, a: 10 + r() * 40 })
    }
    return { leaves: out, fruit }
  }, [leaves, olives, seed])

  const stem = `M${P[0][0]} ${P[0][1]} C ${P[1][0]} ${P[1][1]} ${P[2][0]} ${P[2][1]} ${P[3][0]} ${P[3][1]}`

  return (
    <svg className={`olive-branch ${className ?? ''}`} viewBox="0 0 400 130" role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <defs>
        <linearGradient id={`lf${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={c.leafB} />
          <stop offset="1" stopColor={c.leafA} />
        </linearGradient>
        <radialGradient id={`fr${id}`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor={c.fruitA} />
          <stop offset="1" stopColor={c.fruitB} />
        </radialGradient>
      </defs>
      <g className="ob-sway">
        <path className="ob-stem" d={stem} pathLength={1} fill="none" stroke={c.stem} strokeWidth="2.6" strokeLinecap="round" />
        {parts.fruit.map((f, i) => (
          <g key={`f${i}`} transform={`translate(${f.x} ${f.y}) rotate(${f.a})`}>
            <g className="ob-olive">
              <path d="M0 0 Q 4 6 3 12" stroke={c.stem} strokeWidth="1.2" fill="none" />
              <ellipse cx="4" cy="19" rx="6.2" ry="8.6" fill={`url(#fr${id})`} />
              <ellipse cx="2" cy="16" rx="1.6" ry="2.6" fill="#fff" opacity=".28" />
            </g>
          </g>
        ))}
        {parts.leaves.map((l, i) => (
          <g key={i} transform={`translate(${l.x.toFixed(1)} ${l.y.toFixed(1)}) rotate(${l.a.toFixed(1)})`}>
            <g className="ob-leaf">
              <path d={leafPath(l.L, l.w)} fill={`url(#lf${id})`} />
              <path d={`M1.5 0 Q ${l.L * 0.5} ${-l.w * 0.12} ${l.L * 0.86} 0`} stroke={c.rib} strokeWidth=".9" fill="none" />
            </g>
          </g>
        ))}
      </g>
    </svg>
  )
}
