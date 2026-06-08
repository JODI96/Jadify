import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../../store/authStore'
import { staffOwnerApi, serviceOwnerApi, type StaffOwnerResponse, type ServiceOwnerResponse, type StaffHoursDto } from '../../api'

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500'

const DAY_LABELS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

function StaffAvatar({ name, avatarUrl, size = 40 }: { name: string; avatarUrl?: string; size?: number }) {
  const colors = ['bg-green-600', 'bg-green-600', 'bg-pink-500', 'bg-teal-500', 'bg-orange-500']
  const color = colors[name.charCodeAt(0) % colors.length]
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} style={{ width: size, height: size }} className="rounded-full object-cover shrink-0" />
  }
  return (
    <div style={{ width: size, height: size, fontSize: size * 0.38 }}
      className={`${color} rounded-full flex items-center justify-center text-white font-semibold shrink-0`}>
      {initials(name)}
    </div>
  )
}

// Default hours: Mon–Sat 09:00–18:00, Sun off
function defaultHours(): StaffHoursDto[] {
  return Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    startTime: '09:00',
    endTime: '18:00',
    isWorking: i !== 0,
  }))
}

function StaffHoursPanel({ staffId, onClose }: { staffId: string; onClose: () => void }) {
  const [hours, setHours] = useState<StaffHoursDto[]>(defaultHours())
  const [saved, setSaved] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['staff-hours', staffId],
    queryFn: () => staffOwnerApi.getHours(staffId),
  })

  useEffect(() => {
    if (!data) return
    if (data.length > 0) {
      // Merge loaded data into the 7-day structure
      setHours(defaultHours().map(def => {
        const loaded = data.find(h => h.dayOfWeek === def.dayOfWeek)
        return loaded ?? def
      }))
    }
  }, [data])

  const saveMut = useMutation({
    mutationFn: () => staffOwnerApi.setHours(staffId, hours),
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000) },
  })

  function toggle(day: number) {
    setHours(h => h.map(d => d.dayOfWeek === day ? { ...d, isWorking: !d.isWorking } : d))
  }
  function setTime(day: number, field: 'startTime' | 'endTime', val: string) {
    setHours(h => h.map(d => d.dayOfWeek === day ? { ...d, [field]: val } : d))
  }

  if (isLoading) {
    return (
      <div className="border-t border-gray-100 bg-gray-50 px-4 py-4">
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="border-t border-gray-100 bg-gray-50 px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Arbeitszeiten</p>
        <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600">Schließen</button>
      </div>

      <div className="space-y-2">
        {hours.map(h => (
          <div key={h.dayOfWeek} className="flex items-center gap-2">
            <button
              onClick={() => toggle(h.dayOfWeek)}
              className={`w-8 h-8 rounded-full text-xs font-bold shrink-0 transition-colors ${
                h.isWorking ? 'bg-green-700 text-white' : 'bg-gray-200 text-gray-400'
              }`}
            >
              {DAY_LABELS[h.dayOfWeek]}
            </button>
            {h.isWorking ? (
              <>
                <input
                  type="time"
                  value={h.startTime}
                  onChange={e => setTime(h.dayOfWeek, 'startTime', e.target.value)}
                  className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                />
                <span className="text-xs text-gray-400">–</span>
                <input
                  type="time"
                  value={h.endTime}
                  onChange={e => setTime(h.dayOfWeek, 'endTime', e.target.value)}
                  className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </>
            ) : (
              <span className="text-xs text-gray-400 italic">Frei</span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={() => saveMut.mutate()}
          disabled={saveMut.isPending}
          className="bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-800 disabled:opacity-60"
        >
          {saveMut.isPending ? 'Wird gespeichert…' : 'Speichern'}
        </button>
        {saved && <span className="text-xs text-green-600">Gespeichert ✓</span>}
      </div>
    </div>
  )
}

function StaffForm({
  title,
  form,
  setForm,
  services,
  onSave,
  onCancel,
  saving,
}: {
  title: string
  form: { name: string; email: string; avatarUrl: string; serviceIds: string[] }
  setForm: React.Dispatch<React.SetStateAction<typeof form>>
  services: ServiceOwnerResponse[]
  onSave: () => void
  onCancel: () => void
  saving: boolean
}) {
  function toggleService(id: string) {
    setForm(f => ({
      ...f,
      serviceIds: f.serviceIds.includes(id)
        ? f.serviceIds.filter(s => s !== id)
        : [...f.serviceIds, id],
    }))
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
      <p className="text-sm font-semibold text-gray-700">{title}</p>

      <input placeholder="Name (z.B. Anna Müller)" value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
      <input type="email" placeholder="E-Mail" value={form.email}
        onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} />
      <input placeholder="Foto-URL (optional, z.B. https://…/foto.jpg)" value={form.avatarUrl}
        onChange={e => setForm(f => ({ ...f, avatarUrl: e.target.value }))} className={inputCls} />

      {(form.avatarUrl || form.name) && (
        <div className="flex items-center gap-2">
          <StaffAvatar name={form.name || 'MA'} avatarUrl={form.avatarUrl || undefined} size={48} />
          <span className="text-sm text-gray-500">{form.name || 'Vorschau'}</span>
        </div>
      )}

      {services.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1.5">Angebotene Leistungen</p>
          <div className="grid grid-cols-2 gap-1.5">
            {services.filter(s => s.isActive).map(s => (
              <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.serviceIds.includes(s.id)}
                  onChange={() => toggleService(s.id)}
                  className="accent-green-700"
                />
                <span className="text-xs text-gray-700 truncate">{s.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={onSave} disabled={saving}
          className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-60">
          {saving ? 'Wird gespeichert…' : 'Speichern'}
        </button>
        <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
          Abbrechen
        </button>
      </div>
    </div>
  )
}

export function StaffPage() {
  const { businessId } = useAuth()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<StaffOwnerResponse | null>(null)
  const [hoursStaffId, setHoursStaffId] = useState<string | null>(null)

  const emptyForm = { name: '', email: '', avatarUrl: '', serviceIds: [] as string[] }
  const [form, setForm] = useState(emptyForm)

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['owner-staff', businessId],
    queryFn: () => staffOwnerApi.list(businessId!),
    enabled: !!businessId,
  })

  const { data: services = [] } = useQuery({
    queryKey: ['owner-services', businessId],
    queryFn: () => serviceOwnerApi.list(businessId!),
    enabled: !!businessId,
  })

  const allActiveServiceIds = services.filter(s => s.isActive).map(s => s.id)
  const invalidate = () => qc.invalidateQueries({ queryKey: ['owner-staff'] })

  const createMut = useMutation({
    mutationFn: () => staffOwnerApi.create(businessId!, {
      name: form.name,
      email: form.email,
      avatarUrl: form.avatarUrl || undefined,
      serviceIds: form.serviceIds.length > 0 ? form.serviceIds : undefined,
    }),
    onSuccess: () => { invalidate(); setShowForm(false); setForm(emptyForm) },
  })

  const updateMut = useMutation({
    mutationFn: (s: StaffOwnerResponse) => staffOwnerApi.update(s.id, {
      name: form.name,
      email: form.email,
      isActive: s.isActive,
      avatarUrl: form.avatarUrl || undefined,
      serviceIds: form.serviceIds,
    }),
    onSuccess: () => { invalidate(); setEditItem(null) },
  })

  const toggleMut = useMutation({
    mutationFn: (s: StaffOwnerResponse) =>
      staffOwnerApi.update(s.id, { name: s.name, email: s.email, isActive: !s.isActive, avatarUrl: s.avatarUrl, serviceIds: s.serviceIds }),
    onSuccess: invalidate,
  })

  const deleteMut = useMutation({
    mutationFn: staffOwnerApi.remove,
    onSuccess: invalidate,
  })

  function startEdit(s: StaffOwnerResponse) {
    setEditItem(s)
    setForm({ name: s.name, email: s.email, avatarUrl: s.avatarUrl ?? '', serviceIds: s.serviceIds })
    setShowForm(false)
  }

  function openNew() {
    setShowForm(true)
    setEditItem(null)
    setForm({ ...emptyForm, serviceIds: allActiveServiceIds })
  }

  function toggleHours(id: string) {
    setHoursStaffId(prev => prev === id ? null : id)
  }

  const filtered = staff.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/dashboard/overview" className="text-sm text-gray-400 hover:text-gray-600">← Admin-Panel</Link>
        <span className="text-gray-200">/</span>
        <h1 className="text-xl font-semibold text-gray-900">Mitarbeiter</h1>
        <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium ml-auto">
          {staff.filter(s => s.isActive).length} aktiv
        </span>
      </div>

      <div className="flex gap-3 mb-4">
        <input placeholder="Suchen…" value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        {!showForm && !editItem && (
          <button onClick={openNew}
            className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 shrink-0">
            + Hinzufügen
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-4">
          <StaffForm
            title="Neuer Mitarbeiter"
            form={form} setForm={setForm}
            services={services}
            onSave={() => createMut.mutate()}
            onCancel={() => { setShowForm(false); setForm(emptyForm) }}
            saving={createMut.isPending}
          />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {filtered.length === 0 && (
            <p className="px-4 py-8 text-sm text-center text-gray-400">Keine Mitarbeiter gefunden</p>
          )}
          {filtered.map(s => (
            <div key={s.id}>
              {editItem?.id === s.id ? (
                <div className="p-4">
                  <StaffForm
                    title="Bearbeiten"
                    form={form} setForm={setForm}
                    services={services}
                    onSave={() => updateMut.mutate(s)}
                    onCancel={() => setEditItem(null)}
                    saving={updateMut.isPending}
                  />
                </div>
              ) : (
                <>
                  <div className={`flex items-center gap-3 px-4 py-3 ${!s.isActive ? 'opacity-50' : ''}`}>
                    <StaffAvatar name={s.name} avatarUrl={s.avatarUrl} size={40} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{s.name}</p>
                      <p className="text-xs text-gray-400 truncate">{s.email}</p>
                      <p className="text-xs text-gray-300 mt-0.5">
                        {s.serviceIds.length === 0 ? 'Alle Leistungen' : `${s.serviceIds.length} Leistung(en)`}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${s.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                      {s.isActive ? 'Aktiv' : 'Inaktiv'}
                    </span>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => toggleHours(s.id)}
                        className={`text-xs hover:underline ${hoursStaffId === s.id ? 'text-green-700 font-medium' : 'text-gray-400'}`}
                      >
                        Zeiten
                      </button>
                      <button onClick={() => startEdit(s)} className="text-xs text-green-600 hover:underline">Bearbeiten</button>
                      <button onClick={() => toggleMut.mutate(s)} className="text-xs text-gray-400 hover:underline">
                        {s.isActive ? 'Deaktivieren' : 'Aktivieren'}
                      </button>
                      <button onClick={() => deleteMut.mutate(s.id)} className="text-xs text-red-400 hover:underline">Entfernen</button>
                    </div>
                  </div>
                  {hoursStaffId === s.id && (
                    <StaffHoursPanel staffId={s.id} onClose={() => setHoursStaffId(null)} />
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
