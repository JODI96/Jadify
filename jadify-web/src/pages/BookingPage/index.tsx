import { useReducer } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { businessApi, type ServiceItem, type StaffItem } from '../../api'
import { StepService } from './StepService'
import { StepSlot } from './StepSlot'
import { StepCustomer } from './StepCustomer'
import { StepPayment } from './StepPayment'
import { StepConfirmation } from './StepConfirmation'

export type BookingStep = 'service' | 'slot' | 'customer' | 'payment' | 'confirmation'

export interface BookingState {
  step: BookingStep
  service: ServiceItem | null
  staff: StaffItem | null
  startTime: string | null
  endTime: string | null
  customerName: string
  customerEmail: string
  customerPhone: string
  notes: string
  bookingId: string | null
  clientSecret: string | null
}

type BookingAction =
  | { type: 'SELECT_SERVICE'; service: ServiceItem }
  | { type: 'SELECT_SLOT'; staff: StaffItem; startTime: string; endTime: string }
  | { type: 'SUBMIT_CUSTOMER'; name: string; email: string; phone: string; notes: string }
  | { type: 'BOOKING_CREATED'; bookingId: string; clientSecret: string | null }
  | { type: 'PAYMENT_COMPLETE' }
  | { type: 'BACK' }

const stepOrder: BookingStep[] = ['service', 'slot', 'customer', 'payment', 'confirmation']

function reducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'SELECT_SERVICE':
      return { ...state, step: 'slot', service: action.service, staff: null, startTime: null }
    case 'SELECT_SLOT':
      return { ...state, step: 'customer', staff: action.staff, startTime: action.startTime, endTime: action.endTime }
    case 'SUBMIT_CUSTOMER':
      return { ...state, step: 'payment', customerName: action.name, customerEmail: action.email, customerPhone: action.phone, notes: action.notes }
    case 'BOOKING_CREATED':
      return { ...state, bookingId: action.bookingId, clientSecret: action.clientSecret }
    case 'PAYMENT_COMPLETE':
      return { ...state, step: 'confirmation' }
    case 'BACK': {
      const idx = stepOrder.indexOf(state.step)
      return { ...state, step: stepOrder[Math.max(0, idx - 1)] }
    }
  }
}

const initial: BookingState = {
  step: 'service',
  service: null,
  staff: null,
  startTime: null,
  endTime: null,
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  notes: '',
  bookingId: null,
  clientSecret: null,
}

const STEP_LABELS: Record<BookingStep, string> = {
  service: 'Leistung',
  slot: 'Datum & Zeit',
  customer: 'Angaben',
  payment: 'Zahlung',
  confirmation: 'Bestätigt',
}

export function BookingPage() {
  const { slug } = useParams<{ slug: string }>()
  const [state, dispatch] = useReducer(reducer, initial)

  const { data: business, isLoading, error } = useQuery({
    queryKey: ['business', slug],
    queryFn: () => businessApi.getBySlug(slug!),
    enabled: !!slug,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Wird geladen…</div>
      </div>
    )
  }

  if (error || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Unternehmen nicht gefunden.</p>
        </div>
      </div>
    )
  }

  const steps = stepOrder.filter(s => s !== 'confirmation') as Array<'service' | 'slot' | 'customer' | 'payment'>
  const currentIdx = steps.indexOf(state.step as 'service' | 'slot' | 'customer' | 'payment')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          {business.logoUrl && (
            <img src={business.logoUrl} alt={business.name} className="w-10 h-10 rounded-full object-cover" />
          )}
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{business.name}</h1>
            <p className="text-sm text-gray-500">{business.address}</p>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      {state.step !== 'confirmation' && (
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-2xl mx-auto flex gap-2">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-medium
                  ${i < currentIdx ? 'bg-green-500 text-white'
                    : i === currentIdx ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-400'}`}>
                  {i < currentIdx ? '✓' : i + 1}
                </div>
                <span className={`text-sm hidden sm:block ${i === currentIdx ? 'text-indigo-600 font-medium' : 'text-gray-400'}`}>
                  {STEP_LABELS[s]}
                </span>
                {i < steps.length - 1 && <div className="flex-1 h-px bg-gray-200" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {state.step === 'service' && (
          <StepService
            services={business.services}
            onSelect={service => dispatch({ type: 'SELECT_SERVICE', service })}
          />
        )}
        {state.step === 'slot' && state.service && (
          <StepSlot
            business={business}
            service={state.service}
            onSelect={(staff, startTime, endTime) =>
              dispatch({ type: 'SELECT_SLOT', staff, startTime, endTime })}
            onBack={() => dispatch({ type: 'BACK' })}
          />
        )}
        {state.step === 'customer' && (
          <StepCustomer
            state={state}
            onSubmit={(name, email, phone, notes) =>
              dispatch({ type: 'SUBMIT_CUSTOMER', name, email, phone, notes })}
            onBack={() => dispatch({ type: 'BACK' })}
          />
        )}
        {state.step === 'payment' && state.service && state.staff && state.startTime && (
          <StepPayment
            state={state}
            business={business}
            onBookingCreated={(bookingId, clientSecret) =>
              dispatch({ type: 'BOOKING_CREATED', bookingId, clientSecret })}
            onComplete={() => dispatch({ type: 'PAYMENT_COMPLETE' })}
            onBack={() => dispatch({ type: 'BACK' })}
          />
        )}
        {state.step === 'confirmation' && (
          <StepConfirmation state={state} business={business} />
        )}
      </main>
    </div>
  )
}
