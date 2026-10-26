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
  // Irregular wax outline: a circle with layered low-frequency wobble.
  const pts: string[] = []
  const n = 64
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const r = 55 + Math.sin(a * 3 + seed) * 1.6 + Math.sin(a * 7 + seed * 2) * 1.1 + Math.sin(a * 13 + seed) * 0.6
    pts.push(`${(60 + Math.cos(a) * r).toFixed(2)} ${(60 + Math.sin(a) * r).toFixed(2)}`)
  }
  return `M${pts.join(' L')}Z`
}

/**
 * Champagne wax seal, lit like the real thing. The artwork is drawn as a
 * height map in greys (pooled rim high, stamped plateau lower, the stamp's
 * design raised again) and a lighting filter turns it into glossy, mottled
 * wax with highlights that follow the relief.
 */
export function WaxSealArt({ monogram }: { monogram: string }) {
  const id = useId().replace(/:/g, '')
  const blob = useMemo(() => waxBlob(2.3), [])
  const two = monogram.length > 1
  return (
    <svg className="wax-art" viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <radialGradient id={`wh${id}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#cfcfcf" />
          <stop offset="0.7" stopColor="#d9d9d9" />
          <stop offset="0.83" stopColor="#ffffff" />
          <stop offset="0.94" stopColor="#bdbdbd" />
          <stop offset="1" stopColor="#5a5a5a" />
        </radialGradient>
        <filter id={`wx${id}`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feColorMatrix in="SourceGraphic" type="luminanceToAlpha" result="h" />
          <feGaussianBlur in="h" stdDeviation="1.3" result="hb" />
          <feDiffuseLighting in="hb" surfaceScale="7" diffuseConstant="1.15" lightingColor="#ffffff" result="diff">
            <feDistantLight azimuth="225" elevation="48" />
          </feDiffuseLighting>
          <feSpecularLighting in="hb" surfaceScale="7" specularConstant="1.1" specularExponent="26" lightingColor="#fff6dc" result="spec">
            <fePointLight x="28" y="18" z="95" />
          </feSpecularLighting>
          {/* Mottled champagne wax. */}
          <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="4" result="n" />
          <feColorMatrix in="n" values="0.14 0 0 0 0.71  0 0.13 0 0 0.635  0 0 0.12 0 0.48  0 0 0 0 1" result="base" />
          <feComposite in="base" in2="diff" operator="arithmetic" k1="1.3" result="lit" />
          <feComposite in="spec" in2="lit" operator="arithmetic" k2="0.6" k3="1" result="shiny" />
          <feComposite in="shiny" in2="SourceAlpha" operator="in" />
        </filter>
      </defs>
      <g filter={`url(#wx${id})`}>
        <path d={blob} fill={`url(#wh${id})`} />
        {/* The stamped plateau and the stamp's edge. */}
        <circle cx="60" cy="60" r="40" fill="#a9a9a9" />
        <circle cx="60" cy="60" r="40" fill="none" stroke="#e6e6e6" strokeWidth="2.2" />
        <circle cx="60" cy="60" r="34.5" fill="none" stroke="#d2d2d2" strokeWidth="0.9" strokeDasharray="1.6 2.4" />
        {/* Raised eight-point star and monogram. */}
        <g fill="none" stroke="#f2f2f2" strokeWidth="1.8" strokeLinejoin="round">
          <path d="M60 31 L89 60 L60 89 L31 60Z" />
          <path d="M39.5 39.5 H80.5 V80.5 H39.5Z" />
        </g>
        <circle cx="60" cy="60" r="18.5" fill="#a9a9a9" />
        <text x="60" y={two ? 66 : 70} textAnchor="middle" fontFamily="'Aref Ruqaa', serif" fontSize={two ? 22 : 30} fontWeight="700" direction="rtl" fill="#f5f5f5">
          {monogram}
        </text>
      </g>
    </svg>
  )
}
