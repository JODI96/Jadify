import { useReducer } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { businessApi, type BusinessPublicResponse, type ServiceItem, type StaffItem } from '../../api'
import { StepStaff } from './StepStaff'
import { StepService } from './StepService'
import { StepSlot } from './StepSlot'
import { StepCustomer } from './StepCustomer'
import { StepPayment } from './StepPayment'
import { StepConfirmation } from './StepConfirmation'

export type BookingStep = 'staff' | 'service' | 'slot' | 'customer' | 'payment' | 'confirmation'

export interface BookingState {
  step: BookingStep
  staff: StaffItem | null       // null = "Beliebig"
  service: ServiceItem | null
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
  | { type: 'SELECT_STAFF'; staff: StaffItem | null }
  | { type: 'SELECT_SERVICE'; service: ServiceItem }
  | { type: 'SELECT_SLOT'; startTime: string; endTime: string }
  | { type: 'SUBMIT_CUSTOMER'; name: string; email: string; phone: string; notes: string }
  | { type: 'BOOKING_CREATED'; bookingId: string; clientSecret: string | null }
  | { type: 'PAYMENT_COMPLETE' }
  | { type: 'BACK' }

const stepOrder: BookingStep[] = ['staff', 'service', 'slot', 'customer', 'payment', 'confirmation']

function reducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'SELECT_STAFF':
      return { ...state, step: 'service', staff: action.staff, service: null, startTime: null }
    case 'SELECT_SERVICE':
      return { ...state, step: 'slot', service: action.service, startTime: null }
    case 'SELECT_SLOT':
      return { ...state, step: 'customer', startTime: action.startTime, endTime: action.endTime }
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
  step: 'staff',
  staff: null,
  service: null,
  startTime: null,
  endTime: null,
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  notes: '',
  bookingId: null,
  clientSecret: null,
}

const STEP_LABELS: Record<Exclude<BookingStep, 'confirmation'>, string> = {
  staff:    'Mitarbeiter',
  service:  'Leistung',
  slot:     'Datum & Zeit',
  customer: 'Angaben',
  payment:  'Zahlung',
}

const progressSteps = stepOrder.filter(s => s !== 'confirmation') as Array<Exclude<BookingStep, 'confirmation'>>

function StepContent({
  state,
  dispatch,
  business,
}: {
  state: BookingState
  dispatch: React.Dispatch<BookingAction>
  business: BusinessPublicResponse
}) {
  switch (state.step) {
    case 'staff':
      return (
        <StepStaff
          staff={business.staff}
          onSelect={staff => dispatch({ type: 'SELECT_STAFF', staff })}
        />
      )
    case 'service':
      return (
        <StepService
          services={business.services}
          selectedStaff={state.staff}
          onSelect={service => dispatch({ type: 'SELECT_SERVICE', service })}
          onBack={() => dispatch({ type: 'BACK' })}
        />
      )
    case 'slot':
      return state.service ? (
        <StepSlot
          business={business}
          service={state.service}
          staff={state.staff}
          onSelect={(startTime, endTime) => dispatch({ type: 'SELECT_SLOT', startTime, endTime })}
          onBack={() => dispatch({ type: 'BACK' })}
        />
      ) : null
    case 'customer':
      return (
        <StepCustomer
          state={state}
          onSubmit={(name, email, phone, notes) =>
            dispatch({ type: 'SUBMIT_CUSTOMER', name, email, phone, notes })}
          onBack={() => dispatch({ type: 'BACK' })}
        />
      )
    case 'payment':
      return (state.service && state.startTime) ? (
        <StepPayment
          state={state}
          business={business}
          onBookingCreated={(bookingId, clientSecret) =>
            dispatch({ type: 'BOOKING_CREATED', bookingId, clientSecret })}
          onComplete={() => dispatch({ type: 'PAYMENT_COMPLETE' })}
          onBack={() => dispatch({ type: 'BACK' })}
        />
      ) : null
    case 'confirmation':
      return <StepConfirmation state={state} business={business} />
    default:
      return null
  }
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

  const currentIdx = progressSteps.indexOf(state.step as Exclude<BookingStep, 'confirmation'>)

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
        <div className="bg-white border-b border-gray-100 px-4 py-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center">
              {progressSteps.map((s, i) => (
                <div key={s} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full transition-colors ${
                      i < currentIdx ? 'bg-gray-900'
                        : i === currentIdx ? 'bg-gray-900'
                        : 'bg-gray-200'
                    }`} />
                    <span className={`text-xs mt-1.5 font-medium hidden sm:block whitespace-nowrap ${
                      i === currentIdx ? 'text-gray-900' : i < currentIdx ? 'text-gray-400' : 'text-gray-300'
                    }`}>
                      {STEP_LABELS[s]}
                    </span>
                  </div>
                  {i < progressSteps.length - 1 && (
                    <div className={`flex-1 h-px mx-2 transition-colors ${i < currentIdx ? 'bg-gray-900' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step content */}
      <main className="max-w-2xl mx-auto px-4 py-6 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={state.step}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
          >
            <StepContent state={state} dispatch={dispatch} business={business} />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
