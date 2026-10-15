import { Bell, CheckCheck } from 'lucide-react'
import { useLang } from '../lib/i18n'
import { notificationsFor, useStore } from '../lib/store'
import { Empty, Section } from './ui'

export function useUnread() {
  const { db, user } = useStore()
  const key = `${user.role}:${user.id}`
  return notificationsFor(db, user).filter((n) => !n.read.includes(key)).length
}

export default function Notifications() {
  const { t, lang } = useLang()
  const { db, user, markAllRead } = useStore()
  const key = `${user.role}:${user.id}`
  const list = notificationsFor(db, user)
  return (
    <Section title={t.student.tabs.notifications}
      actions={<button className="btn-ghost" onClick={() => markAllRead(key, list.map((n) => n.id))}><CheckCheck size={16} />{t.student.markRead}</button>}>
      {list.length === 0 ? <Empty /> : (
        <ul className="divide-y divide-slate-100">
          {list.slice(0, 60).map((n) => {
            const unread = !n.read.includes(key)
            const tr = (k) => k?.split('.').reduce((o, x) => o?.[x], t)
            const title = tr(n.titleKey) || n.title
            const body = tr(n.bodyKey) || n.body
            return (
              <li key={n.id} className="flex gap-3 py-3">
                <div className={`mt-1 rounded-full p-2 ${unread ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'}`}><Bell size={16} /></div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{title}</span>
                    {n.day !== undefined && <span className="badge bg-slate-100 text-slate-600">{t.days[n.day]}</span>}
                    {unread && <span className="badge bg-amber-100 text-amber-800">●</span>}
                  </div>
                  <p className="text-sm text-slate-600">{body}</p>
                  <p className="text-xs text-slate-400">{new Date(n.time).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-GB')}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Section>
  )
}
