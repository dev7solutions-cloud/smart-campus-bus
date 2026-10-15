import { X } from 'lucide-react'
import { useLang } from '../lib/i18n'

export function Stat({ icon: Icon, label, value, hint, tone = 'brand' }) {
  const tones = { brand: 'bg-brand-50 text-brand-700', amber: 'bg-amber-50 text-amber-700', sky: 'bg-sky-50 text-sky-700', rose: 'bg-rose-50 text-rose-700', violet: 'bg-violet-50 text-violet-700' }
  return (
    <div className="card p-4 flex items-center gap-4">
      {Icon && <div className={`rounded-xl p-3 ${tones[tone]}`}><Icon size={22} /></div>}
      <div className="min-w-0">
        <div className="text-xs font-medium text-slate-500">{label}</div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        {hint && <div className="text-xs text-slate-400">{hint}</div>}
      </div>
    </div>
  )
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-2xl bg-white p-1 border border-slate-200 no-print">
      {tabs.map(([key, label, Icon]) => (
        <button key={key} onClick={() => onChange(key)}
          className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition cursor-pointer ${value === key ? 'bg-brand-700 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}>
          {Icon && <Icon size={16} />}{label}
        </button>
      ))}
    </div>
  )
}

export function DayPicker({ value, onChange }) {
  const { t } = useLang()
  return (
    <div className="flex flex-wrap gap-1">
      {t.days.map((d, i) => (
        <button key={i} onClick={() => onChange(i)}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold cursor-pointer ${value === i ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
          {d}
        </button>
      ))}
    </div>
  )
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div className="card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-slate-100 cursor-pointer"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Empty({ children }) {
  const { t } = useLang()
  return <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">{children || t.common.none}</div>
}

export function Section({ title, actions, children, className = '' }) {
  return (
    <div className={`card p-5 ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold text-slate-900">{title}</h3>
          <div className="flex flex-wrap gap-2">{actions}</div>
        </div>
      )}
      {children}
    </div>
  )
}

export function downloadCSV(filename, rows) {
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}
