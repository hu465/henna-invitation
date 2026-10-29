import { defaultEvent, type EventDetails } from '../config/event'

const EVENT_KEY = 'henna:event'
const RSVP_KEY = 'henna:rsvps'
const TASKS_KEY = 'henna:tasks'

export interface Rsvp {
  id: string
  name: string
  attending: boolean
  guests: number
  message: string
  createdAt: string
}

export interface Task {
  id: string
  title: string
  done: boolean
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage can be unavailable (private mode); the UI still works for this visit.
  }
}

export function loadEvent(): EventDetails {
  return { ...defaultEvent, ...read<Partial<EventDetails>>(EVENT_KEY, {}) }
}

export function saveEvent(event: EventDetails) {
  write(EVENT_KEY, event)
}

export function resetEvent() {
  try {
    localStorage.removeItem(EVENT_KEY)
  } catch {
    // ignore
  }
}

export function loadRsvps(): Rsvp[] {
  return read<Rsvp[]>(RSVP_KEY, [])
}

export function addRsvp(rsvp: Omit<Rsvp, 'id' | 'createdAt'>): Rsvp {
  const entry: Rsvp = { ...rsvp, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
  write(RSVP_KEY, [...loadRsvps(), entry])
  return entry
}

/** Sends a reply to the host (the /api/rsvp endpoint on the deployed site). */
export async function sendRsvp(rsvp: Omit<Rsvp, 'id' | 'createdAt'>): Promise<boolean> {
  try {
    const res = await fetch('/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rsvp),
    })
    return res.ok
  } catch {
    return false
  }
}

export function removeRsvp(id: string) {
  write(RSVP_KEY, loadRsvps().filter((r) => r.id !== id))
}

const defaultTasks: Task[] = [
  { id: 't1', title: 'حجز القاعة', done: false },
  { id: 't2', title: 'اختيار نقّاشة الحنّة', done: false },
  { id: 't3', title: 'تجهيز صواني الحنّة والشموع', done: false },
  { id: 't4', title: 'الضيافة والحلويات', done: false },
  { id: 't5', title: 'إرسال الدعوات', done: false },
]

export function loadTasks(): Task[] {
  return read<Task[]>(TASKS_KEY, defaultTasks)
}

export function saveTasks(tasks: Task[]) {
  write(TASKS_KEY, tasks)
}
