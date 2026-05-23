import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../../store/authStore'
import { tableApi, type TableResponse } from '../../api'

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400'

export function TablesPage() {
  const { businessId } = useAuth()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<TableResponse | null>(null)
  const [form, setForm] = useState({ name: '', capacity: 2 })

  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['owner-tables', businessId],
    queryFn: () => tableApi.list(businessId!),
    enabled: !!businessId,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['owner-tables'] })

  const createMut = useMutation({
    mutationFn: () => tableApi.create(businessId!, form),
    onSuccess: () => { invalidate(); setShowForm(false); setForm({ name: '', capacity: 2 }) },
  })

  const updateMut = useMutation({
    mutationFn: (t: TableResponse) =>
      tableApi.update(t.id, { name: form.name, capacity: form.capacity, isActive: t.isActive }),
    onSuccess: () => { invalidate(); setEditItem(null) },
  })

  const toggleMut = useMutation({
    mutationFn: (t: TableResponse) =>
      tableApi.update(t.id, { name: t.name, capacity: t.capacity, isActive: !t.isActive }),
    onSuccess: invalidate,
  })

  const deleteMut = useMutation({
    mutationFn: tableApi.remove,
    onSuccess: invalidate,
  })

  function startEdit(t: TableResponse) {
    setEditItem(t)
    setForm({ name: t.name, capacity: t.capacity })
    setShowForm(false)
  }

  const filtered = tables.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/dashboard/overview" className="text-sm text-gray-400 hover:text-gray-600">← Admin-Panel</Link>
        <span className="text-gray-200">/</span>
        <h1 className="text-xl font-semibold text-gray-900">Tische</h1>
        <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium ml-auto">
          {tables.filter(t => t.isActive).length} aktiv
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
          <p className="text-sm font-medium text-gray-700">Neuer Tisch</p>
          <input placeholder="Name (z.B. Tisch 1, Terrasse A)" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
          <div>
            <p className="text-xs text-gray-400 mb-1">Kapazität (Personen)</p>
            <input type="number" min={1} value={form.capacity}
              onChange={e => setForm(f => ({ ...f, capacity: +e.target.value }))} className={inputCls} />
          </div>
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
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.length === 0 && (
            <p className="col-span-3 text-sm text-center text-gray-400 py-8">Keine Tische gefunden</p>
          )}
          {filtered.map(t => (
            <div key={t.id}>
              {editItem?.id === t.id ? (
                <div className="bg-gray-50 border border-indigo-200 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-medium text-gray-700">Bearbeiten</p>
                  <input placeholder="Name" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Kapazität (Personen)</p>
                    <input type="number" min={1} value={form.capacity}
                      onChange={e => setForm(f => ({ ...f, capacity: +e.target.value }))} className={inputCls} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => updateMut.mutate(t)} disabled={updateMut.isPending}
                      className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60">
                      {updateMut.isPending ? '…' : 'Speichern'}
                    </button>
                    <button onClick={() => setEditItem(null)} className="text-sm text-gray-500 hover:text-gray-700">
                      Abbrechen
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`bg-white border rounded-xl p-4 flex flex-col gap-2 ${
                  t.isActive ? 'border-gray-200' : 'border-gray-100 opacity-50'
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-800">{t.name}</p>
                      <p className="text-sm text-gray-400">{t.capacity} Personen</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      t.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {t.isActive ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-1 border-t border-gray-100">
                    <button onClick={() => startEdit(t)} className="text-xs text-indigo-500 hover:underline">Bearbeiten</button>
                    <button onClick={() => toggleMut.mutate(t)} className="text-xs text-gray-400 hover:underline">
                      {t.isActive ? 'Deaktivieren' : 'Aktivieren'}
                    </button>
                    <button onClick={() => deleteMut.mutate(t.id)} className="text-xs text-red-400 hover:underline ml-auto">
                      Entfernen
                    </button>
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
