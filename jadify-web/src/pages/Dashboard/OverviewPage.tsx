import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QRCodeSVG } from 'qrcode.react'
import { useAuth } from '../../store/authStore'
import {
  dashboardApi,
  serviceOwnerApi,
  staffOwnerApi,
  tableApi,
  businessApi,
  type ServiceOwnerResponse,
  type StaffOwnerResponse,
  type TableResponse,
  type UpcomingBookingItem,
} from '../../api'

const PREVIEW_LIMIT = 5

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
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-2 truncate">{label}</p>
      <p className="text-lg sm:text-2xl font-black text-gray-900 truncate">{value}</p>
      {sub && <p className={`text-[11px] mt-1 truncate ${subColor}`}>{sub}</p>}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function OverviewPage() {
  const { businessId, businessType, slug } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.get,
    refetchInterval: 60_000,
  })

  const growthSign  = (data?.revenueGrowthPercent ?? 0) >= 0 ? '+' : ''
  const growthColor = (data?.revenueGrowthPercent ?? 0) >= 0 ? 'text-green-600' : 'text-red-500'
  const isRestaurant = businessType === 'Restaurant'

  return (
    <div className="px-4 py-4 md:px-6 md:py-6 max-w-6xl space-y-4 md:space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Übersicht</h1>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-gray-400">Live</span>
        </div>
      </div>

      {/* KPIs */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 h-20 animate-pulse" />
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          <KpiCard label="Heute"        value={String(data.todayBookingCount)}   sub="Buchungen" />
          <KpiCard label="Bevorstehend" value={String(data.upcomingBookingCount)} sub="Buchungen" />
          <KpiCard
            label="Umsatz Mai"
            value={`CHF ${data.revenueThisMonth.toLocaleString('de-CH', { maximumFractionDigits: 0 })}`}
            sub={`${growthSign}${data.revenueGrowthPercent}% vs. Vormonat`}
            subColor={growthColor}
          />
          <KpiCard label="Kunden" value={String(data.totalCustomers)} sub="Gesamt" />
        </div>
      ) : null}

      {/* Booking link */}
      {slug && <BookingLinkPanel slug={slug} />}

      {/* Mobile: quick-access nav cards */}
      <div className="md:hidden grid grid-cols-2 gap-2.5">
        <Link to="/dashboard/dienstleistungen"
          className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between group">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Dienstleistungen</p>
            <p className="text-sm font-semibold text-gray-900">Verwalten →</p>
          </div>
        </Link>
        <Link to="/dashboard/mitarbeiter"
          className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between group">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Mitarbeiter</p>
            <p className="text-sm font-semibold text-gray-900">Verwalten →</p>
          </div>
        </Link>
        <Link to="/dashboard/bookings"
          className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between group">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Buchungen</p>
            <p className="text-sm font-semibold text-gray-900">Anzeigen →</p>
          </div>
        </Link>
        <Link to="/dashboard/abonnement"
          className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between group">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Abonnement</p>
            <p className="text-sm font-semibold text-gray-900">Verwalten →</p>
          </div>
        </Link>
      </div>

      {/* Mobile: today's schedule */}
      <div className="md:hidden">
        <SchedulePanel schedule={data?.todaySchedule ?? []} loading={isLoading} />
      </div>

      {/* Desktop: full management panels */}
      <div className={`hidden md:grid gap-4 ${isRestaurant ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2'}`}>
        <ServicesPanel businessId={businessId!} />
        <StaffPanel    businessId={businessId!} />
        {isRestaurant && <TablesPanel businessId={businessId!} />}
      </div>

      {/* Desktop: bottom row */}
      <div className="hidden md:grid md:grid-cols-2 gap-4">
        <HoursPanel businessId={businessId!} />
        <SchedulePanel schedule={data?.todaySchedule ?? []} loading={isLoading} />
      </div>
    </div>
  )
}

// ── Services Panel ────────────────────────────────────────────────────────────

function ServicesPanel({ businessId }: { businessId: string }) {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
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

  const filtered = services.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )
  const preview = filtered.slice(0, PREVIEW_LIMIT)
  const hasMore = filtered.length > PREVIEW_LIMIT

  return (
    <PanelCard
      title="Dienstleistungen"
      count={services.filter(s => s.isActive).length}
      allLink="/dashboard/dienstleistungen"
      allCount={services.length}
    >
      <input
        placeholder="Suchen…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className={`${inputCls} mb-2`}
      />

      <div className="divide-y divide-gray-50 max-h-52 overflow-y-auto">
        {preview.map(s => (
          <div key={s.id}>
            {editId === s.id ? (
              <InlineServiceForm
                form={form} setForm={setForm}
                onSave={() => updateMut.mutate(s)}
                onCancel={() => setEditId(null)}
                saving={updateMut.isPending}
              />
            ) : (
              <div className="flex items-center justify-between py-2 px-1">
                <div className="min-w-0 mr-2">
                  <p className="text-sm font-medium text-gray-800 truncate">{s.name}</p>
                  <p className="text-xs text-gray-400">{s.durationMinutes} Min · CHF {s.price.toFixed(2)}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => startEdit(s)} className="text-xs text-gray-500 hover:text-gray-900 hover:underline">Bearbeiten</button>
                  <button onClick={() => deleteMut.mutate(s.id)} className="text-xs text-red-400 hover:underline">Entfernen</button>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && !open && (
          <p className="py-3 text-xs text-center text-gray-400">Keine Einträge</p>
        )}
      </div>

      {hasMore && (
        <Link to="/dashboard/dienstleistungen" className="block text-xs text-gray-400 mt-1 hover:text-gray-900">
          + {filtered.length - PREVIEW_LIMIT} weitere →
        </Link>
      )}

      {open ? (
        <InlineServiceForm
          form={form} setForm={setForm}
          onSave={() => createMut.mutate()}
          onCancel={() => { setOpen(false); resetForm() }}
          saving={createMut.isPending}
        />
      ) : (
        <button onClick={() => setOpen(true)} className="mt-2 text-xs text-green-700 hover:underline">
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
        placeholder="Name (z.B. Haarschnitt)" value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        className={inputCls}
      />
      <input
        placeholder="Beschreibung (z.B. Waschen & Schneiden)" value={form.description}
        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        className={inputCls}
      />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-xs text-gray-400 mb-1">Dauer (Min)</p>
          <input type="number" value={form.durationMinutes}
            onChange={e => setForm(f => ({ ...f, durationMinutes: +e.target.value }))}
            className={inputCls}
          />
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Preis (CHF)</p>
          <input type="number" step="0.01" value={form.price}
            onChange={e => setForm(f => ({ ...f, price: +e.target.value }))}
            className={inputCls}
          />
        </div>
      </div>
      <SaveCancelButtons onSave={onSave} onCancel={onCancel} saving={saving} />
    </div>
  )
}

// ── Staff Panel ───────────────────────────────────────────────────────────────

function StaffPanel({ businessId }: { businessId: string }) {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
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

  const filtered = staff.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  )
  const preview = filtered.slice(0, PREVIEW_LIMIT)
  const hasMore = filtered.length > PREVIEW_LIMIT

  return (
    <PanelCard
      title="Mitarbeiter"
      count={staff.filter(s => s.isActive).length}
      allLink="/dashboard/mitarbeiter"
      allCount={staff.length}
    >
      <input
        placeholder="Suchen…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className={`${inputCls} mb-2`}
      />

      <div className="divide-y divide-gray-50 max-h-52 overflow-y-auto">
        {preview.map(s => (
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
              <div className="flex items-center justify-between py-2 px-1">
                <div className="min-w-0 mr-2">
                  <p className="text-sm font-medium text-gray-800 truncate">{s.name}</p>
                  <p className="text-xs text-gray-400 truncate">{s.email}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => startEdit(s)} className="text-xs text-gray-500 hover:text-gray-900 hover:underline">Bearbeiten</button>
                  <button onClick={() => deleteMut.mutate(s.id)} className="text-xs text-red-400 hover:underline">Entfernen</button>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && !open && (
          <p className="py-3 text-xs text-center text-gray-400">Keine Einträge</p>
        )}
      </div>

      {hasMore && (
        <Link to="/dashboard/mitarbeiter" className="block text-xs text-gray-400 mt-1 hover:text-gray-900">
          + {filtered.length - PREVIEW_LIMIT} weitere →
        </Link>
      )}

      {open ? (
        <div className="py-2 space-y-2">
          <input placeholder="Name (z.B. Anna Müller)" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
          <div className="flex gap-2">
            <input type="email" placeholder="E-Mail" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={`${inputCls} flex-1`} />
            <SaveCancelButtons onSave={() => createMut.mutate()} onCancel={() => setOpen(false)} saving={createMut.isPending} />
          </div>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="mt-2 text-xs text-green-700 hover:underline">
          + Hinzufügen
        </button>
      )}
    </PanelCard>
  )
}

// ── Tables Panel ──────────────────────────────────────────────────────────────

function TablesPanel({ businessId }: { businessId: string }) {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
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

  const filtered = tables.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  )
  const preview = filtered.slice(0, PREVIEW_LIMIT)
  const hasMore = filtered.length > PREVIEW_LIMIT

  return (
    <PanelCard
      title="Tische"
      count={tables.filter(t => t.isActive).length}
      allLink="/dashboard/tische"
      allCount={tables.length}
    >
      <input
        placeholder="Suchen…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className={`${inputCls} mb-2`}
      />

      <div className="divide-y divide-gray-50 max-h-52 overflow-y-auto">
        {preview.map(t => (
          <div key={t.id}>
            {editId === t.id ? (
              <div className="py-2 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="Name" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Personen</p>
                    <input type="number" min={1} value={form.capacity}
                      onChange={e => setForm(f => ({ ...f, capacity: +e.target.value }))} className={inputCls} />
                  </div>
                </div>
                <SaveCancelButtons onSave={() => updateMut.mutate(t)} onCancel={() => setEditId(null)} saving={updateMut.isPending} />
              </div>
            ) : (
              <div className="flex items-center justify-between py-2 px-1">
                <div>
                  <p className="text-sm font-medium text-gray-800">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.capacity} Personen</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => startEdit(t)} className="text-xs text-gray-500 hover:text-gray-900 hover:underline">Bearbeiten</button>
                  <button onClick={() => deleteMut.mutate(t.id)} className="text-xs text-red-400 hover:underline">Entfernen</button>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && !open && (
          <p className="py-3 text-xs text-center text-gray-400">Keine Einträge</p>
        )}
      </div>

      {hasMore && (
        <Link to="/dashboard/tische" className="block text-xs text-gray-400 mt-1 hover:text-gray-900">
          + {filtered.length - PREVIEW_LIMIT} weitere →
        </Link>
      )}

      {open ? (
        <div className="py-2 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Name (z.B. Tisch 1)" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
            <div>
              <p className="text-xs text-gray-400 mb-1">Personen</p>
              <input type="number" min={1} value={form.capacity}
                onChange={e => setForm(f => ({ ...f, capacity: +e.target.value }))} className={inputCls} />
            </div>
          </div>
          <SaveCancelButtons onSave={() => createMut.mutate()} onCancel={() => setOpen(false)} saving={createMut.isPending} />
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="mt-2 text-xs text-green-700 hover:underline">
          + Hinzufügen
        </button>
      )}
    </PanelCard>
  )
}

// ── Hours ─────────────────────────────────────────────────────────────────────

const DAY_NAMES = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

const DEFAULT_HOURS = Array.from({ length: 7 }, (_, i) => ({
  dayOfWeek: i, openTime: '09:00', closeTime: '18:00', isClosed: i === 0,
}))

function toTimeStr(t: string) {
  // API returns "HH:mm:ss" — trim to "HH:mm"
  return t.slice(0, 5)
}

function HoursPanel({ businessId }: { businessId: string }) {
  const [hours, setHours] = useState(DEFAULT_HOURS)
  const [saved, setSaved] = useState(false)

  const { data: loaded } = useQuery({
    queryKey: ['business-hours', businessId],
    queryFn: () => businessApi.getHours(businessId),
    enabled: !!businessId,
  })

  useEffect(() => {
    if (!loaded || loaded.length === 0) return
    const mapped = DEFAULT_HOURS.map(def => {
      const found = loaded.find((h: { dayOfWeek: number }) => h.dayOfWeek === def.dayOfWeek)
      if (!found) return def
      return {
        dayOfWeek: found.dayOfWeek,
        openTime: toTimeStr((found as { openTime: string }).openTime),
        closeTime: toTimeStr((found as { closeTime: string }).closeTime),
        isClosed: (found as { isClosed: boolean }).isClosed,
      }
    })
    setHours(mapped)
  }, [loaded])

  const saveMut = useMutation({
    mutationFn: () => businessApi.setHours(businessId, { hours }),
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
                className="accent-gray-900" />
              <span className="text-xs text-gray-400">Zu</span>
            </label>
            {!h.isClosed ? (
              <>
                <input type="time" value={h.openTime}
                  onChange={e => setDay(i, { openTime: e.target.value })}
                  className="border border-gray-200 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:border-gray-900" />
                <span className="text-gray-300 text-xs">–</span>
                <input type="time" value={h.closeTime}
                  onChange={e => setDay(i, { closeTime: e.target.value })}
                  className="border border-gray-200 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:border-gray-900" />
              </>
            ) : (
              <span className="text-xs text-gray-300">Geschlossen</span>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={() => saveMut.mutate()}
        disabled={saveMut.isPending}
        className="mt-3 text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 disabled:opacity-60"
      >
        {saved ? 'Gespeichert ✓' : saveMut.isPending ? 'Wird gespeichert…' : 'Speichern'}
      </button>
    </PanelCard>
  )
}

// ── Schedule ──────────────────────────────────────────────────────────────────

function SchedulePanel({ schedule, loading }: { schedule: UpcomingBookingItem[]; loading?: boolean }) {
  return (
    <PanelCard title="Heutiger Tagesplan">
      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}
        </div>
      ) : schedule.length === 0 ? (
        <p className="text-sm text-gray-400">Heute keine Buchungen</p>
      ) : (
        <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
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

// ── Booking Link Panel ────────────────────────────────────────────────────────

function BookingLinkPanel({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false)
  const [showQr, setShowQr] = useState(false)
  const url = `${window.location.origin}/book/${slug}`

  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Buchungslink</p>

      {/* URL + copy row */}
      <div className="flex items-center gap-2 mb-3">
        <p className="text-sm text-gray-600 font-mono truncate flex-1">{url}</p>
        <button
          onClick={copy}
          className="shrink-0 text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors whitespace-nowrap"
        >
          {copied ? '✓ Kopiert' : 'Kopieren'}
        </button>
      </div>

      {/* Secondary actions */}
      <div className="flex gap-2">
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          Vorschau →
        </a>
        <button
          onClick={() => setShowQr(v => !v)}
          className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors hidden sm:block"
        >
          {showQr ? 'QR ausblenden' : 'QR-Code'}
        </button>
      </div>

      {showQr && (
        <div className="mt-3 bg-white p-3 rounded-xl border border-gray-200 w-fit">
          <QRCodeSVG value={url} size={120} />
          <p className="text-xs text-center text-gray-400 mt-1">Zum Drucken</p>
        </div>
      )}
    </div>
  )
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

function PanelCard({ title, count, allLink, allCount, children }: {
  title: string
  count?: number
  allLink?: string
  allCount?: number
  children: React.ReactNode
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
        <div className="flex items-center gap-2">
          {count !== undefined && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
              {count}
            </span>
          )}
          {allLink && (
            <Link to={allLink} className="text-xs text-gray-400 hover:text-gray-900 transition-colors">
              Alle anzeigen ({allCount}) →
            </Link>
          )}
        </div>
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
      <button onClick={onSave} disabled={saving}
        className="text-xs bg-gray-900 text-white px-2.5 py-1.5 rounded-lg hover:bg-gray-800 disabled:opacity-60">
        {saving ? '…' : '✓'}
      </button>
      <button onClick={onCancel} className="text-xs text-gray-400 hover:text-gray-600 px-1.5">✕</button>
    </div>
  )
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-gray-900'
