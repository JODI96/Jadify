import { useState } from 'react'
import type { BookingState } from './index'

interface Props {
  state: BookingState
  onSubmit: (name: string, email: string, phone: string, notes: string) => void
  onBack: () => void
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('de-CH', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export function StepCustomer({ state, onSubmit, onBack }: Props) {
  const [name, setName] = useState(state.customerName)
  const [email, setEmail] = useState(state.customerEmail)
  const [phone, setPhone] = useState(state.customerPhone)
  const [notes, setNotes] = useState(state.notes)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Name ist erforderlich'
    if (!email.trim()) e.email = 'E-Mail ist erforderlich'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Ungültige E-Mail'
    return e
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    onSubmit(name, email, phone, notes)
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-gray-900 transition-colors'

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 tracking-tight mb-1">Ihre Angaben</h2>

      {/* Summary */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5 mb-6 text-sm">
        <p className="font-semibold text-gray-900">{state.service?.name}</p>
        <p className="text-gray-500 mt-0.5">
          {state.startTime && formatDateTime(state.startTime)}
          {state.staff?.name && ` · ${state.staff.name}`}
          {' · '}CHF {state.service?.price.toFixed(2)}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Vollständiger Name *</label>
          <input value={name} onChange={e => setName(e.target.value)}
            className={inputCls} placeholder="Anna Müller" />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">E-Mail *</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            className={inputCls} placeholder="anna@example.com" />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefon</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
            className={inputCls} placeholder="+41 79 123 45 67" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Bemerkungen</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            className={`${inputCls} resize-none`} placeholder="Wünsche oder Hinweise…" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onBack}
            className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
            ← Zurück
          </button>
          <button type="submit"
            className="flex-1 bg-gray-900 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors">
            Weiter zur Zahlung →
          </button>
        </div>
      </form>
    </div>
  )
}
