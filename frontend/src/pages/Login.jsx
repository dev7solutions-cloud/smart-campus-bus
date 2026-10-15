import { Bus, GraduationCap, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LangToggle, Logo } from '../components/Layout'
import { useLang } from '../lib/i18n'
import { useStore } from '../lib/store'

const DEMOS = { student: ['student@nu.edu.sa', 'student123'], admin: ['admin', 'admin123'], driver: ['driver1', 'driver123'] }
const ICONS = { student: GraduationCap, admin: ShieldCheck, driver: Bus }

export default function Login() {
  const { t } = useLang()
  const { login } = useStore()
  const navigate = useNavigate()
  const [role, setRole] = useState('student')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  const submit = (e, r = role, id = identifier, pw = password) => {
    e?.preventDefault()
    if (login(r, id, pw)) navigate(`/${r}`)
    else setError(true)
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-brand-50 to-slate-100">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4"><Logo /><LangToggle /></div>
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="card w-full max-w-md p-8">
          <h1 className="text-2xl font-extrabold">{t.auth.signin}</h1>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <span className="label">{t.auth.role}</span>
              <div className="grid grid-cols-3 gap-2">
                {Object.keys(DEMOS).map((r) => {
                  const Icon = ICONS[r]
                  return (
                    <button type="button" key={r} onClick={() => { setRole(r); setError(false) }}
                      className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-semibold cursor-pointer ${role === r ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                      <Icon size={20} />{t.roles[r]}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <label className="label">{role === 'student' ? t.auth.identifier : t.auth.username}</label>
              <input className="input" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
            </div>
            <div>
              <label className="label">{t.auth.password}</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="rounded-lg bg-rose-50 p-2 text-sm text-rose-700">{t.auth.invalid}</p>}
            <button className="btn-primary w-full !py-3">{t.auth.submit}</button>
          </form>
          {role === 'student' && (
            <p className="mt-4 text-center text-sm text-slate-600">{t.auth.noAccount} <Link to="/register" className="font-semibold text-brand-700">{t.auth.register}</Link></p>
          )}
          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <div className="text-xs font-bold uppercase text-slate-500">{t.auth.demo}</div>
            <div className="mt-2 space-y-2">
              {Object.entries(DEMOS).map(([r, [id, pw]]) => (
                <div key={r} className="flex items-center justify-between gap-2 text-sm">
                  <span><b>{t.roles[r]}:</b> <code className="text-xs">{id} / {pw}</code></span>
                  <button className="btn-ghost !px-2 !py-1 text-xs" onClick={() => { setRole(r); setIdentifier(id); setPassword(pw); submit(null, r, id, pw) }}>{t.auth.useDemo}</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
