import { Bell, Bus, CalendarDays, Clock, Download, MapPin, Plus, Trash2, Upload, UserCheck } from 'lucide-react'
import { useRef, useState } from 'react'
import AppShell from '../components/Layout'
import Notifications, { useUnread } from '../components/Notifications'
import { DayPicker, Empty, Section, Tabs, downloadCSV } from '../components/ui'
import { useLang } from '../lib/i18n'
import { studentTrips } from '../lib/scheduler'
import { BUILDINGS, DAYS, STOPS } from '../lib/seed'
import { useStore } from '../lib/store'
import { toHHMM } from '../lib/time'

const todayIdx = () => { const d = new Date().getDay(); return d <= 4 ? d : 0 }

function TripCard({ trip, db, t, lang }) {
  const bus = db.buses.find((b) => b.id === trip.busId)
  const driver = db.drivers.find((d) => d.id === trip.driverId)
  const arrival = trip.type === 'arrival'
  return (
    <div className={`rounded-2xl border p-5 ${arrival ? 'border-brand-200 bg-brand-50' : 'border-sky-200 bg-sky-50'}`}>
      <div className="flex items-center justify-between">
        <span className={`badge ${arrival ? 'bg-brand-700 text-white' : 'bg-sky-700 text-white'}`}>{arrival ? t.common.toCampus : t.common.return}</span>
        {trip.priority && <span className="badge bg-amber-100 text-amber-800">{t.common.priority}</span>}
      </div>
      <div className="mt-3 flex items-end gap-3">
        <div className="text-4xl font-extrabold text-slate-900">{toHHMM(trip.depart)}</div>
        <div className="pb-1 text-sm text-slate-600">{t.common.arrive} {toHHMM(trip.arrive)}</div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-700">
        <div className="flex items-center gap-1"><Bus size={14} />{bus?.plate}</div>
        <div className="flex items-center gap-1"><MapPin size={14} />{STOPS[trip.stopId][lang]}</div>
        <div className="col-span-2 text-xs text-slate-500">{t.common.driver}: {driver?.name ?? '—'} · {trip.predicted}/{trip.capacity} {t.common.passengers}</div>
      </div>
    </div>
  )
}

export default function StudentDashboard() {
  const { t, lang } = useLang()
  const { db, user, addCourse, addCourses, deleteCourse, toggleAbsence } = useStore()
  const unread = useUnread()
  const [tab, setTab] = useState('overview')
  const [day, setDay] = useState(todayIdx())
  const [form, setForm] = useState({ code: '', title: '', day: 0, start: '08:00', end: '09:15', building: BUILDINGS[0] })
  const [msg, setMsg] = useState('')
  const fileRef = useRef()

  const myCourses = db.courses.filter((c) => c.studentId === user.id).sort((a, b) => a.day - b.day || a.start.localeCompare(b.start))
  const isAbsent = (d) => db.absences.some((a) => a.studentId === user.id && a.day === d)
  const dayCourses = myCourses.filter((c) => c.day === day)
  const trips = studentTrips(db.plans[day], user.id)

  const onUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const lines = (await file.text()).split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    const rows = lines.slice(1).map((l) => l.split(',').map((x) => x.replace(/^"|"$/g, '').trim()))
    const list = rows.filter((r) => r.length >= 5).map(([code, title, d, start, end, building]) => ({
      studentId: user.id, code, title, day: Math.max(0, Math.min(4, Number(d))), start, end, building: building || BUILDINGS[0],
    }))
    if (list.length) addCourses(list)
    setMsg(`${list.length} ${t.student.uploaded}`)
    e.target.value = ''
  }

  return (
    <AppShell subtitle={
      <div className="card flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-brand-800 to-brand-600 p-6 text-white">
        <div>
          <div className="text-sm text-brand-100">{t.student.hello}</div>
          <div className="text-2xl font-extrabold">{user.name}</div>
          <div className="mt-1 text-sm text-brand-100">#{user.studentNo} · <MapPin size={12} className="inline" /> {STOPS[user.stopId][lang]}</div>
        </div>
        <div className="flex gap-3">
          <div className="rounded-xl bg-white/10 px-4 py-2 text-center"><div className="text-2xl font-bold">{myCourses.length}</div><div className="text-xs">{t.admin.courses}</div></div>
          <div className="rounded-xl bg-white/10 px-4 py-2 text-center"><div className="text-2xl font-bold">{unread}</div><div className="text-xs">{t.student.tabs.notifications}</div></div>
        </div>
      </div>
    }>
      <Tabs value={tab} onChange={setTab} tabs={[
        ['overview', t.student.tabs.overview, Bus],
        ['schedule', t.student.tabs.schedule, CalendarDays],
        ['attendance', t.student.tabs.attendance, UserCheck],
        ['notifications', `${t.student.tabs.notifications}${unread ? ` (${unread})` : ''}`, Bell],
      ]} />

      {tab === 'overview' && (
        <Section title={t.student.nextTrips} actions={<DayPicker value={day} onChange={setDay} />}>
          {dayCourses.length === 0 ? <Empty>{t.student.noClasses}</Empty>
            : isAbsent(day) ? <Empty>{t.student.absentDay}</Empty>
            : (
              <div className="grid gap-4 lg:grid-cols-3">
                {trips.map((trip) => <TripCard key={trip.id} trip={trip} db={db} t={t} lang={lang} />)}
                <div className="rounded-2xl border border-slate-200 p-5">
                  <div className="text-sm font-bold text-slate-700">{t.days[day]}</div>
                  <ul className="mt-2 space-y-2">
                    {dayCourses.map((c) => (
                      <li key={c.id} className="flex items-center gap-2 text-sm"><Clock size={14} className="text-brand-600" /><b>{c.start}–{c.end}</b> {c.code} <span className="text-slate-500">{c.building}</span></li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
        </Section>
      )}

      {tab === 'schedule' && (
        <div className="grid gap-5 lg:grid-cols-3">
          <Section title={t.student.addCourse}>
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); addCourse({ ...form, day: Number(form.day), studentId: user.id }); setForm({ ...form, code: '', title: '' }) }}>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="label">{t.student.code}</label><input className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required /></div>
                <div><label className="label">{t.common.day}</label><select className="input" value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}>{t.days.map((d, i) => <option key={i} value={i}>{d}</option>)}</select></div>
              </div>
              <div><label className="label">{t.student.title}</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="label">{t.student.start}</label><input type="time" className="input" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} required /></div>
                <div><label className="label">{t.student.end}</label><input type="time" className="input" value={form.end} min={form.start} onChange={(e) => setForm({ ...form, end: e.target.value })} required /></div>
              </div>
              <div><label className="label">{t.student.building}</label><select className="input" value={form.building} onChange={(e) => setForm({ ...form, building: e.target.value })}>{BUILDINGS.map((b) => <option key={b}>{b}</option>)}</select></div>
              <button className="btn-primary w-full"><Plus size={16} />{t.common.add}</button>
            </form>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              <input ref={fileRef} type="file" accept=".csv" hidden onChange={onUpload} />
              <button className="btn-ghost" onClick={() => fileRef.current.click()}><Upload size={16} />{t.student.upload}</button>
              <button className="btn-ghost" onClick={() => downloadCSV('schedule_template.csv', [['code', 'title', 'day(0=Sun..4=Thu)', 'start', 'end', 'building'], ['IS 211', 'Database Systems', 0, '08:00', '09:15', 'College of CS & IT'], ['CS 351', 'Artificial Intelligence', 2, '10:00', '11:40', 'College of Engineering']])}><Download size={16} />{t.student.template}</button>
              {msg && <span className="text-sm text-emerald-700">{msg}</span>}
            </div>
          </Section>
          <Section title={t.student.weekly} className="lg:col-span-2">
            <div className="grid gap-3 md:grid-cols-5">
              {DAYS.map((d) => (
                <div key={d} className="rounded-xl bg-slate-50 p-2">
                  <div className="mb-2 text-center text-xs font-bold uppercase text-slate-500">{t.days[d]}</div>
                  <div className="space-y-2">
                    {myCourses.filter((c) => c.day === d).map((c) => (
                      <div key={c.id} className="group rounded-lg border border-brand-200 bg-white p-2 text-xs">
                        <div className="flex items-start justify-between">
                          <b className="text-brand-800">{c.code}</b>
                          <button onClick={() => deleteCourse(c)} className="text-slate-300 hover:text-rose-600 cursor-pointer"><Trash2 size={12} /></button>
                        </div>
                        <div className="text-slate-700">{c.title}</div>
                        <div className="text-slate-500">{c.start}–{c.end}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {tab === 'attendance' && (
        <Section title={t.student.tabs.attendance}>
          <p className="mb-4 text-sm text-slate-600">{t.student.attendanceHelp}</p>
          <div className="grid gap-3 md:grid-cols-5">
            {DAYS.map((d) => {
              const has = myCourses.some((c) => c.day === d)
              const absent = isAbsent(d)
              return (
                <div key={d} className={`rounded-2xl border p-4 ${!has ? 'border-slate-200 opacity-60' : absent ? 'border-rose-200 bg-rose-50' : 'border-emerald-200 bg-emerald-50'}`}>
                  <div className="font-bold">{t.days[d]}</div>
                  <div className={`badge mt-2 ${absent ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}>{absent ? t.common.absent : t.common.present}</div>
                  <button disabled={!has} onClick={() => toggleAbsence(user.id, d)} className="btn-ghost mt-3 w-full text-xs">
                    {absent ? t.student.willAttend : t.student.willNotAttend}
                  </button>
                </div>
              )
            })}
          </div>
        </Section>
      )}

      {tab === 'notifications' && <Notifications />}
    </AppShell>
  )
}
