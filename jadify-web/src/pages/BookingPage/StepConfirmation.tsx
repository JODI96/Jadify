import type { BookingState } from './index'
import type { BusinessPublicResponse } from '../../api'

interface Props {
  state: BookingState
  business: BusinessPublicResponse
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('de-CH', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function StepConfirmation({ state, business }: Props) {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Booking Confirmed!</h2>
      <p className="text-gray-500 mb-6">
        A confirmation has been sent to <span className="font-medium text-gray-700">{state.customerEmail}</span>
      </p>

      <div className="bg-white border border-gray-200 rounded-xl p-5 text-left max-w-sm mx-auto">
        <dl className="grid gap-3 text-sm">
          <div>
            <dt className="text-gray-500">Business</dt>
            <dd className="font-medium text-gray-900">{business.name}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Service</dt>
            <dd className="font-medium text-gray-900">{state.service?.name}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Staff</dt>
            <dd className="font-medium text-gray-900">{state.staff?.name}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Date & Time</dt>
            <dd className="font-medium text-gray-900">
              {state.startTime && formatDateTime(state.startTime)}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Amount paid</dt>
            <dd className="font-medium text-gray-900">CHF {state.service?.price.toFixed(2)}</dd>
          </div>
        </dl>
      </div>

      <button
        onClick={() => window.location.reload()}
        className="mt-6 text-sm text-indigo-600 hover:text-indigo-800 underline"
      >
        Book another appointment
      </button>
    </div>
  )
}
