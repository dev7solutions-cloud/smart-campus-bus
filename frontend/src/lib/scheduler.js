import { predictDemand } from './rf'
import { toMin, toHHMM, floorTo, ceilTo } from './time'

/**
 * Build per-student trip requests (arrival before first class, return after last class)
 * for a given day, excluding students that reported absence.
 */
export function buildRequests(db, day) {
  const absent = new Set(db.absences.filter((a) => a.day === day).map((a) => a.studentId))
  const byStudent = new Map()
  for (const c of db.courses) {
    if (c.day !== day) continue
    const cur = byStudent.get(c.studentId) || { first: Infinity, last: -Infinity }
    cur.first = Math.min(cur.first, toMin(c.start))
    cur.last = Math.max(cur.last, toMin(c.end))
    byStudent.set(c.studentId, cur)
  }
  const { travelMin, bufferMin } = db.settings
  const requests = []
  for (const s of db.students) {
    const span = byStudent.get(s.id)
    if (!span) continue
    const isAbsent = absent.has(s.id)
    requests.push({
      studentId: s.id, stopId: s.stopId, absent: isAbsent, type: 'arrival',
      classTime: span.first, depart: floorTo(span.first - travelMin - bufferMin, 15),
    })
    requests.push({
      studentId: s.id, stopId: s.stopId, absent: isAbsent, type: 'return',
      classTime: span.last, depart: ceilTo(span.last + 5, 30),
    })
  }
  return requests
}

function groupDemand(requests, day, examWeek) {
  const groups = new Map()
  for (const r of requests) {
    const key = `${r.type}|${r.depart}|${r.stopId}`
    const g = groups.get(key) || { type: r.type, depart: r.depart, stopId: r.stopId, scheduled: 0, absent: 0, students: [] }
    g.scheduled += 1
    if (r.absent) g.absent += 1
    else g.students.push(r.studentId)
    groups.set(key, g)
  }
  for (const g of groups.values()) {
    g.predicted = g.scheduled - g.absent === 0 ? 0
      : Math.round(predictDemand({ day, hour: g.depart / 60, stop: g.stopId, scheduled: g.scheduled, absent: g.absent, examWeek }))
  }
  return [...groups.values()]
}

/** Generate an AI-optimized bus plan for one day. */
export function generatePlan(db, day) {
  const { examWeek, travelMin, turnaroundMin } = db.settings
  const requests = buildRequests(db, day)
  const groups = groupDemand(requests, day, examWeek).filter((g) => g.predicted > 0)
  const buses = db.buses.filter((b) => b.active).sort((a, b) => b.capacity - a.capacity)
  const busFree = new Map(buses.map((b) => [b.id, 0]))
  const tripsBy = new Map(buses.map((b) => [b.id, 0]))
  const slots = new Map()
  for (const g of groups) {
    const key = `${g.type}|${g.depart}`
    if (!slots.has(key)) slots.set(key, { type: g.type, depart: g.depart, groups: [] })
    slots.get(key).groups.push(g)
  }
  const ordered = [...slots.values()].sort((a, b) => a.depart - b.depart || (a.type === 'arrival' ? -1 : 1))

  const trips = []
  const warnings = []
  let tripId = 1
  for (const slot of ordered) {
    const priority = slot.type === 'arrival' && slot.depart + travelMin <= 9 * 60
    const stopsLeft = slot.groups
      .map((g) => ({ ...g, need: Math.ceil(g.predicted * (priority ? 1.1 : 1)) }))
      .sort((a, b) => b.need - a.need)
    while (stopsLeft.length) {
      const free = buses.filter((b) => busFree.get(b.id) <= slot.depart)
      const need = stopsLeft.reduce((s, g) => s + g.need, 0)
      const fits = free.filter((b) => b.capacity >= need)
      const bus = fits.length ? fits.reduce((a, b) => (tripsBy.get(b.id) < tripsBy.get(a.id) || (tripsBy.get(b.id) === tripsBy.get(a.id) && b.capacity < a.capacity) ? b : a)) : free[0]
      if (!bus) {
        warnings.push({ depart: slot.depart, type: slot.type, unserved: stopsLeft.reduce((s, g) => s + g.need, 0) })
        break
      }
      let load = 0
      const tripStops = []
      for (let i = 0; i < stopsLeft.length; ) {
        const g = stopsLeft[i]
        const room = bus.capacity - load
        if (room <= 0) break
        const take = Math.min(room, g.need)
        tripStops.push({ stopId: g.stopId, scheduled: g.scheduled, absent: g.absent, predicted: take, students: g.students })
        load += take
        if (take === g.need) stopsLeft.splice(i, 1)
        else { g.need -= take; i++ }
      }
      busFree.set(bus.id, slot.depart + turnaroundMin)
      tripsBy.set(bus.id, tripsBy.get(bus.id) + 1)
      const driver = db.drivers.find((d) => d.busId === bus.id)
      trips.push({
        id: tripId++, type: slot.type, depart: slot.depart, arrive: slot.depart + travelMin,
        busId: bus.id, driverId: driver?.id ?? null, capacity: bus.capacity, priority,
        stops: tripStops.sort((a, b) => a.stopId - b.stopId), predicted: load,
      })
    }
  }

  return { day, generatedAt: Date.now(), trips, warnings, metrics: computeMetrics(db, day, requests, trips) }
}

/** Compare AI schedule with the traditional fixed hourly timetable. */
function computeMetrics(db, day, requests, trips) {
  const { travelMin } = db.settings
  const active = requests.filter((r) => !r.absent)
  const arrivals = active.filter((r) => r.type === 'arrival')
  const aiWait = arrivals.length ? arrivals.reduce((s, r) => s + (r.classTime - (r.depart + travelMin)), 0) / arrivals.length : 0

  const fixedDeparts = []
  for (let t = 6 * 60 + 30; t <= 16 * 60 + 30; t += 90) fixedDeparts.push(t)
  const active_ = db.buses.filter((b) => b.active)
  const fleetCap = active_.length ? (active_.reduce((s, b) => s + b.capacity, 0) / active_.length) : 0
  const fixedLoad = new Map()
  let fixedWaitSum = 0
  for (const r of arrivals) {
    const dep = [...fixedDeparts].reverse().find((t) => t + travelMin <= r.classTime - 5) ?? fixedDeparts[0]
    fixedWaitSum += r.classTime - (dep + travelMin)
    fixedLoad.set(`a${dep}`, (fixedLoad.get(`a${dep}`) || 0) + 1)
  }
  for (const r of active.filter((x) => x.type === 'return')) {
    const dep = fixedDeparts.find((t) => t >= r.classTime + 5) ?? fixedDeparts.at(-1)
    fixedLoad.set(`r${dep}`, (fixedLoad.get(`r${dep}`) || 0) + 1)
  }
  const fixedOvercrowded = [...fixedLoad.values()].filter((n) => n > fleetCap).length
  const aiOvercrowded = trips.filter((t) => t.predicted > t.capacity).length
  const seats = trips.reduce((s, t) => s + t.capacity, 0)
  const riders = trips.reduce((s, t) => s + t.predicted, 0)
  const stopsSkipped = new Set(requests.filter((r) => r.absent).map((r) => `${r.type}|${r.depart}|${r.stopId}`))
  for (const t of trips) for (const s of t.stops) stopsSkipped.delete(`${t.type}|${t.depart}|${s.stopId}`)

  return {
    students: new Set(active.map((r) => r.studentId)).size,
    absent: new Set(requests.filter((r) => r.absent).map((r) => r.studentId)).size,
    trips: trips.length,
    riders,
    loadFactor: seats ? riders / seats : 0,
    aiWait: Math.round(aiWait * 10) / 10,
    fixedWait: arrivals.length ? Math.round((fixedWaitSum / arrivals.length) * 10) / 10 : 0,
    aiOvercrowded,
    fixedOvercrowded,
    fixedTrips: fixedDeparts.length * 2,
    stopsSkipped: stopsSkipped.size,
  }
}

/** Hourly demand curve (scheduled vs AI-predicted) for charts. */
export function hourlyDemand(plan) {
  const map = new Map()
  for (const t of plan?.trips || []) {
    const h = Math.floor(t.depart / 60)
    const cur = map.get(h) || { hour: `${String(h).padStart(2, '0')}:00`, predicted: 0, scheduled: 0, trips: 0 }
    cur.predicted += t.predicted
    cur.scheduled += t.stops.reduce((s, x) => s + x.scheduled - x.absent, 0)
    cur.trips += 1
    map.set(h, cur)
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v)
}

export function studentTrips(plan, studentId) {
  const res = []
  const seen = new Set()
  for (const t of plan?.trips || []) {
    if (seen.has(t.type)) continue
    const stop = t.stops.find((s) => s.students.includes(studentId))
    if (stop) {
      seen.add(t.type)
      res.push({ ...t, stopId: stop.stopId })
    }
  }
  return res
}

export { toHHMM }
