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
      <h2 className="text-xl font-bold text-gray-900 tracking-tight mb-1">Leistung wählen</h2>
      <p className="text-sm text-gray-500 mb-5">
        {selectedStaff ? `Leistungen von ${selectedStaff.name}` : 'Alle verfügbaren Leistungen'}
      </p>

      {visible.length === 0 && (
        <p className="text-gray-500 text-sm py-4">Momentan keine Leistungen verfügbar.</p>
      )}

      <div className="grid gap-2 mb-6">
        {visible.map(service => (
          <button
            key={service.id}
            onClick={() => onSelect(service)}
            className="w-full text-left bg-white border border-gray-200 rounded-xl p-4
              hover:border-gray-900 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 group"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-900 text-sm">{service.name}</p>
                {service.description && (
                  <p className="text-xs text-gray-400 mt-0.5">{service.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">{service.durationMinutes} min</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-base font-black text-gray-900">
                  CHF {service.price.toFixed(2)}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
        ← Zurück
      </button>
    </div>
  )
}
