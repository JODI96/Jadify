import { Link } from 'react-router-dom'
import { FadeUp } from './index'

const PLANS = [
  {
    name: 'Free',
    price: 'CHF 0',
    period: 'für immer',
    fee: '2% Plattformgebühr',
    desc: 'Perfekt zum Starten.',
    features: [
      'Unbegrenzte Buchungen',
      'Öffentliche Buchungsseite',
      'Stripe-Zahlungen',
      'E-Mail-Bestätigungen',
      'Basis-Dashboard',
    ],
    cta: 'Kostenlos starten',
    highlight: false,
    accentClass: 'border-white/10',
  },
  {
    name: 'Growth',
    price: 'CHF 29',
    period: 'pro Monat',
    fee: '0.5% Plattformgebühr',
    desc: 'Für wachsende Unternehmen.',
    features: [
      'Alles aus Free',
      'Logo & Branding',
      'Prioritäts-Support',
      'Erweiterte Verfügbarkeit',
      'Umsatzanalysen',
    ],
    cta: 'Jetzt starten',
    highlight: true,
    accentClass: 'border-indigo-500/50',
  },
  {
    name: 'Pro',
    price: 'CHF 79',
    period: 'pro Monat',
    fee: '0% Plattformgebühr',
    desc: 'Für etablierte Betriebe.',
    features: [
      'Alles aus Growth',
      'Keine Plattformgebühr',
      'API-Zugang',
      'Persönlicher Ansprechpartner',
      'Eigene Domain',
    ],
    cta: 'Jetzt starten',
    highlight: false,
    accentClass: 'border-white/10',
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="py-32 bg-gray-950 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-900/20 rounded-full blur-[160px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <FadeUp className="text-center mb-20">
          <p className="text-sm font-semibold text-indigo-400 uppercase tracking-widest mb-4">Preise</p>
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            Einfach. Transparent. Fair.
          </h2>
          <p className="mt-4 text-xl text-white/40 max-w-xl mx-auto">
            Gratis starten. Upgraden, wenn dein Business wächst.
          </p>
        </FadeUp>

        <div className="grid md:grid-cols-3 gap-5 items-stretch">
          {PLANS.map((plan, i) => (
            <FadeUp key={plan.name} delay={i * 0.12}>
              <div className={`relative flex flex-col rounded-3xl p-8 h-full border transition-all
                ${plan.highlight
                  ? 'bg-gradient-to-b from-indigo-600/20 to-violet-600/10 border-indigo-500/40 shadow-2xl shadow-indigo-900/40'
                  : 'bg-white/5 border-white/10 hover:bg-white/8'}`}>

                {plan.highlight && (
                  <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
                )}
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-[11px] font-bold px-4 py-1.5 rounded-full shadow-lg">
                      Beliebteste Wahl
                    </span>
                  </div>
                )}

                <div className="mb-7">
                  <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${plan.highlight ? 'text-indigo-400' : 'text-white/40'}`}>
                    {plan.name}
                  </p>
                  <div className="flex items-end gap-1.5 mb-1">
                    <span className="text-5xl font-black text-white">{plan.price}</span>
                    <span className="text-white/30 text-sm mb-2">/{plan.period}</span>
                  </div>
                  <p className={`text-sm font-medium ${plan.highlight ? 'text-indigo-300' : 'text-white/40'}`}>{plan.fee}</p>
                </div>

                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${plan.highlight ? 'bg-indigo-500' : 'bg-white/10'}`}>
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-white/60">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/register"
                  className={`block text-center py-3.5 rounded-2xl text-sm font-bold transition-all
                    ${plan.highlight
                      ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:opacity-90 shadow-lg shadow-indigo-900/50'
                      : 'bg-white/10 text-white hover:bg-white/15 border border-white/10'}`}
                >
                  {plan.cta} →
                </Link>
              </div>
            </FadeUp>
          ))}
        </div>

        <FadeUp delay={0.4}>
          <p className="text-center text-white/25 text-sm mt-10">
            Keine Kreditkarte für den Free-Plan · Jederzeit kündbar · Swiss Hosting
          </p>
        </FadeUp>
      </div>
    </section>
  )
}
