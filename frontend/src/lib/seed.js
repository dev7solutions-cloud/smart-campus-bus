export const DAYS = [0, 1, 2, 3, 4] // Sunday..Thursday

export const STOPS = [
  { id: 0, en: 'Student Housing A', ar: 'السكن الطلابي أ' },
  { id: 1, en: 'Student Housing B', ar: 'السكن الطلابي ب' },
  { id: 2, en: 'Al-Faisaliyah District', ar: 'حي الفيصلية' },
  { id: 3, en: 'King Fahd District', ar: 'حي الملك فهد' },
  { id: 4, en: 'Downtown Najran', ar: 'وسط نجران' },
  { id: 5, en: 'Al-Khalidiyah District', ar: 'حي الخالدية' },
]

export const BUILDINGS = [
  'College of CS & IT',
  'College of Engineering',
  'College of Medicine',
  'College of Business',
  'Central Library',
]

const COURSES = [
  ['IS 211', 'Database Systems'], ['IS 322', 'Systems Analysis'], ['CS 240', 'Data Structures'],
  ['CS 351', 'Artificial Intelligence'], ['IS 431', 'Machine Learning'], ['MATH 201', 'Linear Algebra'],
  ['STAT 210', 'Statistics'], ['ENG 102', 'Technical Writing'], ['IS 360', 'Web Development'],
  ['IS 499', 'Graduation Project'], ['CS 310', 'Operating Systems'], ['IS 340', 'Project Management'],
]

const FIRST = ['Mohammed', 'Abdullah', 'Faisal', 'Saad', 'Omar', 'Khalid', 'Nasser', 'Turki', 'Fahad', 'Ali',
  'Atyaf', 'Afrah', 'Saadih', 'Amjad', 'Noura', 'Sara', 'Reem', 'Lama', 'Hind', 'Maha']
const LAST = ['Al-Yami', 'Al-Qahtani', 'Al-Shahrani', 'Al-Mutlaq', 'Asiri', 'Al-Ansari', 'Al-Dosari', 'Al-Harbi', 'Al-Zahrani', 'Al-Ghamdi']

function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const pick = (rnd, arr) => arr[Math.floor(rnd() * arr.length)]
const STARTS = ['08:00', '08:00', '08:00', '09:00', '09:00', '10:00', '10:00', '11:00', '12:00', '13:00', '14:00']
const DURATIONS = [50, 75, 100]

function addMin(hhmm, mins) {
  const [h, m] = hhmm.split(':').map(Number)
  const t = h * 60 + m + mins
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}

export function buildSeed() {
  const rnd = mulberry32(2026)
  const students = []
  const courses = []
  let courseId = 1

  const demo = { id: 1, name: 'Atyaf Salem Al-Ansari', studentNo: '442408445', email: 'student@nu.edu.sa', password: 'student123', stopId: 0 }
  students.push(demo)
  const demoCourses = [
    [0, '08:00', 100, 'IS 499', 'Graduation Project', 'College of CS & IT'],
    [0, '11:00', 75, 'IS 431', 'Machine Learning', 'College of CS & IT'],
    [1, '09:00', 75, 'IS 322', 'Systems Analysis', 'College of CS & IT'],
    [2, '08:00', 50, 'STAT 210', 'Statistics', 'College of Business'],
    [4, '10:00', 75, 'IS 451', 'Information Security', 'College of CS & IT'],
    [2, '13:00', 100, 'IS 360', 'Web Development', 'College of CS & IT'],
    [3, '10:00', 75, 'IS 340', 'Project Management', 'Central Library'],
  ]
  for (const [day, start, dur, code, title, building] of demoCourses) {
    courses.push({ id: courseId++, studentId: 1, code, title, day, start, end: addMin(start, dur), building })
  }

  for (let i = 2; i <= 160; i++) {
    const stopId = Math.min(5, Math.floor(Math.pow(rnd(), 1.3) * 6))
    students.push({
      id: i,
      name: `${pick(rnd, FIRST)} ${pick(rnd, LAST)}`,
      studentNo: String(441000000 + Math.floor(rnd() * 4000000)),
      email: `s${i}@nu.edu.sa`,
      password: 'student123',
      stopId,
    })
    for (const day of DAYS) {
      if (rnd() < 0.3) continue
      const n = 1 + Math.floor(rnd() * 3)
      let start = pick(rnd, STARTS)
      for (let k = 0; k < n; k++) {
        const dur = pick(rnd, DURATIONS)
        const [code, title] = pick(rnd, COURSES)
        courses.push({ id: courseId++, studentId: i, code, title, day, start, end: addMin(start, dur), building: pick(rnd, BUILDINGS) })
        start = addMin(start, dur + 10 + 60 * Math.floor(rnd() * 2))
        start = start.slice(0, 3) + (Number(start.slice(3)) < 30 ? '00' : '30')
        if (start > '15:30') break
      }
    }
  }

  const absences = []
  for (const s of students.slice(1)) {
    for (const day of DAYS) if (rnd() < 0.08) absences.push({ studentId: s.id, day })
  }

  const drivers = [
    { id: 1, name: 'Hassan Al-Yami', phone: '0551234501', username: 'driver1', password: 'driver123', busId: 1 },
    { id: 2, name: 'Salem Al-Qahtani', phone: '0551234502', username: 'driver2', password: 'driver123', busId: 2 },
    { id: 3, name: 'Mubarak Al-Dosari', phone: '0551234503', username: 'driver3', password: 'driver123', busId: 3 },
    { id: 4, name: 'Ahmed Al-Harbi', phone: '0551234504', username: 'driver4', password: 'driver123', busId: 4 },
    { id: 5, name: 'Yousef Al-Zahrani', phone: '0551234505', username: 'driver5', password: 'driver123', busId: 5 },
    { id: 6, name: 'Ibrahim Al-Ghamdi', phone: '0551234506', username: 'driver6', password: 'driver123', busId: 6 },
  ]
  const buses = [
    { id: 1, plate: 'NJR 1021', capacity: 45, active: true },
    { id: 2, plate: 'NJR 1022', capacity: 45, active: true },
    { id: 3, plate: 'NJR 1023', capacity: 45, active: true },
    { id: 4, plate: 'NJR 1024', capacity: 30, active: true },
    { id: 5, plate: 'NJR 1025', capacity: 30, active: true },
    { id: 6, plate: 'NJR 1026', capacity: 50, active: true },
  ]

  return {
    admins: [{ id: 1, name: 'Transport Administrator', username: 'admin', password: 'admin123' }],
    students, courses, absences, drivers, buses,
    notifications: [{ id: 1, target: 'all', titleKey: 'notif.welcome', bodyKey: 'notif.welcomeBody', title: 'Welcome to SmartBus AI', body: 'Bus schedules are now generated automatically from your class timetable.', time: Date.now(), read: [] }],
    plans: {},
    settings: { examWeek: false, bufferMin: 10, travelMin: 20, turnaroundMin: 40 },
  }
}
