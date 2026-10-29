// Default invitation details. Edit these values before sharing the link with
// guests, or use the planner page (#/planner) to preview changes locally.
export interface EventDetails {
  brideName: string
  groomName: string
  /** Letters engraved on the wax seal. */
  monogram: string
  hostLine: string
  /** ISO date (YYYY-MM-DD) and 24h time (HH:MM), in the venue's local time. */
  date: string
  time: string
  endTime: string
  venueName: string
  venueAddress: string
  mapUrl: string
  dressCode: string
  note: string
  /** International format without "+" or spaces, e.g. 962790000000. Empty hides WhatsApp RSVP. */
  hostWhatsapp: string
  rsvpDeadline: string
  /** Optional background music file (e.g. /media/zaffeh.mp3). Empty = gentle generated ambience. */
  musicUrl: string
  /** Optional looping atmosphere video for the hero (muted), with a poster image fallback. */
  ambientVideo: string
  ambientPoster: string
  /** Link encoded in the QR code. Empty = the address the invitation is opened from. */
  inviteUrl: string
  /** YouTube video id of the evening's song, shown in a player the guest starts herself. */
  songYoutubeId: string
}

export const defaultEvent: EventDetails = {
  // The date is still a placeholder — replace it before sending.
  brideName: 'سارة عمر يونس',
  groomName: '',
  monogram: 'س',
  hostLine: 'تتشرّف عائلة العروس بدعوتكم',
  date: '2026-12-17',
  time: '17:00',
  endTime: '',
  venueName: 'فندق ريجنسي بالاس',
  venueAddress: 'عمّان — الشميساني، شارع الملكة نور',
  mapUrl: 'https://www.google.com/maps/search/?api=1&query=Regency+Palace+Hotel+Amman',
  dressCode: 'الثوب',
  note: 'نعتذر عن اصطحاب الأطفال',
  hostWhatsapp: '',
  rsvpDeadline: '2026-12-10',
  musicUrl: '',
  ambientVideo: '',
  ambientPoster: '',
  // Replace with the final hosted link before printing or sharing the QR code.
  inviteUrl: 'https://claude.ai/artifact/2BC3DXVGzLFKnN6GNUFiDc',
  songYoutubeId: 'NzwqktLGlb0',
}

/** The evening's programme shown under the curtains. */
export const programme: { time: string; title: string; note?: string }[] = [
  { time: '17:00', title: 'استقبال الضيوف' },
  { time: '19:00', title: 'جبلة الحنّة' },
]
