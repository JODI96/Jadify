import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const EASE = [0.21, 0.47, 0.32, 0.98] as const

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}
const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
}

export function Hero() {
  return (
    <section className="relative min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center overflow-hidden pt-20 pb-10 sm:pb-0">
      {/* Ambient glow — desktop only, too expensive for mobile Safari */}
      <div className="absolute inset-0 -z-0 hidden sm:block">
        <div className="absolute top-[-10%] left-[20%] w-[700px] h-[700px] bg-green-700/20 rounded-full blur-[140px]" />
        <div className="absolute top-[30%] right-[10%] w-[400px] h-[400px] bg-green-800/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[10%] left-[30%] w-[500px] h-[500px] bg-green-900/10 rounded-full blur-[120px]" />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 -z-0"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <motion.div
        variants={stagger} initial="hidden" animate="show"
        className="relative z-10 text-center px-6 max-w-5xl mx-auto"
      >
        {/* Badge */}
        <motion.div variants={item} className="inline-flex items-center gap-2.5 mb-10">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 text-white/40 text-xs font-medium px-3.5 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            Für Schweizer Salons & Restaurants
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1 variants={item}
          className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-[-0.02em] mb-6">
          <span className="block">Dein Buchungssystem.</span>
          <span className="block text-green-400">Einfach, schnell,</span>
          <span className="block text-green-400">professionell.</span>
        </motion.h1>

        {/* Sub */}
        <motion.p variants={item}
          className="text-sm sm:text-base text-white/35 max-w-lg mx-auto leading-relaxed mb-10">
          Für Schweizer Betriebe. Buchungsseite, Stripe-Zahlung, E-Mail-Bestätigung und Dashboard —
          alles in einem. In unter <span className="text-white/60 font-medium">5 Minuten</span> startklar.
        </motion.p>

        {/* CTAs */}
        <motion.div variants={item} className="flex flex-col sm:flex-row gap-3 justify-center mb-14">
          <Link to="/register"
            className="group relative bg-white text-gray-900 font-bold px-8 py-4 rounded-2xl text-sm hover:bg-gray-50 transition-all shadow-2xl shadow-white/10 overflow-hidden">
            <span className="relative z-10">Jetzt kostenlos starten →</span>
          </Link>
          <a href="#how-it-works"
            className="font-medium text-sm px-8 py-4 rounded-2xl border border-white/10 text-white/70 hover:border-white/20 hover:text-white hover:bg-white/5 transition-all">
            Live-Demo ansehen
          </a>
        </motion.div>

        {/* Social proof numbers */}
        <motion.div variants={item}
          className="flex flex-wrap justify-center gap-8 mb-16 text-center">
          {[
            { n: '500+', l: 'Unternehmen' },
            { n: '10\'000+', l: 'Buchungen' },
            { n: '4.9 ★', l: 'Bewertung' },
            { n: 'CHF 0', l: 'Startkosten' },
          ].map(({ n, l }) => (
            <div key={l}>
              <div className="text-2xl font-bold text-white">{n}</div>
              <div className="text-xs text-white/40 mt-0.5">{l}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.8 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-10"
      >
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/20">Scroll</span>
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          className="w-px h-7 bg-gradient-to-b from-white/20 to-transparent"
        />
      </motion.div>

      {/* App mockup */}
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, delay: 0.6, ease: EASE }}
        className="relative z-10 w-full max-w-5xl px-4 sm:px-6 pb-0"
      >
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-24 bg-green-700/30 blur-3xl hidden sm:block" />

        <div className="relative bg-white/5 border border-white/10 rounded-t-2xl sm:rounded-t-3xl overflow-hidden sm:backdrop-blur-sm shadow-[0_-20px_80px_rgba(22,163,74,0.1)]">

          {/* Browser bar */}
          <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 sm:py-3.5 border-b border-white/10 bg-white/5">
            <div className="flex gap-1 sm:gap-1.5 shrink-0">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500/60" />
            </div>
            <div className="flex-1 bg-white/5 border border-white/10 rounded-md px-2 sm:px-3 py-1 text-center min-w-0">
              <span className="text-white/30 text-[10px] sm:text-xs">app.jadify.ch/book/</span>
              <span className="text-green-400 text-[10px] sm:text-xs font-medium">salon-bella-zuerich</span>
            </div>
          </div>

          {/* Booking widget — single column on mobile, 3-col on desktop */}
          <div className="p-3 sm:p-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:min-h-[280px]">

            {/* Booking card */}
            <div className="sm:col-span-2 bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xl">
              <div className="flex items-center gap-2 sm:gap-3 mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-lg shrink-0">S</div>
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 text-xs sm:text-sm">Salon Bella</div>
                  <div className="text-[10px] sm:text-xs text-gray-400">Zürich · 4.9 ★</div>
                </div>
                <div className="ml-auto bg-green-50 text-green-700 text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full shrink-0">Geöffnet</div>
              </div>

              <p className="text-[10px] sm:text-xs font-medium text-gray-500 mb-1.5 sm:mb-2 uppercase tracking-wide">Dienstleistungen</p>
              <div className="space-y-1.5 sm:space-y-2 mb-3">
                {[
                  { n: 'Haarschnitt & Styling', d: '60 Min.', p: 'CHF 65', sel: true },
                  { n: 'Farbe & Highlights', d: '120 Min.', p: 'CHF 145', sel: false },
                ].map(s => (
                  <div key={s.n} className={`flex items-center justify-between p-2 sm:p-2.5 rounded-lg sm:rounded-xl border text-[10px] sm:text-xs
                    ${s.sel ? 'border-green-500 bg-green-50' : 'border-gray-100'}`}>
                    <div className="min-w-0 mr-2">
                      <div className={`font-semibold truncate ${s.sel ? 'text-green-800' : 'text-gray-700'}`}>{s.n}</div>
                      <div className="text-gray-400">{s.d}</div>
                    </div>
                    <div className={`font-bold shrink-0 ${s.sel ? 'text-green-700' : 'text-gray-600'}`}>{s.p}</div>
                  </div>
                ))}
              </div>

              <p className="text-[10px] sm:text-xs font-medium text-gray-500 mb-1.5 sm:mb-2 uppercase tracking-wide">Freie Zeiten</p>
              <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
                {['09:00', '09:30', '10:30', '11:00', '14:00', '15:30', '16:00', '17:30'].map((t, i) => (
                  <div key={t} className={`text-center py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-medium border
                    ${i === 2 ? 'bg-green-700 text-white border-green-700' : 'border-gray-200 text-gray-600'}`}>{t}</div>
                ))}
              </div>
            </div>

            {/* Stats — desktop only */}
            <div className="hidden sm:flex flex-col gap-3">
              {[
                { l: 'Heute', v: '8 Buchungen', c: 'text-white' },
                { l: 'Einnahmen Mai', v: "CHF 3'840", c: 'text-emerald-400' },
                { l: 'Kunden total', v: '247', c: 'text-white' },
              ].map(s => (
                <div key={s.l} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="text-white/40 text-xs mb-1">{s.l}</div>
                  <div className={`font-bold text-lg ${s.c}`}>{s.v}</div>
                </div>
              ))}
              <div className="bg-green-700/20 border border-green-600/30 rounded-2xl p-4 flex-1 flex flex-col justify-center">
                <div className="text-green-300 text-xs mb-2">Nächste Buchung</div>
                <div className="text-white font-semibold text-sm">Anna M.</div>
                <div className="text-white/50 text-xs">14:00 · Haarschnitt</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
