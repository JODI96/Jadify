import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../../store/authStore'
import { staffOwnerApi, type StaffOwnerResponse } from '../../api'

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400'

export function StaffPage() {
  const { businessId } = useAuth()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<StaffOwnerResponse | null>(null)
  const [form, setForm] = useState({ name: '', email: '' })

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['owner-staff', businessId],
    queryFn: () => staffOwnerApi.list(businessId!),
    enabled: !!businessId,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['owner-staff'] })

  const createMut = useMutation({
    mutationFn: () => staffOwnerApi.create(businessId!, form),
    onSuccess: () => { invalidate(); setShowForm(false); setForm({ name: '', email: '' }) },
  })

  const updateMut = useMutation({
    mutationFn: (s: StaffOwnerResponse) =>
      staffOwnerApi.update(s.id, { name: form.name, email: form.email, isActive: s.isActive }),
    onSuccess: () => { invalidate(); setEditItem(null) },
  })

  const toggleMut = useMutation({
    mutationFn: (s: StaffOwnerResponse) =>
      staffOwnerApi.update(s.id, { name: s.name, email: s.email, isActive: !s.isActive }),
    onSuccess: invalidate,
  })

  const deleteMut = useMutation({
    mutationFn: staffOwnerApi.remove,
    onSuccess: invalidate,
  })

  function startEdit(s: StaffOwnerResponse) {
    setEditItem(s)
    setForm({ name: s.name, email: s.email })
    setShowForm(false)
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
        <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium ml-auto">
          {staff.filter(s => s.isActive).length} aktiv
        </span>
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 mb-4">
        <input
          placeholder="Suchen…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        {!showForm && !editItem && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 shrink-0"
          >
            + Hinzufügen
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">Neuer Mitarbeiter</p>
          <input placeholder="Name (z.B. Anna Müller)" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
          <input type="email" placeholder="E-Mail" value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} />
          <div className="flex gap-2">
            <button onClick={() => createMut.mutate()} disabled={createMut.isPending}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60">
              {createMut.isPending ? 'Wird gespeichert…' : 'Speichern'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* List */}
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
                <div className="p-4 space-y-3">
                  <p className="text-sm font-medium text-gray-700">Bearbeiten</p>
                  <input placeholder="Name" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
                  <input type="email" placeholder="E-Mail" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} />
                  <div className="flex gap-2">
                    <button onClick={() => updateMut.mutate(s)} disabled={updateMut.isPending}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60">
                      {updateMut.isPending ? 'Wird gespeichert…' : 'Speichern'}
                    </button>
                    <button onClick={() => setEditItem(null)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
                      Abbrechen
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`flex items-center gap-4 px-4 py-3 ${!s.isActive ? 'opacity-50' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{s.name}</p>
                    <p className="text-xs text-gray-400 truncate">{s.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                    s.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {s.isActive ? 'Aktiv' : 'Inaktiv'}
                  </span>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => startEdit(s)} className="text-xs text-indigo-500 hover:underline">Bearbeiten</button>
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
