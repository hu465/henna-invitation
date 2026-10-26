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

/** Champagne wax seal with an embossed Arabic monogram. */
export function WaxSealArt({ monogram }: { monogram: string }) {
  const id = useId().replace(/:/g, '')
  const blob = useMemo(() => waxBlob(2.3), [])
  return (
    <svg className="wax-art" viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <radialGradient id={`wx${id}`} cx="0.38" cy="0.32" r="0.75">
          <stop offset="0" stopColor="#EADFBE" />
          <stop offset="0.45" stopColor="#C6B58A" />
          <stop offset="0.85" stopColor="#9C8857" />
          <stop offset="1" stopColor="#7D6B41" />
        </radialGradient>
        <radialGradient id={`wi${id}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.7" stopColor="#B8A675" />
          <stop offset="1" stopColor="#A08C5B" />
        </radialGradient>
        <filter id={`we${id}`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.1" result="b" />
          <feOffset dx="-0.8" dy="-0.8" result="o1" />
          <feComposite in="o1" in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="hi" />
          <feFlood floodColor="#5E4F2C" floodOpacity=".75" />
          <feComposite in2="hi" operator="in" result="shade" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="shade" />
          </feMerge>
        </filter>
      </defs>
      <path d={blob} fill={`url(#wx${id})`} />
      <circle cx="60" cy="60" r="41" fill={`url(#wi${id})`} />
      <circle cx="60" cy="60" r="41" fill="none" stroke="#F3EAD0" strokeOpacity=".55" strokeWidth="1" transform="translate(.8 .8)" />
      <circle cx="60" cy="60" r="41" fill="none" stroke="#6F5F37" strokeOpacity=".7" strokeWidth="1.2" />
      <circle cx="60" cy="60" r="35" fill="none" stroke="#6F5F37" strokeOpacity=".45" strokeWidth=".6" strokeDasharray="1.5 2.5" />
      <g filter={`url(#we${id})`} fill="none" stroke="#9A8653" strokeWidth="1.3" strokeLinejoin="round">
        {/* Embossed eight-point star behind the monogram */}
        <path d="M60 31 L89 60 L60 89 L31 60Z" />
        <path d="M39.5 39.5 H80.5 V80.5 H39.5Z" />
      </g>
      <circle cx="60" cy="60" r="19" fill={`url(#wi${id})`} />
      <g filter={`url(#we${id})`} fill="#A28E5C">
        <text x="60" y={monogram.length > 1 ? 66 : 70} textAnchor="middle" fontFamily="'Aref Ruqaa', serif" fontSize={monogram.length > 1 ? 22 : 30} fontWeight="700" direction="rtl">
          {monogram}
        </text>
      </g>
      <ellipse cx="44" cy="36" rx="14" ry="7" fill="#fff" opacity=".22" transform="rotate(-30 44 36)" />
    </svg>
  )
}
