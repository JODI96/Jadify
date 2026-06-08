import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { bookingApi } from '../../api'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('de-CH', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function ConfirmationPage() {
  const { slug, bookingId } = useParams<{ slug: string; bookingId: string }>()

  const { data: booking, isLoading, error } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingApi.getById(bookingId!),
    enabled: !!bookingId,
    retry: 1,
  })

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">

          {isLoading && (
            <div className="flex flex-col items-center gap-3 py-20">
              <div className="w-8 h-8 border-2 border-green-700 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Wird geladen…</p>
            </div>
          )}

          {(error || (!isLoading && !booking)) && (
            <div className="bg-white border border-red-200 rounded-2xl p-8 text-center shadow-sm">
              <p className="text-red-600 font-medium mb-1">Buchung nicht gefunden</p>
              <p className="text-sm text-gray-400">Bitte überprüfe den Link in deiner E-Mail.</p>
            </div>
          )}

          {booking && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

              {/* Green header */}
              <div className="bg-green-500 px-6 py-7 sm:px-8 sm:py-8 text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-white">Buchung bestätigt!</h1>
                <p className="text-green-100 text-sm mt-1">{booking.businessName}</p>
              </div>

              {/* Body */}
              <div className="px-5 py-5 sm:px-8 sm:py-6 space-y-4">

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

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Bezahlter Betrag</span>
                  <span className="text-lg font-bold text-gray-900">CHF {booking.totalAmount.toFixed(2)}</span>
                </div>

                <div className="bg-gray-50 rounded-xl px-4 py-3 text-center">
                  <p className="text-xs text-gray-400 mb-0.5">Buchungsnummer</p>
                  <p className="text-xs font-mono text-gray-600 break-all">{booking.id}</p>
                </div>
              </div>

              {/* Footer buttons */}
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
            </div>
          )}
        </div>
      </div>
    </>
  )
}
