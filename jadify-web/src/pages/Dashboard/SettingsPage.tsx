import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../store/authStore'
import { businessApi, serviceOwnerApi, staffOwnerApi } from '../../api'
import type { ServiceOwnerResponse, StaffOwnerResponse } from '../../api'

const TABS = ['Profil', 'Dienstleistungen', 'Mitarbeiter', 'Öffnungszeiten'] as const
type Tab = typeof TABS[number]

const DAY_NAMES = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']

export function SettingsPage() {
  const [tab, setTab] = useState<Tab>('Profil')

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Einstellungen</h1>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Profil' && <ProfileTab />}
      {tab === 'Dienstleistungen' && <ServicesTab />}
      {tab === 'Mitarbeiter' && <StaffTab />}
      {tab === 'Öffnungszeiten' && <HoursTab />}
    </div>
  )
}

// ── Profil ────────────────────────────────────────────────────────────────────

function ProfileTab() {
  const { businessId } = useAuth()
  const qc = useQueryClient()

  const { data: business } = useQuery({
    queryKey: ['business-public'],
    queryFn: async () => {
      const res = await fetch(`/api/businesses?ownerId=${businessId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('jadify_token')}` },
      })
      if (!res.ok) throw new Error('Fehler beim Laden')
      return res.json()
    },
    enabled: !!businessId,
  })

  const [form, setForm] = useState({ name: '', address: '', phone: '', email: '', type: 'Salon', reminderHoursBefore: 24 })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (business) {
      setForm({
        name: business.name ?? '',
        address: business.address ?? '',
        phone: business.phone ?? '',
        email: business.email ?? '',
        type: business.type ?? 'Salon',
        reminderHoursBefore: business.reminderHoursBefore ?? 24,
      })
    }
  }, [business?.id])

  const mutation = useMutation({
    mutationFn: () => businessApi.update(businessId!, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['business-public'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  function f(key: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 grid gap-4">
      <h2 className="font-medium text-gray-800">Unternehmensprofil</h2>

      {[
        { label: 'Name', key: 'name' as const },
        { label: 'Adresse', key: 'address' as const },
        { label: 'Telefon', key: 'phone' as const },
        { label: 'E-Mail', key: 'email' as const },
      ].map(({ label, key }) => (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <input
            value={form[key]}
            onChange={e => f(key, e.target.value)}
            placeholder={business?.[key] ?? ''}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>
      ))}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Erinnerungs-E-Mail senden
        </label>
        <select
          value={form.reminderHoursBefore}
          onChange={e => setForm(prev => ({ ...prev, reminderHoursBefore: +e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 bg-white"
        >
          <option value={12}>12 Stunden vorher</option>
          <option value={24}>24 Stunden vorher</option>
          <option value={48}>48 Stunden vorher</option>
          <option value={72}>72 Stunden vorher</option>
        </select>
        <p className="mt-1 text-xs text-gray-400">
          Kunden erhalten automatisch eine Erinnerung vor ihrem Termin.
        </p>
      </div>

      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-800 disabled:opacity-60 transition-colors w-fit"
      >
        {saved ? 'Gespeichert ✓' : mutation.isPending ? 'Wird gespeichert…' : 'Speichern'}
      </button>
    </div>
  )
}

// ── Dienstleistungen ──────────────────────────────────────────────────────────

function ServicesTab() {
  const { businessId } = useAuth()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<ServiceOwnerResponse | null>(null)
  const [form, setForm] = useState({ name: '', description: '', durationMinutes: 30, price: 0 })

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['owner-services', businessId],
    queryFn: () => serviceOwnerApi.list(businessId!),
    enabled: !!businessId,
  })

  const createMutation = useMutation({
    mutationFn: () => serviceOwnerApi.create(businessId!, {
      name: form.name,
      description: form.description || undefined,
      durationMinutes: form.durationMinutes,
      price: form.price,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner-services'] })
      setShowForm(false)
      setForm({ name: '', description: '', durationMinutes: 30, price: 0 })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (item: ServiceOwnerResponse) => serviceOwnerApi.update(item.id, {
      name: form.name,
      description: form.description || undefined,
      durationMinutes: form.durationMinutes,
      price: form.price,
      isActive: item.isActive,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner-services'] })
      setEditItem(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => serviceOwnerApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['owner-services'] }),
  })

  function openEdit(s: ServiceOwnerResponse) {
    setEditItem(s)
    setForm({ name: s.name, description: s.description ?? '', durationMinutes: s.durationMinutes, price: s.price })
  }

  if (isLoading) return <div className="text-sm text-gray-500">Wird geladen…</div>

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
        {services.length === 0 && (
          <p className="p-4 text-sm text-gray-400">Noch keine Dienstleistungen</p>
        )}
        {services.map(s => (
          <div key={s.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-800">{s.name}</p>
              <p className="text-xs text-gray-400">{s.durationMinutes} Min · CHF {s.price.toFixed(2)}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(s)} className="text-xs text-green-700 hover:underline">Bearbeiten</button>
              <button onClick={() => deleteMutation.mutate(s.id)} className="text-xs text-red-500 hover:underline">Entfernen</button>
            </div>
          </div>
        ))}
      </div>

      {(showForm || editItem) && (
        <ServiceForm
          form={form}
          setForm={setForm}
          onSave={() => editItem ? updateMutation.mutate(editItem) : createMutation.mutate()}
          onCancel={() => { setShowForm(false); setEditItem(null) }}
          saving={createMutation.isPending || updateMutation.isPending}
          title={editItem ? 'Dienstleistung bearbeiten' : 'Neue Dienstleistung'}
        />
      )}

      {!showForm && !editItem && (
        <button
          onClick={() => setShowForm(true)}
          className="text-sm text-green-700 hover:underline"
        >
          + Dienstleistung hinzufügen
        </button>
      )}
    </div>
  )
}

function ServiceForm({
  form, setForm, onSave, onCancel, saving, title,
}: {
  form: { name: string; description: string; durationMinutes: number; price: number }
  setForm: React.Dispatch<React.SetStateAction<typeof form>>
  onSave: () => void
  onCancel: () => void
  saving: boolean
  title: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 grid gap-3">
      <h3 className="text-sm font-medium text-gray-800">{title}</h3>
      <input
        placeholder="Name"
        value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
      />
      <input
        placeholder="Beschreibung (optional)"
        value={form.description}
        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
      />
      <div className="flex gap-3">
        <input
          type="number"
          placeholder="Dauer (Min)"
          value={form.durationMinutes}
          onChange={e => setForm(f => ({ ...f, durationMinutes: +e.target.value }))}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
        />
        <input
          type="number"
          step="0.01"
          placeholder="Preis (CHF)"
          value={form.price}
          onChange={e => setForm(f => ({ ...f, price: +e.target.value }))}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={onSave}
          disabled={saving}
          className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-60"
        >
          {saving ? 'Wird gespeichert…' : 'Speichern'}
        </button>
        <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
          Abbrechen
        </button>
      </div>
    </div>
  )
}

// ── Mitarbeiter ───────────────────────────────────────────────────────────────

function StaffTab() {
  const { businessId } = useAuth()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<StaffOwnerResponse | null>(null)
  const [form, setForm] = useState({ name: '', email: '' })

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['owner-staff', businessId],
    queryFn: () => staffOwnerApi.list(businessId!),
    enabled: !!businessId,
  })

  const createMutation = useMutation({
    mutationFn: () => staffOwnerApi.create(businessId!, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner-staff'] })
      setShowForm(false)
      setForm({ name: '', email: '' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (item: StaffOwnerResponse) =>
      staffOwnerApi.update(item.id, { name: form.name, email: form.email, isActive: item.isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner-staff'] })
      setEditItem(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => staffOwnerApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['owner-staff'] }),
  })

  function openEdit(s: StaffOwnerResponse) {
    setEditItem(s)
    setForm({ name: s.name, email: s.email })
  }

  if (isLoading) return <div className="text-sm text-gray-500">Wird geladen…</div>

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
        {staff.length === 0 && (
          <p className="p-4 text-sm text-gray-400">Noch keine Mitarbeiter</p>
        )}
        {staff.map(s => (
          <div key={s.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-800">{s.name}</p>
              <p className="text-xs text-gray-400">{s.email}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(s)} className="text-xs text-green-700 hover:underline">Bearbeiten</button>
              <button onClick={() => deleteMutation.mutate(s.id)} className="text-xs text-red-500 hover:underline">Entfernen</button>
            </div>
          </div>
        ))}
      </div>

      {(showForm || editItem) && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 grid gap-3">
          <h3 className="text-sm font-medium text-gray-800">
            {editItem ? 'Mitarbeiter bearbeiten' : 'Neuer Mitarbeiter'}
          </h3>
          <input
            placeholder="Name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
          <input
            type="email"
            placeholder="E-Mail"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
          <div className="flex gap-2">
            <button
              onClick={() => editItem ? updateMutation.mutate(editItem) : createMutation.mutate()}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-60"
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

      {!showForm && !editItem && (
        <button onClick={() => setShowForm(true)} className="text-sm text-green-700 hover:underline">
          + Mitarbeiter hinzufügen
        </button>
      )}
    </div>
  )
}

// ── Öffnungszeiten ────────────────────────────────────────────────────────────

function HoursTab() {
  const { businessId } = useAuth()
  const qc = useQueryClient()

  const defaultHours = Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    openTime: '09:00',
    closeTime: '17:00',
    isClosed: i === 0,
  }))

  const [hours, setHours] = useState(defaultHours)
  const [saved, setSaved] = useState(false)

  const mutation = useMutation({
    mutationFn: () =>
      fetch(`/api/businesses/${businessId}/hours`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('jadify_token')}`,
        },
        body: JSON.stringify({ hours }),
      }).then(r => { if (!r.ok) throw new Error('Fehler'); return r.json() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['business-hours'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  function setDay(index: number, patch: Partial<typeof hours[0]>) {
    setHours(prev => prev.map((h, i) => i === index ? { ...h, ...patch } : h))
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
      {hours.map((h, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-24 text-sm text-gray-700 shrink-0">{DAY_NAMES[i]}</span>
          <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={h.isClosed}
              onChange={e => setDay(i, { isClosed: e.target.checked })}
              className="accent-green-700"
            />
            Geschlossen
          </label>
          {!h.isClosed && (
            <>
              <input
                type="time"
                value={h.openTime}
                onChange={e => setDay(i, { openTime: e.target.value })}
                className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              />
              <span className="text-gray-400 text-sm">–</span>
              <input
                type="time"
                value={h.closeTime}
                onChange={e => setDay(i, { closeTime: e.target.value })}
                className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </>
          )}
        </div>
      ))}

      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="mt-2 bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-800 disabled:opacity-60 transition-colors"
      >
        {saved ? 'Gespeichert ✓' : mutation.isPending ? 'Wird gespeichert…' : 'Speichern'}
      </button>
    </div>
  )
}
