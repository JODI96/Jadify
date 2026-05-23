import { Link } from 'react-router-dom'
import { FadeUp } from './index'

export function CtaBanner() {
  return (
    <section className="py-32 bg-gray-950 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-indigo-600/25 rounded-full blur-[120px]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <FadeUp>
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-indigo-300 text-xs font-medium px-4 py-2 rounded-full mb-8">
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
            Jetzt kostenlos — keine Kreditkarte nötig
          </div>
        </FadeUp>

        <FadeUp delay={0.1}>
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.05] mb-6">
            Dein Business.<br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              Startklar in 5 Min.
            </span>
          </h2>
        </FadeUp>

        <FadeUp delay={0.2}>
          <p className="text-xl text-white/40 mb-12 max-w-2xl mx-auto leading-relaxed">
            Hunderte Schweizer Salons und Restaurants buchen und bezahlen bereits über Jadify.
            Warte nicht länger.
          </p>
        </FadeUp>

        <FadeUp delay={0.3}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              to="/register"
              className="group relative bg-white text-gray-900 font-bold px-10 py-4 rounded-2xl text-sm hover:bg-gray-50 transition-all shadow-2xl shadow-white/10 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-100/0 via-indigo-100/0 to-indigo-100/0 group-hover:from-indigo-50 group-hover:via-white group-hover:to-violet-50 transition-all duration-500" />
              <span className="relative z-10">Kostenloses Konto erstellen →</span>
            </Link>
            <Link
              to="/login"
              className="font-medium text-sm px-10 py-4 rounded-2xl border border-white/10 text-white/60 hover:border-white/20 hover:text-white hover:bg-white/5 transition-all"
            >
              Anmelden
            </Link>
          </div>
        </FadeUp>

        <FadeUp delay={0.4}>
          <div className="flex flex-wrap items-center justify-center gap-6 text-white/25 text-xs">
            {['Keine Kreditkarte', 'Jederzeit kündbar', 'Swiss Hosting', 'DSGVO-konform'].map((t, i) => (
              <span key={t} className="flex items-center gap-1.5">
                {i > 0 && <span className="w-1 h-1 rounded-full bg-white/15" />}
                ✓ {t}
              </span>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  )
}
