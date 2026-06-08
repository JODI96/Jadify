import { useEffect, useRef, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { bookingApi, type BusinessPublicResponse } from '../../api'
import type { BookingState } from './index'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '')

interface Props {
  state: BookingState
  business: BusinessPublicResponse
  onBookingCreated: (bookingId: string, clientSecret: string | null) => void
  onComplete: () => void
  onBack: () => void
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('de-CH', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export function StepPayment(props: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const called = useRef(false)

  // Step 1: get a PaymentIntent from backend (no booking saved yet)
  useEffect(() => {
    if (called.current) return
    called.current = true
    bookingApi
      .createIntent({
        businessId: props.business.id,
        staffId: props.state.staff?.id,
        serviceId: props.state.service!.id,
        startTime: props.state.startTime!,
      })
      .then(r => setClientSecret(r.clientSecret))
      .catch(err => setLoadError(err.message ?? 'Fehler beim Laden'))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Wird vorbereitet…</div>
  }

  if (loadError) {
    return (
      <div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700">
          {loadError}
        </div>
        <button onClick={props.onBack} className="text-sm text-gray-500 hover:text-gray-700 underline">
          ← Zurück
        </button>
      </div>
    )
  }

  if (!clientSecret) return null

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentForm
        state={props.state}
        business={props.business}
        onBookingCreated={props.onBookingCreated}
        onComplete={props.onComplete}
        onBack={props.onBack}
      />
    </Elements>
  )
}

function PaymentForm({
  state,
  business,
  onBookingCreated,
  onComplete,
  onBack,
}: {
  state: BookingState
  business: BusinessPublicResponse
  onBookingCreated: (bookingId: string, clientSecret: string | null) => void
  onComplete: () => void
  onBack: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [elementReady, setElementReady] = useState(false)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)

  async function handlePay(ev: React.FormEvent) {
    ev.preventDefault()
    if (!stripe || !elements) return
    setPaying(true)
    setPayError(null)

    // Save booking details before redirect so we can restore them after
    sessionStorage.setItem('jadify_pending_booking', JSON.stringify({
      businessId: business.id,
      staffId: state.staff?.id,
      serviceId: state.service!.id,
      startTime: state.startTime!,
      customerName: state.customerName,
      customerEmail: state.customerEmail,
      customerPhone: state.customerPhone || undefined,
      notes: state.notes || undefined,
    }))

    // Step 2: confirm payment — may redirect for TWINT/3DS
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/book/${business.slug}/payment-complete`,
      },
      redirect: 'if_required',
    })

    if (error) {
      sessionStorage.removeItem('jadify_pending_booking')
      setPayError(error.message ?? 'Zahlung fehlgeschlagen')
      setPaying(false)
      return
    }

    // Payment succeeded without redirect — create booking directly
    await createBooking(paymentIntent?.id)
  }

  async function createBooking(paymentIntentId?: string) {
    const raw = sessionStorage.getItem('jadify_pending_booking')
    if (!raw) return
    const details = JSON.parse(raw)
    sessionStorage.removeItem('jadify_pending_booking')

    try {
      const booking = await bookingApi.create({ ...details, paymentIntentId })
      onBookingCreated(booking.id, null)
      onComplete()
    } catch (err: unknown) {
      let msg = 'Buchung konnte nicht gespeichert werden'
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message)
          msg = parsed.detail ?? parsed.title ?? err.message
        } catch {
          msg = err.message
        }
      }
      setPayError(msg)
      setPaying(false)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Zahlung</h2>

      {/* Order summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-5 text-sm">
        <div className="flex justify-between text-gray-700">
          <span>{state.service?.name}</span>
          <span className="font-medium">CHF {state.service?.price.toFixed(2)}</span>
        </div>
        <div className="text-gray-500 mt-0.5">
          {state.startTime && formatDateTime(state.startTime)} · {state.staff?.name ?? 'Beliebig'}
        </div>
        <div className="text-gray-500">{state.customerName}</div>
      </div>

      <form onSubmit={handlePay} className="grid gap-4">
        <PaymentElement onReady={() => setElementReady(true)} />
        {payError && <p className="text-red-600 text-sm">{payError}</p>}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={paying}
            className="text-sm text-gray-500 hover:text-gray-700 underline disabled:opacity-50"
          >
            ← Zurück
          </button>
          <button
            type="submit"
            disabled={!stripe || !elementReady || paying}
            className="flex-1 bg-gray-900 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:opacity-60 transition-colors"
          >
            {paying ? 'Wird verarbeitet…' : `CHF ${state.service?.price.toFixed(2)} bezahlen`}
          </button>
        </div>
      </form>
    </div>
  )
}
