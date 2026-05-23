import type { ReactElement } from 'react'
import { OverviewPage } from '../pages/Dashboard/OverviewPage'
import { BookingsPage } from '../pages/Dashboard/BookingsPage'
import { SubscriptionPage } from '../pages/Dashboard/SubscriptionPage'
import { SettingsPage } from '../pages/Dashboard/SettingsPage'
import { TablesPage } from '../pages/Dashboard/TablesPage'

export interface DashboardModule {
  id: string
  path: string
  label: string
  icon: string
  element: ReactElement
  visibleFor?: string[]
}

export const DASHBOARD_MODULES: DashboardModule[] = [
  {
    id: 'overview',
    path: 'overview',
    label: 'Übersicht',
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
    id: 'tables',
    path: 'tische',
    label: 'Tische',
    icon: '🪑',
    element: <TablesPage />,
    visibleFor: ['Restaurant'],
  },
  {
    id: 'settings',
    path: 'einstellungen',
    label: 'Einstellungen',
    icon: '⚙️',
    element: <SettingsPage />,
  },
  {
    id: 'subscription',
    path: 'abonnement',
    label: 'Abonnement',
    icon: '⭐',
    element: <SubscriptionPage />,
  },
]
