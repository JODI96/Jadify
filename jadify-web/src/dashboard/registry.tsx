import type { ReactElement } from 'react'
import { OverviewPage } from '../pages/Dashboard/OverviewPage'
import { BookingsPage } from '../pages/Dashboard/BookingsPage'
import { SubscriptionPage } from '../pages/Dashboard/SubscriptionPage'

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
]
