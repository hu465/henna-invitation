import { useId } from 'react'
import type { EventDetails } from '../config/event'
import { Baked, BevelStroke, CornerBouquet, PaperFinish, cartouchePath } from '../art/Relief'
import { Divider } from '../art/Ornaments'
import { shortDate, timeLabel } from '../lib/format'
import { useViewport } from '../lib/useViewport'

// The invitation card that sits inside the envelope: embossed ivory paper with
// relief bouquets in each corner, a raised cartouche, and a satin ribbon tied
// around it. Elements carry hooks that heroReveal.ts choreographs.

export const CARD_PAPER = '#f3f3ea'

export function cardLayout(w: number, h: number) {
  const portrait = h > w
  const mx = Math.max(24, w * (portrait ? 0.085 : 0.2))
  const top = h * (portrait ? 0.17 : 0.15)
  const bottom = h * (portrait ? 0.12 : 0.11)
  const corner = Math.min(w * 0.47, h * 0.3)
  return { mx, top, bottom, corner, crest: Math.min(34, h * 0.035) }
}

function Ribbon({ w, h }: { w: number; h: number }) {
  const id = useId().replace(/:/g, '')
  const cy = h * 0.5
  const cx = w / 2
  const t = Math.max(30, Math.min(w * 0.085, 48))
  const L = t * 2.6
  const loop = (dir: 1 | -1) => `M0 0 C ${dir * L * 0.35} ${-L * 0.62} ${dir * L * 1.15} ${-L * 0.58} ${dir * L * 1.02} 0 C ${dir * L * 1.12} ${L * 0.5} ${dir * L * 0.35} ${L * 0.5} 0 0Z`
  // The inside of the loop, seen through its opening: smaller and set toward the knot.
  const hole = (dir: 1 | -1) => `M${dir * L * 0.22} ${-L * 0.04} C ${dir * L * 0.42} ${-L * 0.36} ${dir * L * 0.86} ${-L * 0.34} ${dir * L * 0.8} ${-L * 0.02} C ${dir * L * 0.84} ${L * 0.24} ${dir * L * 0.42} ${L * 0.26} ${dir * L * 0.22} ${-L * 0.04}Z`
  const tailL = `M-4 6 L${-L * 0.55} ${L * 1.25} L${-L * 0.32} ${L * 1.12} L${-L * 0.3} ${L * 1.42} L6 10Z`
  const tailR = `M4 6 L${L * 0.6} ${L * 1.2} L${L * 0.36} ${L * 1.1} L${L * 0.36} ${L * 1.4} L-6 10Z`
  const band = (x: number, width: number) => (
    <>
      <rect x={x} y={cy - t / 2} width={width} height={t} fill={`url(#satin${id})`} />
      <rect x={x} y={cy - t / 2} width={width} height={t} fill={`url(#sheen${id})`} />
      <rect x={x} y={cy - t / 2} width={width} height={t} fill={`url(#weave${id})`} />
    </>
  )
  return (
    <svg className="ribbon" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <defs>
        {/* Across the width: the curve of a satin ribbon catching the light. */}
        <linearGradient id={`satin${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a8955f" />
          <stop offset="0.08" stopColor="#d3c397" />
          <stop offset="0.3" stopColor="#ece2c3" />
          <stop offset="0.55" stopColor="#ddcfa6" />
          <stop offset="0.8" stopColor="#e6dab4" />
          <stop offset="0.93" stopColor="#c6b485" />
          <stop offset="1" stopColor="#a08c5b" />
        </linearGradient>
        {/* Along the length: soft travelling highlights. */}
        <linearGradient id={`sheen${id}`} x1="0" y1="0" x2="1" y2="0" gradientUnits="userSpaceOnUse" gradientTransform={`scale(${w} 1)`}>
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.18" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.3" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.62" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.74" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="0.86" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        {/* The fine lengthwise weave of satin. */}
        <pattern id={`weave${id}`} width="6" height="2" patternUnits="userSpaceOnUse">
          <rect width="6" height="1" fill="#5c4d26" opacity="0.07" />
        </pattern>
        <linearGradient id={`loop${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6efd8" />
          <stop offset="0.35" stopColor="#d6c597" />
          <stop offset="0.62" stopColor="#ece0bc" />
          <stop offset="1" stopColor="#9c8857" />
        </linearGradient>
        <radialGradient id={`inside${id}`} cx="0.5" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#7d6b41" />
          <stop offset="1" stopColor="#7d6b41" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`wrap${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3a2f14" stopOpacity="0.55" />
          <stop offset="1" stopColor="#3a2f14" stopOpacity="0" />
        </linearGradient>
        {/* The band wraps around the card's edges rather than running past them. */}
        <clipPath id={`card${id}`}>
          <rect width={w} height={h} />
        </clipPath>
      </defs>
      <g transform={`rotate(-6 ${cx} ${cy})`}>
        <g clipPath={`url(#card${id})`}>
          <g className="ribbon-l">{band(-w * 0.3, cx + w * 0.3)}</g>
          <g className="ribbon-r">{band(cx, w * 0.8)}</g>
        </g>
        {/* Darkening where the band turns over the card's edge. */}
        <g clipPath={`url(#card${id})`}>
          <rect x="0" y={cy - t / 2} width="14" height={t} fill={`url(#wrap${id})`} className="ribbon-wrap" />
          <rect x={w - 14} y={cy - t / 2} width="14" height={t} fill={`url(#wrap${id})`} transform={`rotate(180 ${w - 7} ${cy})`} className="ribbon-wrap" />
        </g>
        <g className="bow" transform={`translate(${cx} ${cy})`}>
          <g className="bow-tail bow-tail--l">
            <path d={tailL} fill={`url(#loop${id})`} />
            <path d={`M0 10 L${-L * 0.4} ${L * 1.18}`} stroke="#8f7c4e" strokeOpacity="0.45" strokeWidth="1" />
          </g>
          <g className="bow-tail bow-tail--r">
            <path d={tailR} fill={`url(#loop${id})`} />
            <path d={`M0 10 L${L * 0.46} ${L * 1.14}`} stroke="#8f7c4e" strokeOpacity="0.45" strokeWidth="1" />
          </g>
          {([-1, 1] as const).map((dir) => (
            <g key={dir} className={`bow-loop bow-loop--${dir < 0 ? 'l' : 'r'}`}>
              <path d={loop(dir)} fill={`url(#loop${id})`} />
              <path d={hole(dir)} fill={`url(#inside${id})`} opacity="0.32" />
              <path d={`M${dir * 4} ${-4} C ${dir * L * 0.35} ${-L * 0.56} ${dir * L * 1.05} ${-L * 0.54} ${dir * L * 0.98} ${-L * 0.08}`} fill="none" stroke="#fffaf0" strokeOpacity="0.6" strokeWidth="1.3" />
            </g>
          ))}
          <g className="bow-knot">
            <rect x={-t * 0.36} y={-t * 0.46} width={t * 0.72} height={t * 0.92} rx={t * 0.28} fill={`url(#satin${id})`} />
            <path d={`M${-t * 0.18} ${-t * 0.4} q ${t * 0.08} ${t * 0.4} 0 ${t * 0.8} M${t * 0.16} ${-t * 0.4} q ${-t * 0.06} ${t * 0.4} 0 ${t * 0.8}`} fill="none" stroke="#7d6b41" strokeOpacity="0.45" strokeWidth="1" />
          </g>
        </g>
      </g>
    </svg>
  )
}

export function InvitationFace({ event, guestName = '' }: { event: EventDetails; guestName?: string }) {
  const vp = useViewport()
  const w = vp.w
  const h = Math.max(vp.h, 600)
  const { mx, top, bottom, corner, crest } = cardLayout(w, h)
  const rim = cartouchePath(mx, top, w - mx, h - bottom, 26, crest)
  const panel = cartouchePath(mx + 13, top + 13, w - mx - 13, h - bottom - 13, 20, crest * 0.8)

  return (
    <div className="face">
      <Baked className="card-art" w={w} h={h} priority={1}>
        <rect width={w} height={h} fill={CARD_PAPER} />
        <PaperFinish w={w} h={h} grain={0.45} light={0.6} />
        {/* Pressed panel: shade on the edge nearest the light, highlight opposite. */}
        <BevelStroke d={panel} paper={CARD_PAPER} width={1.2} hi="rgba(60,72,46,0.22)" sh="rgba(255,255,255,0.95)" depth={1} />
        {/* Raised rim. */}
        <BevelStroke d={rim} paper={CARD_PAPER} width={6} depth={1.4} />
        <g className="card-corner" transform={`translate(${w - corner} 0)`}><CornerBouquet size={corner} fill={CARD_PAPER} seed={1} /></g>
        <g className="card-corner" transform={`translate(${corner} 0) scale(-1 1)`}><CornerBouquet size={corner} fill={CARD_PAPER} seed={4} /></g>
        <g className="card-corner" transform={`translate(${w - corner} ${h}) scale(1 -1)`}><CornerBouquet size={corner * 0.82} fill={CARD_PAPER} seed={9} /></g>
        <g className="card-corner" transform={`translate(${corner} ${h}) scale(-1 -1)`}><CornerBouquet size={corner * 0.82} fill={CARD_PAPER} seed={13} /></g>
      </Baked>

      <div className="card-sheen anim-loop" aria-hidden="true" />

      <div className="cartouche-body" style={{ left: mx + 22, right: mx + 22, top: top + 22, bottom: bottom + 22 }}>
        <p className="f-basmala" data-reveal="line">بسم الله الرحمن الرحيم</p>
        <p className="f-love" data-reveal="line">{guestName ? `إلى الغالية ${guestName}` : 'بكل الحب والفرح'}</p>
        <h1 className="f-title" tabIndex={-1}>
          <span className="f-title-lead" data-reveal="line">ندعوكم لمشاركتنا</span>
          <span className="sr-only">ليلة الحنّة</span>
          <svg className="f-title-art" viewBox="0 0 600 190" aria-hidden="true">
            <text className="title-ink" x="300" y="140" textAnchor="middle" direction="rtl">
              ليلة الحنّة
            </text>
          </svg>
        </h1>
        <p className="f-name" data-reveal="line">
          <span className="f-name-label">للعروس</span>
          <span className="f-name-text">{event.brideName}</span>
        </p>
        <Divider className="f-divider" />
        <p className="f-date" data-reveal="line">
          <bdi>{shortDate(event)}</bdi>
          <span className="f-date-sep" aria-hidden="true"> ◆ </span>
          <bdi>الساعة {timeLabel(event.time)}</bdi>
        </p>
        <p className="f-close" data-reveal="line">فرحتنا تكتمل بوجودكم</p>
      </div>

      <Ribbon w={w} h={h} />
    </div>
  )
}
