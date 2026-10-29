import { useCallback, useEffect, useState, type FormEvent } from 'react'
import type { Rsvp } from '../lib/store'
import { arDigits } from '../lib/format'

// Every guest's reply, read from the deployed site's /api/rsvp with the
// host's password (the ADMIN_KEY set on Vercel). The password is remembered on
// this device only.

const KEY_STORE = 'henna:admin-key'

const readKey = () => {
  try {
    return localStorage.getItem(KEY_STORE) ?? ''
  } catch {
    return ''
  }
}

const storeKey = (key: string) => {
  try {
    if (key) localStorage.setItem(KEY_STORE, key)
    else localStorage.removeItem(KEY_STORE)
  } catch {
    // Storage unavailable: the password is asked for again next visit.
  }
}

type Status = 'idle' | 'loading' | 'ready' | 'unauthorized' | 'unavailable'

function toCsv(replies: Rsvp[]) {
  const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const rows = replies.map((r) => [r.name, r.attending ? 'نعم' : 'لا', r.guests, r.message, new Date(r.createdAt).toLocaleString('ar')].map(cell).join(','))
  // The BOM lets Excel open the Arabic text correctly.
  return '﻿' + ['الاسم,الحضور,العدد,الرسالة,وقت الرد', ...rows].join('\n')
}

export function Replies() {
  const [key, setKey] = useState(readKey)
  const [draft, setDraft] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [replies, setReplies] = useState<Rsvp[]>([])

  const load = useCallback(async (k: string) => {
    setStatus('loading')
    try {
      const res = await fetch('/api/rsvp', { headers: { 'x-admin-key': k }, cache: 'no-store' })
      if (res.status === 401) {
        storeKey('')
        setKey('')
        return setStatus('unauthorized')
      }
      if (!res.ok) return setStatus('unavailable')
      setReplies((await res.json()).replies)
      setStatus('ready')
    } catch {
      setStatus('unavailable')
    }
  }, [])

  useEffect(() => {
    if (key) void load(key)
  }, [key, load])

  const signIn = (e: FormEvent) => {
    e.preventDefault()
    const k = draft.trim()
    if (!k) return
    storeKey(k)
    setKey(k)
    setDraft('')
  }

  const remove = async (r: Rsvp) => {
    if (!confirm(`حذف رد ${r.name}؟`)) return
    const res = await fetch(`/api/rsvp?id=${encodeURIComponent(r.id)}`, { method: 'DELETE', headers: { 'x-admin-key': key } }).catch(() => null)
    if (res?.ok) setReplies((list) => list.filter((x) => x.id !== r.id))
  }

  const download = () => {
    const url = URL.createObjectURL(new Blob([toCsv(replies)], { type: 'text/csv;charset=utf-8' }))
    Object.assign(document.createElement('a'), { href: url, download: 'henna-rsvps.csv' }).click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  if (!key) {
    return (
      <form className="p-key" onSubmit={signIn}>
        <p className="panel-note">أدخلي كلمة سر الردود (ADMIN_KEY التي وضعتِها في Vercel) لعرض ردود الضيوف.</p>
        {status === 'unauthorized' && <p className="field-error">كلمة السر غير صحيحة.</p>}
        <div className="p-key-row">
          <input type="password" value={draft} onChange={(e) => setDraft(e.target.value)} autoComplete="current-password" aria-label="كلمة سر الردود" />
          <button type="submit" className="btn btn--olive">عرض الردود</button>
        </div>
      </form>
    )
  }

  if (status === 'unavailable')
    return (
      <p className="panel-note">
        تعذّر الوصول إلى الردود. تعمل هذه الصفحة على موقع Vercel بعد ربط قاعدة البيانات.{' '}
        <button type="button" className="btn btn--text" onClick={() => load(key)}>إعادة المحاولة</button>
      </p>
    )

  const coming = replies.filter((r) => r.attending)
  const headcount = coming.reduce((n, r) => n + r.guests, 0)

  return (
    <>
      <div className="p-stats">
        <div><strong>{arDigits(coming.length)}</strong> ردود بالحضور</div>
        <div><strong>{arDigits(headcount)}</strong> إجمالي الحضور</div>
        <div><strong>{arDigits(replies.length - coming.length)}</strong> اعتذار</div>
      </div>
      <div className="p-actions">
        <button type="button" className="btn btn--ghost" onClick={() => load(key)} disabled={status === 'loading'}>
          {status === 'loading' ? 'جارٍ التحديث…' : 'تحديث'}
        </button>
        {replies.length > 0 && <button type="button" className="btn btn--ghost" onClick={download}>تنزيل Excel (CSV)</button>}
        <button type="button" className="btn btn--text" onClick={() => { storeKey(''); setKey(''); setStatus('idle') }}>خروج</button>
      </div>
      {replies.length === 0 ? (
        <p className="panel-note">{status === 'loading' ? 'جارٍ التحميل…' : 'لا توجد ردود بعد.'}</p>
      ) : (
        <table className="p-table">
          <thead>
            <tr><th>الاسم</th><th>الحضور</th><th>العدد</th><th>الرسالة</th><th><span className="sr-only">حذف</span></th></tr>
          </thead>
          <tbody>
            {replies.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.attending ? 'نعم' : 'لا'}</td>
                <td>{arDigits(r.guests)}</td>
                <td>{r.message}</td>
                <td>
                  <button className="p-x" aria-label={`حذف رد ${r.name}`} onClick={() => remove(r)}>×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}
