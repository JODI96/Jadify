import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookingApi, type BookingResponse } from '../../api'
import { useAuth } from '../../store/authStore'

const STATUSES = [
  { value: 'All',       label: 'Alle' },
  { value: 'Pending',   label: 'Ausstehend' },
  { value: 'Confirmed', label: 'Bestätigt' },
  { value: 'Completed', label: 'Abgeschlossen' },
  { value: 'Cancelled', label: 'Storniert' },
]

const STATUS_LABELS: Record<string, string> = {
  Confirmed: 'Bestätigt',
  Pending:   'Ausstehend',
  Cancelled: 'Storniert',
  Completed: 'Abgeschlossen',
}

const STATUS_CLASSES: Record<string, string> = {
  Confirmed: 'bg-green-100 text-green-700',
  Pending:   'bg-yellow-100 text-yellow-700',
  Cancelled: 'bg-red-100 text-red-700',
  Completed: 'bg-gray-100 text-gray-600',
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('de-CH', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASSES[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

export function BookingsPage() {
  const { businessId } = useAuth()
  const [filter, setFilter] = useState('All')
  const qc = useQueryClient()

  const { data: bookings = [], isLoading, isError, error } = useQuery({
    queryKey: ['bookings', businessId],
    queryFn: () => bookingApi.forBusiness(businessId!),
    enabled: !!businessId,
  })

  const confirm = useMutation({
    mutationFn: (id: string) => bookingApi.confirm(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  })

  const cancel = useMutation({
    mutationFn: (id: string) => bookingApi.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  })

  const visible = filter === 'All'
    ? bookings
    : bookings.filter((b: BookingResponse) => b.status === filter)

  const sorted = [...visible].sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  )

  return (
    <div className="px-4 py-4 md:px-8 md:py-8 max-w-5xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Buchungen</h1>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 flex-wrap">
        {STATUSES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors
              ${filter === value
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="text-center text-gray-400 py-12">Wird geladen…</div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-red-700">
          <p className="font-semibold mb-1">Buchungen konnten nicht geladen werden</p>
          <p className="text-red-500 font-mono text-xs break-all">{(error as Error)?.message}</p>
        </div>
      )}

      {!isLoading && !isError && sorted.length === 0 && (
        <div className="text-center text-gray-400 py-12 bg-white border border-gray-200 rounded-xl">
          Keine Buchungen gefunden
        </div>
      )}

      {!isLoading && sorted.length > 0 && (
        <>
          {/* Mobile: card list */}
          <div className="md:hidden space-y-2">
            {sorted.map((b: BookingResponse) => (
              <div key={b.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{b.customerName}</p>
                    <p className="text-xs text-gray-400 truncate">{b.customerEmail}</p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
                <p className="text-sm text-gray-700 mb-0.5">{b.serviceName} · {b.staffName}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-400">{formatDateTime(b.startTime)}</p>
                  <p className="text-sm font-bold text-gray-900">CHF {b.totalAmount.toFixed(2)}</p>
                </div>
                {(b.status === 'Pending' || b.status === 'Confirmed') && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                    {b.status === 'Pending' && (
                      <button onClick={() => confirm.mutate(b.id)} disabled={confirm.isPending}
                        className="flex-1 text-xs py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors">
                        Bestätigen
                      </button>
                    )}
                    <button onClick={() => cancel.mutate(b.id)} disabled={cancel.isPending}
                      className="flex-1 text-xs py-2 border border-gray-200 text-gray-600 rounded-lg hover:border-red-300 hover:text-red-600 disabled:opacity-50 transition-colors">
                      Stornieren
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    <th className="px-5 py-3 text-left font-medium">Datum</th>
                    <th className="px-5 py-3 text-left font-medium">Kunde</th>
                    <th className="px-5 py-3 text-left font-medium">Leistung</th>
                    <th className="px-5 py-3 text-left font-medium">Mitarbeiter</th>
                    <th className="px-5 py-3 text-right font-medium">Betrag</th>
                    <th className="px-5 py-3 text-left font-medium">Status</th>
                    <th className="px-5 py-3 text-left font-medium">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sorted.map((b: BookingResponse) => (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 whitespace-nowrap text-gray-700">{formatDateTime(b.startTime)}</td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900">{b.customerName}</p>
                        <p className="text-xs text-gray-400">{b.customerEmail}</p>
                      </td>
                      <td className="px-5 py-3 text-gray-700">{b.serviceName}</td>
                      <td className="px-5 py-3 text-gray-700">{b.staffName}</td>
                      <td className="px-5 py-3 text-right font-medium text-gray-900">CHF {b.totalAmount.toFixed(2)}</td>
                      <td className="px-5 py-3"><StatusBadge status={b.status} /></td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          {b.status === 'Pending' && (
                            <button onClick={() => confirm.mutate(b.id)} disabled={confirm.isPending}
                              className="text-xs px-2.5 py-1 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors">
                              Bestätigen
                            </button>
                          )}
                          {(b.status === 'Pending' || b.status === 'Confirmed') && (
                            <button onClick={() => cancel.mutate(b.id)} disabled={cancel.isPending}
                              className="text-xs px-2.5 py-1 border border-gray-200 text-gray-600 rounded-lg hover:border-red-300 hover:text-red-600 disabled:opacity-50 transition-colors">
                              Stornieren
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
