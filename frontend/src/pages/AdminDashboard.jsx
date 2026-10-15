import { AlertTriangle, BarChart3, Bell, Brain, Bus, Clock, Download, Gauge, LayoutDashboard, MapPinOff, Pencil, Plus, Printer, RefreshCw, RotateCcw, Send, Sparkles, Trash2, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import AppShell from '../components/Layout'
import { DayPicker, Empty, Modal, Section, Stat, Tabs, downloadCSV } from '../components/ui'
import { useLang } from '../lib/i18n'
import { modelInfo, predictDemand } from '../lib/rf'
import { hourlyDemand } from '../lib/scheduler'
import { DAYS, STOPS } from '../lib/seed'
import { useStore } from '../lib/store'
import { toHHMM } from '../lib/time'

const COLORS = ['#0f766e', '#14b8a6', '#f59e0b', '#0ea5e9', '#8b5cf6', '#f43f5e']
const todayIdx = () => { const d = new Date().getDay(); return d <= 4 ? d : 0 }

function Overview({ day, setDay }) {
  const { t } = useLang()
  const { db } = useStore()
  const plan = db.plans[day]
  const m = plan?.metrics
  const demand = hourlyDemand(plan)
  const compare = [
    { name: t.admin.waitAi.replace(/\s*\(.*\)/, ''), ai: m?.aiWait, fixed: m?.fixedWait },
    { name: t.stats.overcrowd, ai: m?.aiOvercrowded, fixed: m?.fixedOvercrowded },
  ]
  return (
    <>
      <DayPicker value={day} onChange={setDay} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Stat icon={Users} label={t.admin.kpi.students} value={db.students.length} hint={`${m?.students ?? 0} ${t.common.today}`} />
        <Stat icon={Sparkles} label={t.admin.kpi.riders} value={m?.riders ?? 0} tone="amber" />
        <Stat icon={Bus} label={t.admin.kpi.trips} value={m?.trips ?? 0} hint={`${t.admin.tripsFixed}: ${m?.fixedTrips ?? 0}`} tone="sky" />
        <Stat icon={Gauge} label={t.admin.kpi.load} value={`${Math.round((m?.loadFactor ?? 0) * 100)}%`} tone="violet" />
        <Stat icon={Clock} label={t.admin.kpi.wait} value={`${m?.aiWait ?? 0}m`} hint={`${t.admin.waitFixed}: ${m?.fixedWait ?? 0}m`} />
        <Stat icon={MapPinOff} label={t.admin.kpi.skipped} value={m?.stopsSkipped ?? 0} hint={`${m?.absent ?? 0} ${t.common.absent}`} tone="rose" />
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Section title={t.admin.demandChart} className="lg:col-span-2">
          <div className="h-72" dir="ltr">
            <ResponsiveContainer>
              <AreaChart data={demand}>
                <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0f766e" stopOpacity={0.4} /><stop offset="100%" stopColor="#0f766e" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="hour" /><YAxis /><Tooltip /><Legend />
                <Area type="monotone" dataKey="predicted" name={t.admin.predicted} stroke="#0f766e" fill="url(#g1)" strokeWidth={2} />
                <Area type="monotone" dataKey="scheduled" name={t.admin.model.scheduled} stroke="#f59e0b" fill="transparent" strokeWidth={2} strokeDasharray="5 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Section>
        <Section title={t.admin.compareChart}>
          <div className="h-72" dir="ltr">
            <ResponsiveContainer>
              <BarChart data={compare}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis /><Tooltip /><Legend />
                <Bar dataKey="fixed" name="Fixed" fill="#94a3b8" radius={[6, 6, 0, 0]} />
                <Bar dataKey="ai" name="AI" fill="#0f766e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
      </div>
    </>
  )
}

function Scheduler({ day, setDay }) {
  const { t, lang } = useLang()
  const { db, regenerate, setSettings } = useStore()
  const plan = db.plans[day]
  const [flash, setFlash] = useState(false)
  const run = (days) => { regenerate(days); setFlash(true); setTimeout(() => setFlash(false), 1500) }
  return (
    <Section title={`${t.admin.tabs.scheduler} — ${t.days[day]}`} actions={
      <>
        <label className="btn-ghost"><input type="checkbox" checked={db.settings.examWeek} onChange={(e) => setSettings({ examWeek: e.target.checked })} />{t.admin.examWeek}</label>
        <button className="btn-ghost" onClick={() => run(DAYS)}><RefreshCw size={16} />{t.admin.regenerateAll}</button>
        <button className="btn-primary" onClick={() => run([day])}><Sparkles size={16} />{t.admin.regenerate}</button>
      </>
    }>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <DayPicker value={day} onChange={setDay} />
        <span className={`text-xs ${flash ? 'font-bold text-emerald-600' : 'text-slate-400'}`}>{t.admin.generated}: {plan ? new Date(plan.generatedAt).toLocaleTimeString() : '—'}</span>
      </div>
      {plan?.warnings?.length > 0 && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <div className="flex items-center gap-2 font-bold"><AlertTriangle size={16} />{t.admin.warnings}</div>
          {plan.warnings.map((w, i) => <div key={i}>{toHHMM(w.depart)} · {w.unserved} {t.admin.unserved}</div>)}
        </div>
      )}
      {!plan?.trips.length ? <Empty /> : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr><th>{t.admin.trip}</th><th>{t.common.depart}</th><th>{t.common.arrive}</th><th>{t.admin.type}</th><th>{t.common.bus}</th><th>{t.common.driver}</th><th>{t.admin.stops}</th><th>{t.admin.load}</th></tr></thead>
            <tbody>
              {plan.trips.map((tr) => {
                const bus = db.buses.find((b) => b.id === tr.busId)
                const drv = db.drivers.find((d) => d.id === tr.driverId)
                const pct = Math.round((tr.predicted / tr.capacity) * 100)
                return (
                  <tr key={tr.id}>
                    <td className="font-mono text-xs">#{tr.id}</td>
                    <td className="font-bold">{toHHMM(tr.depart)}{tr.priority && <span className="badge ms-2 bg-amber-100 text-amber-800">★</span>}</td>
                    <td>{toHHMM(tr.arrive)}</td>
                    <td><span className={`badge ${tr.type === 'arrival' ? 'bg-brand-100 text-brand-800' : 'bg-sky-100 text-sky-800'}`}>{tr.type === 'arrival' ? t.common.toCampus : t.common.return}</span></td>
                    <td>{bus?.plate}</td>
                    <td className="text-xs">{drv?.name ?? '—'}</td>
                    <td className="text-xs">{tr.stops.map((s) => `${STOPS[s.stopId][lang]} (${s.predicted})`).join(' · ')}</td>
                    <td className="min-w-28">
                      <div className="h-2 rounded-full bg-slate-100"><div className={`h-2 rounded-full ${pct > 95 ? 'bg-amber-500' : 'bg-brand-600'}`} style={{ width: `${Math.min(100, pct)}%` }} /></div>
                      <div className="text-xs text-slate-500">{tr.predicted}/{tr.capacity}</div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  )
}

function StudentsAdmin() {
  const { t, lang } = useLang()
  const { db, saveStudent, deleteStudent } = useStore()
  const [q, setQ] = useState('')
  const [edit, setEdit] = useState(null)
  const list = db.students.filter((s) => `${s.name} ${s.studentNo} ${s.email}`.toLowerCase().includes(q.toLowerCase()))
  const count = useMemo(() => db.courses.reduce((m, c) => m.set(c.studentId, (m.get(c.studentId) || 0) + 1), new Map()), [db.courses])
  return (
    <Section title={`${t.admin.tabs.students} (${db.students.length})`} actions={
      <>
        <input className="input !w-56" placeholder={t.common.search} value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn-ghost" onClick={() => downloadCSV('students.csv', [['id', 'name', 'studentNo', 'email', 'stop', 'classes'], ...db.students.map((s) => [s.id, s.name, s.studentNo, s.email, STOPS[s.stopId].en, count.get(s.id) || 0])])}><Download size={16} />{t.common.export}</button>
        <button className="btn-primary" onClick={() => setEdit({ name: '', studentNo: '', email: '', stopId: 0 })}><Plus size={16} />{t.admin.addStudent}</button>
      </>
    }>
      <div className="max-h-[560px] overflow-auto">
        <table className="table">
          <thead className="sticky top-0"><tr><th>{t.common.name}</th><th>{t.auth.studentNo}</th><th>{t.auth.email}</th><th>{t.common.stop}</th><th>{t.admin.courses}</th><th>{t.common.actions}</th></tr></thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.id}>
                <td className="font-semibold">{s.name}</td><td>{s.studentNo}</td><td className="text-xs">{s.email}</td>
                <td className="text-xs">{STOPS[s.stopId][lang]}</td><td>{count.get(s.id) || 0}</td>
                <td className="flex gap-1">
                  <button className="btn-ghost !p-1.5" onClick={() => setEdit(s)}><Pencil size={14} /></button>
                  <button className="btn-danger !p-1.5" onClick={() => confirm(`${t.common.delete} ${s.name}?`) && deleteStudent(s.id)}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {edit && (
        <Modal title={edit.id ? t.common.edit : t.admin.addStudent} onClose={() => setEdit(null)}>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); saveStudent({ ...edit, stopId: Number(edit.stopId) }); setEdit(null) }}>
            <div><label className="label">{t.auth.name}</label><input className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="label">{t.auth.studentNo}</label><input className="input" value={edit.studentNo} onChange={(e) => setEdit({ ...edit, studentNo: e.target.value })} required /></div>
              <div><label className="label">{t.auth.stop}</label><select className="input" value={edit.stopId} onChange={(e) => setEdit({ ...edit, stopId: e.target.value })}>{STOPS.map((s) => <option key={s.id} value={s.id}>{s[lang]}</option>)}</select></div>
            </div>
            <div><label className="label">{t.auth.email}</label><input type="email" className="input" value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} required /></div>
            <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={() => setEdit(null)}>{t.common.cancel}</button><button className="btn-primary">{t.common.save}</button></div>
          </form>
        </Modal>
      )}
    </Section>
  )
}

function Fleet() {
  const { t } = useLang()
  const { db, saveBus, deleteBus, saveDriver, deleteDriver } = useStore()
  const [bus, setBus] = useState(null)
  const [drv, setDrv] = useState(null)
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Section title={`${t.common.bus} (${db.buses.length})`} actions={<button className="btn-primary" onClick={() => setBus({ plate: '', capacity: 45, active: true })}><Plus size={16} />{t.admin.addBus}</button>}>
        <table className="table">
          <thead><tr><th>{t.admin.plate}</th><th>{t.common.capacity}</th><th>{t.common.driver}</th><th>{t.common.status}</th><th>{t.common.actions}</th></tr></thead>
          <tbody>
            {db.buses.map((b) => (
              <tr key={b.id}>
                <td className="font-semibold">{b.plate}</td><td>{b.capacity}</td>
                <td className="text-xs">{db.drivers.find((d) => d.busId === b.id)?.name ?? '—'}</td>
                <td><button onClick={() => saveBus({ ...b, active: !b.active })} className={`badge cursor-pointer ${b.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>{b.active ? t.common.active : t.common.inactive}</button></td>
                <td className="flex gap-1">
                  <button className="btn-ghost !p-1.5" onClick={() => setBus(b)}><Pencil size={14} /></button>
                  <button className="btn-danger !p-1.5" onClick={() => confirm(`${t.common.delete} ${b.plate}?`) && deleteBus(b.id)}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
      <Section title={`${t.common.driver} (${db.drivers.length})`} actions={<button className="btn-primary" onClick={() => setDrv({ name: '', phone: '', username: '', busId: '' })}><Plus size={16} />{t.admin.addDriver}</button>}>
        <table className="table">
          <thead><tr><th>{t.common.name}</th><th>{t.common.phone}</th><th>{t.auth.username}</th><th>{t.admin.assignedBus}</th><th>{t.common.actions}</th></tr></thead>
          <tbody>
            {db.drivers.map((d) => (
              <tr key={d.id}>
                <td className="font-semibold">{d.name}</td><td className="text-xs">{d.phone}</td><td className="text-xs">{d.username}</td>
                <td>{db.buses.find((b) => b.id === d.busId)?.plate ?? '—'}</td>
                <td className="flex gap-1">
                  <button className="btn-ghost !p-1.5" onClick={() => setDrv(d)}><Pencil size={14} /></button>
                  <button className="btn-danger !p-1.5" onClick={() => confirm(`${t.common.delete} ${d.name}?`) && deleteDriver(d.id)}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
      {bus && (
        <Modal title={bus.id ? t.common.edit : t.admin.addBus} onClose={() => setBus(null)}>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); saveBus({ ...bus, capacity: Number(bus.capacity) }); setBus(null) }}>
            <div><label className="label">{t.admin.plate}</label><input className="input" value={bus.plate} onChange={(e) => setBus({ ...bus, plate: e.target.value })} required /></div>
            <div><label className="label">{t.common.capacity}</label><input type="number" min={10} max={80} className="input" value={bus.capacity} onChange={(e) => setBus({ ...bus, capacity: e.target.value })} required /></div>
            <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={() => setBus(null)}>{t.common.cancel}</button><button className="btn-primary">{t.common.save}</button></div>
          </form>
        </Modal>
      )}
      {drv && (
        <Modal title={drv.id ? t.common.edit : t.admin.addDriver} onClose={() => setDrv(null)}>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); saveDriver({ ...drv, busId: drv.busId === '' ? null : Number(drv.busId) }); setDrv(null) }}>
            <div><label className="label">{t.common.name}</label><input className="input" value={drv.name} onChange={(e) => setDrv({ ...drv, name: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="label">{t.common.phone}</label><input className="input" value={drv.phone} onChange={(e) => setDrv({ ...drv, phone: e.target.value })} /></div>
              <div><label className="label">{t.auth.username}</label><input className="input" value={drv.username} onChange={(e) => setDrv({ ...drv, username: e.target.value.toLowerCase() })} required /></div>
            </div>
            <div><label className="label">{t.admin.assignedBus}</label>
              <select className="input" value={drv.busId ?? ''} onChange={(e) => setDrv({ ...drv, busId: e.target.value })}>
                <option value="">—</option>{db.buses.map((b) => <option key={b.id} value={b.id}>{b.plate}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={() => setDrv(null)}>{t.common.cancel}</button><button className="btn-primary">{t.common.save}</button></div>
          </form>
        </Modal>
      )}
    </div>
  )
}

function Reports() {
  const { t, lang } = useLang()
  const { db } = useStore()
  const weekly = DAYS.map((d) => ({ day: t.daysShort[d], ...db.plans[d]?.metrics }))
  const stopDemand = STOPS.map((s) => ({ name: s[lang], value: DAYS.reduce((sum, d) => sum + (db.plans[d]?.trips || []).reduce((a, tr) => a + tr.stops.filter((x) => x.stopId === s.id).reduce((b, x) => b + x.predicted, 0), 0), 0) }))
  const perBus = db.buses.map((b) => ({ name: b.plate, trips: DAYS.reduce((sum, d) => sum + (db.plans[d]?.trips || []).filter((tr) => tr.busId === b.id).length, 0) }))
  const exportAll = () => {
    const rows = [['day', 'trip', 'type', 'depart', 'arrive', 'bus', 'driver', 'stops', 'predicted', 'capacity']]
    for (const d of DAYS) for (const tr of db.plans[d]?.trips || []) {
      rows.push([t.days[d], tr.id, tr.type, toHHMM(tr.depart), toHHMM(tr.arrive), db.buses.find((b) => b.id === tr.busId)?.plate, db.drivers.find((x) => x.id === tr.driverId)?.name, tr.stops.map((s) => STOPS[s.stopId].en).join(' | '), tr.predicted, tr.capacity])
    }
    downloadCSV('bus_schedule_report.csv', rows)
  }
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-extrabold">{t.admin.reportTitle}</h2>
        <div className="flex gap-2 no-print">
          <button className="btn-ghost" onClick={exportAll}><Download size={16} />{t.common.export}</button>
          <button className="btn-ghost" onClick={() => window.print()}><Printer size={16} />{t.common.print}</button>
        </div>
      </div>
      <Section title={t.admin.weekly}>
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr><th>{t.common.day}</th><th>{t.admin.kpi.students}</th><th>{t.common.absent}</th><th>{t.admin.tripsAi}</th><th>{t.admin.tripsFixed}</th><th>{t.admin.kpi.riders}</th><th>{t.admin.kpi.load}</th><th>{t.admin.waitAi}</th><th>{t.admin.waitFixed}</th><th>{t.admin.overAi}</th><th>{t.admin.overFixed}</th></tr></thead>
            <tbody>
              {weekly.map((w) => (
                <tr key={w.day}><td className="font-semibold">{w.day}</td><td>{w.students}</td><td>{w.absent}</td><td>{w.trips}</td><td>{w.fixedTrips}</td><td>{w.riders}</td><td>{Math.round((w.loadFactor ?? 0) * 100)}%</td><td className="font-semibold text-emerald-700">{w.aiWait}m</td><td className="text-rose-600">{w.fixedWait}m</td><td>{w.aiOvercrowded}</td><td>{w.fixedOvercrowded}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      <div className="grid gap-5 lg:grid-cols-3">
        <Section title={t.admin.compareChart}>
          <div className="h-64" dir="ltr">
            <ResponsiveContainer>
              <BarChart data={weekly}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="day" /><YAxis /><Tooltip /><Legend />
                <Bar dataKey="fixedWait" name={t.admin.waitFixed} fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="aiWait" name={t.admin.waitAi} fill="#0f766e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
        <Section title={t.admin.perStop}>
          <div className="h-64" dir="ltr">
            <ResponsiveContainer>
              <PieChart><Pie data={stopDemand} dataKey="value" nameKey="name" innerRadius={45} outerRadius={85} paddingAngle={2}>{stopDemand.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} /></PieChart>
            </ResponsiveContainer>
          </div>
        </Section>
        <Section title={t.admin.perBus}>
          <div className="h-64" dir="ltr">
            <ResponsiveContainer>
              <BarChart data={perBus} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis type="number" /><YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} /><Tooltip />
                <Bar dataKey="trips" fill="#14b8a6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
      </div>
    </>
  )
}

function ModelPanel() {
  const { t, lang } = useLang()
  const m = modelInfo.metrics
  const [x, setX] = useState({ day: 0, hour: 7.5, stop: 0, scheduled: 30, absent: 2, examWeek: false })
  const result = predictDemand(x)
  const fi = Object.entries(m.feature_importance).map(([name, value]) => ({ name, value: Math.round(value * 1000) / 10 })).sort((a, b) => b.value - a.value)
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Section title={t.admin.model.title} className="lg:col-span-2">
        <div className="grid gap-3 sm:grid-cols-4">
          <Stat label={t.admin.model.r2} value={m.r2} />
          <Stat label={t.admin.model.mae} value={m.mae} tone="amber" />
          <Stat label={t.admin.model.trees} value={m.n_estimators} tone="sky" />
          <Stat label={t.admin.model.rows} value={m.train_rows.toLocaleString()} tone="violet" />
        </div>
        <h4 className="mt-6 mb-2 font-semibold">{t.admin.model.features}</h4>
        <div className="h-60" dir="ltr">
          <ResponsiveContainer>
            <BarChart data={fi} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis type="number" unit="%" /><YAxis type="category" dataKey="name" width={80} /><Tooltip />
              <Bar dataKey="value" fill="#0f766e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-slate-500">{t.admin.model.metrics} · {m.test_rows.toLocaleString()} rows · max_depth={m.max_depth}</p>
      </Section>
      <Section title={t.admin.model.tryIt}>
        <div className="space-y-3">
          <div><label className="label">{t.common.day}</label><select className="input" value={x.day} onChange={(e) => setX({ ...x, day: Number(e.target.value) })}>{t.days.map((d, i) => <option key={i} value={i}>{d}</option>)}</select></div>
          <div><label className="label">{t.admin.model.hour}: {toHHMM(x.hour * 60)}</label><input type="range" min={7} max={17} step={0.25} value={x.hour} onChange={(e) => setX({ ...x, hour: Number(e.target.value) })} className="w-full accent-teal-700" /></div>
          <div><label className="label">{t.common.stop}</label><select className="input" value={x.stop} onChange={(e) => setX({ ...x, stop: Number(e.target.value) })}>{STOPS.map((s) => <option key={s.id} value={s.id}>{s[lang]}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="label">{t.admin.model.scheduled}</label><input type="number" min={0} className="input" value={x.scheduled} onChange={(e) => setX({ ...x, scheduled: Number(e.target.value) })} /></div>
            <div><label className="label">{t.admin.model.absentN}</label><input type="number" min={0} max={x.scheduled} className="input" value={x.absent} onChange={(e) => setX({ ...x, absent: Number(e.target.value) })} /></div>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={x.examWeek} onChange={(e) => setX({ ...x, examWeek: e.target.checked })} />{t.admin.examWeek}</label>
          <div className="rounded-2xl bg-brand-700 p-5 text-center text-white">
            <div className="text-sm text-brand-100">{t.admin.model.result}</div>
            <div className="text-5xl font-extrabold">{result.toFixed(1)}</div>
          </div>
        </div>
      </Section>
    </div>
  )
}

function NotifyPanel() {
  const { t, lang } = useLang()
  const { db, broadcast } = useStore()
  const [form, setForm] = useState({ target: 'all', title: '', body: '' })
  const [ok, setOk] = useState(false)
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Section title={t.admin.notify.title}>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); broadcast(form.title, form.body, form.target); setForm({ ...form, title: '', body: '' }); setOk(true); setTimeout(() => setOk(false), 2000) }}>
          <div><label className="label">{t.admin.notify.target}</label>
            <select className="input" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })}>
              <option value="all">{t.admin.notify.everyone}</option><option value="students">{t.admin.notify.students}</option><option value="drivers">{t.admin.notify.drivers}</option>
            </select>
          </div>
          <div><label className="label">{t.admin.notify.subject}</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
          <div><label className="label">{t.admin.notify.body}</label><textarea className="input min-h-28" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required /></div>
          <button className="btn-primary w-full"><Send size={16} />{t.admin.notify.send}</button>
          {ok && <p className="text-center text-sm text-emerald-700">{t.admin.notify.sent}</p>}
        </form>
      </Section>
      <Section title={t.admin.notify.history} className="lg:col-span-2">
        <ul className="max-h-[480px] divide-y divide-slate-100 overflow-auto">
          {db.notifications.slice(0, 80).map((n) => (
            <li key={n.id} className="py-2 text-sm">
              <div className="flex items-center gap-2"><b>{n.titleKey ? n.titleKey.split('.').reduce((o, k) => o?.[k], t) : n.title}</b><span className="badge bg-slate-100 text-slate-600">{n.target}</span></div>
              <div className="text-slate-600">{n.body}</div>
              <div className="text-xs text-slate-400">{new Date(n.time).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-GB')}</div>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}

export default function AdminDashboard() {
  const { t } = useLang()
  const { reset } = useStore()
  const [tab, setTab] = useState('overview')
  const [day, setDay] = useState(todayIdx())
  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onChange={setTab} tabs={[
          ['overview', t.admin.tabs.overview, LayoutDashboard],
          ['scheduler', t.admin.tabs.scheduler, Sparkles],
          ['students', t.admin.tabs.students, Users],
          ['fleet', t.admin.tabs.fleet, Bus],
          ['reports', t.admin.tabs.reports, BarChart3],
          ['model', t.admin.tabs.model, Brain],
          ['notify', t.admin.tabs.notify, Bell],
        ]} />
        <button className="btn-ghost no-print" onClick={() => confirm(t.common.resetConfirm) && reset()}><RotateCcw size={16} />{t.common.reset}</button>
      </div>
      {tab === 'overview' && <Overview day={day} setDay={setDay} />}
      {tab === 'scheduler' && <Scheduler day={day} setDay={setDay} />}
      {tab === 'students' && <StudentsAdmin />}
      {tab === 'fleet' && <Fleet />}
      {tab === 'reports' && <Reports />}
      {tab === 'model' && <ModelPanel />}
      {tab === 'notify' && <NotifyPanel />}
    </AppShell>
  )
}
