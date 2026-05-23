import { useEffect, useState } from 'react'
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
  const [clientSecret, setClientSecret] = useState<string | null>(props.state.clientSecret)
  const [bookingId, setBookingId] = useState<string | null>(props.state.bookingId)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  useEffect(() => {
    if (bookingId) return
    setCreating(true)
    bookingApi
      .create({
        businessId: props.business.id,
        staffId: props.state.staff!.id,
        serviceId: props.state.service!.id,
        startTime: props.state.startTime!,
        customerName: props.state.customerName,
        customerEmail: props.state.customerEmail,
        customerPhone: props.state.customerPhone || undefined,
        notes: props.state.notes || undefined,
      })
      .then(booking => {
        setBookingId(booking.id)
        setClientSecret(booking.clientSecret ?? null)
        props.onBookingCreated(booking.id, booking.clientSecret ?? null)
      })
      .catch(err => setCreateError(err.message))
      .finally(() => setCreating(false))
  // run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (creating) {
    return (
      <div className="text-center py-12 text-gray-500">Buchung wird erstellt…</div>
    )
  }

  if (createError) {
    return (
      <div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700">
          {createError}
        </div>
        <button onClick={props.onBack} className="text-sm text-gray-500 hover:text-gray-700 underline">
          ← Zurück
        </button>
      </div>
    )
  }

  if (!clientSecret) {
    return (
      <div>
        <p className="text-sm text-gray-600 mb-4">Buchung erstellt — keine Zahlung erforderlich.</p>
        <button
          onClick={props.onComplete}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Buchung bestätigen
        </button>
      </div>
    )
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentForm
        state={props.state}
        clientSecret={clientSecret}
        onComplete={props.onComplete}
        onBack={props.onBack}
      />
    </Elements>
  )
}

function PaymentForm({
  state,
  onComplete,
  onBack,
}: {
  state: BookingState
  clientSecret: string
  onComplete: () => void
  onBack: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)

  async function handlePay(ev: React.FormEvent) {
    ev.preventDefault()
    if (!stripe || !elements) return
    setPaying(true)
    setPayError(null)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    })

    if (error) {
      setPayError(error.message ?? 'Payment failed')
      setPaying(false)
    } else {
      onComplete()
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
          {state.startTime && formatDateTime(state.startTime)} · {state.staff?.name}
        </div>
        <div className="text-gray-500">{state.customerName}</div>
      </div>

      <form onSubmit={handlePay} className="grid gap-4">
        <PaymentElement />
        {payError && (
          <p className="text-red-600 text-sm">{payError}</p>
        )}
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
            disabled={!stripe || paying}
            className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {paying ? 'Wird verarbeitet…' : `CHF ${state.service?.price.toFixed(2)} bezahlen`}
          </button>
        </div>
      </form>
    </div>
  )
}
