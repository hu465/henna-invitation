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
}

export const defaultEvent: EventDetails = {
  brideName: 'سارة',
  groomName: 'أحمد',
  monogram: 'س أ',
  hostLine: 'تتشرّف عائلة العروس بدعوتكم',
  date: '2026-12-17',
  time: '20:00',
  endTime: '23:30',
  venueName: 'قاعة الزيتونة',
  venueAddress: 'عمّان — دابوق، شارع الملك حسين',
  mapUrl: 'https://maps.google.com/?q=Amman',
  dressCode: 'الثوب التراثي المطرّز أو الأخضر الزيتوني',
  note: 'السهرة للسيدات فقط',
  hostWhatsapp: '',
  rsvpDeadline: '2026-12-10',
}
