import type { ServiceItem, StaffItem } from '../../api'

interface Props {
  services: ServiceItem[]
  selectedStaff: StaffItem | null
  onSelect: (service: ServiceItem) => void
  onBack: () => void
}

export function StepService({ services, selectedStaff, onSelect, onBack }: Props) {
  const active = services.filter(s => (s as unknown as { isActive?: boolean }).isActive !== false)

  const visible = selectedStaff && selectedStaff.serviceIds.length > 0
    ? active.filter(s => selectedStaff.serviceIds.includes(s.id))
    : active

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Leistung wählen</h2>
      {selectedStaff && (
        <p className="text-sm text-gray-500 mb-4">Leistungen von {selectedStaff.name}</p>
      )}
      {!selectedStaff && (
        <p className="text-sm text-gray-500 mb-4">Alle verfügbaren Leistungen</p>
      )}

      {visible.length === 0 && (
        <p className="text-gray-500">Momentan keine Leistungen verfügbar.</p>
      )}

      <div className="grid gap-3 mb-6">
        {visible.map(service => (
          <button
            key={service.id}
            onClick={() => onSelect(service)}
            className="w-full text-left bg-white border border-gray-200 rounded-xl p-4
              hover:border-indigo-400 hover:shadow-sm transition-all group"
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

      <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 underline">
        ← Zurück
      </button>
    </div>
  )
}
