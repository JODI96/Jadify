import { useQuery } from '@tanstack/react-query'
import { dashboardApi, type UpcomingBookingItem } from '../../api'

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })
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

interface KpiCardProps {
  label: string
  value: string
  sub?: string
  subColor?: string
}

function KpiCard({ label, value, sub, subColor = 'text-gray-400' }: KpiCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      {sub && <p className={`text-xs mt-1 ${subColor}`}>{sub}</p>}
    </div>
  )
}

export function OverviewPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.get,
    refetchInterval: 60_000,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500 text-sm">
        Failed to load dashboard. Check your connection.
      </div>
    )
  }

  const growthSign = data.revenueGrowthPercent >= 0 ? '+' : ''
  const growthColor = data.revenueGrowthPercent >= 0 ? 'text-green-600' : 'text-red-500'

  return (
    <div className="px-8 py-8 max-w-5xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Overview</h1>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <KpiCard label="Today's Bookings" value={String(data.todayBookingCount)} />
        <KpiCard label="Upcoming" value={String(data.upcomingBookingCount)} />
        <KpiCard
          label="Revenue This Month"
          value={`CHF ${data.revenueThisMonth.toFixed(2)}`}
          sub={`${growthSign}${data.revenueGrowthPercent}% vs last month`}
          subColor={growthColor}
        />
        <KpiCard
          label="Last Month Revenue"
          value={`CHF ${data.revenueLastMonth.toFixed(2)}`}
        />
        <KpiCard
          label="Cancellation Rate"
          value={`${data.cancellationRatePercent}%`}
          sub="Last 30 days"
        />
        <KpiCard
          label="Total Customers"
          value={String(data.totalCustomers)}
        />
      </div>

      {/* Today's schedule */}
      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Today's Schedule</h2>
        </div>
        {data.todaySchedule.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">No bookings today</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                  <th className="px-5 py-3 text-left font-medium">Time</th>
                  <th className="px-5 py-3 text-left font-medium">Customer</th>
                  <th className="px-5 py-3 text-left font-medium">Service</th>
                  <th className="px-5 py-3 text-left font-medium">Staff</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.todaySchedule.map((item: UpcomingBookingItem) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900 whitespace-nowrap">
                      {formatTime(item.startTime)} – {formatTime(item.endTime)}
                    </td>
                    <td className="px-5 py-3 text-gray-700">{item.customerName}</td>
                    <td className="px-5 py-3 text-gray-700">{item.serviceName}</td>
                    <td className="px-5 py-3 text-gray-700">{item.staffName}</td>
                    <td className="px-5 py-3">{statusBadge(item.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
