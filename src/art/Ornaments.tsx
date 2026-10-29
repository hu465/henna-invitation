import { useId, useMemo } from 'react'
import { OliveBranch } from './OliveBranch'

/** Corner flourish for the invitation frame; mirrored per corner in CSS. */
export function CornerOrnament({ className = '' }: { className?: string }) {
  return (
    <svg className={`corner ${className}`} viewBox="0 0 80 80" aria-hidden="true">
      <path className="draw" pathLength={1} d="M3 78 V26 Q3 3 26 3 H78" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path className="draw" pathLength={1} d="M10 78 V30 Q10 10 30 10 H78" fill="none" stroke="currentColor" strokeWidth=".7" opacity=".7" />
      <path d="M19 19 l5 -5 l5 5 l-5 5z" fill="currentColor" opacity=".9" />
      <path d="M30 22 c 8 -9 18 -9 24 -6 c -8 5 -16 8 -24 6z" fill="currentColor" opacity=".55" />
      <path d="M22 30 c -9 8 -9 18 -6 24 c 5 -8 8 -16 6 -24z" fill="currentColor" opacity=".55" />
    </svg>
  )
}

/** Two mirrored olive branches meeting under a small medallion. */
export function Crest({ className = '', tone = 'olive' as const }: { className?: string; tone?: 'olive' | 'champagne' | 'ivory' }) {
  return (
    <div className={`crest ${className}`} aria-hidden="true">
      <OliveBranch className="crest-branch crest-right" tone={tone} leaves={11} olives={2} seed={11} />
      <span className="crest-gem" />
      <OliveBranch className="crest-branch crest-left" tone={tone} leaves={11} olives={2} seed={23} />
    </div>
  )
}

export function Divider({ className = '' }: { className?: string }) {
  return (
    <svg className={`divider ${className}`} viewBox="0 0 240 24" aria-hidden="true">
      <path className="draw" pathLength={1} d="M4 12 H100" stroke="currentColor" strokeWidth="1" />
      <path className="draw" pathLength={1} d="M140 12 H236" stroke="currentColor" strokeWidth="1" />
      <path d="M120 3 l9 9 l-9 9 l-9 -9z" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="120" cy="12" r="2.4" fill="currentColor" />
      <path d="M104 12 c 3 -4 7 -5 9 -4 c -2 3 -6 4 -9 4z M136 12 c -3 -4 -7 -5 -9 -4 c 2 3 6 4 9 4z" fill="currentColor" opacity=".7" />
    </svg>
  )
}

function waxBlob(seed: number) {
  // Pooled wax: a soft circle with a few gentle swells where the wax spread
  // further, rather than a regular wobble.
  const pts: string[] = []
  const n = 96
  const swells = [0.4, 1.9, 3.3, 4.6, 5.7].map((c, i) => ({ c: c + seed * 0.1, h: [3.2, 2.1, 3.8, 1.6, 2.6][i], w: [0.32, 0.22, 0.4, 0.2, 0.28][i] }))
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    let r = 52.5 + Math.sin(a * 5 + seed) * 0.5 + Math.sin(a * 11 + seed * 3) * 0.35
    for (const s of swells) {
      const d = Math.atan2(Math.sin(a - s.c), Math.cos(a - s.c))
      r += s.h * Math.exp(-(d * d) / (2 * s.w * s.w))
    }
    pts.push(`${(60 + Math.cos(a) * r).toFixed(2)} ${(60 + Math.sin(a) * r).toFixed(2)}`)
  }
  return `M${pts.join(' L')}Z`
}

/** Leaves of a small olive wreath curving under the monogram. */
function wreath() {
  const leaves: string[] = []
  for (const side of [-1, 1]) {
    // A thin stem from the bottom centre up each side, at radius 22.
    const a0 = Math.PI / 2 + side * 0.18, a1 = Math.PI / 2 + side * 1.55
    const p = (a: number) => `${(60 + Math.cos(a) * 22).toFixed(2)} ${(62 + Math.sin(a) * 22).toFixed(2)}`
    leaves.push(`<path d="M${p(a0)} A 22 22 0 0 ${side > 0 ? 0 : 1} ${p(a1)}" fill="none" stroke="#dcdcdc" stroke-width="0.9"/>`)
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 2 + side * (0.42 + i * 0.32)
      for (const out of [1, -1]) {
        // Leaves alternate just outside and inside the stem, pointing along it.
        const r = 22 + out * 3.1
        const x = 60 + Math.cos(a) * r, y = 62 + Math.sin(a) * r
        const deg = (a * 180) / Math.PI + 90 + out * side * -32
        leaves.push(`<ellipse cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" rx="3.3" ry="1.5" transform="rotate(${deg.toFixed(1)} ${x.toFixed(2)} ${y.toFixed(2)})"/>`)
      }
    }
  }
  return leaves.join('')
}

/**
 * An artisan wax seal in antique gold. The artwork is drawn as a height map in
 * greys (pooled rim, pressed plateau, raised beads, wreath and monogram) and a
 * lighting filter turns it into satin wax: soft diffuse light and a restrained
 * sheen, so it reads as wax rather than plastic.
 */
export function WaxSealArt({ monogram }: { monogram: string }) {
  const id = useId().replace(/:/g, '')
  const blob = useMemo(() => waxBlob(2.3), [])
  const leaves = useMemo(wreath, [])
  const beads = useMemo(
    () => Array.from({ length: 44 }, (_, i) => {
      const a = (i / 44) * Math.PI * 2
      return [60 + Math.cos(a) * 33.6, 60 + Math.sin(a) * 33.6]
    }),
    [],
  )
  const two = monogram.length > 1
  return (
    <svg className="wax-art" viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <radialGradient id={`wh${id}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#c4c4c4" />
          <stop offset="0.72" stopColor="#cfcfcf" />
          <stop offset="0.82" stopColor="#f2f2f2" />
          <stop offset="0.9" stopColor="#e2e2e2" />
          <stop offset="0.97" stopColor="#8a8a8a" />
          <stop offset="1" stopColor="#3c3c3c" />
        </radialGradient>
        <filter id={`wx${id}`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feColorMatrix in="SourceGraphic" type="luminanceToAlpha" result="h" />
          <feGaussianBlur in="h" stdDeviation="0.9" result="hb" />
          <feDiffuseLighting in="hb" surfaceScale="5" diffuseConstant="1.25" lightingColor="#ffffff" result="diff">
            <feDistantLight azimuth="225" elevation="52" />
          </feDiffuseLighting>
          <feSpecularLighting in="hb" surfaceScale="5" specularConstant="0.5" specularExponent="14" lightingColor="#fff1cf" result="spec">
            <fePointLight x="30" y="22" z="110" />
          </feSpecularLighting>
          {/* Antique gold wax, faintly mottled where it cooled unevenly. */}
          <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="9" result="n" />
          <feColorMatrix in="n" values="0.1 0 0 0 0.56  0 0.09 0 0 0.5  0 0 0.08 0 0.36  0 0 0 0 1" result="base" />
          <feComposite in="base" in2="diff" operator="arithmetic" k1="1.32" result="lit" />
          <feComposite in="spec" in2="lit" operator="arithmetic" k2="0.42" k3="1" result="satin" />
          <feComposite in="satin" in2="SourceAlpha" operator="in" />
        </filter>
      </defs>
      <g filter={`url(#wx${id})`}>
        <path d={blob} fill={`url(#wh${id})`} />
        {/* The stamp's pressed plateau, with a crisp edge. */}
        <circle cx="60" cy="60" r="38.5" fill="#a2a2a2" />
        <circle cx="60" cy="60" r="38.5" fill="none" stroke="#d6d6d6" strokeWidth="1.4" />
        {/* Beaded ring and a fine inner line. */}
        <g fill="#dcdcdc">
          {beads.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.05" />
          ))}
        </g>
        <circle cx="60" cy="60" r="29.5" fill="none" stroke="#c9c9c9" strokeWidth="0.55" />
        {/* Olive wreath and the monogram, raised. */}
        <g fill="#e4e4e4" dangerouslySetInnerHTML={{ __html: leaves }} />
        <text x="60" y={two ? 63 : 64} textAnchor="middle" fontFamily="'Aref Ruqaa', serif" fontSize={two ? 20 : 30} fontWeight="700" direction="rtl" fill="#f6f6f6">
          {monogram}
        </text>
      </g>
    </svg>
  )
}
