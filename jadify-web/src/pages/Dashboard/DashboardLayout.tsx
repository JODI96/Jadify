import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/authStore'
import { DASHBOARD_MODULES } from '../../dashboard/registry'

export function DashboardLayout() {
  const { email, businessType, logout } = useAuth()
  const navigate = useNavigate()

  const visibleModules = DASHBOARD_MODULES.filter(
    m => m.showInNav !== false && (!m.visibleFor || m.visibleFor.includes(businessType ?? '')),
  )

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ── Desktop sidebar (md+) ─────────────────────────────────────────── */}
      <aside className="hidden md:flex w-56 shrink-0 bg-white border-r border-gray-200 flex-col">
        <div className="px-5 py-5 border-b border-gray-100">
          <span className="text-lg font-bold text-indigo-600 tracking-tight">Jadify</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {visibleModules.map(({ path, label, icon }) => (
            <NavLink
              key={path}
              to={`/dashboard/${path}`}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors
                ${isActive
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`
              }
            >
              <span className="text-base">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 truncate mb-2">{email}</p>
          <button
            onClick={handleLogout}
            className="w-full text-left text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            Abmelden
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shrink-0">
          <span className="text-base font-bold text-indigo-600 tracking-tight">Jadify</span>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            Abmelden
          </button>
        </header>

        {/* Page content — leave space for mobile bottom bar */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <Outlet />
        </main>

        {/* ── Mobile bottom tab bar ──────────────────────────────────────── */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 flex z-10">
          {visibleModules.map(({ path, label, icon }) => (
            <NavLink
              key={path}
              to={`/dashboard/${path}`}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs transition-colors
                ${isActive
                  ? 'text-indigo-600 font-medium'
                  : 'text-gray-400 hover:text-gray-600'}`
              }
            >
              <span className="text-lg leading-none">{icon}</span>
              <span className="leading-none">{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
