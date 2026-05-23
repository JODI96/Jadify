import type { ServiceItem } from '../../api'

interface Props {
  services: ServiceItem[]
  onSelect: (service: ServiceItem) => void
}

export function StepService({ services, onSelect }: Props) {
  const active = services.filter(s => (s as unknown as { isActive?: boolean }).isActive !== false)

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Choose a Service</h2>
      {active.length === 0 && (
        <p className="text-gray-500">No services available at this time.</p>
      )}
      <div className="grid gap-3">
        {active.map(service => (
          <button
            key={service.id}
            onClick={() => onSelect(service)}
            className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-400 hover:shadow-sm transition-all group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-gray-900 group-hover:text-indigo-600">{service.name}</p>
                {service.description && (
                  <p className="text-sm text-gray-500 mt-0.5">{service.description}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">{service.durationMinutes} min</p>
              </div>
              <span className="font-semibold text-gray-900 text-lg">
                CHF {service.price.toFixed(2)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
