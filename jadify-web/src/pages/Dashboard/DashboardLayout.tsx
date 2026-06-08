import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '../../store/authStore'
import { Logo } from '../../components/Logo'
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

      {/* ── Desktop sidebar ──────────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-56 shrink-0 bg-white border-r border-gray-100 flex-col">
        <div className="px-5 py-5 border-b border-gray-100">
          <Logo size={28} />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {visibleModules.map(({ path, label, icon }) => (
            <NavLink
              key={path}
              to={`/dashboard/${path}`}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`
              }
            >
              {icon}
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 truncate mb-3">{email}</p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-900 transition-colors w-full"
          >
            <LogOut size={14} />
            Abmelden
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shrink-0">
          <Logo size={24} />
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-900 transition-colors"
          >
            <LogOut size={13} />
            Abmelden
          </button>
        </header>

        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <Outlet />
        </main>

        {/* ── Mobile bottom tab bar ─────────────────────────────────────────── */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 flex overflow-x-auto z-10 scrollbar-none">
          {visibleModules.map(({ path, label, icon }) => (
            <NavLink
              key={path}
              to={`/dashboard/${path}`}
              className={({ isActive }) =>
                `flex-1 min-w-[64px] flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors
                ${isActive ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`
              }
            >
              {icon}
              <span className="leading-none">{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
