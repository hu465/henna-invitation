import type { EventDetails } from '../config/event'
import { Crest, Divider } from '../art/Ornaments'
import { Arch, TatreezStar } from '../art/Levant'
import { shortDate, timeLabel } from '../lib/format'

// The composition the card expands into: a deep-olive frame, a Levantine arch
// and the invitation text. Elements carry hooks (`data-reveal`, `.draw`) that
// heroReveal.ts choreographs.

export function InvitationFace({ event }: { event: EventDetails }) {
  return (
    <div className="face">
      <div className="face-frame" aria-hidden="true">
        <div className="frame-band" />
        <div className="frame-key" />
        {(['tr', 'tl', 'br', 'bl'] as const).map((c) => (
          <span key={c} className={`corner corner--${c}`}>
            <TatreezStar size={2} />
          </span>
        ))}
      </div>

      <Arch className="face-arch" />

      <div className="face-body">
        <Crest className="face-crest" />
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
    </div>
  )
}
