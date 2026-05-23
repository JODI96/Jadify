import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { availabilityApi, type BusinessPublicResponse, type ServiceItem, type StaffItem, type TimeSlot } from '../../api'

interface Props {
  business: BusinessPublicResponse
  service: ServiceItem
  onSelect: (staff: StaffItem, startTime: string, endTime: string) => void
  onBack: () => void
}

function toDateInputValue(d: Date) {
  return d.toISOString().split('T')[0]
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function StepSlot({ business, service, onSelect, onBack }: Props) {
  const today = toDateInputValue(new Date())
  const [selectedDate, setSelectedDate] = useState(today)
  const [selectedStaff, setSelectedStaff] = useState<StaffItem | null>(
    business.staff.length === 1 ? business.staff[0] : null
  )

  const { data: slots, isLoading } = useQuery({
    queryKey: ['slots', business.id, selectedStaff?.id, service.id, selectedDate],
    queryFn: () =>
      availabilityApi.getSlots({
        businessId: business.id,
        staffId: selectedStaff?.id,
        serviceId: service.id,
        date: selectedDate,
      }),
    enabled: !!selectedDate,
  })

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Datum & Zeit wählen</h2>
      <p className="text-sm text-gray-500 mb-4">
        {service.name} · {service.durationMinutes} min · CHF {service.price.toFixed(2)}
      </p>

      {/* Staff selector */}
      {business.staff.length > 1 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Mitarbeiter</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedStaff(null)}
              className={`px-3 py-1.5 rounded-lg border text-sm transition-colors
                ${!selectedStaff ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              Beliebig
            </button>
            {business.staff.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedStaff(s)}
                className={`px-3 py-1.5 rounded-lg border text-sm transition-colors
                  ${selectedStaff?.id === s.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Date picker */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Datum</label>
        <input
          type="date"
          min={today}
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {selectedDate && (
          <p className="text-sm text-gray-500 mt-1">{formatDate(selectedDate + 'T12:00:00')}</p>
        )}
      </div>

      {/* Time slots */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Verfügbare Zeiten</label>
        {isLoading && <p className="text-sm text-gray-400">Wird geladen…</p>}
        {!isLoading && slots?.length === 0 && (
          <p className="text-sm text-gray-500">Kein freier Termin an diesem Tag. Bitte anderen Tag wählen.</p>
        )}
        {!isLoading && slots && slots.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {slots.map((slot: TimeSlot) => {
              const staff = selectedStaff ?? business.staff[0]
              return (
                <button
                  key={slot.start}
                  onClick={() => onSelect(staff, slot.start, slot.end)}
                  className="border border-gray-200 rounded-lg py-2 text-sm font-medium text-gray-700
                    hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                >
                  {formatTime(slot.start)}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 underline">
        ← Zurück
      </button>
    </div>
  )
}
