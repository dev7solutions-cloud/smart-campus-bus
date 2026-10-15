import { Bus, Languages, LogOut } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useLang } from '../lib/i18n'
import { useStore } from '../lib/store'

export function LangToggle() {
  const { lang, setLang } = useLang()
  return (
    <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="btn-ghost !px-3" title="Language">
      <Languages size={16} />{lang === 'en' ? 'العربية' : 'English'}
    </button>
  )
}

export function Logo() {
  const { t } = useLang()
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="rounded-xl bg-brand-700 p-2 text-white"><Bus size={20} /></span>
      <span className="text-lg font-extrabold text-slate-900">{t.appName}</span>
    </Link>
  )
}

export default function AppShell({ children, subtitle }) {
  const { t } = useLang()
  const { user, logout } = useStore()
  const navigate = useNavigate()
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur no-print">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Logo />
          <div className="flex items-center gap-2">
            <LangToggle />
            {user && (
              <>
                <div className="hidden text-end sm:block">
                  <div className="text-sm font-semibold">{user.name}</div>
                  <div className="text-xs text-slate-500">{t.roles[user.role]}</div>
                </div>
                <button className="btn-ghost !px-3" onClick={() => { logout(); navigate('/') }}><LogOut size={16} /><span className="hidden sm:inline">{t.nav.logout}</span></button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6">
        {subtitle}
        {children}
      </main>
    </div>
  )
}
