import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../api'
import { useAuth } from '../store/authStore'
import { Logo } from '../components/Logo'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const resetSuccess = new URLSearchParams(window.location.search).get('reset') === 'success'

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await authApi.login(email, password)
      login(res.accessToken, res.refreshToken, res.businessId, res.email, res.businessType, res.slug)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Anmeldung fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — dark brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-900 flex-col justify-between p-12">
        <Logo size={32} light />

        <div>
          <h2 className="text-4xl font-black text-white leading-tight tracking-tight mb-4">
            Dein Salon.<br />
            <span className="text-gray-400">Online buchbar.</span>
          </h2>
          <p className="text-gray-500 text-base leading-relaxed max-w-sm">
            Verwalte Buchungen, Mitarbeiter und Zahlungen — alles an einem Ort.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-6">
            {[
              { n: '500+', l: 'Betriebe' },
              { n: '10K+', l: 'Buchungen' },
              { n: 'CHF 0', l: 'Startkosten' },
            ].map(({ n, l }) => (
              <div key={l}>
                <div className="text-2xl font-black text-white">{n}</div>
                <div className="text-xs text-gray-600 mt-0.5 font-medium">{l}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-700">© 2025 Jadify · Made in Switzerland</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <Logo size={28} />
          </div>

          <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-1">Anmelden</h1>
          <p className="text-sm text-gray-500 mb-8">
            Noch kein Konto?{' '}
            <Link to="/register" className="text-gray-900 font-semibold hover:underline">
              Kostenlos registrieren
            </Link>
          </p>

          {resetSuccess && (
            <div className="border border-green-200 bg-green-50 rounded-lg p-3 mb-5 text-sm text-green-700">
              Passwort erfolgreich zurückgesetzt. Du kannst dich jetzt anmelden.
            </div>
          )}

          {error && (
            <div className="border border-red-200 bg-red-50 rounded-lg p-3 mb-5 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">E-Mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="deine@email.ch"
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-gray-900 transition-colors"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">Passwort</label>
                <Link to="/forgot-password" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
                  Vergessen?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-gray-900 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors mt-2"
            >
              {loading ? 'Wird angemeldet…' : 'Anmelden'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
