import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LangToggle, Logo } from '../components/Layout'
import { useLang } from '../lib/i18n'
import { STOPS } from '../lib/seed'
import { useStore } from '../lib/store'

export default function Register() {
  const { t, lang } = useLang()
  const { register } = useStore()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', studentNo: '', email: '', password: '', stopId: 0 })
  const [error, setError] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = (e) => {
    e.preventDefault()
    if (register(form)) navigate('/student')
    else setError(true)
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-brand-50 to-slate-100">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4"><Logo /><LangToggle /></div>
      <div className="flex flex-1 items-center justify-center p-4">
        <form onSubmit={submit} className="card w-full max-w-md space-y-4 p-8">
          <h1 className="text-2xl font-extrabold">{t.auth.registerTitle}</h1>
          <div><label className="label">{t.auth.name}</label><input className="input" value={form.name} onChange={set('name')} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">{t.auth.studentNo}</label><input className="input" value={form.studentNo} onChange={set('studentNo')} pattern="[0-9]{6,12}" required /></div>
            <div><label className="label">{t.auth.stop}</label>
              <select className="input" value={form.stopId} onChange={set('stopId')}>{STOPS.map((s) => <option key={s.id} value={s.id}>{s[lang]}</option>)}</select>
            </div>
          </div>
          <div><label className="label">{t.auth.email}</label><input className="input" type="email" value={form.email} onChange={set('email')} required /></div>
          <div><label className="label">{t.auth.password}</label><input className="input" type="password" minLength={6} value={form.password} onChange={set('password')} required /></div>
          {error && <p className="rounded-lg bg-rose-50 p-2 text-sm text-rose-700">{t.auth.exists}</p>}
          <button className="btn-primary w-full !py-3">{t.auth.create}</button>
          <p className="text-center text-sm text-slate-600">{t.auth.haveAccount} <Link to="/login" className="font-semibold text-brand-700">{t.nav.login}</Link></p>
        </form>
      </div>
    </div>
  )
}
