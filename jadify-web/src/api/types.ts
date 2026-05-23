export interface BusinessPublicResponse {
  id: string
  name: string
  type: string
  slug: string
  address: string
  phone: string
  email: string
  logoUrl?: string
  hours: BusinessHoursItem[]
  staff: StaffItem[]
  services: ServiceItem[]
}

export interface BusinessHoursItem {
  dayOfWeek: number
  openTime: string
  closeTime: string
  isClosed: boolean
}

export interface StaffItem {
  id: string
  name: string
  avatarUrl?: string
}

export interface ServiceItem {
  id: string
  name: string
  description?: string
  durationMinutes: number
  price: number
}

export interface TimeSlot {
  start: string
  end: string
}

export interface CreateBookingRequest {
  businessId: string
  staffId: string
  serviceId: string
  startTime: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  notes?: string
}

export interface BookingResponse {
  id: string
  businessName: string
  staffName: string
  serviceName: string
  customerName: string
  customerEmail: string
  startTime: string
  endTime: string
  status: string
  totalAmount: number
  feeAmount: number
  clientSecret?: string
  notes?: string
  createdAt: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  expiresAt: string
  businessId: string
  email: string
  businessType: string
}

export interface DashboardResponse {
  todayBookingCount: number
  upcomingBookingCount: number
  revenueThisMonth: number
  revenueLastMonth: number
  revenueGrowthPercent: number
  cancellationRatePercent: number
  totalCustomers: number
  todaySchedule: UpcomingBookingItem[]
}

export interface UpcomingBookingItem {
  id: string
  customerName: string
  serviceName: string
  staffName: string
  startTime: string
  endTime: string
  status: string
}

export interface SubscriptionResponse {
  id: string
  businessId: string
  tier: string
  isActive: boolean
  currentPeriodEnd?: string
  cancelAtPeriodEnd: boolean
  stripeSubscriptionId?: string
  createdAt: string
}

// ── Owner CRUD types ──────────────────────────────────────────────────────────

export interface ServiceOwnerResponse {
  id: string
  name: string
  description?: string
  durationMinutes: number
  price: number
  isActive: boolean
  createdAt: string
}

export interface StaffOwnerResponse {
  id: string
  name: string
  email: string
  avatarUrl?: string
  isActive: boolean
  createdAt: string
}

export interface TableResponse {
  id: string
  name: string
  capacity: number
  isActive: boolean
  createdAt: string
}

export interface UpdateBusinessRequest {
  name: string
  type: string
  address: string
  phone: string
  email: string
}

export interface SetBusinessHoursRequest {
  hours: {
    dayOfWeek: number
    openTime: string
    closeTime: string
    isClosed: boolean
  }[]
}
