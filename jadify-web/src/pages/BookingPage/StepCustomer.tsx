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

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Ihre Angaben</h2>

      {/* Summary */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 mb-6 text-sm text-indigo-800">
        <p className="font-medium">{state.service?.name}</p>
        <p className="text-indigo-600">
          {state.startTime && formatDateTime(state.startTime)} · {state.staff?.name}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vollständiger Name *</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Anna Müller"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail *</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="anna@example.com"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="+41 79 123 45 67"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bemerkungen</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder="Wünsche oder Hinweise…"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            ← Zurück
          </button>
          <button
            type="submit"
            className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Weiter zur Zahlung
          </button>
        </div>
      </form>
    </div>
  )
}
