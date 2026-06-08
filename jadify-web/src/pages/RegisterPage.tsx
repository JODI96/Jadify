import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Scissors, UtensilsCrossed, Star } from 'lucide-react'
import { authApi } from '../api'
import { useAuth } from '../store/authStore'
import { Logo } from '../components/Logo'

const BUSINESS_TYPES = [
  { value: 'Salon',      label: 'Salon' },
  { value: 'Coiffeur',   label: 'Coiffeur' },
  { value: 'Restaurant', label: 'Restaurant' },
  { value: 'Other',      label: 'Anderes' },
]

const FEATURES = [
  { icon: <Scissors size={14} />, text: 'Online-Buchungsseite in 5 Minuten' },
  { icon: <Star size={14} />,     text: 'Stripe-Zahlungen & TWINT' },
  { icon: <UtensilsCrossed size={14} />, text: 'Dashboard & Mitarbeiterverwaltung' },
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
      login(res.accessToken, res.refreshToken, res.businessId, res.email, res.businessType, res.slug)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registrierung fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-gray-900 transition-colors'

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-gray-900 flex-col justify-between p-12">
        <Logo size={32} light />

        <div>
          <h2 className="text-3xl font-black text-white leading-tight tracking-tight mb-6">
            Kostenlos starten.<br />
            <span className="text-gray-400">Ohne Kreditkarte.</span>
          </h2>

          <div className="space-y-4">
            {FEATURES.map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center text-white shrink-0">
                  {icon}
                </div>
                <span className="text-sm text-gray-400">{text}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 bg-white/5 border border-white/10 rounded-xl p-5">
            <p className="text-sm text-gray-300 leading-relaxed italic">
              "Seit Jadify haben wir 40% mehr Online-Buchungen und sparen 2 Stunden täglich."
            </p>
            <p className="text-xs text-gray-600 mt-3 font-medium">— Anna M., Salon Bella, Zürich</p>
          </div>
        </div>

        <p className="text-xs text-gray-700">© 2025 Jadify · Made in Switzerland</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-start justify-center px-6 py-10 bg-white overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Logo size={28} />
          </div>

          <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-1">Konto erstellen</h1>
          <p className="text-sm text-gray-500 mb-8">
            Bereits ein Konto?{' '}
            <Link to="/login" className="text-gray-900 font-semibold hover:underline">Anmelden</Link>
          </p>

          {error && (
            <div className="border border-red-200 bg-red-50 rounded-lg p-3 mb-5 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Inhaber</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Vollständiger Name</label>
                  <input type="text" required value={form.ownerName} placeholder="Anna Müller"
                    onChange={e => set('ownerName', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">E-Mail</label>
                  <input type="email" required value={form.email} placeholder="anna@example.com"
                    onChange={e => set('email', e.target.value)} className={inputCls} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Passwort</label>
                    <input type="password" required value={form.password}
                      onChange={e => set('password', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Bestätigen</label>
                    <input type="password" required value={form.confirmPassword}
                      onChange={e => set('confirmPassword', e.target.value)} className={inputCls} />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 mt-2">Unternehmen</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Unternehmensname</label>
                  <input type="text" required value={form.businessName} placeholder="Salon Bella"
                    onChange={e => set('businessName', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Typ</label>
                  <select value={form.businessType} onChange={e => set('businessType', e.target.value)} className={inputCls}>
                    {BUSINESS_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse</label>
                  <input type="text" required value={form.address} placeholder="Bahnhofstrasse 1, 8001 Zürich"
                    onChange={e => set('address', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefon</label>
                  <input type="tel" required value={form.phone} placeholder="+41 44 123 45 67"
                    onChange={e => set('phone', e.target.value)} className={inputCls} />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors mt-2"
            >
              {loading ? 'Konto wird erstellt…' : 'Konto erstellen →'}
            </button>

            <p className="text-xs text-gray-400 text-center">
              Mit der Registrierung akzeptierst du unsere Nutzungsbedingungen.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
