import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../store/authStore'
import { tableApi } from '../../api'
import type { TableResponse } from '../../api'

export function TablesPage() {
  const { businessId } = useAuth()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<TableResponse | null>(null)
  const [form, setForm] = useState({ name: '', capacity: 2 })

  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['owner-tables', businessId],
    queryFn: () => tableApi.list(businessId!),
    enabled: !!businessId,
  })

  const createMutation = useMutation({
    mutationFn: () => tableApi.create(businessId!, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner-tables'] })
      setShowForm(false)
      setForm({ name: '', capacity: 2 })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (item: TableResponse) =>
      tableApi.update(item.id, { name: form.name, capacity: form.capacity, isActive: item.isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner-tables'] })
      setEditItem(null)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (item: TableResponse) =>
      tableApi.update(item.id, { name: item.name, capacity: item.capacity, isActive: !item.isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['owner-tables'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tableApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['owner-tables'] }),
  })

  function openEdit(t: TableResponse) {
    setEditItem(t)
    setForm({ name: t.name, capacity: t.capacity })
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Tische</h1>
        {!showForm && !editItem && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            + Tisch hinzufügen
          </button>
        )}
      </div>

      {isLoading && <p className="text-sm text-gray-500">Wird geladen…</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {tables.map(t => (
          <div
            key={t.id}
            className={`bg-white rounded-2xl border p-4 flex flex-col gap-2 ${
              t.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'
            }`}
          >
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
              <button onClick={() => openEdit(t)} className="text-xs text-indigo-600 hover:underline">
                Bearbeiten
              </button>
              <button onClick={() => toggleMutation.mutate(t)} className="text-xs text-gray-500 hover:underline">
                {t.isActive ? 'Deaktivieren' : 'Aktivieren'}
              </button>
              <button onClick={() => deleteMutation.mutate(t.id)} className="text-xs text-red-500 hover:underline ml-auto">
                Entfernen
              </button>
            </div>
          </div>
        ))}
      </div>

      {(showForm || editItem) && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 grid gap-3 max-w-sm">
          <h3 className="text-sm font-medium text-gray-800">
            {editItem ? 'Tisch bearbeiten' : 'Neuer Tisch'}
          </h3>
          <input
            placeholder="Name (z.B. Tisch 1)"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div>
            <label className="block text-sm text-gray-600 mb-1">Kapazität (Personen)</label>
            <input
              type="number"
              min={1}
              value={form.capacity}
              onChange={e => setForm(f => ({ ...f, capacity: +e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => editItem ? updateMutation.mutate(editItem) : createMutation.mutate()}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Wird gespeichert…' : 'Speichern'}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditItem(null) }}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
