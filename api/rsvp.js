// RSVP endpoint for the Vercel deployment.
//
// POST /api/rsvp            a guest's reply (public)
// GET  /api/rsvp            every reply (host only: x-admin-key header)
// DELETE /api/rsvp?id=…     remove one reply (host only)
//
// Replies live in one Redis hash, reached over Upstash's REST API, so no
// packages are needed. Vercel's Upstash integration sets KV_REST_API_URL and
// KV_REST_API_TOKEN (or the UPSTASH_REDIS_REST_* pair); ADMIN_KEY is the
// password the host types on the planner page.

const KEY = 'henna:rsvps'
const MAX_REPLIES = 3000

const redisUrl = () => process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const redisToken = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN

async function redis(...command) {
  const res = await fetch(redisUrl(), {
    method: 'POST',
    headers: { Authorization: `Bearer ${redisToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  })
  const body = await res.json()
  if (!res.ok || body.error) throw new Error(body.error || `redis ${res.status}`)
  return body.result
}

const json = (data, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } })

function configured() {
  return Boolean(redisUrl() && redisToken())
}

function isHost(request) {
  const key = process.env.ADMIN_KEY
  return Boolean(key) && request.headers.get('x-admin-key') === key
}

const clean = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '')

export async function POST(request) {
  if (!configured()) return json({ error: 'not_configured' }, 503)
  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'bad_request' }, 400)
  }
  const name = clean(body.name, 80)
  if (name.length < 2 || typeof body.attending !== 'boolean') return json({ error: 'bad_request' }, 400)
  const guests = body.attending ? Math.min(10, Math.max(1, Math.round(Number(body.guests) || 1))) : 0
  const entry = {
    id: crypto.randomUUID(),
    name,
    attending: body.attending,
    guests,
    message: clean(body.message, 500),
    createdAt: new Date().toISOString(),
  }
  try {
    if ((await redis('HLEN', KEY)) >= MAX_REPLIES) return json({ error: 'full' }, 507)
    await redis('HSET', KEY, entry.id, JSON.stringify(entry))
  } catch {
    return json({ error: 'storage' }, 502)
  }
  return json({ ok: true, id: entry.id }, 201)
}

export async function GET(request) {
  if (!configured()) return json({ error: 'not_configured' }, 503)
  if (!isHost(request)) return json({ error: 'unauthorized' }, 401)
  try {
    const flat = (await redis('HGETALL', KEY)) || []
    const replies = []
    for (let i = 1; i < flat.length; i += 2) replies.push(JSON.parse(flat[i]))
    replies.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return json({ replies })
  } catch {
    return json({ error: 'storage' }, 502)
  }
}

export async function DELETE(request) {
  if (!configured()) return json({ error: 'not_configured' }, 503)
  if (!isHost(request)) return json({ error: 'unauthorized' }, 401)
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return json({ error: 'bad_request' }, 400)
  try {
    await redis('HDEL', KEY, id)
    return json({ ok: true })
  } catch {
    return json({ error: 'storage' }, 502)
  }
}
