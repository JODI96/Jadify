import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookingApi, type BookingResponse } from '../../api'
import { useAuth } from '../../store/authStore'

const STATUSES = ['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled']

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('de-CH', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

function statusBadge(status: string) {
  const classes: Record<string, string> = {
    Confirmed: 'bg-green-100 text-green-700',
    Pending:   'bg-yellow-100 text-yellow-700',
    Cancelled: 'bg-red-100 text-red-700',
    Completed: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${classes[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

export function BookingsPage() {
  const { businessId } = useAuth()
  const [filter, setFilter] = useState('All')
  const qc = useQueryClient()

  const { data: bookings = [], isLoading } = useQuery({
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
    <div className="px-8 py-8 max-w-5xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Bookings</h1>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 flex-wrap">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors
              ${filter === s ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="text-center text-gray-400 py-12">Loading…</div>
      )}

      {!isLoading && sorted.length === 0 && (
        <div className="text-center text-gray-400 py-12 bg-white border border-gray-200 rounded-xl">
          No bookings found
        </div>
      )}

      {!isLoading && sorted.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                  <th className="px-5 py-3 text-left font-medium">Date</th>
                  <th className="px-5 py-3 text-left font-medium">Customer</th>
                  <th className="px-5 py-3 text-left font-medium">Service</th>
                  <th className="px-5 py-3 text-left font-medium">Staff</th>
                  <th className="px-5 py-3 text-right font-medium">Amount</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="px-5 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sorted.map((b: BookingResponse) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 whitespace-nowrap text-gray-700">
                      {formatDateTime(b.startTime)}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{b.customerName}</p>
                      <p className="text-xs text-gray-400">{b.customerEmail}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-700">{b.serviceName}</td>
                    <td className="px-5 py-3 text-gray-700">{b.staffName}</td>
                    <td className="px-5 py-3 text-right font-medium text-gray-900">
                      CHF {b.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-5 py-3">{statusBadge(b.status)}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        {b.status === 'Pending' && (
                          <button
                            onClick={() => confirm.mutate(b.id)}
                            disabled={confirm.isPending}
                            className="text-xs px-2.5 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            Confirm
                          </button>
                        )}
                        {(b.status === 'Pending' || b.status === 'Confirmed') && (
                          <button
                            onClick={() => cancel.mutate(b.id)}
                            disabled={cancel.isPending}
                            className="text-xs px-2.5 py-1 border border-gray-200 text-gray-600 rounded-lg hover:border-red-300 hover:text-red-600 disabled:opacity-50 transition-colors"
                          >
                            Cancel
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
      )}
    </div>
  )
}
