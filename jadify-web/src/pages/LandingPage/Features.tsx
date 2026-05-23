import { useRef, useState, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'

const EASE = [0.21, 0.47, 0.32, 0.98] as const

function animateCount(
  setter: (v: number) => void,
  target: number,
  duration: number,
) {
  const start = performance.now()
  const frame = (now: number) => {
    const p = Math.min((now - start) / (duration * 1000), 1)
    const eased = 1 - Math.pow(1 - p, 3)
    setter(Math.round(eased * target))
    if (p < 1) requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}

function Card({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ── Booking card ──────────────────────────────────────────────
function BookingCard() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const [filled, setFilled] = useState<number[]>([])
  const [showNotif, setShowNotif] = useState(false)

  const SLOTS = ['09:00', '09:30', '10:30', '11:00', '14:00', '15:30', '16:00', '17:00']

  useEffect(() => {
    if (!inView) return
    const seq = [
      { slot: 2,  delay: 700  },
      { slot: 5,  delay: 1400 },
      { slot: 0,  delay: 2200 },
    ]
    const timers = seq.map(({ slot, delay }) =>
      setTimeout(() => {
        setFilled(p => [...p, slot])
        if (delay === 2200) setTimeout(() => setShowNotif(true), 400)
      }, delay),
    )
    return () => timers.forEach(clearTimeout)
  }, [inView])

  return (
    <div ref={ref} className="relative bg-white h-full rounded-3xl p-7 flex flex-col">
      <div className="mb-5">
        <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-indigo-600">
          Buchungsseite
        </span>
        <h3 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight mt-1.5">
          Deine Seite.<br />Sofort fertig.
        </h3>
        <p className="text-gray-400 text-sm mt-2">
          Einzigartiger Link — kein Konto für Kunden nötig.
        </p>
      </div>

      <div className="bg-gray-50 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-[10px] font-bold shadow-md">
            S
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-900">Salon Bella</div>
            <div className="text-[10px] text-gray-400">Zürich · 4.9 ★</div>
          </div>
          <div className="ml-auto bg-green-50 text-green-600 text-[10px] font-medium px-2 py-0.5 rounded-full">
            Geöffnet
          </div>
        </div>

        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Freie Zeiten heute
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          {SLOTS.map((slot, i) => (
            <motion.div
              key={slot}
              animate={
                filled.includes(i)
                  ? { backgroundColor: '#4f46e5', color: '#fff', borderColor: '#4f46e5', scale: [1, 1.08, 1] }
                  : {}
              }
              transition={{ duration: 0.28 }}
              className="text-center py-1.5 rounded-lg text-[10px] font-semibold border border-gray-200 text-gray-500"
            >
              {filled.includes(i) ? '✓' : slot}
            </motion.div>
          ))}
        </div>

        <div className="mt-3 text-[10px] text-gray-400 font-mono">
          jadify.ch/book/<span className="text-indigo-500 font-medium">salon-bella</span>
        </div>
      </div>

      {/* Floating notification */}
      <AnimatePresence>
        {showNotif && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="absolute top-5 right-5 bg-gray-900 text-white rounded-2xl px-4 py-3 shadow-2xl shadow-black/30 flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-900/40">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-bold leading-tight">Neue Buchung!</div>
              <div className="text-white/40 text-[10px] leading-tight mt-0.5">Anna M. — 10:30 Uhr</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Payment card ──────────────────────────────────────────────
function PaymentCard() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    if (!inView) return
    const t = setTimeout(() => setConfirmed(true), 1000)
    return () => clearTimeout(t)
  }, [inView])

  return (
    <div ref={ref} className="bg-white h-full rounded-3xl p-6 flex flex-col">
      <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-600">
        Zahlungen
      </span>
      <h3 className="text-xl font-black text-gray-900 leading-tight mt-1.5 mb-4">
        Bezahlt werden.<br />Automatisch.
      </h3>

      <div className="flex gap-2 mb-4">
        {['Karte', 'TWINT', 'Apple Pay'].map((m, i) => (
          <div
            key={m}
            className={`flex-1 text-center py-2 rounded-xl text-[11px] font-semibold border
              ${i === 0
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                : 'border-gray-100 text-gray-400'}`}
          >
            {m}
          </div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-2xl p-4 flex flex-col gap-3">
        <div>
          <div className="text-[11px] text-gray-400 mb-0.5">Haarschnitt & Styling</div>
          <div className="text-3xl font-black text-gray-900 tabular-nums">CHF 65.00</div>
        </div>

        <AnimatePresence>
          {confirmed && (
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="mt-3 bg-emerald-500 rounded-2xl px-4 py-3 flex items-center gap-3"
            >
              <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <div className="text-white text-xs font-bold">Bezahlt</div>
                <div className="text-white/60 text-[10px]">Stripe · sofort verfügbar</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Dashboard card ────────────────────────────────────────────
function DashCard() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const [revenue, setRevenue] = useState(0)
  const [bookings, setBookings] = useState(0)

  useEffect(() => {
    if (!inView) return
    animateCount(setRevenue, 3840, 1.8)
    animateCount(setBookings, 8, 1.1)
  }, [inView])

  return (
    <div ref={ref} className="bg-[#0d0d12] h-full rounded-3xl p-6 flex flex-col">
      <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-orange-400">Dashboard</span>
      <h3 className="text-xl font-black text-white leading-tight mt-1.5 mb-4">
        Alles auf einen Blick. <span className="text-white/25">Live.</span>
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4">
          <div className="text-white/30 text-[10px] uppercase tracking-wide mb-1.5">Heute</div>
          <div className="text-3xl font-black text-white tabular-nums">{bookings}</div>
          <div className="text-white/25 text-[10px] mt-0.5">Buchungen</div>
        </div>

        <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4">
          <div className="text-white/30 text-[10px] uppercase tracking-wide mb-1.5">Mai Umsatz</div>
          <div className="text-xl font-black text-emerald-400 tabular-nums">
            CHF {revenue.toLocaleString('de-CH')}
          </div>
          <div className="text-white/25 text-[10px] mt-0.5 flex items-center gap-1">
            <span className="text-emerald-400">↑ +18%</span> vs. April
          </div>
        </div>

        <div className="col-span-2 bg-indigo-500/[0.08] border border-indigo-500/[0.15] rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/30 flex items-center justify-center shrink-0">
            <span className="text-indigo-300 text-sm font-bold">A</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-bold">Anna M.</div>
            <div className="text-white/30 text-xs">Nächste Buchung · 14:00 · Haarschnitt</div>
          </div>
          <div className="shrink-0 bg-indigo-600/20 border border-indigo-500/20 rounded-lg px-2.5 py-1.5 text-indigo-300 text-[10px] font-semibold">
            14:00
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Stat cards (stacked in col 3, row 1) ─────────────────────
function FreeCard() {
  return (
    <div className="bg-[#0d0d12] rounded-3xl p-5 flex flex-col justify-between overflow-hidden relative flex-1 min-h-[140px]">
      <div className="absolute bottom-0 right-2 text-[88px] font-black text-white/[0.04] select-none leading-none tabular-nums pointer-events-none">
        0
      </div>
      <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/20">
        Startkosten
      </span>
      <div>
        <div className="text-5xl font-black text-white leading-none tabular-nums">CHF 0</div>
        <p className="text-white/25 text-sm mt-2">Für immer.</p>
      </div>
    </div>
  )
}

function CounterCard() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView) return
    animateCount(setCount, 10000, 2.0)
  }, [inView])

  return (
    <div ref={ref} className="bg-indigo-600 rounded-3xl p-5 flex flex-col justify-between overflow-hidden relative flex-1 min-h-[140px]">
      <div className="absolute bottom-0 right-2 text-[72px] font-black text-white/[0.12] select-none leading-none pointer-events-none">
        ∞
      </div>
      <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-indigo-200">
        Buchungen
      </span>
      <div>
        <div className="text-4xl font-black text-white leading-none tabular-nums">
          {count.toLocaleString('de-CH')}+
        </div>
        <p className="text-indigo-200/60 text-xs mt-1.5">verarbeitet</p>
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────
export function Features() {
  return (
    <section id="features" className="py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <Card className="mb-10" delay={0}>
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-indigo-600 mb-3">
            Funktionen
          </p>
          <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
            Alles drin. Nichts zu viel.
          </h2>
        </Card>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Row 1 */}
          <Card className="md:col-span-2 min-h-[360px]" delay={0.05}>
            <BookingCard />
          </Card>

          <Card className="flex flex-col gap-4 h-full min-h-[360px]" delay={0.12}>
            <FreeCard />
            <CounterCard />
          </Card>

          {/* Row 2 */}
          <Card className="min-h-[300px]" delay={0.08}>
            <PaymentCard />
          </Card>

          <Card className="md:col-span-2 min-h-[300px]" delay={0.04}>
            <DashCard />
          </Card>
        </div>
      </div>
    </section>
  )
}
