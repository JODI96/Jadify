import type { StaffItem } from '../../api'

interface Props {
  staff: StaffItem[]
  onSelect: (staff: StaffItem | null) => void
}

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

function Avatar({ name, avatarUrl, size = 52 }: { name: string; avatarUrl?: string; size?: number }) {
  if (avatarUrl) {
    return (
      <img src={avatarUrl} alt={name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover shrink-0" />
    )
  }
  const colors = ['bg-slate-600', 'bg-zinc-600', 'bg-stone-600', 'bg-neutral-700', 'bg-gray-700']
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div style={{ width: size, height: size }}
      className={`${color} rounded-full flex items-center justify-center text-white font-semibold shrink-0`}>
      <span style={{ fontSize: size * 0.35 }}>{initials(name)}</span>
    </div>
  )
}

export function StepStaff({ staff, onSelect }: Props) {
  const active = staff.filter(s => (s as unknown as { isActive?: boolean }).isActive !== false)

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 tracking-tight mb-1">Mitarbeiter wählen</h2>
      <p className="text-sm text-gray-500 mb-5">
        Wähle eine Person oder lass uns den nächsten freien Termin finden.
      </p>

      <div className="grid gap-2">
        <button
          onClick={() => onSelect(null)}
          className="w-full text-left bg-white border border-gray-200 rounded-xl p-4
            hover:border-gray-900 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 group flex items-center gap-4"
        >
          <div className="w-[52px] h-[52px] rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <span className="text-gray-500 text-xs font-bold">ALLE</span>
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Beliebig</p>
            <p className="text-xs text-gray-400 mt-0.5">Nächsten freien Termin buchen</p>
          </div>
          <span className="ml-auto text-gray-300 group-hover:text-gray-900 transition-colors">›</span>
        </button>

        {active.map(member => (
          <button
            key={member.id}
            onClick={() => onSelect(member)}
            className="w-full text-left bg-white border border-gray-200 rounded-xl p-4
              hover:border-gray-900 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 group flex items-center gap-4"
          >
            <Avatar name={member.name} avatarUrl={member.avatarUrl} size={52} />
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm">{member.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {member.serviceIds.length === 0
                  ? 'Alle Leistungen'
                  : `${member.serviceIds.length} Leistung${member.serviceIds.length !== 1 ? 'en' : ''}`}
              </p>
            </div>
            <span className="ml-auto text-gray-300 group-hover:text-gray-900 transition-colors shrink-0">›</span>
          </button>
        ))}

        {active.length === 0 && (
          <p className="text-gray-500 text-sm py-4">Momentan keine Mitarbeiter verfügbar.</p>
        )}
      </div>
    </div>
  )
}
