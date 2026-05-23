import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../store/authStore'
import {
  dashboardApi,
  serviceOwnerApi,
  staffOwnerApi,
  tableApi,
  type ServiceOwnerResponse,
  type StaffOwnerResponse,
  type TableResponse,
  type UpcomingBookingItem,
} from '../../api'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(iso: string) {
  return new Date(iso).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })
}

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    Confirmed: 'bg-green-100 text-green-700',
    Pending:   'bg-yellow-100 text-yellow-700',
    Cancelled: 'bg-red-100 text-red-700',
    Completed: 'bg-gray-100 text-gray-600',
  }
  const labels: Record<string, string> = {
    Confirmed: 'Bestätigt',
    Pending:   'Ausstehend',
    Cancelled: 'Storniert',
    Completed: 'Abgeschlossen',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cls[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {labels[status] ?? status}
    </span>
  )
}

function KpiCard({ label, value, sub, subColor = 'text-gray-400' }: {
  label: string; value: string; sub?: string; subColor?: string
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      {sub && <p className={`text-xs mt-1 ${subColor}`}>{sub}</p>}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function OverviewPage() {
  const { businessId, businessType, email } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.get,
    refetchInterval: 60_000,
  })

  const growthSign  = (data?.revenueGrowthPercent ?? 0) >= 0 ? '+' : ''
  const growthColor = (data?.revenueGrowthPercent ?? 0) >= 0 ? 'text-green-600' : 'text-red-500'
  const isRestaurant = businessType === 'Restaurant'

  return (
    <div className="px-6 py-6 max-w-6xl space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Admin-Panel</h1>
        <span className="text-xs text-gray-400">{email}</span>
      </div>

      {/* KPIs */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 h-20 animate-pulse" />
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="Buchungen heute"    value={String(data.todayBookingCount)} />
          <KpiCard label="Bevorstehend"       value={String(data.upcomingBookingCount)} />
          <KpiCard
            label="Umsatz diesen Monat"
            value={`CHF ${data.revenueThisMonth.toFixed(2)}`}
            sub={`${growthSign}${data.revenueGrowthPercent}% vs. letzten Monat`}
            subColor={growthColor}
          />
          <KpiCard label="Kunden gesamt"      value={String(data.totalCustomers)} />
        </div>
      ) : null}

      {/* Management grid */}
      <div className={`grid gap-4 ${isRestaurant ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
        <ServicesPanel businessId={businessId!} />
        <StaffPanel    businessId={businessId!} />
        {isRestaurant && <TablesPanel businessId={businessId!} />}
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-2 gap-4">
        <HoursPanel businessId={businessId!} />
        <SchedulePanel schedule={data?.todaySchedule ?? []} loading={isLoading} />
      </div>
    </div>
  )
}

// ── Services ──────────────────────────────────────────────────────────────────

function ServicesPanel({ businessId }: { businessId: string }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: '', description: '', durationMinutes: 30, price: 0 })
  const [editId, setEditId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const { data: services = [] } = useQuery({
    queryKey: ['owner-services', businessId],
    queryFn: () => serviceOwnerApi.list(businessId),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['owner-services'] })

  const createMut = useMutation({
    mutationFn: () => serviceOwnerApi.create(businessId, {
      name: form.name, description: form.description || undefined,
      durationMinutes: form.durationMinutes, price: form.price,
    }),
    onSuccess: () => { invalidate(); setOpen(false); resetForm() },
  })

  const updateMut = useMutation({
    mutationFn: (s: ServiceOwnerResponse) => serviceOwnerApi.update(s.id, {
      name: form.name, description: form.description || undefined,
      durationMinutes: form.durationMinutes, price: form.price, isActive: s.isActive,
    }),
    onSuccess: () => { invalidate(); setEditId(null) },
  })

  const deleteMut = useMutation({
    mutationFn: serviceOwnerApi.remove,
    onSuccess: invalidate,
  })

  function resetForm() { setForm({ name: '', description: '', durationMinutes: 30, price: 0 }) }

  function startEdit(s: ServiceOwnerResponse) {
    setEditId(s.id)
    setForm({ name: s.name, description: s.description ?? '', durationMinutes: s.durationMinutes, price: s.price })
    setOpen(false)
  }

  const activeServices = services.filter(s => s.isActive)

  return (
    <PanelCard title="Dienstleistungen" count={activeServices.length}>
      <div className="divide-y divide-gray-50">
        {services.map(s => (
          <div key={s.id}>
            {editId === s.id ? (
              <InlineServiceForm
                form={form} setForm={setForm}
                onSave={() => updateMut.mutate(s)}
                onCancel={() => setEditId(null)}
                saving={updateMut.isPending}
              />
            ) : (
              <div className="flex items-center justify-between py-2.5 px-1">
                <div>
                  <p className="text-sm font-medium text-gray-800">{s.name}</p>
                  <p className="text-xs text-gray-400">{s.durationMinutes} Min · CHF {s.price.toFixed(2)}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => startEdit(s)} className="text-xs text-indigo-500 hover:underline">Bearbeiten</button>
                  <button onClick={() => deleteMut.mutate(s.id)} className="text-xs text-red-400 hover:underline">Entfernen</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {open ? (
        <InlineServiceForm
          form={form} setForm={setForm}
          onSave={() => createMut.mutate()}
          onCancel={() => { setOpen(false); resetForm() }}
          saving={createMut.isPending}
        />
      ) : (
        <button onClick={() => setOpen(true)} className="mt-2 text-xs text-indigo-600 hover:underline">
          + Hinzufügen
        </button>
      )}
    </PanelCard>
  )
}

function InlineServiceForm({ form, setForm, onSave, onCancel, saving }: {
  form: { name: string; description: string; durationMinutes: number; price: number }
  setForm: React.Dispatch<React.SetStateAction<typeof form>>
  onSave: () => void; onCancel: () => void; saving: boolean
}) {
  return (
    <div className="py-2 space-y-2">
      <input
        placeholder="Name" value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        className={inputCls}
      />
      <input
        placeholder="Beschreibung (optional)" value={form.description}
        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        className={inputCls}
      />
      <div className="flex gap-2">
        <input type="number" placeholder="Min" value={form.durationMinutes}
          onChange={e => setForm(f => ({ ...f, durationMinutes: +e.target.value }))}
          className={`${inputCls} w-20`}
        />
        <input type="number" step="0.01" placeholder="CHF" value={form.price}
          onChange={e => setForm(f => ({ ...f, price: +e.target.value }))}
          className={`${inputCls} w-24`}
        />
        <SaveCancelButtons onSave={onSave} onCancel={onCancel} saving={saving} />
      </div>
    </div>
  )
}

// ── Staff ─────────────────────────────────────────────────────────────────────

function StaffPanel({ businessId }: { businessId: string }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: '', email: '' })
  const [editId, setEditId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const { data: staff = [] } = useQuery({
    queryKey: ['owner-staff', businessId],
    queryFn: () => staffOwnerApi.list(businessId),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['owner-staff'] })

  const createMut = useMutation({
    mutationFn: () => staffOwnerApi.create(businessId, form),
    onSuccess: () => { invalidate(); setOpen(false); setForm({ name: '', email: '' }) },
  })

  const updateMut = useMutation({
    mutationFn: (s: StaffOwnerResponse) =>
      staffOwnerApi.update(s.id, { name: form.name, email: form.email, isActive: s.isActive }),
    onSuccess: () => { invalidate(); setEditId(null) },
  })

  const deleteMut = useMutation({
    mutationFn: staffOwnerApi.remove,
    onSuccess: invalidate,
  })

  function startEdit(s: StaffOwnerResponse) {
    setEditId(s.id)
    setForm({ name: s.name, email: s.email })
    setOpen(false)
  }

  return (
    <PanelCard title="Mitarbeiter" count={staff.filter(s => s.isActive).length}>
      <div className="divide-y divide-gray-50">
        {staff.map(s => (
          <div key={s.id}>
            {editId === s.id ? (
              <div className="py-2 space-y-2">
                <input placeholder="Name" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
                <div className="flex gap-2">
                  <input type="email" placeholder="E-Mail" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={`${inputCls} flex-1`} />
                  <SaveCancelButtons onSave={() => updateMut.mutate(s)} onCancel={() => setEditId(null)} saving={updateMut.isPending} />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between py-2.5 px-1">
                <div>
                  <p className="text-sm font-medium text-gray-800">{s.name}</p>
                  <p className="text-xs text-gray-400">{s.email}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => startEdit(s)} className="text-xs text-indigo-500 hover:underline">Bearbeiten</button>
                  <button onClick={() => deleteMut.mutate(s.id)} className="text-xs text-red-400 hover:underline">Entfernen</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {open ? (
        <div className="py-2 space-y-2">
          <input placeholder="Name" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
          <div className="flex gap-2">
            <input type="email" placeholder="E-Mail" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={`${inputCls} flex-1`} />
            <SaveCancelButtons onSave={() => createMut.mutate()} onCancel={() => setOpen(false)} saving={createMut.isPending} />
          </div>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="mt-2 text-xs text-indigo-600 hover:underline">
          + Hinzufügen
        </button>
      )}
    </PanelCard>
  )
}

// ── Tables ────────────────────────────────────────────────────────────────────

function TablesPanel({ businessId }: { businessId: string }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: '', capacity: 2 })
  const [editId, setEditId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const { data: tables = [] } = useQuery({
    queryKey: ['owner-tables', businessId],
    queryFn: () => tableApi.list(businessId),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['owner-tables'] })

  const createMut = useMutation({
    mutationFn: () => tableApi.create(businessId, form),
    onSuccess: () => { invalidate(); setOpen(false); setForm({ name: '', capacity: 2 }) },
  })

  const updateMut = useMutation({
    mutationFn: (t: TableResponse) =>
      tableApi.update(t.id, { name: form.name, capacity: form.capacity, isActive: t.isActive }),
    onSuccess: () => { invalidate(); setEditId(null) },
  })

  const deleteMut = useMutation({
    mutationFn: tableApi.remove,
    onSuccess: invalidate,
  })

  function startEdit(t: TableResponse) {
    setEditId(t.id)
    setForm({ name: t.name, capacity: t.capacity })
    setOpen(false)
  }

  return (
    <PanelCard title="Tische" count={tables.filter(t => t.isActive).length}>
      <div className="divide-y divide-gray-50">
        {tables.map(t => (
          <div key={t.id}>
            {editId === t.id ? (
              <div className="py-2 space-y-2">
                <div className="flex gap-2">
                  <input placeholder="Name" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={`${inputCls} flex-1`} />
                  <input type="number" min={1} value={form.capacity}
                    onChange={e => setForm(f => ({ ...f, capacity: +e.target.value }))}
                    className={`${inputCls} w-16`} />
                  <SaveCancelButtons onSave={() => updateMut.mutate(t)} onCancel={() => setEditId(null)} saving={updateMut.isPending} />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between py-2.5 px-1">
                <div>
                  <p className="text-sm font-medium text-gray-800">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.capacity} Personen</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => startEdit(t)} className="text-xs text-indigo-500 hover:underline">Bearbeiten</button>
                  <button onClick={() => deleteMut.mutate(t.id)} className="text-xs text-red-400 hover:underline">Entfernen</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {open ? (
        <div className="py-2">
          <div className="flex gap-2">
            <input placeholder="Name" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={`${inputCls} flex-1`} />
            <input type="number" min={1} value={form.capacity}
              onChange={e => setForm(f => ({ ...f, capacity: +e.target.value }))} className={`${inputCls} w-16`} />
            <SaveCancelButtons onSave={() => createMut.mutate()} onCancel={() => setOpen(false)} saving={createMut.isPending} />
          </div>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="mt-2 text-xs text-indigo-600 hover:underline">
          + Hinzufügen
        </button>
      )}
    </PanelCard>
  )
}

// ── Hours ─────────────────────────────────────────────────────────────────────

const DAY_NAMES = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

function HoursPanel({ businessId }: { businessId: string }) {
  const [hours, setHours] = useState(
    Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      openTime: '09:00',
      closeTime: '17:00',
      isClosed: i === 0,
    }))
  )
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
      }).then(r => { if (!r.ok) throw new Error('Fehler') }),
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000) },
  })

  function setDay(i: number, patch: object) {
    setHours(prev => prev.map((h, idx) => idx === i ? { ...h, ...patch } : h))
  }

  return (
    <PanelCard title="Öffnungszeiten">
      <div className="space-y-1.5">
        {hours.map((h, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="w-6 text-xs font-medium text-gray-500 shrink-0">{DAY_NAMES[i]}</span>
            <label className="flex items-center gap-1 cursor-pointer shrink-0">
              <input type="checkbox" checked={h.isClosed}
                onChange={e => setDay(i, { isClosed: e.target.checked })}
                className="accent-indigo-600" />
              <span className="text-xs text-gray-400">Zu</span>
            </label>
            {!h.isClosed && (
              <>
                <input type="time" value={h.openTime}
                  onChange={e => setDay(i, { openTime: e.target.value })}
                  className="border border-gray-200 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                <span className="text-gray-300 text-xs">–</span>
                <input type="time" value={h.closeTime}
                  onChange={e => setDay(i, { closeTime: e.target.value })}
                  className="border border-gray-200 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400" />
              </>
            )}
            {h.isClosed && <span className="text-xs text-gray-300">Geschlossen</span>}
          </div>
        ))}
      </div>
      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="mt-3 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-60"
      >
        {saved ? 'Gespeichert ✓' : mutation.isPending ? 'Wird gespeichert…' : 'Speichern'}
      </button>
    </PanelCard>
  )
}

// ── Today's schedule ──────────────────────────────────────────────────────────

function SchedulePanel({ schedule, loading }: { schedule: UpcomingBookingItem[]; loading?: boolean }) {
  return (
    <PanelCard title="Heutiger Tagesplan">
      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : schedule.length === 0 ? (
        <p className="text-sm text-gray-400">Heute keine Buchungen</p>
      ) : (
        <div className="divide-y divide-gray-50">
          {schedule.map(item => (
            <div key={item.id} className="flex items-center gap-3 py-2.5">
              <span className="text-xs font-medium text-gray-500 whitespace-nowrap w-24 shrink-0">
                {fmt(item.startTime)} – {fmt(item.endTime)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{item.customerName}</p>
                <p className="text-xs text-gray-400 truncate">{item.serviceName} · {item.staffName}</p>
              </div>
              <StatusBadge status={item.status} />
            </div>
          ))}
        </div>
      )}
    </PanelCard>
  )
}

// ── Shared UI primitives ──────────────────────────────────────────────────────

function PanelCard({ title, count, children }: {
  title: string; count?: number; children: React.ReactNode
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
        {count !== undefined && (
          <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

function SaveCancelButtons({ onSave, onCancel, saving }: {
  onSave: () => void; onCancel: () => void; saving: boolean
}) {
  return (
    <div className="flex gap-1 shrink-0">
      <button
        onClick={onSave}
        disabled={saving}
        className="text-xs bg-indigo-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-60"
      >
        {saving ? '…' : '✓'}
      </button>
      <button onClick={onCancel} className="text-xs text-gray-400 hover:text-gray-600 px-1.5">
        ✕
      </button>
    </div>
  )
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400'
