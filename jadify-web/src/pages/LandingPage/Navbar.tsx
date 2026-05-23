import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../store/authStore'
import { Logo } from '../../components/Logo'

const NAV = [
  { label: 'Funktionen', anchor: 'features' },
  { label: "So funktioniert's", anchor: 'how-it-works' },
  { label: 'Preise', anchor: 'pricing' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { token } = useAuth()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500
        ${scrolled ? 'bg-white/90 backdrop-blur-2xl border-b border-gray-100 shadow-sm' : ''}`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-18 flex items-center justify-between py-4">
        <Link to="/">
          <Logo size={32} light={!scrolled} />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map(({ label, anchor }) => (
            <a key={anchor} href={`#${anchor}`}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all">
              {label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {token ? (
            <Link to="/dashboard"
              className="bg-gray-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-700 transition-colors">
              Dashboard →
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 transition-colors">
                Anmelden
              </Link>
              <Link to="/register"
                className="bg-gray-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-700 transition-colors shadow-lg shadow-gray-900/15">
                Kostenlos starten
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors" onClick={() => setOpen(o => !o)}>
          <div className="w-5 h-4 flex flex-col justify-between">
            <span className={`block h-0.5 bg-gray-900 rounded transition-all origin-center ${open ? 'rotate-45 translate-y-[7px]' : ''}`} />
            <span className={`block h-0.5 bg-gray-900 rounded transition-all ${open ? 'opacity-0 scale-x-0' : ''}`} />
            <span className={`block h-0.5 bg-gray-900 rounded transition-all origin-center ${open ? '-rotate-45 -translate-y-[7px]' : ''}`} />
          </div>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} className="md:hidden bg-white border-t border-gray-100 overflow-hidden">
            <div className="px-6 py-4 flex flex-col gap-1">
              {NAV.map(({ label, anchor }) => (
                <a key={anchor} href={`#${anchor}`} onClick={() => setOpen(false)}
                  className="px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">{label}</a>
              ))}
              <div className="pt-3 mt-2 border-t border-gray-100 flex flex-col gap-2">
                <Link to="/login" className="px-3 py-2.5 text-sm text-gray-700 text-center border border-gray-200 rounded-xl">Anmelden</Link>
                <Link to="/register" className="px-3 py-2.5 text-sm font-semibold text-white bg-gray-900 text-center rounded-xl">Kostenlos starten</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
