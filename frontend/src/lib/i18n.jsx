import { createContext, useContext, useEffect, useState } from 'react'

const en = {
  appName: 'SmartBus AI', tagline: 'AI-Based Smart Campus Bus Scheduling System',
  nav: { home: 'Home', features: 'Features', how: 'How it works', team: 'Team', login: 'Sign in', dashboard: 'Dashboard', logout: 'Sign out' },
  days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
  daysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
  roles: { student: 'Student', admin: 'Administrator', driver: 'Bus Driver' },
  hero: {
    badge: 'Graduation Project · Najran University · 2026',
    title: 'Campus buses that follow your class schedule',
    subtitle: 'A Random Forest model analyses student timetables and attendance to predict transportation demand and generate optimized, dynamic bus schedules — less waiting, no overcrowding.',
    cta: 'Open the live system', cta2: 'See how it works',
  },
  stats: { wait: 'Avg. waiting time', overcrowd: 'Overcrowded trips', accuracy: 'Model accuracy (R²)', students: 'Students served' },
  problem: { title: 'The problem with fixed timetables', items: ['Fixed bus timings ignore students’ class schedules', 'Long waiting times and late arrivals for early lectures', 'Overcrowded buses at peak hours, empty buses off-peak', 'No data or intelligent methods for planning'] },
  features: {
    title: 'What the system does',
    items: [
      ['Schedule input', 'Students enter or upload (CSV) their class timetable.'],
      ['AI demand prediction', 'Random Forest predicts riders per stop and time slot.'],
      ['Optimized schedules', 'Trips are generated and packed onto buses by capacity.'],
      ['Early-class priority', 'Trips before 9:00 get a 10% safety seat buffer.'],
      ['Attendance-aware routes', 'Absent students are excluded so buses skip empty stops.'],
      ['Real-time notifications', 'Students and drivers are notified when plans change.'],
      ['Driver predictions', 'Drivers see trips, stops and expected passengers.'],
      ['Reports & analytics', 'Admins compare AI vs. fixed schedules and export reports.'],
    ],
  },
  how: { title: 'How it works', steps: [['Collect', 'Class schedules, attendance status, stops and fleet data'], ['Analyse', 'Group students by departure slot and stop, find peaks'], ['Predict', 'Random Forest estimates actual riders for each group'], ['Optimize', 'Assign buses by capacity, prioritise early classes'], ['Deliver', 'Timings to students, routes to drivers, reports to admins']] },
  compare: { title: 'Existing vs. proposed system', feature: 'Feature', existing: 'Existing systems', proposed: 'Proposed system',
    rows: [['Scheduling method', 'Fixed schedules', 'Dynamic, AI-based scheduling'], ['Adaptability', 'Does not adapt', 'Adapts to real-time data'], ['Student schedules', 'Not considered', 'Fully integrated & analysed'], ['Waiting time', 'Often long', 'Reduced significantly'], ['Overcrowding', 'Common at peak hours', 'Minimized using prediction'], ['Prediction', 'Limited or none', 'Random Forest demand model'], ['Notifications', 'Limited', 'Real-time updates & alerts']] },
  stack: 'Technology stack',
  team: { title: 'Project team', supervisor: 'Supervised by', dept: 'Department of Information Systems · Faculty of Computer Science & IT · Najran University' },
  footer: 'AI-Based Smart Campus Bus Scheduling System — Najran University graduation project.',
  auth: {
    signin: 'Sign in to SmartBus AI', role: 'I am a', identifier: 'Email or student number', username: 'Username', password: 'Password',
    submit: 'Sign in', invalid: 'Invalid credentials. Try the demo accounts below.', demo: 'Demo accounts', useDemo: 'Use',
    noAccount: 'New student?', register: 'Create an account', registerTitle: 'Create student account', name: 'Full name',
    studentNo: 'Student number', email: 'University email', stop: 'Pickup stop', create: 'Create account', exists: 'A student with this email or number already exists.', haveAccount: 'Already registered?',
  },
  common: { save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', add: 'Add', actions: 'Actions', day: 'Day', time: 'Time', stop: 'Stop', bus: 'Bus', driver: 'Driver', capacity: 'Capacity', status: 'Status', name: 'Name', search: 'Search…', none: 'Nothing here yet.', all: 'All', export: 'Export CSV', print: 'Print', passengers: 'passengers', minutes: 'min', reset: 'Reset demo data', resetConfirm: 'Reset all demo data?', priority: 'Early-class priority', toCampus: 'To campus', return: 'Return', arrive: 'Arrives', depart: 'Departs', present: 'Present', absent: 'Absent', active: 'Active', inactive: 'Inactive', phone: 'Phone', yes: 'Yes', no: 'No', today: 'Today', workdays: 'working days' },
  student: {
    hello: 'Welcome back', tabs: { overview: 'My bus', schedule: 'Class schedule', attendance: 'Attendance', notifications: 'Notifications' },
    nextTrips: 'Your optimized bus timings', noClasses: 'No classes on this day — no bus booked.', absentDay: 'You are marked absent — your stop is skipped.',
    addCourse: 'Add class', code: 'Course code', title: 'Course title', start: 'Start', end: 'End', building: 'Building',
    upload: 'Upload CSV', template: 'Download template', uploaded: 'classes imported', weekly: 'Weekly timetable',
    attendanceHelp: 'Tell the system if you will not attend on a day. Absent students are excluded from demand, so the bus skips unnecessary stops.',
    willAttend: 'Will attend', willNotAttend: 'Will not attend', firstClass: 'First class', lastClass: 'Last class', stopLabel: 'Your stop', markRead: 'Mark all as read',
  },
  admin: {
    tabs: { overview: 'Overview', scheduler: 'AI Scheduler', students: 'Students', fleet: 'Buses & Drivers', reports: 'Reports', model: 'AI Model', notify: 'Notifications' },
    kpi: { students: 'Registered students', riders: 'Predicted riders', trips: 'Trips planned', load: 'Avg. load factor', wait: 'Avg. waiting (AI)', skipped: 'Stops skipped (absence)' },
    demandChart: 'Hourly demand — scheduled vs. AI-predicted', compareChart: 'AI schedule vs. fixed timetable',
    regenerate: 'Regenerate with AI', regenerateAll: 'Regenerate whole week', generated: 'Generated', examWeek: 'Exam week mode', warnings: 'Capacity warnings', unserved: 'riders unserved — add a bus',
    trip: 'Trip', type: 'Type', stops: 'Stops', predicted: 'Predicted', load: 'Load', waitAi: 'Avg wait (AI)', waitFixed: 'Avg wait (fixed)', overAi: 'Overcrowded (AI)', overFixed: 'Overcrowded (fixed)', tripsAi: 'Trips (AI)', tripsFixed: 'Trips (fixed)',
    addStudent: 'Add student', addBus: 'Add bus', addDriver: 'Add driver', plate: 'Plate number', courses: 'Classes', assignedBus: 'Assigned bus',
    model: { title: 'Random Forest demand model', features: 'Feature importance', metrics: 'Evaluation on hold-out test set', mae: 'MAE (riders)', r2: 'R² score', trees: 'Decision trees', depth: 'Max depth', rows: 'Training rows', tryIt: 'Try a prediction', scheduled: 'Students scheduled', absentN: 'Reported absent', hour: 'Departure hour', result: 'Predicted riders' },
    notify: { title: 'Send announcement', target: 'Audience', subject: 'Title', body: 'Message', send: 'Send', sent: 'Announcement sent', students: 'All students', drivers: 'All drivers', everyone: 'Everyone', history: 'Recent notifications' },
    reportTitle: 'Transportation demand report', perStop: 'Demand by stop', perBus: 'Trips per bus', weekly: 'Weekly summary',
  },
  driver: { tabs: { trips: 'My trips', predictions: 'Predictions', notifications: 'Notifications' }, noBus: 'No bus assigned. Contact the administrator.', noTrips: 'No trips assigned for this day.', expected: 'Expected passengers', route: 'Route', peak: 'Peak demand' },
  notif: { updated: 'Bus schedule updated', driver: 'Route plan regenerated', welcome: 'Welcome to SmartBus AI', welcomeBody: 'Bus schedules are now generated automatically from your class timetable.' },
}

const ar = {
  appName: 'الباص الذكي', tagline: 'نظام جدولة حافلات الحرم الجامعي الذكي المعتمد على الذكاء الاصطناعي',
  nav: { home: 'الرئيسية', features: 'المزايا', how: 'آلية العمل', team: 'الفريق', login: 'تسجيل الدخول', dashboard: 'لوحة التحكم', logout: 'تسجيل الخروج' },
  days: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
  daysShort: ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس'],
  roles: { student: 'طالب', admin: 'مسؤول النظام', driver: 'سائق الحافلة' },
  hero: {
    badge: 'مشروع تخرج · جامعة نجران · 2026',
    title: 'حافلات جامعية تتبع جدولك الدراسي',
    subtitle: 'نموذج الغابة العشوائية (Random Forest) يحلل جداول الطلاب وحالة الحضور للتنبؤ بالطلب على النقل وإنشاء جداول حافلات ديناميكية ومحسّنة — انتظار أقل وبلا ازدحام.',
    cta: 'افتح النظام المباشر', cta2: 'شاهد آلية العمل',
  },
  stats: { wait: 'متوسط وقت الانتظار', overcrowd: 'رحلات مزدحمة', accuracy: 'دقة النموذج (R²)', students: 'طلاب مخدومون' },
  problem: { title: 'مشكلة الجداول الثابتة', items: ['مواعيد الحافلات الثابتة لا تراعي جداول الطلاب', 'انتظار طويل وتأخر عن المحاضرات الصباحية', 'ازدحام في أوقات الذروة وحافلات فارغة في غيرها', 'غياب البيانات والأساليب الذكية في التخطيط'] },
  features: {
    title: 'ماذا يقدم النظام',
    items: [
      ['إدخال الجدول', 'يُدخل الطالب جدوله أو يرفعه بملف CSV.'],
      ['التنبؤ بالطلب بالذكاء الاصطناعي', 'الغابة العشوائية تتنبأ بعدد الركاب لكل محطة وفترة.'],
      ['جداول محسّنة', 'تُنشأ الرحلات وتوزع على الحافلات حسب السعة.'],
      ['أولوية المحاضرات المبكرة', 'رحلات ما قبل 9:00 تحصل على هامش مقاعد 10%.'],
      ['مسارات تراعي الحضور', 'يُستبعد الطلاب الغائبون فتتجاوز الحافلة المحطات الفارغة.'],
      ['إشعارات فورية', 'يُبلَّغ الطلاب والسائقون عند تغيّر الخطة.'],
      ['تنبؤات للسائق', 'يرى السائق الرحلات والمحطات وعدد الركاب المتوقع.'],
      ['تقارير وتحليلات', 'يقارن المسؤول بين الجدول الذكي والثابت ويصدّر التقارير.'],
    ],
  },
  how: { title: 'آلية العمل', steps: [['جمع البيانات', 'الجداول الدراسية وحالة الحضور والمحطات والأسطول'], ['التحليل', 'تجميع الطلاب حسب وقت الانطلاق والمحطة وتحديد الذروة'], ['التنبؤ', 'الغابة العشوائية تقدّر الركاب الفعليين لكل مجموعة'], ['التحسين', 'توزيع الحافلات حسب السعة وأولوية المحاضرات المبكرة'], ['التسليم', 'مواعيد للطلاب ومسارات للسائقين وتقارير للمسؤول']] },
  compare: { title: 'النظام الحالي مقابل النظام المقترح', feature: 'الخاصية', existing: 'الأنظمة الحالية', proposed: 'النظام المقترح',
    rows: [['طريقة الجدولة', 'جداول ثابتة', 'جدولة ديناميكية بالذكاء الاصطناعي'], ['القدرة على التكيّف', 'لا يتكيّف', 'يتكيّف مع البيانات الفورية'], ['جداول الطلاب', 'غير معتبرة', 'مدمجة ومحللة بالكامل'], ['وقت الانتظار', 'طويل غالباً', 'منخفض بشكل كبير'], ['الازدحام', 'شائع وقت الذروة', 'مُقلَّل بالتنبؤ'], ['التنبؤ', 'محدود أو معدوم', 'نموذج الغابة العشوائية'], ['الإشعارات', 'محدودة', 'تحديثات وتنبيهات فورية']] },
  stack: 'التقنيات المستخدمة',
  team: { title: 'فريق المشروع', supervisor: 'بإشراف', dept: 'قسم نظم المعلومات · كلية علوم الحاسب ونظم المعلومات · جامعة نجران' },
  footer: 'نظام جدولة حافلات الحرم الجامعي الذكي — مشروع تخرج جامعة نجران.',
  auth: {
    signin: 'تسجيل الدخول إلى الباص الذكي', role: 'نوع المستخدم', identifier: 'البريد أو الرقم الجامعي', username: 'اسم المستخدم', password: 'كلمة المرور',
    submit: 'دخول', invalid: 'بيانات غير صحيحة. جرّب الحسابات التجريبية أدناه.', demo: 'حسابات تجريبية', useDemo: 'استخدم',
    noAccount: 'طالب جديد؟', register: 'إنشاء حساب', registerTitle: 'إنشاء حساب طالب', name: 'الاسم الكامل',
    studentNo: 'الرقم الجامعي', email: 'البريد الجامعي', stop: 'محطة الركوب', create: 'إنشاء الحساب', exists: 'يوجد طالب بنفس البريد أو الرقم.', haveAccount: 'لديك حساب؟',
  },
  common: { save: 'حفظ', cancel: 'إلغاء', delete: 'حذف', edit: 'تعديل', add: 'إضافة', actions: 'إجراءات', day: 'اليوم', time: 'الوقت', stop: 'المحطة', bus: 'الحافلة', driver: 'السائق', capacity: 'السعة', status: 'الحالة', name: 'الاسم', search: 'بحث…', none: 'لا توجد بيانات بعد.', all: 'الكل', export: 'تصدير CSV', print: 'طباعة', passengers: 'راكب', minutes: 'دقيقة', reset: 'إعادة البيانات التجريبية', resetConfirm: 'إعادة جميع البيانات التجريبية؟', priority: 'أولوية المحاضرات المبكرة', toCampus: 'إلى الجامعة', return: 'العودة', arrive: 'الوصول', depart: 'الانطلاق', present: 'حاضر', absent: 'غائب', active: 'نشطة', inactive: 'متوقفة', phone: 'الجوال', yes: 'نعم', no: 'لا', today: 'اليوم', workdays: 'أيام دراسية' },
  student: {
    hello: 'مرحباً بعودتك', tabs: { overview: 'حافلتي', schedule: 'الجدول الدراسي', attendance: 'الحضور', notifications: 'الإشعارات' },
    nextTrips: 'مواعيد حافلتك المحسّنة', noClasses: 'لا توجد محاضرات في هذا اليوم — لا يوجد حجز حافلة.', absentDay: 'أنت مسجل غائب — سيتم تجاوز محطتك.',
    addCourse: 'إضافة مادة', code: 'رمز المادة', title: 'اسم المادة', start: 'البداية', end: 'النهاية', building: 'المبنى',
    upload: 'رفع ملف CSV', template: 'تحميل النموذج', uploaded: 'مادة تم استيرادها', weekly: 'الجدول الأسبوعي',
    attendanceHelp: 'أخبر النظام إذا لن تحضر في يوم ما. يُستبعد الغائبون من حساب الطلب فتتجاوز الحافلة المحطات غير الضرورية.',
    willAttend: 'سأحضر', willNotAttend: 'لن أحضر', firstClass: 'أول محاضرة', lastClass: 'آخر محاضرة', stopLabel: 'محطتك', markRead: 'تحديد الكل كمقروء',
  },
  admin: {
    tabs: { overview: 'نظرة عامة', scheduler: 'المجدول الذكي', students: 'الطلاب', fleet: 'الحافلات والسائقون', reports: 'التقارير', model: 'نموذج الذكاء الاصطناعي', notify: 'الإشعارات' },
    kpi: { students: 'الطلاب المسجلون', riders: 'الركاب المتوقعون', trips: 'الرحلات المخططة', load: 'متوسط نسبة الإشغال', wait: 'متوسط الانتظار (ذكي)', skipped: 'محطات متجاوزة (غياب)' },
    demandChart: 'الطلب بالساعة — المجدول مقابل المتوقع', compareChart: 'الجدول الذكي مقابل الجدول الثابت',
    regenerate: 'إعادة التوليد بالذكاء الاصطناعي', regenerateAll: 'إعادة توليد الأسبوع', generated: 'تم التوليد', examWeek: 'وضع أسبوع الاختبارات', warnings: 'تنبيهات السعة', unserved: 'راكب بدون مقعد — أضف حافلة',
    trip: 'الرحلة', type: 'النوع', stops: 'المحطات', predicted: 'المتوقع', load: 'الإشغال', waitAi: 'متوسط الانتظار (ذكي)', waitFixed: 'متوسط الانتظار (ثابت)', overAi: 'رحلات مزدحمة (ذكي)', overFixed: 'رحلات مزدحمة (ثابت)', tripsAi: 'الرحلات (ذكي)', tripsFixed: 'الرحلات (ثابت)',
    addStudent: 'إضافة طالب', addBus: 'إضافة حافلة', addDriver: 'إضافة سائق', plate: 'رقم اللوحة', courses: 'المواد', assignedBus: 'الحافلة المخصصة',
    model: { title: 'نموذج الغابة العشوائية للتنبؤ بالطلب', features: 'أهمية الخصائص', metrics: 'التقييم على بيانات الاختبار', mae: 'متوسط الخطأ المطلق (ركاب)', r2: 'معامل R²', trees: 'أشجار القرار', depth: 'أقصى عمق', rows: 'صفوف التدريب', tryIt: 'جرّب التنبؤ', scheduled: 'الطلاب المجدولون', absentN: 'المبلّغون بالغياب', hour: 'ساعة الانطلاق', result: 'الركاب المتوقعون' },
    notify: { title: 'إرسال إعلان', target: 'الجمهور', subject: 'العنوان', body: 'الرسالة', send: 'إرسال', sent: 'تم إرسال الإعلان', students: 'جميع الطلاب', drivers: 'جميع السائقين', everyone: 'الجميع', history: 'آخر الإشعارات' },
    reportTitle: 'تقرير الطلب على النقل', perStop: 'الطلب حسب المحطة', perBus: 'الرحلات لكل حافلة', weekly: 'الملخص الأسبوعي',
  },
  driver: { tabs: { trips: 'رحلاتي', predictions: 'التنبؤات', notifications: 'الإشعارات' }, noBus: 'لا توجد حافلة مخصصة. تواصل مع المسؤول.', noTrips: 'لا توجد رحلات في هذا اليوم.', expected: 'الركاب المتوقعون', route: 'المسار', peak: 'ذروة الطلب' },
  notif: { updated: 'تم تحديث جدول الحافلة', driver: 'تمت إعادة توليد خطة المسار', welcome: 'مرحباً بك في الباص الذكي', welcomeBody: 'أصبحت جداول الحافلات تُولَّد تلقائياً من جدولك الدراسي.' },
}

const LangCtx = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('smartbus-lang') || 'en')
  useEffect(() => {
    localStorage.setItem('smartbus-lang', lang)
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }, [lang])
  const t = lang === 'ar' ? ar : en
  return <LangCtx.Provider value={{ lang, setLang, t }}>{children}</LangCtx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useLang = () => useContext(LangCtx)
