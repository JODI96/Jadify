import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const EASE = [0.21, 0.47, 0.32, 0.98] as const

const STEPS = [
  {
    n: '01',
    title: 'Unternehmen einrichten',
    body: 'Name, Dienstleistungen, Preise, Öffnungszeiten und Team — einmal eintragen, fertig. Dauert weniger als 5 Minuten.',
    accent: 'text-green-400',
    border: 'border-green-500/20',
    glyph: 'bg-green-500/10 text-green-400',
  },
  {
    n: '02',
    title: 'Link teilen',
    body: 'Du erhältst eine persönliche URL. Teile sie auf Instagram, in der Bio, auf Google My Business oder auf deiner Website.',
    accent: 'text-green-400',
    border: 'border-green-500/20',
    glyph: 'bg-green-500/10 text-green-400',
  },
  {
    n: '03',
    title: 'Kunden buchen & zahlen',
    body: 'Kunden buchen selbst und bezahlen direkt über Stripe — du wirst benachrichtigt und siehst alles im Dashboard.',
    accent: 'text-green-400',
    border: 'border-green-500/20',
    glyph: 'bg-green-500/10 text-green-400',
  },
]

// SVG icons per step
const ICONS = [
  // Storefront / setup
  <svg key="setup" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
  </svg>,
  // Link / share
  <svg key="link" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
  </svg>,
  // Payment / card
  <svg key="pay" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
  </svg>,
]

export function HowItWorks() {
  const sectionRef = useRef(null)
  const inView = useInView(sectionRef, { once: true, margin: '-80px' })

  return (
    <section id="how-it-works" className="py-32 bg-gray-950 relative overflow-hidden">
      {/* Subtle top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />

      <div ref={sectionRef} className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: EASE }}
          className="mb-20"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-green-400 mb-3">
            So funktioniert's
          </p>
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            In 3 Schritten online.
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-px bg-white/[0.05] rounded-3xl overflow-hidden">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.65, delay: 0.15 + i * 0.12, ease: EASE }}
              className="bg-gray-950 p-8 lg:p-10 relative group hover:bg-white/[0.02] transition-colors duration-300"
            >
              {/* Ghost number */}
              <div
                className={`absolute top-4 right-6 text-[96px] font-black select-none leading-none tabular-nums pointer-events-none ${step.accent} opacity-[0.06]`}
              >
                {step.n}
              </div>

              {/* Icon badge */}
              <div className={`w-11 h-11 rounded-2xl ${step.glyph} flex items-center justify-center mb-6`}>
                {ICONS[i]}
              </div>

              {/* Step number */}
              <div className={`text-xs font-bold tabular-nums mb-3 ${step.accent}`}>
                {step.n}
              </div>

              <h3 className="text-lg font-bold text-white mb-3 leading-snug">
                {step.title}
              </h3>
              <p className="text-white/35 text-sm leading-relaxed">
                {step.body}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Footer stat */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="mt-10 text-center"
        >
          <p className="text-white/20 text-sm">
            Ø Einrichtungszeit:{' '}
            <span className="text-white/45 font-semibold">4 Minuten 38 Sekunden</span>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
