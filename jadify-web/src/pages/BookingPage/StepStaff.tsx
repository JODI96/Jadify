import type { StaffItem } from '../../api'

interface Props {
  staff: StaffItem[]
  onSelect: (staff: StaffItem | null) => void
}

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

function Avatar({ name, avatarUrl, size = 72 }: { name: string; avatarUrl?: string; size?: number }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover"
      />
    )
  }
  const colors = [
    'bg-indigo-500', 'bg-violet-500', 'bg-pink-500',
    'bg-teal-500', 'bg-orange-500', 'bg-cyan-500',
  ]
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div
      style={{ width: size, height: size }}
      className={`${color} rounded-full flex items-center justify-center text-white font-semibold`}
      style2={{ fontSize: size * 0.35 }}
    >
      <span style={{ fontSize: size * 0.35 }}>{initials(name)}</span>
    </div>
  )
}

export function StepStaff({ staff, onSelect }: Props) {
  const active = staff.filter(s => (s as unknown as { isActive?: boolean }).isActive !== false)

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Mitarbeiter wählen</h2>
      <p className="text-sm text-gray-500 mb-5">
        Wähle eine Person oder lass uns den nächsten freien Mitarbeiter finden.
      </p>

      <div className="grid gap-3">
        {/* "Any" card */}
        <button
          onClick={() => onSelect(null)}
          className="w-full text-left bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4
            hover:border-indigo-400 hover:shadow-sm transition-all group flex items-center gap-4"
        >
          <div className="w-[72px] h-[72px] rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
            <span className="text-2xl">✦</span>
          </div>
          <div>
            <p className="font-semibold text-indigo-800 text-base group-hover:text-indigo-900">Beliebig</p>
            <p className="text-sm text-indigo-600 mt-0.5">Nächsten freien Termin buchen</p>
          </div>
        </button>

        {/* Individual staff cards */}
        {active.map(member => (
          <button
            key={member.id}
            onClick={() => onSelect(member)}
            className="w-full text-left bg-white border border-gray-200 rounded-xl p-4
              hover:border-indigo-400 hover:shadow-sm transition-all group flex items-center gap-4"
          >
            <div className="shrink-0">
              <Avatar name={member.name} avatarUrl={member.avatarUrl} size={72} />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-gray-900 text-base group-hover:text-indigo-600">
                {member.name}
              </p>
              <p className="text-sm text-gray-400 mt-0.5">
                {member.serviceIds.length === 0
                  ? 'Alle Leistungen'
                  : `${member.serviceIds.length} Leistung${member.serviceIds.length !== 1 ? 'en' : ''}`}
              </p>
            </div>
            <span className="ml-auto text-gray-300 group-hover:text-indigo-400 text-xl shrink-0">›</span>
          </button>
        ))}

        {active.length === 0 && (
          <p className="text-gray-500 text-sm">Momentan keine Mitarbeiter verfügbar.</p>
        )}
      </div>
    </div>
  )
}
