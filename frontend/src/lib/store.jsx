import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { buildSeed, DAYS } from './seed'
import { generatePlan, studentTrips } from './scheduler'
import { toHHMM } from './time'

const KEY = 'smartbus-db-v3'
const SESSION = 'smartbus-session-v1'
const StoreCtx = createContext(null)

function withPlans(db, days = DAYS, notify = false) {
  const plans = { ...db.plans }
  const notes = []
  for (const day of days) {
    const prev = plans[day]
    const next = generatePlan(db, day)
    plans[day] = next
    if (notify && prev) {
      for (const s of db.students) {
        const a = studentTrips(prev, s.id).map((t) => `${t.type}@${t.depart}`).join(',')
        const bTrips = studentTrips(next, s.id)
        const b = bTrips.map((t) => `${t.type}@${t.depart}`).join(',')
        if (a !== b && bTrips.length) {
          notes.push({
            id: Date.now() + Math.random(), target: `student:${s.id}`, time: Date.now(), read: [],
            title: 'Bus schedule updated', titleKey: 'notif.updated', day,
            body: bTrips.map((t) => `${t.type === 'arrival' ? 'To campus' : 'Return'} ${toHHMM(t.depart)}`).join(' | '),
          })
        }
      }
      for (const d of db.drivers) {
        notes.push({
          id: Date.now() + Math.random(), target: `driver:${d.id}`, time: Date.now(), read: [],
          title: 'Route plan regenerated', titleKey: 'notif.driver', day,
          body: `${next.trips.filter((t) => t.driverId === d.id).length} trips assigned`,
        })
      }
    }
  }
  return { ...db, plans, notifications: [...notes.slice(0, 400), ...db.notifications].slice(0, 600) }
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore corrupted storage */ }
  return withPlans(buildSeed())
}

export function StoreProvider({ children }) {
  const [db, setDb] = useState(load)
  const [session, setSession] = useState(() => JSON.parse(localStorage.getItem(SESSION) || 'null'))

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(db)) }, [db])
  useEffect(() => { localStorage.setItem(SESSION, JSON.stringify(session)) }, [session])

  const update = useCallback((fn, regenDays) => {
    setDb((cur) => {
      const next = fn(cur)
      return regenDays ? withPlans(next, regenDays, true) : next
    })
  }, [])

  const nextId = (arr) => arr.reduce((m, x) => Math.max(m, x.id), 0) + 1

  const actions = useMemo(() => ({
    login(role, identifier, password) {
      const id = identifier.trim().toLowerCase()
      let user = null
      if (role === 'admin') user = db.admins.find((a) => a.username === id && a.password === password)
      if (role === 'driver') user = db.drivers.find((d) => d.username === id && d.password === password)
      if (role === 'student') user = db.students.find((s) => (s.email.toLowerCase() === id || s.studentNo === id) && s.password === password)
      if (!user) return false
      setSession({ role, id: user.id })
      return true
    },
    logout: () => setSession(null),
    register(data) {
      if (db.students.some((s) => s.email.toLowerCase() === data.email.toLowerCase() || s.studentNo === data.studentNo)) return false
      const id = nextId(db.students)
      update((d) => ({ ...d, students: [...d.students, { ...data, id, stopId: Number(data.stopId) }] }))
      setSession({ role: 'student', id })
      return true
    },
    addCourse(course) {
      update((d) => ({ ...d, courses: [...d.courses, { ...course, id: nextId(d.courses) }] }), [course.day])
    },
    addCourses(list) {
      update((d) => {
        let id = nextId(d.courses)
        return { ...d, courses: [...d.courses, ...list.map((c) => ({ ...c, id: id++ }))] }
      }, [...new Set(list.map((c) => c.day))])
    },
    deleteCourse(course) {
      update((d) => ({ ...d, courses: d.courses.filter((c) => c.id !== course.id) }), [course.day])
    },
    toggleAbsence(studentId, day) {
      update((d) => {
        const exists = d.absences.some((a) => a.studentId === studentId && a.day === day)
        return { ...d, absences: exists ? d.absences.filter((a) => !(a.studentId === studentId && a.day === day)) : [...d.absences, { studentId, day }] }
      }, [day])
    },
    saveStudent(st) {
      update((d) => {
        const students = st.id ? d.students.map((s) => (s.id === st.id ? { ...s, ...st } : s)) : [...d.students, { ...st, id: nextId(d.students), password: st.password || 'student123' }]
        return { ...d, students }
      }, DAYS)
    },
    deleteStudent(id) {
      update((d) => ({ ...d, students: d.students.filter((s) => s.id !== id), courses: d.courses.filter((c) => c.studentId !== id), absences: d.absences.filter((a) => a.studentId !== id) }), DAYS)
    },
    saveBus(bus) {
      update((d) => ({ ...d, buses: bus.id ? d.buses.map((b) => (b.id === bus.id ? { ...b, ...bus } : b)) : [...d.buses, { ...bus, id: nextId(d.buses) }] }), DAYS)
    },
    deleteBus(id) {
      update((d) => ({ ...d, buses: d.buses.filter((b) => b.id !== id), drivers: d.drivers.map((x) => (x.busId === id ? { ...x, busId: null } : x)) }), DAYS)
    },
    saveDriver(dr) {
      update((d) => ({ ...d, drivers: dr.id ? d.drivers.map((x) => (x.id === dr.id ? { ...x, ...dr } : x)) : [...d.drivers, { ...dr, id: nextId(d.drivers), password: dr.password || 'driver123' }] }), DAYS)
    },
    deleteDriver(id) {
      update((d) => ({ ...d, drivers: d.drivers.filter((x) => x.id !== id) }), DAYS)
    },
    setSettings(patch) {
      update((d) => ({ ...d, settings: { ...d.settings, ...patch } }), DAYS)
    },
    regenerate(days = DAYS) { update((d) => d, days) },
    broadcast(title, body, target = 'all') {
      update((d) => ({ ...d, notifications: [{ id: Date.now(), target, title, body, time: Date.now(), read: [] }, ...d.notifications] }))
    },
    markAllRead(userKey, ids) {
      update((d) => ({ ...d, notifications: d.notifications.map((n) => (ids.includes(n.id) && !n.read.includes(userKey) ? { ...n, read: [...n.read, userKey] } : n)) }))
    },
    reset() {
      setDb(withPlans(buildSeed()))
    },
  }), [db, update])

  const user = useMemo(() => {
    if (!session) return null
    const list = { admin: db.admins, driver: db.drivers, student: db.students }[session.role]
    const u = list?.find((x) => x.id === session.id)
    return u ? { ...u, role: session.role } : null
  }, [db, session])

  return <StoreCtx.Provider value={{ db, user, ...actions }}>{children}</StoreCtx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useStore = () => useContext(StoreCtx)

// eslint-disable-next-line react-refresh/only-export-components
export function notificationsFor(db, user) {
  if (!user) return []
  const key = `${user.role}:${user.id}`
  return db.notifications.filter((n) => n.target === 'all' || n.target === key || n.target === `${user.role}s`)
}
