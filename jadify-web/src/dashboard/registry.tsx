import type { ReactElement } from 'react'
import { OverviewPage } from '../pages/Dashboard/OverviewPage'
import { BookingsPage } from '../pages/Dashboard/BookingsPage'
import { SubscriptionPage } from '../pages/Dashboard/SubscriptionPage'
import { ServicesPage } from '../pages/Dashboard/ServicesPage'
import { StaffPage } from '../pages/Dashboard/StaffPage'
import { TablesPage } from '../pages/Dashboard/TablesPage'

export interface DashboardModule {
  id: string
  path: string
  label: string
  icon: string
  element: ReactElement
  visibleFor?: string[]   // undefined = alle sehen es
  showInNav?: boolean     // default true
}

export const DASHBOARD_MODULES: DashboardModule[] = [
  // ── Sichtbar in Sidebar ──────────────────────────────────────────────────
  {
    id: 'overview',
    path: 'overview',
    label: 'Admin-Panel',
    icon: '▦',
    element: <OverviewPage />,
  },
  {
    id: 'bookings',
    path: 'bookings',
    label: 'Buchungen',
    icon: '📅',
    element: <BookingsPage />,
  },
  {
    id: 'subscription',
    path: 'abonnement',
    label: 'Abonnement',
    icon: '⭐',
    element: <SubscriptionPage />,
  },

  // ── Nur via "Alle anzeigen" erreichbar ───────────────────────────────────
  {
    id: 'services',
    path: 'dienstleistungen',
    label: 'Dienstleistungen',
    icon: '✂️',
    element: <ServicesPage />,
    showInNav: false,
  },
  {
    id: 'staff',
    path: 'mitarbeiter',
    label: 'Mitarbeiter',
    icon: '👤',
    element: <StaffPage />,
    showInNav: false,
  },
  {
    id: 'tables',
    path: 'tische',
    label: 'Tische',
    icon: '🪑',
    element: <TablesPage />,
    visibleFor: ['Restaurant'],
    showInNav: false,
  },
]
