// The guest the invitation is addressed to. Taken from a personal link
// (`?to=ليلى`) or typed by the guest before the envelope opens, and
// remembered on her device so a refresh or replay doesn't ask again.

const KEY = 'henna:guest'

export const cleanName = (raw: string) => raw.replace(/\s+/g, ' ').trim().slice(0, 40)

export function loadGuestName(): string {
  const fromLink = cleanName(new URLSearchParams(location.search).get('to') ?? '')
  if (fromLink) return fromLink
  try {
    return cleanName(localStorage.getItem(KEY) ?? '')
  } catch {
    return ''
  }
}

export function saveGuestName(name: string) {
  try {
    if (name) localStorage.setItem(KEY, name)
    else localStorage.removeItem(KEY)
  } catch {
    // Storage unavailable: she is asked again on the next visit.
  }
}
