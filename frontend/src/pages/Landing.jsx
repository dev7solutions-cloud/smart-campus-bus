import { ArrowRight, BellRing, BarChart3, Brain, CalendarClock, CheckCircle2, Clock, Gauge, LayoutDashboard, Route, ShieldCheck, Upload, UserX, Users, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LangToggle, Logo } from '../components/Layout'
import { useLang } from '../lib/i18n'
import { modelInfo } from '../lib/rf'
import { useStore } from '../lib/store'
import { DAYS } from '../lib/seed'

const FEATURE_ICONS = [Upload, Brain, CalendarClock, Clock, UserX, BellRing, Route, BarChart3]
const TEAM = [
  ['Atyaf Salem Al-Ansari', '442408445'],
  ['Afrah Jaber Al-Mutlaq', '443404651'],
  ['Saadih Hassan Asiri', '444305334'],
  ['Amjad Jaber Al-Shahrani', '442302691'],
]
const STACK = ['React', 'Vite', 'Tailwind CSS', 'Python', 'scikit-learn (Random Forest)', 'FastAPI', 'MySQL', 'Recharts', 'GitHub Actions']

export default function Landing() {
  const { t } = useLang()
  const { db, user } = useStore()
  const plans = DAYS.map((d) => db.plans[d]).filter(Boolean)
  const avg = (k) => plans.reduce((s, p) => s + p.metrics[k], 0) / (plans.length || 1)
  const overAi = plans.reduce((s, p) => s + p.metrics.aiOvercrowded, 0)
  const overFixed = plans.reduce((s, p) => s + p.metrics.fixedOvercrowded, 0)

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="hover:text-brand-700">{t.nav.features}</a>
            <a href="#how" className="hover:text-brand-700">{t.nav.how}</a>
            <a href="#team" className="hover:text-brand-700">{t.nav.team}</a>
          </nav>
          <div className="flex items-center gap-2">
            <LangToggle />
            <Link to={user ? `/${user.role}` : '/login'} className="btn-primary">{user ? t.nav.dashboard : t.nav.login}</Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 text-white">
        <div className="absolute -top-24 -end-24 h-96 w-96 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="badge bg-white/10 text-brand-100 ring-1 ring-white/20">{t.hero.badge}</span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight md:text-5xl">{t.hero.title}</h1>
            <p className="mt-5 max-w-xl text-lg text-brand-100">{t.hero.subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login" className="btn bg-amber-400 text-slate-900 hover:bg-amber-300 !px-6 !py-3 text-base">{t.hero.cta}<ArrowRight size={18} className="rtl:rotate-180" /></Link>
              <a href="#how" className="btn bg-white/10 text-white ring-1 ring-white/30 hover:bg-white/20 !px-6 !py-3 text-base">{t.hero.cta2}</a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              [Clock, t.stats.wait, `${avg('aiWait').toFixed(0)} ${t.common.minutes}`, `${avg('fixedWait').toFixed(0)} ${t.common.minutes} → ${avg('aiWait').toFixed(0)}`],
              [Gauge, t.stats.overcrowd, overAi, `${overFixed} → ${overAi}`],
              [Brain, t.stats.accuracy, modelInfo.metrics.r2.toFixed(3), `MAE ${modelInfo.metrics.mae}`],
              [Users, t.stats.students, db.students.length, `${DAYS.length} ${t.common.workdays}`],
            ].map(([Icon, label, value, hint]) => (
              <div key={label} className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/20 backdrop-blur">
                <Icon className="text-amber-300" />
                <div className="mt-3 text-3xl font-extrabold">{value}</div>
                <div className="text-sm text-brand-100">{label}</div>
                <div className="mt-1 text-xs text-brand-200">{hint}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-3xl font-extrabold text-slate-900">{t.problem.title}</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {t.problem.items.map((p) => (
            <div key={p} className="card flex gap-3 p-5"><XCircle className="shrink-0 text-rose-500" /><p className="text-sm text-slate-700">{p}</p></div>
          ))}
        </div>
      </section>

      <section id="features" className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-3xl font-extrabold text-slate-900">{t.features.title}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {t.features.items.map(([title, desc], i) => {
              const Icon = FEATURE_ICONS[i]
              return (
                <div key={title} className="card p-5 transition hover:-translate-y-1 hover:shadow-md">
                  <div className="inline-flex rounded-xl bg-brand-50 p-3 text-brand-700"><Icon size={22} /></div>
                  <h3 className="mt-4 font-bold">{title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-3xl font-extrabold text-slate-900">{t.how.title}</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-5">
          {t.how.steps.map(([title, desc], i) => (
            <div key={title} className="relative card p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-700 font-bold text-white">{i + 1}</div>
              <h3 className="mt-3 font-bold">{title}</h3>
              <p className="mt-1 text-sm text-slate-600">{desc}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-16 text-3xl font-extrabold text-slate-900">{t.compare.title}</h2>
        <div className="card mt-6 overflow-x-auto">
          <table className="table">
            <thead><tr><th>{t.compare.feature}</th><th>{t.compare.existing}</th><th>{t.compare.proposed}</th></tr></thead>
            <tbody>
              {t.compare.rows.map(([f, a, b]) => (
                <tr key={f}>
                  <td className="font-semibold">{f}</td>
                  <td className="text-slate-500"><XCircle size={14} className="inline text-rose-400 me-1" />{a}</td>
                  <td className="text-slate-800"><CheckCircle2 size={14} className="inline text-emerald-500 me-1" />{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mt-16 text-2xl font-extrabold text-slate-900">{t.stack}</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {STACK.map((s) => <span key={s} className="badge bg-slate-100 text-slate-700 !px-3 !py-1.5 text-sm">{s}</span>)}
        </div>
      </section>

      <section id="team" className="bg-slate-900 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-3xl font-extrabold">{t.team.title}</h2>
          <p className="mt-2 text-slate-400">{t.team.dept}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TEAM.map(([name, id]) => (
              <div key={id} className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-lg font-bold">{name[0]}</div>
                <div className="mt-3 font-semibold">{name}</div>
                <div className="text-sm text-slate-400">{id}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-3 rounded-2xl bg-brand-800/60 p-5 ring-1 ring-brand-600">
            <ShieldCheck className="text-amber-300" />
            <span className="text-slate-300">{t.team.supervisor}:</span>
            <span className="font-semibold">Dr. Muhammad Al-Jubairi</span>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        <div className="flex items-center justify-center gap-2"><LayoutDashboard size={16} />{t.footer}</div>
      </footer>
    </div>
  )
}
