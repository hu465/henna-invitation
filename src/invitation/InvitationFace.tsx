import { useId } from 'react'
import type { EventDetails } from '../config/event'
import { Baked, BevelStroke, CornerBouquet, cartouchePath } from '../art/Relief'
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
  return (
    <svg className="ribbon" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <defs>
        <linearGradient id={`satin${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a8955f" />
          <stop offset="0.16" stopColor="#efe5c6" />
          <stop offset="0.34" stopColor="#cbb98b" />
          <stop offset="0.56" stopColor="#e9dcb6" />
          <stop offset="0.82" stopColor="#bfac7c" />
          <stop offset="1" stopColor="#9c8857" />
        </linearGradient>
        <linearGradient id={`loop${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f1e8cb" />
          <stop offset="0.45" stopColor="#c9b789" />
          <stop offset="0.7" stopColor="#e6d9b2" />
          <stop offset="1" stopColor="#a8955f" />
        </linearGradient>
      </defs>
      <g transform={`rotate(-6 ${cx} ${cy})`}>
        <g className="ribbon-l">
          <rect x={-w * 0.3} y={cy - t / 2} width={cx + w * 0.3} height={t} fill={`url(#satin${id})`} />
        </g>
        <g className="ribbon-r">
          <rect x={cx} y={cy - t / 2} width={w * 0.8} height={t} fill={`url(#satin${id})`} />
        </g>
        <g className="bow" transform={`translate(${cx} ${cy})`}>
          <path className="bow-tail bow-tail--l" d={`M-4 6 L${-L * 0.55} ${L * 1.25} L${-L * 0.32} ${L * 1.12} L${-L * 0.3} ${L * 1.42} L6 10Z`} fill={`url(#loop${id})`} />
          <path className="bow-tail bow-tail--r" d={`M4 6 L${L * 0.6} ${L * 1.2} L${L * 0.36} ${L * 1.1} L${L * 0.36} ${L * 1.4} L-6 10Z`} fill={`url(#loop${id})`} />
          <path className="bow-loop bow-loop--l" d={`M0 0 C ${-L * 0.35} ${-L * 0.62} ${-L * 1.15} ${-L * 0.58} ${-L * 1.02} 0 C ${-L * 1.12} ${L * 0.5} ${-L * 0.35} ${L * 0.5} 0 0Z`} fill={`url(#loop${id})`} />
          <path className="bow-loop bow-loop--r" d={`M0 0 C ${L * 0.35} ${-L * 0.62} ${L * 1.15} ${-L * 0.58} ${L * 1.02} 0 C ${L * 1.12} ${L * 0.5} ${L * 0.35} ${L * 0.5} 0 0Z`} fill={`url(#loop${id})`} />
          <rect className="bow-knot" x={-t * 0.36} y={-t * 0.46} width={t * 0.72} height={t * 0.92} rx={t * 0.28} fill={`url(#satin${id})`} />
        </g>
      </g>
    </svg>
  )
}

export function InvitationFace({ event }: { event: EventDetails }) {
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
        <p className="f-love" data-reveal="line">بكل الحب والفرح</p>
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
