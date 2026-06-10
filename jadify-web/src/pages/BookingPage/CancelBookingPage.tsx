import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { bookingApi } from '../../api'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('de-CH', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

type State = 'idle' | 'confirming' | 'success' | 'error'

export function CancelBookingPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [uiState, setUiState] = useState<State>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const { data: booking, isLoading, error: loadError } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingApi.getById(bookingId!),
    enabled: !!bookingId,
    retry: 1,
  })

  const cancelMutation = useMutation({
    mutationFn: () => bookingApi.cancelByCustomer(bookingId!, token),
    onSuccess: () => setUiState('success'),
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.'
      setErrorMsg(msg)
      setUiState('error')
    },
  })

  const alreadyCancelled = booking?.status === 'Cancelled'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        {isLoading && (
          <div className="flex flex-col items-center gap-3 py-20">
            <div className="w-8 h-8 border-2 border-gray-700 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Wird geladen…</p>
          </div>
        )}

        {(loadError || (!isLoading && !booking)) && (
          <div className="bg-white border border-red-200 rounded-2xl p-8 text-center shadow-sm">
            <p className="text-red-600 font-medium mb-1">Buchung nicht gefunden</p>
            <p className="text-sm text-gray-400">Bitte überprüfe den Link in deiner E-Mail.</p>
          </div>
        )}

        {/* Already cancelled */}
        {booking && alreadyCancelled && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-800 px-6 py-7 text-center">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white">Bereits storniert</h1>
              <p className="text-gray-300 text-sm mt-1">Diese Buchung wurde bereits storniert.</p>
            </div>
          </div>
        )}

        {/* Success */}
        {uiState === 'success' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-green-500 px-6 py-7 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white">Buchung storniert</h1>
              <p className="text-green-100 text-sm mt-1">Du erhältst eine Bestätigung per E-Mail.</p>
            </div>
            <div className="px-6 py-5 text-center">
              <p className="text-sm text-gray-500">
                Falls eine Zahlung erfolgt ist, wird die Rückerstattung innerhalb von 5–10 Werktagen gutgeschrieben.
              </p>
            </div>
          </div>
        )}

        {/* Error state */}
        {uiState === 'error' && (
          <div className="bg-white rounded-2xl shadow-sm border border-red-200 overflow-hidden">
            <div className="bg-red-500 px-6 py-7 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white">Stornierung fehlgeschlagen</h1>
            </div>
            <div className="px-6 py-5 text-center">
              <p className="text-sm text-gray-600">{errorMsg}</p>
              <button
                onClick={() => setUiState('idle')}
                className="mt-4 text-sm text-gray-500 underline"
              >
                Zurück
              </button>
            </div>
          </div>
        )}

        {/* Main confirm card — shown when booking loaded, not yet cancelled, not yet actioned */}
        {booking && !alreadyCancelled && uiState !== 'success' && uiState !== 'error' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

            {/* Header */}
            <div className="bg-gray-900 px-6 py-7 text-center">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white">Buchung stornieren</h1>
              <p className="text-gray-300 text-sm mt-1">{booking.businessName}</p>
            </div>

            {/* Booking summary */}
            <div className="px-5 py-5 sm:px-8 sm:py-6 space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Leistung</span>
                  <span className="font-medium text-gray-900">{booking.serviceName}</span>
                </div>
                <div className="border-t border-gray-100" />
                <div className="flex justify-between">
                  <span className="text-gray-500">Mitarbeiter</span>
                  <span className="text-gray-700">{booking.staffName}</span>
                </div>
                <div className="border-t border-gray-100" />
                <div className="flex justify-between">
                  <span className="text-gray-500">Termin</span>
                  <span className="text-gray-700 text-right max-w-[55%]">{formatDate(booking.startTime)}</span>
                </div>
                <div className="border-t border-gray-100" />
                <div className="flex justify-between">
                  <span className="text-gray-500">Betrag</span>
                  <span className="font-bold text-gray-900">CHF {booking.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {booking.totalAmount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
                  Wurde bereits bezahlt? Die Rückerstattung erfolgt innerhalb von 5–10 Werktagen.
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="px-5 pb-6 pt-2 sm:px-8 sm:pb-8 space-y-2">
              {uiState === 'confirming' ? (
                <>
                  <p className="text-sm text-center text-gray-600 font-medium mb-3">
                    Buchung wirklich stornieren?
                  </p>
                  <button
                    onClick={() => cancelMutation.mutate()}
                    disabled={cancelMutation.isPending}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  >
                    {cancelMutation.isPending ? 'Wird storniert…' : 'Ja, Buchung stornieren'}
                  </button>
                  <button
                    onClick={() => setUiState('idle')}
                    className="w-full border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Abbrechen
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setUiState('confirming')}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  >
                    Buchung stornieren
                  </button>
                  <a
                    href="/"
                    className="w-full flex items-center justify-center border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Zurück zur Startseite
                  </a>
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
