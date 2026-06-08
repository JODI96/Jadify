import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../../store/authStore'
import { serviceOwnerApi, type ServiceOwnerResponse } from '../../api'

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500'

export function ServicesPage() {
  const { businessId } = useAuth()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<ServiceOwnerResponse | null>(null)
  const [form, setForm] = useState({ name: '', description: '', durationMinutes: 30, price: 0 })

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['owner-services', businessId],
    queryFn: () => serviceOwnerApi.list(businessId!),
    enabled: !!businessId,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['owner-services'] })

  const createMut = useMutation({
    mutationFn: () => serviceOwnerApi.create(businessId!, {
      name: form.name,
      description: form.description || undefined,
      durationMinutes: form.durationMinutes,
      price: form.price,
    }),
    onSuccess: () => { invalidate(); setShowForm(false); resetForm() },
  })

  const updateMut = useMutation({
    mutationFn: (s: ServiceOwnerResponse) => serviceOwnerApi.update(s.id, {
      name: form.name,
      description: form.description || undefined,
      durationMinutes: form.durationMinutes,
      price: form.price,
      isActive: s.isActive,
    }),
    onSuccess: () => { invalidate(); setEditItem(null) },
  })

  const toggleMut = useMutation({
    mutationFn: (s: ServiceOwnerResponse) => serviceOwnerApi.update(s.id, {
      name: s.name, description: s.description, durationMinutes: s.durationMinutes,
      price: s.price, isActive: !s.isActive,
    }),
    onSuccess: invalidate,
  })

  const deleteMut = useMutation({
    mutationFn: serviceOwnerApi.remove,
    onSuccess: invalidate,
  })

  function resetForm() { setForm({ name: '', description: '', durationMinutes: 30, price: 0 }) }

  function startEdit(s: ServiceOwnerResponse) {
    setEditItem(s)
    setForm({ name: s.name, description: s.description ?? '', durationMinutes: s.durationMinutes, price: s.price })
    setShowForm(false)
  }

  const filtered = services.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.description ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/dashboard/overview" className="text-sm text-gray-400 hover:text-gray-600">← Admin-Panel</Link>
        <span className="text-gray-200">/</span>
        <h1 className="text-xl font-semibold text-gray-900">Dienstleistungen</h1>
        <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium ml-auto">
          {services.filter(s => s.isActive).length} aktiv
        </span>
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 mb-4">
        <input
          placeholder="Suchen…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        {!showForm && !editItem && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 shrink-0"
          >
            + Hinzufügen
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <ServiceForm
          form={form} setForm={setForm}
          onSave={() => createMut.mutate()}
          onCancel={() => { setShowForm(false); resetForm() }}
          saving={createMut.isPending}
          title="Neue Dienstleistung"
        />
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {filtered.length === 0 && (
            <p className="px-4 py-8 text-sm text-center text-gray-400">Keine Dienstleistungen gefunden</p>
          )}
          {filtered.map(s => (
            <div key={s.id}>
              {editItem?.id === s.id ? (
                <div className="p-4">
                  <ServiceForm
                    form={form} setForm={setForm}
                    onSave={() => updateMut.mutate(s)}
                    onCancel={() => setEditItem(null)}
                    saving={updateMut.isPending}
                    title="Bearbeiten"
                  />
                </div>
              ) : (
                <div className={`flex items-center gap-4 px-4 py-3 ${!s.isActive ? 'opacity-50' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{s.name}</p>
                    {s.description && <p className="text-xs text-gray-400 truncate">{s.description}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-gray-700">CHF {s.price.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">{s.durationMinutes} Min</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => startEdit(s)} className="text-xs text-green-600 hover:underline">Bearbeiten</button>
                    <button onClick={() => toggleMut.mutate(s)} className="text-xs text-gray-400 hover:underline">
                      {s.isActive ? 'Deaktivieren' : 'Aktivieren'}
                    </button>
                    <button onClick={() => deleteMut.mutate(s.id)} className="text-xs text-red-400 hover:underline">Entfernen</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ServiceForm({ form, setForm, onSave, onCancel, saving, title }: {
  form: { name: string; description: string; durationMinutes: number; price: number }
  setForm: React.Dispatch<React.SetStateAction<typeof form>>
  onSave: () => void; onCancel: () => void; saving: boolean; title: string
}) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 space-y-3">
      <p className="text-sm font-medium text-gray-700">{title}</p>
      <input placeholder="Name (z.B. Haarschnitt)" value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
      <input placeholder="Beschreibung (z.B. Waschen & Schneiden)" value={form.description}
        onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputCls} />
      <div className="flex gap-3">
        <div className="flex-1">
          <p className="text-xs text-gray-400 mb-1">Dauer (Min)</p>
          <input type="number" value={form.durationMinutes}
            onChange={e => setForm(f => ({ ...f, durationMinutes: +e.target.value }))} className={inputCls} />
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-400 mb-1">Preis (CHF)</p>
          <input type="number" step="0.01" value={form.price}
            onChange={e => setForm(f => ({ ...f, price: +e.target.value }))} className={inputCls} />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onSave} disabled={saving}
          className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-60">
          {saving ? 'Wird gespeichert…' : 'Speichern'}
        </button>
        <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Abbrechen</button>
      </div>
    </div>
  )
}
