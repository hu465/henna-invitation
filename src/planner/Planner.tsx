import { useState, type ChangeEvent } from 'react'
import type { EventDetails } from '../config/event'
import { loadEvent, loadTasks, resetEvent, saveEvent, saveTasks, type Task } from '../lib/store'
import { Replies } from './Replies'
import { InviteQr, QrActions } from '../invitation/InviteQr'
import '../invitation/invitation.css'
import './planner.css'

const fields: { key: keyof EventDetails; label: string; type?: string; hint?: string }[] = [
  { key: 'brideName', label: 'اسم العروس' },
  { key: 'groomName', label: 'اسم العريس' },
  { key: 'monogram', label: 'حروف الختم', hint: 'حرفان أو ثلاثة تظهر على الختم الشمعي' },
  { key: 'hostLine', label: 'سطر الدعوة' },
  { key: 'date', label: 'التاريخ', type: 'date' },
  { key: 'time', label: 'وقت البدء', type: 'time' },
  { key: 'endTime', label: 'وقت الانتهاء', type: 'time' },
  { key: 'venueName', label: 'اسم القاعة' },
  { key: 'venueAddress', label: 'العنوان' },
  { key: 'mapUrl', label: 'رابط الخريطة', type: 'url' },
  { key: 'dressCode', label: 'اللباس' },
  { key: 'dressNote', label: 'وصف اللباس' },
  { key: 'note', label: 'ملاحظة' },
  { key: 'rsvpDeadline', label: 'آخر موعد للرد', type: 'date' },
  { key: 'hostWhatsapp', label: 'رقم واتساب لاستقبال الردود', type: 'tel', hint: 'بالصيغة الدولية بدون + مثل 962790000000' },
  { key: 'musicUrl', label: 'رابط ملف الموسيقى', type: 'url', hint: 'اتركيه فارغاً لاستخدام النغمة الهادئة المولّدة' },
  { key: 'ambientVideo', label: 'رابط فيديو الخلفية', type: 'url', hint: 'اختياري: فيديو قصير صامت يتكرر خلف الدعوة' },
  { key: 'ambientPoster', label: 'صورة بديلة للفيديو', type: 'url' },
  { key: 'inviteUrl', label: 'رابط الدعوة (لرمز QR)', type: 'url', hint: 'الرابط الذي يفتحه رمز QR' },
]

export function Planner() {
  const [event, setEvent] = useState(loadEvent)
  const [saved, setSaved] = useState(false)
  const [tasks, setTasks] = useState(loadTasks)
  const [newTask, setNewTask] = useState('')

  const update = (key: keyof EventDetails) => (e: ChangeEvent<HTMLInputElement>) => {
    setEvent({ ...event, [key]: e.target.value })
    setSaved(false)
  }

  const updateTasks = (next: Task[]) => {
    setTasks(next)
    saveTasks(next)
  }


  return (
    <div className="planner">
      <header className="planner-head">
        <h1>مخطّط ليلة الحنّة</h1>
        <a className="planner-link" href="#">معاينة الدعوة</a>
      </header>

      <section className="panel" aria-labelledby="p-details">
        <h2 id="p-details">تفاصيل الدعوة</h2>
        <p className="panel-note">
          التعديلات هنا تُحفظ على هذا المتصفح للمعاينة. لتظهر للضيوف، انسخيها إلى <code>src/config/event.ts</code> ثم أعيدي النشر.
        </p>
        <form
          className="p-grid"
          onSubmit={(e) => {
            e.preventDefault()
            saveEvent(event)
            setSaved(true)
          }}
        >
          {fields.map((f) => (
            <label key={f.key} className="p-field">
              <span>{f.label}</span>
              <input type={f.type ?? 'text'} value={event[f.key]} onChange={update(f.key)} dir={f.type === 'url' || f.type === 'tel' ? 'ltr' : undefined} />
              {f.hint && <small>{f.hint}</small>}
            </label>
          ))}
          <div className="p-actions">
            <button type="submit" className="p-btn">حفظ</button>
            <button
              type="button"
              className="p-btn p-btn--ghost"
              onClick={() => {
                resetEvent()
                setEvent(loadEvent())
              }}
            >
              استعادة الافتراضي
            </button>
            <span role="status" className="p-saved">{saved ? 'تم الحفظ' : ''}</span>
          </div>
        </form>
      </section>

      <section className="panel p-qr" aria-labelledby="p-qr">
        <h2 id="p-qr">رمز QR للدعوة</h2>
        <p className="panel-note">اطبعيه على البطاقات الورقية أو أرسليه مع الرابط. يفتح الرمز رابط الدعوة المحدد في الإعدادات.</p>
        <InviteQr event={event} />
        <QrActions event={event} download />
      </section>

      <section className="panel" aria-labelledby="p-rsvp">
        <h2 id="p-rsvp">الردود</h2>
        <Replies />
      </section>

      <section className="panel" aria-labelledby="p-tasks">
        <h2 id="p-tasks">قائمة المهام</h2>
        <ul className="p-tasks">
          {tasks.map((t) => (
            <li key={t.id}>
              <label>
                <input type="checkbox" checked={t.done} onChange={() => updateTasks(tasks.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))} />
                <span className={t.done ? 'done' : ''}>{t.title}</span>
              </label>
              <button className="p-x" aria-label={`حذف ${t.title}`} onClick={() => updateTasks(tasks.filter((x) => x.id !== t.id))}>×</button>
            </li>
          ))}
        </ul>
        <form
          className="p-add"
          onSubmit={(e) => {
            e.preventDefault()
            if (!newTask.trim()) return
            updateTasks([...tasks, { id: crypto.randomUUID(), title: newTask.trim(), done: false }])
            setNewTask('')
          }}
        >
          <label className="sr-only" htmlFor="new-task">مهمة جديدة</label>
          <input id="new-task" value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="أضيفي مهمة…" />
          <button className="p-btn" type="submit">إضافة</button>
        </form>
      </section>
    </div>
  )
}
