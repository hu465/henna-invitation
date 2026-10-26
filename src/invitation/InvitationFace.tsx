import type { EventDetails } from '../config/event'
import { CornerOrnament, Crest, Divider } from '../art/Ornaments'
import { shortDate, timeLabel } from '../lib/format'

// The full-screen composition the card expands into. Elements carry hooks
// (`data-reveal`, `.draw`) that heroReveal.ts choreographs.

export function InvitationFace({ event }: { event: EventDetails }) {
  return (
    <div className="face">
      <div className="face-frame" data-reveal="frame" aria-hidden="true">
        <svg className="face-rule" preserveAspectRatio="none" viewBox="0 0 100 100">
          <rect className="draw" pathLength={1} x="0.5" y="0.5" width="99" height="99" vectorEffect="non-scaling-stroke" />
        </svg>
        <svg className="face-rule face-rule--inner" preserveAspectRatio="none" viewBox="0 0 100 100">
          <rect className="draw" pathLength={1} x="0.5" y="0.5" width="99" height="99" vectorEffect="non-scaling-stroke" />
        </svg>
        <CornerOrnament className="c-tr" />
        <CornerOrnament className="c-tl" />
        <CornerOrnament className="c-br" />
        <CornerOrnament className="c-bl" />
      </div>

      <div className="face-body">
        <Crest className="face-crest" />
        <p className="f-basmala" data-reveal="line">بسم الله الرحمن الرحيم</p>
        <p className="f-love" data-reveal="line">بكل الحب والفرح</p>
        <p className="f-host" data-reveal="line">{event.hostLine}</p>
        <h1 className="f-title" data-reveal="line" tabIndex={-1}>
          <span className="f-title-lead">ندعوكم لمشاركتنا</span>
          <span className="f-title-main">ليلة الحنّة</span>
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
