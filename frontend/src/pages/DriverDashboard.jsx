import { Bell, Bus, LineChart as LineIcon, MapPin, TrendingUp, Users } from 'lucide-react'
import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import AppShell from '../components/Layout'
import Notifications, { useUnread } from '../components/Notifications'
import { DayPicker, Empty, Section, Stat, Tabs } from '../components/ui'
import { useLang } from '../lib/i18n'
import { STOPS } from '../lib/seed'
import { useStore } from '../lib/store'
import { toHHMM } from '../lib/time'

const todayIdx = () => { const d = new Date().getDay(); return d <= 4 ? d : 0 }

export default function DriverDashboard() {
  const { t, lang } = useLang()
  const { db, user } = useStore()
  const unread = useUnread()
  const [tab, setTab] = useState('trips')
  const [day, setDay] = useState(todayIdx())
  const bus = db.buses.find((b) => b.id === user.busId)
  const trips = (db.plans[day]?.trips || []).filter((tr) => tr.driverId === user.id)
  const total = trips.reduce((s, tr) => s + tr.predicted, 0)
  const peak = trips.reduce((m, tr) => (tr.predicted > (m?.predicted ?? -1) ? tr : m), null)
  const chart = trips.map((tr) => ({ time: toHHMM(tr.depart), predicted: tr.predicted, capacity: tr.capacity }))

  return (
    <AppShell>
      <div className="grid gap-4 md:grid-cols-4">
        <Stat icon={Bus} label={t.common.bus} value={bus?.plate ?? '—'} hint={bus ? `${t.common.capacity}: ${bus.capacity}` : t.driver.noBus} />
        <Stat icon={MapPin} label={t.driver.tabs.trips} value={trips.length} hint={t.days[day]} tone="sky" />
        <Stat icon={Users} label={t.driver.expected} value={total} tone="amber" />
        <Stat icon={TrendingUp} label={t.driver.peak} value={peak ? toHHMM(peak.depart) : '—'} hint={peak ? `${peak.predicted} ${t.common.passengers}` : ''} tone="violet" />
      </div>
      <Tabs value={tab} onChange={setTab} tabs={[
        ['trips', t.driver.tabs.trips, Bus],
        ['predictions', t.driver.tabs.predictions, LineIcon],
        ['notifications', `${t.driver.tabs.notifications}${unread ? ` (${unread})` : ''}`, Bell],
      ]} />
      {tab !== 'notifications' && <DayPicker value={day} onChange={setDay} />}

      {tab === 'trips' && (
        <Section title={`${t.driver.tabs.trips} — ${t.days[day]}`}>
          {!bus ? <Empty>{t.driver.noBus}</Empty> : trips.length === 0 ? <Empty>{t.driver.noTrips}</Empty> : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {trips.map((tr) => (
                <div key={tr.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-extrabold">{toHHMM(tr.depart)} <span className="text-sm font-medium text-slate-400">→ {toHHMM(tr.arrive)}</span></div>
                    <span className={`badge ${tr.type === 'arrival' ? 'bg-brand-100 text-brand-800' : 'bg-sky-100 text-sky-800'}`}>{tr.type === 'arrival' ? t.common.toCampus : t.common.return}</span>
                  </div>
                  {tr.priority && <span className="badge mt-2 bg-amber-100 text-amber-800">{t.common.priority}</span>}
                  <div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-brand-600" style={{ width: `${Math.min(100, (tr.predicted / tr.capacity) * 100)}%` }} /></div>
                  <div className="mt-1 text-xs text-slate-500">{tr.predicted}/{tr.capacity} {t.common.passengers}</div>
                  <div className="mt-3 text-xs font-bold uppercase text-slate-500">{t.driver.route}</div>
                  <ol className="mt-1 space-y-1">
                    {tr.stops.map((s) => (
                      <li key={s.stopId} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1"><MapPin size={12} className="text-brand-600" />{STOPS[s.stopId][lang]}</span>
                        <span className="font-semibold">{s.predicted}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {tab === 'predictions' && (
        <Section title={`${t.driver.expected} — ${t.days[day]}`}>
          {chart.length === 0 ? <Empty>{t.driver.noTrips}</Empty> : (
            <div className="h-80" dir="ltr">
              <ResponsiveContainer>
                <BarChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" /><YAxis /><Tooltip />
                  <Bar dataKey="predicted" name={t.admin.predicted} fill="#0f766e" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="capacity" name={t.common.capacity} fill="#cbd5e1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Section>
      )}

      {tab === 'notifications' && <Notifications />}
    </AppShell>
  )
}
