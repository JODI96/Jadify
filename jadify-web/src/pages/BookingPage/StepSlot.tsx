import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { availabilityApi, type BusinessPublicResponse, type ServiceItem, type StaffItem, type TimeSlot } from '../../api'

interface Props {
  business: BusinessPublicResponse
  service: ServiceItem
  staff: StaffItem | null
  onSelect: (startTime: string, endTime: string) => void
  onBack: () => void
}

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

function toMonday(jsDay: number) {
  // JS: 0=Sun → convert to Mon=0 … Sun=6
  return (jsDay + 6) % 7
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })
}

function formatMonthLabel(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleDateString('de-CH', { month: 'long', year: 'numeric' })
}

export function StepSlot({ business, service, staff, onSelect, onBack }: Props) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Fetch which days in the visible month have slots
  const { data: availableDates = [], isLoading: loadingDates } = useQuery({
    queryKey: ['available-dates', business.id, staff?.id, service.id, viewYear, viewMonth],
    queryFn: () =>
      availabilityApi.getAvailableDates({
        businessId: business.id,
        serviceId: service.id,
        year: viewYear,
        month: viewMonth,
        staffId: staff?.id,
      }),
  })

  const availableSet = new Set(availableDates)

  // Fetch time slots for the selected day
  const { data: slots = [], isLoading: loadingSlots } = useQuery({
    queryKey: ['slots', business.id, staff?.id, service.id, selectedDate],
    queryFn: () =>
      availabilityApi.getSlots({
        businessId: business.id,
        serviceId: service.id,
        date: selectedDate!,
        staffId: staff?.id,
      }),
    enabled: !!selectedDate,
  })

  function prevMonth() {
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12) }
    else setViewMonth(m => m - 1)
    setSelectedDate(null)
  }

  function nextMonth() {
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1) }
    else setViewMonth(m => m + 1)
    setSelectedDate(null)
  }

  // Build calendar grid
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate()
  const firstDayOfWeek = toMonday(new Date(viewYear, viewMonth - 1, 1).getDay()) // 0=Mon
  const todayStr = today.toISOString().split('T')[0]

  const calendarCells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to complete last row
  while (calendarCells.length % 7 !== 0) calendarCells.push(null)

  function dayStr(day: number) {
    return `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 tracking-tight mb-1">Datum & Zeit wählen</h2>
      <p className="text-sm text-gray-500 mb-4">
        {service.name} · {service.durationMinutes} min · CHF {service.price.toFixed(2)}
      </p>

      {/* Calendar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            ‹
          </button>
          <span className="text-sm font-semibold text-gray-800">
            {loadingDates ? '…' : formatMonthLabel(viewYear, viewMonth)}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            ›
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-y-1">
          {calendarCells.map((day, i) => {
            if (day === null) return <div key={i} />

            const ds = dayStr(day)
            const isPast = ds < todayStr
            const isAvailable = availableSet.has(ds)
            const isSelected = ds === selectedDate
            const isToday = ds === todayStr

            let cls = 'relative mx-auto flex items-center justify-center w-9 h-9 rounded-full text-sm font-medium transition-colors select-none '

            if (isSelected) {
              cls += 'bg-gray-900 text-white'
            } else if (isPast) {
              cls += 'text-gray-300 cursor-not-allowed'
            } else if (isAvailable) {
              cls += 'text-gray-800 font-semibold hover:bg-gray-100 cursor-pointer'
            } else {
              cls += 'text-gray-300 cursor-not-allowed'
            }

            return (
              <div key={i} className="flex justify-center">
                <button
                  disabled={isPast || !isAvailable}
                  onClick={() => setSelectedDate(ds)}
                  className={cls}
                >
                  {day}
                  {isToday && !isSelected && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gray-400" />
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100">
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Verfügbar
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <span className="w-3 h-3 rounded-full bg-red-300 inline-block" /> Ausgebucht/Geschlossen
          </span>
        </div>
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Verfügbare Zeiten
          </label>
          {loadingSlots && <p className="text-sm text-gray-400">Wird geladen…</p>}
          {!loadingSlots && slots.length === 0 && (
            <p className="text-sm text-gray-500">
              Kein freier Termin an diesem Tag. Bitte anderen Tag wählen.
            </p>
          )}
          {!loadingSlots && slots.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {slots.map((slot: TimeSlot) => (
                <button
                  key={slot.start}
                  onClick={() => onSelect(slot.start, slot.end)}
                  className="border border-gray-200 bg-white rounded-lg py-3 text-sm font-semibold
                    text-gray-800 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-colors"
                >
                  {formatTime(slot.start)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {!selectedDate && (
        <p className="text-sm text-gray-400 mb-6">Wähle einen Tag um die freien Zeiten zu sehen.</p>
      )}

      <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 underline">
        ← Zurück
      </button>
    </div>
  )
}
