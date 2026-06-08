import type { ReactElement, ReactNode } from 'react'
import { LayoutGrid, CalendarDays, Star, Scissors, Users, Table2, CalendarRange } from 'lucide-react'
import { OverviewPage } from '../pages/Dashboard/OverviewPage'
import { BookingsPage } from '../pages/Dashboard/BookingsPage'
import { CalendarPage } from '../pages/Dashboard/CalendarPage'
import { SubscriptionPage } from '../pages/Dashboard/SubscriptionPage'
import { ServicesPage } from '../pages/Dashboard/ServicesPage'
import { StaffPage } from '../pages/Dashboard/StaffPage'
import { TablesPage } from '../pages/Dashboard/TablesPage'

export interface DashboardModule {
  id: string
  path: string
  label: string
  icon: ReactNode
  element: ReactElement
  visibleFor?: string[]
  showInNav?: boolean
}

export const DASHBOARD_MODULES: DashboardModule[] = [
  {
    id: 'overview',
    path: 'overview',
    label: 'Admin-Panel',
    icon: <LayoutGrid size={16} />,
    element: <OverviewPage />,
  },
  {
    id: 'bookings',
    path: 'bookings',
    label: 'Buchungen',
    icon: <CalendarDays size={16} />,
    element: <BookingsPage />,
  },
  {
    id: 'calendar',
    path: 'kalender',
    label: 'Kalender',
    icon: <CalendarRange size={16} />,
    element: <CalendarPage />,
  },
  {
    id: 'subscription',
    path: 'abonnement',
    label: 'Abonnement',
    icon: <Star size={16} />,
    element: <SubscriptionPage />,
  },
  {
    id: 'services',
    path: 'dienstleistungen',
    label: 'Dienstleistungen',
    icon: <Scissors size={16} />,
    element: <ServicesPage />,
    showInNav: false,
  },
  {
    id: 'staff',
    path: 'mitarbeiter',
    label: 'Mitarbeiter',
    icon: <Users size={16} />,
    element: <StaffPage />,
    showInNav: false,
  },
  {
    id: 'tables',
    path: 'tische',
    label: 'Tische',
    icon: <Table2 size={16} />,
    element: <TablesPage />,
    visibleFor: ['Restaurant'],
    showInNav: false,
  },
]
