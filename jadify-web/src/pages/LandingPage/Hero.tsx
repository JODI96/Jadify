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
    <section className="relative min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center overflow-hidden pt-20">
      {/* Ambient glow */}
      <div className="absolute inset-0 -z-0">
        <div className="absolute top-[-10%] left-[20%] w-[700px] h-[700px] bg-indigo-600/20 rounded-full blur-[140px]" />
        <div className="absolute top-[30%] right-[10%] w-[400px] h-[400px] bg-violet-600/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-[10%] left-[30%] w-[500px] h-[500px] bg-indigo-800/10 rounded-full blur-[120px]" />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 -z-0"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <motion.div
        variants={stagger} initial="hidden" animate="show"
        className="relative z-10 text-center px-6 max-w-5xl mx-auto"
      >
        {/* Badge */}
        <motion.div variants={item} className="inline-flex items-center gap-2.5 mb-8">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 backdrop-blur-sm text-indigo-300 text-xs font-medium px-4 py-2 rounded-full">
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
            Die #1 Buchungsplattform für die Schweiz
            <span className="text-white/30">—</span>
            <span className="text-white/60">Jetzt kostenlos</span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1 variants={item}
          className="text-5xl sm:text-6xl lg:text-[5.5rem] font-black text-white leading-[1.05] tracking-[-0.03em] mb-6">
          Dein Salon.<br />
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
            Immer buchbar.
          </span>
        </motion.h1>

        {/* Sub */}
        <motion.p variants={item}
          className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed mb-10 font-light">
          Jadify gibt Coiffeuren, Salons und Restaurants eine professionelle Buchungsseite
          mit Stripe-Zahlungen, automatischen Bestätigungen und einem Live-Dashboard —
          in unter <span className="text-white/80 font-medium">5 Minuten</span> startklar.
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

      {/* App mockup */}
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, delay: 0.6, ease: EASE }}
        className="relative z-10 w-full max-w-5xl px-6 pb-0"
      >
        {/* Glow under mockup */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-24 bg-indigo-600/30 blur-3xl" />

        <div className="relative bg-white/5 border border-white/10 rounded-t-3xl overflow-hidden backdrop-blur-sm shadow-[0_-20px_80px_rgba(99,102,241,0.15)]">
          {/* Browser bar */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/10 bg-white/5">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
            <div className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-center">
              <span className="text-white/30 text-xs">app.jadify.ch/book/</span>
              <span className="text-indigo-400 text-xs font-medium">salon-bella-zuerich</span>
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="p-6 grid grid-cols-3 gap-4 min-h-[280px]">
            {/* Left: booking widget */}
            <div className="col-span-2 bg-white rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">S</div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Salon Bella</div>
                  <div className="text-xs text-gray-400">Zürich · 4.9 ★</div>
                </div>
                <div className="ml-auto bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">Geöffnet</div>
              </div>
              <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Dienstleistungen</p>
              <div className="space-y-2 mb-4">
                {[
                  { n: 'Haarschnitt & Styling', d: '60 Min.', p: 'CHF 65', sel: true },
                  { n: 'Farbe & Highlights', d: '120 Min.', p: 'CHF 145', sel: false },
                  { n: 'Bart & Pflege', d: '30 Min.', p: 'CHF 35', sel: false },
                ].map(s => (
                  <div key={s.n} className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all
                    ${s.sel ? 'border-indigo-400 bg-indigo-50 shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}>
                    <div>
                      <div className={`font-semibold ${s.sel ? 'text-indigo-700' : 'text-gray-700'}`}>{s.n}</div>
                      <div className="text-gray-400">{s.d}</div>
                    </div>
                    <div className={`font-bold ${s.sel ? 'text-indigo-600' : 'text-gray-600'}`}>{s.p}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Freie Zeiten — Heute</p>
              <div className="grid grid-cols-4 gap-1.5">
                {['09:00', '09:30', '10:30', '11:00', '14:00', '15:30', '16:00', '17:30'].map((t, i) => (
                  <div key={t} className={`text-center py-1.5 rounded-lg text-xs font-medium border transition-all
                    ${i === 2 ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' : 'border-gray-200 text-gray-600 hover:border-indigo-300'}`}>{t}</div>
                ))}
              </div>
            </div>

            {/* Right: stats */}
            <div className="flex flex-col gap-3">
              {[
                { l: 'Heute', v: '8 Buchungen', c: 'text-white' },
                { l: 'Einnahmen Mai', v: 'CHF 3\'840', c: 'text-emerald-400' },
                { l: 'Kunden total', v: '247', c: 'text-white' },
              ].map(s => (
                <div key={s.l} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="text-white/40 text-xs mb-1">{s.l}</div>
                  <div className={`font-bold text-lg ${s.c}`}>{s.v}</div>
                </div>
              ))}
              <div className="bg-indigo-600/20 border border-indigo-500/30 rounded-2xl p-4 flex-1 flex flex-col justify-center">
                <div className="text-indigo-300 text-xs mb-2">Nächste Buchung</div>
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
