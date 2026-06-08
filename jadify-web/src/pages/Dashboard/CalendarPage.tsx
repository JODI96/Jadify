import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { bookingApi, staffOwnerApi, type BookingResponse } from '../../api'
import { useAuth } from '../../store/authStore'

const START_HOUR = 0
const END_HOUR = 24
const HOUR_HEIGHT = 64

const STATUS_BAR: Record<string, string> = {
  Confirmed: 'bg-green-500',
  Pending:   'bg-amber-400',
  Cancelled: 'bg-red-400',
  Completed: 'bg-gray-400',
}
const STATUS_BG: Record<string, string> = {
  Confirmed: 'bg-green-50 border-green-200 hover:border-green-400',
  Pending:   'bg-amber-50 border-amber-200 hover:border-amber-400',
  Cancelled: 'bg-red-50 border-red-200 opacity-60',
  Completed: 'bg-gray-50 border-gray-200',
}
const STATUS_TEXT: Record<string, string> = {
  Confirmed: 'text-green-800',
  Pending:   'text-amber-800',
  Cancelled: 'text-red-700',
  Completed: 'text-gray-600',
}
const STATUS_LABEL: Record<string, string> = {
  Confirmed: 'Bestätigt',
  Pending:   'Ausstehend',
  Cancelled: 'Storniert',
  Completed: 'Abgeschlossen',
}
const STATUS_BADGE: Record<string, string> = {
  Confirmed: 'bg-green-100 text-green-700',
  Pending:   'bg-amber-100 text-amber-700',
  Cancelled: 'bg-red-100 text-red-700',
  Completed: 'bg-gray-100 text-gray-600',
}

const DAY_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

function getMonday(d: Date): Date {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const m = new Date(d)
  m.setDate(d.getDate() + diff)
  m.setHours(0, 0, 0, 0)
  return m
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })
}

function fmtDate(d: Date) {
  return d.toLocaleDateString('de-CH', { day: 'numeric', month: 'short' })
}

function fmtDateLong(iso: string) {
  return new Date(iso).toLocaleString('de-CH', {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  })
}

const GRID_MINUTES = (END_HOUR - START_HOUR) * 60

function eventStyle(b: BookingResponse): { top: number; height: number } | null {
  const start = new Date(b.startTime)
  const end = new Date(b.endTime)
  const startMin = (start.getHours() - START_HOUR) * 60 + start.getMinutes()
  const endMin   = (end.getHours()   - START_HOUR) * 60 + end.getMinutes()
  // booking is entirely outside the visible grid
  if (endMin <= 0 || startMin >= GRID_MINUTES) return null
  const clampedStart = Math.max(startMin, 0)
  const clampedEnd   = Math.min(endMin,   GRID_MINUTES)
  const top    = (clampedStart / 60) * HOUR_HEIGHT
  const height = Math.max(((clampedEnd - clampedStart) / 60) * HOUR_HEIGHT, 20)
  return { top, height }
}

// ── Edit modal ──────────────────────────────────────────────────────────────
function BookingModal({ booking, onClose }: { booking: BookingResponse; onClose: () => void }) {
  const qc = useQueryClient()
  const confirm = useMutation({
    mutationFn: () => bookingApi.confirm(booking.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bookings'] }); onClose() },
  })
  const cancel = useMutation({
    mutationFn: () => bookingApi.cancel(booking.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bookings'] }); onClose() },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Status bar accent */}
        <div className={`h-1 w-full ${STATUS_BAR[booking.status] ?? 'bg-gray-300'}`} />

        <div className="p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{booking.customerName}</h2>
              <p className="text-sm text-gray-400 mt-0.5">{booking.customerEmail}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_BADGE[booking.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {STATUS_LABEL[booking.status] ?? booking.status}
              </span>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <Row label="Datum & Uhrzeit" value={fmtDateLong(booking.startTime)} />
            <Row label="Ende" value={fmtTime(booking.endTime)} />
            <Row label="Dienstleistung" value={booking.serviceName} />
            <Row label="Mitarbeiter" value={booking.staffName} />
            <Row label="Betrag" value={`CHF ${booking.totalAmount.toFixed(2)}`} bold />
            {booking.notes && <Row label="Notizen" value={booking.notes} />}
          </div>

          {(booking.status === 'Pending' || booking.status === 'Confirmed') && (
            <div className="flex gap-2 mt-6 pt-5 border-t border-gray-100">
              {booking.status === 'Pending' && (
                <button
                  onClick={() => confirm.mutate()}
                  disabled={confirm.isPending || cancel.isPending}
                  className="flex-1 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  {confirm.isPending ? 'Wird bestätigt…' : 'Bestätigen'}
                </button>
              )}
              <button
                onClick={() => cancel.mutate()}
                disabled={confirm.isPending || cancel.isPending}
                className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-xl hover:border-red-300 hover:text-red-600 disabled:opacity-50 transition-colors"
              >
                {cancel.isPending ? 'Wird storniert…' : 'Stornieren'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-gray-400 shrink-0 pt-0.5">{label}</span>
      <span className={`text-sm text-right ${bold ? 'font-bold text-gray-900' : 'text-gray-700'}`}>{value}</span>
    </div>
  )
}

// ── Main calendar ───────────────────────────────────────────────────────────
export function CalendarPage() {
  const { businessId } = useAuth()
  const [weekStart, setWeekStart] = useState<Date>(getMonday(new Date()))
  const [staffFilter, setStaffFilter] = useState<string>('all')
  const [editBooking, setEditBooking] = useState<BookingResponse | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const qc = useQueryClient()

  const { data: allBookings = [], isLoading, isError, error } = useQuery({
    queryKey: ['bookings', businessId],
    queryFn: () => bookingApi.forBusiness(businessId!),
    enabled: !!businessId,
  })

  const { data: staffList = [] } = useQuery({
    queryKey: ['staff', businessId],
    queryFn: () => staffOwnerApi.list(businessId!),
    enabled: !!businessId,
  })

  useEffect(() => {
    if (!isLoading && scrollRef.current) {
      scrollRef.current.scrollTop = 8 * HOUR_HEIGHT
    }
  }, [isLoading])

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)

  const bookings = staffFilter === 'all'
    ? allBookings
    : allBookings.filter(b => {
        const s = staffList.find(st => st.id === staffFilter)
        return s ? b.staffName === s.name : true
      })

  const weekLabel = `${fmtDate(days[0])} – ${fmtDate(days[6])} ${days[0].getFullYear()}`

  const isToday = (d: Date) => isSameDay(d, new Date())

  function goToday() {
    setWeekStart(getMonday(new Date()))
  }
  function prev() {
    const d = new Date(weekStart)
    d.setDate(d.getDate() - 7)
    setWeekStart(d)
  }
  function next() {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 7)
    setWeekStart(d)
  }

  // Reload bookings when modal closes after mutation
  function handleModalClose() {
    setEditBooking(null)
    qc.invalidateQueries({ queryKey: ['bookings', businessId] })
  }

  return (
    <div>

      {/* ── Controls ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 md:px-8 md:py-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-gray-900 leading-none">Kalender</h1>
          <p className="text-xs text-gray-400 mt-0.5">{weekLabel}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={staffFilter}
            onChange={e => setStaffFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:border-gray-400"
          >
            <option value="all">Alle Mitarbeiter</option>
            {staffList.filter(s => s.isActive).map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <div className="flex items-center gap-1">
            <button onClick={prev} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <ChevronLeft size={16} className="text-gray-600" />
            </button>
            <button onClick={goToday} className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors">
              Heute
            </button>
            <button onClick={next} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Scrollable body ─ capped at 600px so scroll always has content ──────── */}
      <div ref={scrollRef} className="overflow-auto border-b border-gray-100" style={{ height: 'min(600px, calc(100vh - 200px))' }}>
        <div className="min-w-[600px]">

          {/* Day headers — sticky inside this scroll container */}
          <div className="sticky top-0 z-10 flex bg-white border-b border-gray-100">
            <div className="w-12 md:w-16 shrink-0" />
            {days.map((day, i) => (
              <div key={i} className="flex-1 py-3 text-center border-l border-gray-100">
                <p className={`text-[11px] font-semibold uppercase tracking-wide mb-0.5
                  ${isToday(day) ? 'text-green-600' : 'text-gray-400'}`}>
                  {DAY_SHORT[i]}
                </p>
                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
                  ${isToday(day) ? 'bg-green-600 text-white' : 'text-gray-800'}`}>
                  {day.getDate()}
                </span>
              </div>
            ))}
          </div>

          {/* Time grid */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
              Wird geladen…
            </div>
          ) : isError ? (
            <div className="m-4 bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-red-700">
              <p className="font-semibold mb-1">Buchungen konnten nicht geladen werden</p>
              <p className="text-red-500 font-mono text-xs break-all">{(error as Error)?.message}</p>
            </div>
          ) : (
            <div className="flex bg-white">

              {/* Time labels */}
              <div
                className="w-12 md:w-16 shrink-0 relative"
                style={{ height: (END_HOUR - START_HOUR) * HOUR_HEIGHT }}
              >
                {hours.map(h => (
                  <div
                    key={h}
                    className="absolute w-full flex items-start justify-end pr-2 md:pr-3"
                    style={{ top: (h - START_HOUR) * HOUR_HEIGHT - 7 }}
                  >
                    <span className="text-[11px] text-gray-300 font-medium tabular-nums">
                      {String(h).padStart(2, '0')}:00
                    </span>
                  </div>
                ))}
              </div>

              {/* Day columns */}
              <div className="flex-1 grid grid-cols-7">
                {days.map((day, di) => {
                  const dayBookings = bookings.filter(b => isSameDay(new Date(b.startTime), day))
                  return (
                    <div
                      key={di}
                      className="relative border-l border-gray-100 overflow-hidden"
                      style={{ height: (END_HOUR - START_HOUR) * HOUR_HEIGHT }}
                    >
                      {hours.map(h => (
                        <div
                          key={h}
                          className="absolute inset-x-0 border-t border-gray-100"
                          style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
                        />
                      ))}
                      {hours.map(h => (
                        <div
                          key={`hh-${h}`}
                          className="absolute inset-x-0 border-t border-gray-50"
                          style={{ top: (h - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
                        />
                      ))}

                      {isToday(day) && (
                        <div className="absolute inset-0 bg-green-50/40 pointer-events-none" />
                      )}

                      {dayBookings.map(b => {
                        const ev = eventStyle(b)
                        if (!ev) return null
                        const short = ev.height < 40
                        return (
                          <button
                            key={b.id}
                            onClick={() => setEditBooking(b)}
                            className={`absolute inset-x-1 border rounded-md text-left overflow-hidden transition-shadow hover:shadow-md cursor-pointer
                              ${STATUS_BG[b.status] ?? 'bg-gray-50 border-gray-200'}`}
                            style={{ top: ev.top, height: ev.height }}
                          >
                            <div className={`w-1 h-full absolute left-0 top-0 rounded-l-md ${STATUS_BAR[b.status] ?? 'bg-gray-300'}`} />
                            <div className={`pl-2 pr-1 py-1 ${STATUS_TEXT[b.status] ?? 'text-gray-700'}`}>
                              {short ? (
                                <p className="text-[10px] font-semibold truncate leading-tight">
                                  {fmtTime(b.startTime)} {b.customerName}
                                </p>
                              ) : (
                                <>
                                  <p className="text-[10px] font-bold truncate leading-tight">{b.customerName}</p>
                                  <p className="text-[10px] truncate leading-tight opacity-70">{b.serviceName}</p>
                                  {ev.height >= 52 && (
                                    <p className="text-[10px] opacity-60 leading-tight">{fmtTime(b.startTime)}–{fmtTime(b.endTime)}</p>
                                  )}
                                </>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Legend ───────────────────────────────────────────────────────────── */}
      <div className="px-4 py-2 md:px-8 border-t border-gray-100 bg-white flex items-center gap-4 flex-wrap">
        {Object.entries(STATUS_LABEL).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${STATUS_BAR[k]}`} />
            <span className="text-xs text-gray-500">{v}</span>
          </div>
        ))}
        <div className="ml-auto text-xs text-gray-400">
          {bookings.length} Buchungen diese Woche
        </div>
      </div>

      {editBooking && (
        <BookingModal booking={editBooking} onClose={handleModalClose} />
      )}
    </div>
  )
}
