import { Link } from 'react-router-dom'
import { Logo } from '../../components/Logo'

const PRODUCT = [
  { label: 'Funktionen', anchor: 'features' },
  { label: 'Preise', anchor: 'pricing' },
  { label: "So funktioniert's", anchor: 'how-it-works' },
]

const LEGAL = ['Datenschutz', 'Nutzungsbedingungen', 'Cookie-Richtlinie']

export function Footer() {
  return (
    <footer className="bg-gray-950 border-t border-white/5 px-6 py-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="mb-4 inline-block">
              <Logo size={30} light />
            </Link>
            <p className="text-sm text-white/30 leading-relaxed max-w-[200px]">
              Online-Buchungen & Zahlungen für Schweizer Kleinunternehmen.
            </p>
            <div className="mt-5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-white/25">Alle Systeme normal</span>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-white/20 uppercase tracking-widest mb-4">Produkt</p>
            <ul className="space-y-3">
              {PRODUCT.map(({ label, anchor }) => (
                <li key={anchor}>
                  <a href={`#${anchor}`} className="text-sm text-white/40 hover:text-white transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-white/20 uppercase tracking-widest mb-4">Konto</p>
            <ul className="space-y-3">
              <li><Link to="/login" className="text-sm text-white/40 hover:text-white transition-colors">Anmelden</Link></li>
              <li><Link to="/register" className="text-sm text-white/40 hover:text-white transition-colors">Registrieren</Link></li>
              <li><Link to="/dashboard" className="text-sm text-white/40 hover:text-white transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-white/20 uppercase tracking-widest mb-4">Rechtliches</p>
            <ul className="space-y-3">
              {LEGAL.map(l => (
                <li key={l}>
                  <a href="#" className="text-sm text-white/40 hover:text-white transition-colors">{l}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/20">© {new Date().getFullYear()} Jadify AG. Hergestellt in der Schweiz 🇨🇭</p>
          <div className="flex items-center gap-4">
            <p className="text-xs text-white/20">
              Zahlungen gesichert durch{' '}
              <span className="text-indigo-400 font-medium">Stripe</span>
            </p>
            <div className="w-px h-3 bg-white/10" />
            <p className="text-xs text-white/20">SOC 2 · PCI DSS</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
