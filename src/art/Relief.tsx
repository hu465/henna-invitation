// Tone-on-tone embossed ("sculpted paper") artwork.
//
// Every ornament is drawn in the same colour as the surface it sits on and
// lifted off the page by an SVG bevel filter: a highlight on the edges facing
// the light (top-left) and a shade on the edges facing away, plus a soft cast
// shadow. Layered pieces (rosette rings, drape folds) are filtered one by one
// so each layer reads as its own sheet of paper.

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

/** Filter definitions, rendered once at the root of the app. */
export function ReliefDefs() {
  return (
    <svg id="relief-defs" width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        {/* Raised relief on light paper. */}
        <Bevel id="emboss" depth={1.3} blur={1.4} hi="#ffffff" hiA={0.95} sh="#465438" shA={0.42} cast={0.22} />
        {/* Deeper relief for large forms (drapes, rosettes). */}
        <Bevel id="emboss-deep" depth={2.4} blur={2.6} hi="#ffffff" hiA={0.9} sh="#3c472f" shA={0.5} cast={0.28} />
        {/* Raised relief on olive paper (the envelope). */}
        <Bevel id="emboss-olive" depth={1.6} blur={1.8} hi="#f4ecd2" hiA={0.42} sh="#1d2414" shA={0.62} cast={0.35} />
        {/* Pressed into the paper (debossed lines and panels). */}
        <Bevel id="deboss" depth={-1.1} blur={1.2} hi="#ffffff" hiA={0.9} sh="#465438" shA={0.35} cast={0} />
        {/* Paper finish: fine speckle and long cotton fibres, as a translucent veil. */}
        <filter id="grain" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.45  1.4 0 0 0 -0.62" />
        </filter>
        {/* Cloudy formation of cotton paper: soft light and dark mottling. */}
        <filter id="fibres" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="3" seed="11" />
          <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.46  0.9 0 0 0 -0.38" />
        </filter>
        {/* Soft, blurred cast shadow. */}
        <filter id="soft-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        {/* Satin / mother-of-pearl surface. */}
        <filter id="satin" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.004 0.016" numOctaves="2" seed="7" result="n" />
          <feDiffuseLighting in="n" surfaceScale="9" diffuseConstant="1.15" lightingColor="#ffffff" result="l">
            <feDistantLight azimuth="235" elevation="38" />
          </feDiffuseLighting>
          <feComposite in="SourceGraphic" in2="l" operator="arithmetic" k1="1.15" k2="0" k3="0" k4="0" />
        </filter>
      </defs>
    </svg>
  )
}

/** A bevel: highlight toward the light, shade away from it, optional cast shadow. */
function Bevel({ id, depth, blur, hi, hiA, sh, shA, cast }: { id: string; depth: number; blur: number; hi: string; hiA: number; sh: string; shA: number; cast: number }) {
  const d = Math.abs(depth)
  const [toLight, away] = depth > 0 ? ['a', 'b'] : ['b', 'a']
  return (
    <filter id={id} x="-8%" y="-8%" width="116%" height="116%" colorInterpolationFilters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation={blur} result="blur" />
      <feOffset in="blur" dx={d} dy={d} result="a" />
      <feOffset in="blur" dx={-d} dy={-d} result="b" />
      {/* Inside the shape: where the light-side sample is weaker we are on a lit edge, and vice versa. */}
      <feComposite in={toLight} in2={away} operator="arithmetic" k2="-1" k3="1" result="hiMask" />
      <feComposite in={away} in2={toLight} operator="arithmetic" k2="-1" k3="1" result="shMask" />
      <feFlood floodColor={hi} floodOpacity={hiA} />
      <feComposite in2="hiMask" operator="in" />
      <feComposite in2="SourceAlpha" operator="in" result="hiLayer" />
      <feFlood floodColor={sh} floodOpacity={shA} />
      <feComposite in2="shMask" operator="in" />
      <feComposite in2="SourceAlpha" operator="in" result="shLayer" />
      {cast > 0 && (
        <>
          <feGaussianBlur in="SourceAlpha" stdDeviation={blur * 1.6} />
          <feOffset dx={d * 1.2} dy={d * 1.8} result="castShape" />
          <feFlood floodColor={sh} floodOpacity={cast} />
          <feComposite in2="castShape" operator="in" result="castLayer" />
        </>
      )}
      <feMerge>
        {cast > 0 && <feMergeNode in="castLayer" />}
        <feMergeNode in="SourceGraphic" />
        <feMergeNode in="shLayer" />
        <feMergeNode in="hiLayer" />
      </feMerge>
    </filter>
  )
}

export function rng(seed: number) {
  let s = seed % 2147483647 || 1
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
}

/** An olive leaf split along its midrib, so the relief shows a crease. */
export function leafHalves(L: number, w: number) {
  const top = `M0 -0.7 C ${L * 0.22} ${-w} ${L * 0.68} ${-w * 1.05} ${L} -0.4 L ${L * 0.98} -0.2 C ${L * 0.6} -0.6 ${L * 0.3} -0.6 0 -0.7Z`
  const bottom = `M0 0.7 C ${L * 0.22} ${w} ${L * 0.68} ${w * 0.95} ${L} 0.4 L ${L * 0.98} 0.2 C ${L * 0.6} 0.6 ${L * 0.3} 0.6 0 0.7Z`
  return top + bottom
}

interface SprigProps {
  /** Length of the sprig in user units. */
  length: number
  leaves?: number
  seed?: number
  /** Leaf size relative to length. */
  leafScale?: number
  curve?: number
  fill: string
  filter?: string
  className?: string
  transform?: string
}

/** A relief olive sprig drawn from the origin along +x. */
export function Sprig({ length, leaves = 9, seed = 3, leafScale = 0.22, curve = 0.12, fill, filter = 'url(#emboss)', className, transform }: SprigProps) {
  const d = useMemo(() => {
    const r = rng(seed)
    const c = length * curve
    const at = (t: number) => {
      // Quadratic curve (0,0) → (L/2, -c) → (L, 0).
      const x = length * t
      const y = -4 * c * t * (1 - t)
      const ang = Math.atan2(-4 * c * (1 - 2 * t), length)
      return { x, y, ang }
    }
    let path = ''
    for (let i = 0; i < leaves; i++) {
      const t = 0.12 + (0.82 * i) / Math.max(1, leaves - 1)
      const { x, y, ang } = at(t)
      const side = i % 2 ? 1 : -1
      const a = (ang * 180) / Math.PI + side * (30 + r() * 16)
      const L = length * leafScale * (1.15 - t * 0.45) * (0.9 + r() * 0.2)
      path += `<path transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(1)})" d="${leafHalves(L, L * 0.2)}"/>`
    }
    const tip = at(1)
    path += `<path transform="translate(${tip.x.toFixed(1)} ${tip.y.toFixed(1)}) rotate(${((tip.ang * 180) / Math.PI).toFixed(1)})" d="${leafHalves(length * leafScale * 0.75, length * leafScale * 0.15)}"/>`
    return { leaves: path, stem: `M0 0 Q ${length / 2} ${-2 * c} ${length} 0` }
  }, [length, leaves, seed, leafScale, curve])
  return (
    <g className={className} transform={transform} filter={filter}>
      <path d={d.stem} fill="none" stroke={fill} strokeWidth={Math.max(2, length * 0.012)} strokeLinecap="round" />
      <g fill={fill} dangerouslySetInnerHTML={{ __html: d.leaves }} />
    </g>
  )
}

/** A layered relief flower (rose-like), each ring filtered as its own sheet. */
export function Rosette({ r, fill, x = 0, y = 0, seed = 1, filter = 'url(#emboss-deep)' }: { r: number; fill: string; x?: number; y?: number; seed?: number; filter?: string }) {
  const rings = useMemo(() => {
    const rand = rng(seed)
    const out: string[] = []
    const layers = [
      { n: 7, rr: 1, w: 0.62 },
      { n: 6, rr: 0.72, w: 0.6 },
      { n: 5, rr: 0.46, w: 0.58 },
    ]
    layers.forEach((l, li) => {
      const off = rand() * Math.PI
      let p = ''
      for (let i = 0; i < l.n; i++) {
        const a = off + (i / l.n) * Math.PI * 2
        const R = r * l.rr
        const pw = R * l.w
        // A rounded petal from the centre outward.
        const ex = Math.cos(a) * R, ey = Math.sin(a) * R
        const nx = -Math.sin(a) * pw, ny = Math.cos(a) * pw
        p += `M0 0 C ${(ex * 0.4 + nx).toFixed(1)} ${(ey * 0.4 + ny).toFixed(1)} ${(ex + nx * 0.6).toFixed(1)} ${(ey + ny * 0.6).toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)} C ${(ex - nx * 0.6).toFixed(1)} ${(ey - ny * 0.6).toFixed(1)} ${(ex * 0.4 - nx).toFixed(1)} ${(ey * 0.4 - ny).toFixed(1)} 0 0Z`
      }
      out.push(p)
      if (li === 2) out.push(`M${-r * 0.16} 0 a ${r * 0.16} ${r * 0.16} 0 1 0 ${r * 0.32} 0 a ${r * 0.16} ${r * 0.16} 0 1 0 ${-r * 0.32} 0Z`)
    })
    return out
  }, [r, seed])
  return (
    <g transform={`translate(${x} ${y})`}>
      {rings.map((d, i) => (
        <path key={i} d={d} fill={fill} filter={filter} />
      ))}
    </g>
  )
}

/**
 * Ornate cartouche: straight sides, scooped corners and a pointed (ogee)
 * crest at top and bottom — a Levantine arch mirrored.
 */
export function cartouchePath(x0: number, y0: number, x1: number, y1: number, r: number, crest: number) {
  const cx = (x0 + x1) / 2
  const s = Math.min((x1 - x0) * 0.22, 90)
  return [
    `M${x0} ${y0 + r}`,
    `A ${r} ${r} 0 0 0 ${x0 + r} ${y0}`,
    `L ${cx - s} ${y0}`,
    `C ${cx - s * 0.45} ${y0} ${cx - s * 0.3} ${y0 - crest} ${cx} ${y0 - crest}`,
    `C ${cx + s * 0.3} ${y0 - crest} ${cx + s * 0.45} ${y0} ${cx + s} ${y0}`,
    `L ${x1 - r} ${y0}`,
    `A ${r} ${r} 0 0 0 ${x1} ${y0 + r}`,
    `L ${x1} ${y1 - r}`,
    `A ${r} ${r} 0 0 0 ${x1 - r} ${y1}`,
    `L ${cx + s} ${y1}`,
    `C ${cx + s * 0.45} ${y1} ${cx + s * 0.3} ${y1 + crest} ${cx} ${y1 + crest}`,
    `C ${cx - s * 0.3} ${y1 + crest} ${cx - s * 0.45} ${y1} ${cx - s} ${y1}`,
    `L ${x0 + r} ${y1}`,
    `A ${r} ${r} 0 0 0 ${x0} ${y1 - r}`,
    'Z',
  ].join(' ')
}

/** A corner bouquet: rosettes nestled among olive sprigs, drawn for the top-right corner. */
export function CornerBouquet({ size, fill, seed = 1 }: { size: number; fill: string; seed?: number }) {
  const s = size
  return (
    <g>
      <Sprig length={s * 1.05} leaves={10} seed={seed + 2} fill={fill} transform={`translate(${s * 0.98} ${s * 0.08}) rotate(152)`} leafScale={0.2} />
      <Sprig length={s * 0.95} leaves={9} seed={seed + 5} fill={fill} transform={`translate(${s * 0.94} ${s * 0.12}) rotate(118)`} leafScale={0.2} />
      <Sprig length={s * 0.62} leaves={7} seed={seed + 9} fill={fill} transform={`translate(${s * 0.72} ${s * 0.3}) rotate(170)`} leafScale={0.22} curve={-0.1} />
      <Rosette r={s * 0.2} x={s * 0.8} y={s * 0.2} fill={fill} seed={seed} />
      <Rosette r={s * 0.13} x={s * 0.52} y={s * 0.12} fill={fill} seed={seed + 3} />
      <Rosette r={s * 0.11} x={s * 0.9} y={s * 0.5} fill={fill} seed={seed + 7} />
    </g>
  )
}

/**
 * A cheap embossed edge for large outlines: a shade stroke offset away from the
 * light, a highlight stroke offset toward it, and the paper stroke on top.
 * Visually close to the bevel filter at a fraction of its cost.
 */
export function BevelStroke({ d, paper, width, hi = 'rgba(255,255,255,0.9)', sh = 'rgba(60,72,46,0.38)', depth = 1.2, fill = 'none' }: { d: string; paper: string; width: number; hi?: string; sh?: string; depth?: number; fill?: string }) {
  return (
    <g fill="none" strokeLinejoin="round">
      <path d={d} stroke={sh} strokeWidth={width} transform={`translate(${depth} ${depth * 1.4})`} />
      <path d={d} stroke={hi} strokeWidth={width} transform={`translate(${-depth} ${-depth})`} />
      <path d={d} stroke={paper} strokeWidth={width} fill={fill} />
    </g>
  )
}

/**
 * Real paper finish over a surface: grain, fibres and directional light
 * (brighter toward the top-left light, falling off toward the bottom-right).
 */
export function PaperFinish({ w, h, clip, grain = 1, light = 1 }: { w: number; h: number; clip?: string; grain?: number; light?: number }) {
  const id = `pf${Math.round(w)}x${Math.round(h)}${clip ? clip.replace(/[^a-z0-9]/gi, '') : ''}`
  return (
    <g clipPath={clip ? `url(#${clip})` : undefined}>
      <defs>
        <linearGradient id={`${id}l`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fffbe8" stopOpacity={0.16 * light} />
          <stop offset="0.45" stopColor="#fffbe8" stopOpacity="0" />
          <stop offset="1" stopColor="#141a0c" stopOpacity={0.2 * light} />
        </linearGradient>
        <radialGradient id={`${id}v`} cx="0.5" cy="0.45" r="0.75">
          <stop offset="0.6" stopColor="#141a0c" stopOpacity="0" />
          <stop offset="1" stopColor="#141a0c" stopOpacity={0.14 * light} />
        </radialGradient>
      </defs>
      <rect width={w} height={h} filter="url(#fibres)" opacity={0.28 * grain} />
      <rect width={w} height={h} filter="url(#grain)" opacity={0.55 * grain} />
      <rect width={w} height={h} fill={`url(#${id}l)`} />
      <rect width={w} height={h} fill={`url(#${id}v)`} />
    </g>
  )
}

/** Wraps children in an absolutely sized SVG in px units. */
export function Canvas({ w, h, className, children }: { w: number; h: number; className?: string; children: ReactNode }) {
  if (!w || !h) return null
  return (
    <svg className={className} width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      {children}
    </svg>
  )
}

/**
 * Rasterises an SVG (with the relief filters) into a PNG once. Filtered
 * vector art is expensive to repaint, so anything that animates or scrolls
 * is drawn as a plain bitmap after the first paint.
 */
async function bake(svg: SVGSVGElement, w: number, h: number) {
  const defs = document.querySelector('#relief-defs defs')?.outerHTML ?? ''
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  // The live source is kept invisible; the baked copy must not be.
  clone.removeAttribute('style')
  clone.insertAdjacentHTML('afterbegin', defs)
  const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(clone))
  const img = new Image()
  img.src = src
  await img.decode()
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
  try {
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'))
    return blob ? URL.createObjectURL(blob) : src
  } catch {
    // A browser that refuses to export the canvas still gets a cached SVG image.
    return src
  }
}

// One bake at a time, most important first, and never while the opening plays.
type Job = { priority: number; run: () => Promise<void> }
const jobs: Job[] = []
let busy = false
let paused = false

function pump() {
  if (busy || paused || !jobs.length) return
  jobs.sort((a, b) => a.priority - b.priority)
  const job = jobs.shift()!
  busy = true
  job.run().finally(() => {
    busy = false
    setTimeout(pump, 16)
  })
}

function enqueue(priority: number, run: () => Promise<void>) {
  const job = { priority, run }
  jobs.push(job)
  pump()
  return () => {
    const i = jobs.indexOf(job)
    if (i >= 0) jobs.splice(i, 1)
  }
}

/** Holds back baking while a timeline needs the main thread. */
export function pauseBaking(on: boolean) {
  paused = on
  if (!on) pump()
}

/** Vector source until its baked bitmap is ready; `priority` 0 bakes first. */
export function Baked({ w, h, className, priority = 5, children }: { w: number; h: number; className?: string; priority?: number; children: ReactNode }) {
  const ref = useRef<SVGSVGElement>(null)
  const [img, setImg] = useState<{ url: string; w: number; h: number } | null>(null)
  const current = img && img.w === w && img.h === h ? img.url : null

  useEffect(() => {
    if (current || !ref.current || !w || !h) return
    let alive = true
    const svg = ref.current
    const cancel = enqueue(priority, () =>
      bake(svg, w, h).then(
        (url) => {
          if (alive) setImg({ url, w, h })
          else if (url.startsWith('blob:')) URL.revokeObjectURL(url)
        },
        () => {},
      ),
    )
    return () => {
      alive = false
      cancel()
    }
  }, [current, w, h, priority])

  useEffect(() => () => {
    if (img?.url.startsWith('blob:')) URL.revokeObjectURL(img.url)
  }, [img])

  if (!w || !h) return null
  if (current) return <img className={`baked ${className ?? ''}`} src={current} width={w} height={h} alt="" aria-hidden="true" draggable={false} />
  // Never painted live: the vector source stays invisible while it is rasterised.
  return (
    <svg ref={ref} className={className} width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" style={{ visibility: 'hidden' }}>
      {children}
    </svg>
  )
}
