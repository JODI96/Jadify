import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../api'
import { useAuth } from '../store/authStore'

const BUSINESS_TYPES = [
  { value: 'Salon',      label: 'Salon' },
  { value: 'Coiffeur',   label: 'Coiffeur' },
  { value: 'Restaurant', label: 'Restaurant' },
  { value: 'Other',      label: 'Anderes' },
]

export function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    ownerName: '', email: '', password: '', confirmPassword: '',
    businessName: '', businessType: 'Salon', address: '', phone: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (form.password !== form.confirmPassword) {
      setError('Passwörter stimmen nicht überein')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await authApi.register({
        ownerName: form.ownerName,
        email: form.email,
        password: form.password,
        businessName: form.businessName,
        businessType: form.businessType,
        address: form.address,
        phone: form.phone,
      })
      login(res.accessToken, res.refreshToken, res.businessId, res.email, res.businessType)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registrierung fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  const field = (label: string, key: keyof typeof form, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        required
        value={form[key]}
        onChange={e => set(key, e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 w-full max-w-md">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Konto erstellen</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Inhaber</p>
          {field('Vollständiger Name', 'ownerName', 'text', 'Anna Müller')}
          {field('E-Mail', 'email', 'email', 'anna@example.com')}
          {field('Passwort', 'password', 'password')}
          {field('Passwort bestätigen', 'confirmPassword', 'password')}

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-2">Unternehmen</p>
          {field('Unternehmensname', 'businessName', 'text', 'Salon Bella')}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unternehmenstyp</label>
            <select
              value={form.businessType}
              onChange={e => set('businessType', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {BUSINESS_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {field('Adresse', 'address', 'text', 'Bahnhofstrasse 1, 8001 Zürich')}
          {field('Telefon', 'phone', 'tel', '+41 44 123 45 67')}

          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors mt-2"
          >
            {loading ? 'Konto wird erstellt…' : 'Konto erstellen'}
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-4">
          Bereits ein Konto?{' '}
          <Link to="/login" className="text-indigo-600 hover:underline">Anmelden</Link>
        </p>
      </div>
    </div>
  )
}
