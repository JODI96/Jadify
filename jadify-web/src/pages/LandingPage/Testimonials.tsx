import { FadeUp } from './index'

const TESTIMONIALS = [
  {
    quote: 'Jadify hat den Aufwand am Telefon halbiert. Die Kunden buchen selbst — ich bin einfach da und schneide.',
    name: 'Sophie M.',
    role: 'Inhaberin, Salon Bella Zürich',
    initials: 'SM',
    metric: '−50%',
    metricLabel: 'Telefonanrufe',
    from: 'from-pink-500',
    to: 'to-rose-600',
  },
  {
    quote: 'Die Buchungsseite wirkt so professionell. Kunden erwähnen es jedes Mal. Und Stripe läuft einfach — ohne Probleme.',
    name: 'Luca B.',
    role: 'Coiffeur, Basel',
    initials: 'LB',
    metric: '+38%',
    metricLabel: 'Umsatz',
    from: 'from-indigo-500',
    to: 'to-violet-600',
  },
  {
    quote: 'Von Papierkalender auf vollständig digital — an einem Nachmittag. Ich wünschte, ich hätte das früher gemacht.',
    name: 'Nadine R.',
    role: 'Geschäftsführerin, Restaurant Lac Genf',
    initials: 'NR',
    metric: '4 Min.',
    metricLabel: 'Einrichtung',
    from: 'from-emerald-500',
    to: 'to-teal-600',
  },
]

function Stars() {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className="w-3.5 h-3.5 text-yellow-400 fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export function Testimonials() {
  return (
    <section className="py-32 bg-white relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-indigo-50 rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-50 rounded-full blur-[100px] opacity-50" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <FadeUp className="text-center mb-20">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest mb-4">Kundenstimmen</p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-gray-900">
            Geliebt von Schweizer Unternehmen.
          </h2>
          <p className="mt-4 text-xl text-gray-400 max-w-xl mx-auto">
            Echte Ergebnisse von echten Kunden.
          </p>
        </FadeUp>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <FadeUp key={t.name} delay={i * 0.12}>
              <div className="group relative bg-gray-50 border border-gray-100 rounded-3xl p-7 hover:shadow-xl hover:shadow-gray-100 hover:-translate-y-1 transition-all duration-300">
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${t.from} ${t.to} rounded-t-3xl opacity-0 group-hover:opacity-100 transition-opacity`} />

                <div className="flex items-start justify-between mb-5">
                  <Stars />
                  <div className="text-right">
                    <div className={`text-2xl font-black bg-gradient-to-br ${t.from} ${t.to} bg-clip-text text-transparent`}>
                      {t.metric}
                    </div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide">{t.metricLabel}</div>
                  </div>
                </div>

                <p className="text-gray-700 text-sm leading-relaxed mb-6">«{t.quote}»</p>

                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${t.from} ${t.to} flex items-center justify-center text-white text-xs font-bold shadow-lg`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>

        <FadeUp delay={0.4}>
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-center">
            {[
              { n: '4.9/5', l: 'Ø Bewertung' },
              { n: '500+', l: 'Aktive Unternehmen' },
              { n: '10\'000+', l: 'Buchungen' },
              { n: '99.9%', l: 'Uptime' },
            ].map(({ n, l }) => (
              <div key={l} className="min-w-[100px]">
                <div className="text-3xl font-black text-gray-900">{n}</div>
                <div className="text-xs text-gray-400 mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  )
}
