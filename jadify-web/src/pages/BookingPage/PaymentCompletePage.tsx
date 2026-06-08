import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { bookingApi, type BookingResponse } from '../../api'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('de-CH', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function PaymentCompletePage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [booking, setBooking] = useState<BookingResponse | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const called = useRef(false)

  useEffect(() => {
    if (called.current) return
    called.current = true

    const params = new URLSearchParams(window.location.search)
    const paymentIntentId = params.get('payment_intent')
    const raw = sessionStorage.getItem('jadify_pending_booking')

    if (!paymentIntentId || !raw) {
      navigate(`/book/${slug}`, { replace: true })
      return
    }

    const details = JSON.parse(raw)
    sessionStorage.removeItem('jadify_pending_booking')

    bookingApi
      .create({ ...details, paymentIntentId })
      .then(b => {
        setBooking(b)
        setStatus('success')
      })
      .catch((err: unknown) => {
        let msg = 'Buchung konnte nicht gespeichert werden'
        if (err instanceof Error) {
          try {
            const parsed = JSON.parse(err.message)
            msg = parsed.detail ?? parsed.title ?? err.message
          } catch {
            msg = err.message
          }
        }
        setErrorMsg(msg)
        setStatus('error')
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-green-700 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Buchung wird gespeichert…</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white border border-red-200 rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Fehler beim Speichern</h2>
          <p className="text-sm text-gray-500 mb-2">{errorMsg}</p>
          <p className="text-xs text-gray-400 mb-6">Die Zahlung wurde bereits verarbeitet. Bitte kontaktiere uns direkt.</p>
          <a
            href={`/book/${slug}`}
            className="inline-block text-sm text-green-700 hover:underline"
          >
            Zurück zur Buchung
          </a>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .print-card { box-shadow: none !important; border: 1px solid #e5e7eb !important; }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10 no-print-bg">
        <div className="w-full max-w-md">

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden print-card"
          >

            {/* Green header */}
            <div className="bg-green-500 px-6 py-7 sm:px-8 sm:py-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 20 }}
                className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3"
              >
                <motion.svg
                  className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  transition={{ delay: 0.5, duration: 0.5, ease: 'easeOut' }}
                >
                  <motion.path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ delay: 0.5, duration: 0.5, ease: 'easeOut' }}
                  />
                </motion.svg>
              </motion.div>
              <h1 className="text-2xl font-black text-white">Buchung bestätigt!</h1>
              <p className="text-green-100 text-sm mt-1">Zahlung erfolgreich verarbeitet</p>
            </div>

            {/* Body */}
            {booking && (
              <div className="px-5 py-5 sm:px-8 sm:py-6 space-y-4">

                {/* Service + Staff */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Leistung</p>
                    <p className="text-sm font-semibold text-gray-900">{booking.serviceName}</p>
                    <p className="text-xs text-gray-500">mit {booking.staffName}</p>
                  </div>
                </div>

                <div className="border-t border-gray-100" />

                {/* Date */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Datum & Uhrzeit</p>
                    <p className="text-sm font-semibold text-gray-900">{formatDate(booking.startTime)}</p>
                  </div>
                </div>

                <div className="border-t border-gray-100" />

                {/* Customer */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Kunde</p>
                    <p className="text-sm font-semibold text-gray-900">{booking.customerName}</p>
                    <p className="text-xs text-gray-500">{booking.customerEmail}</p>
                  </div>
                </div>

                <div className="border-t border-gray-100" />

                {/* Amount */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Bezahlter Betrag</span>
                  <span className="text-lg font-bold text-gray-900">CHF {booking.totalAmount.toFixed(2)}</span>
                </div>

                {/* Booking ID */}
                <div className="bg-gray-50 rounded-xl px-4 py-3 text-center">
                  <p className="text-xs text-gray-400 mb-0.5">Buchungsnummer</p>
                  <p className="text-xs font-mono text-gray-600 break-all">{booking.id}</p>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="px-5 pb-6 pt-2 sm:px-8 sm:pb-8 flex flex-col gap-2 no-print">
              <button
                onClick={() => window.print()}
                className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Bestätigung drucken
              </button>
              <a
                href={`/book/${slug}`}
                className="w-full flex items-center justify-center bg-green-700 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-green-800 transition-colors"
              >
                Neue Buchung
              </a>
            </div>
          </motion.div>

          <p className="text-center text-xs text-gray-400 mt-4 no-print">
            Eine Bestätigung wurde an {booking?.customerEmail} gesendet.
          </p>
        </div>
      </div>
    </>
  )
}
