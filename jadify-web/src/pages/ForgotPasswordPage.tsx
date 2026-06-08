import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../api'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await authApi.forgotPassword(email)
      setSent(true)
    } catch {
      setError('Ein Fehler ist aufgetreten. Bitte versuche es später erneut.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 w-full max-w-sm">

        {/* Icon */}
        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-5">
          <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">E-Mail gesendet</h1>
            <p className="text-sm text-gray-500 mb-6">
              Falls ein Konto mit <strong>{email}</strong> existiert, erhältst du in Kürze einen Reset-Link.
            </p>
            <Link to="/login" className="text-sm text-green-700 hover:underline">
              Zurück zur Anmeldung
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-gray-900 mb-1 text-center">Passwort vergessen?</h1>
            <p className="text-sm text-gray-500 text-center mb-6">
              Gib deine E-Mail-Adresse ein und wir senden dir einen Reset-Link.
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="deine@email.ch"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-gray-900 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:opacity-60 transition-colors"
              >
                {loading ? 'Wird gesendet…' : 'Reset-Link senden'}
              </button>
            </form>

            <p className="text-sm text-gray-500 text-center mt-4">
              <Link to="/login" className="text-green-700 hover:underline">Zurück zur Anmeldung</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
