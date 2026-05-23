import { api } from './client'
import type {
  AuthResponse,
  BookingResponse,
  BusinessPublicResponse,
  CreateBookingRequest,
  DashboardResponse,
  SubscriptionResponse,
  TimeSlot,
} from './types'

export * from './types'

export const businessApi = {
  getBySlug: (slug: string) =>
    api.get<BusinessPublicResponse>(`/businesses/${slug}`),
}

export const availabilityApi = {
  getSlots: (params: {
    businessId: string
    staffId?: string
    serviceId: string
    date: string
  }) => {
    const q = new URLSearchParams({ ...params } as Record<string, string>)
    return api.get<TimeSlot[]>(`/availability?${q}`)
  },
}

export const bookingApi = {
  create: (req: CreateBookingRequest) =>
    api.post<BookingResponse>('/bookings', req),
  getById: (id: string) =>
    api.get<BookingResponse>(`/bookings/${id}`),
  confirm: (id: string) =>
    api.put<BookingResponse>(`/bookings/${id}/confirm`, {}),
  cancel: (id: string, reason?: string) =>
    api.put<void>(`/bookings/${id}/cancel`, { reason }),
  forBusiness: (businessId: string) =>
    api.get<BookingResponse[]>(`/businesses/${businessId}/bookings`),
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
  register: (body: {
    ownerName: string
    email: string
    password: string
    businessName: string
    businessType: string
    address: string
    phone: string
  }) => api.post<AuthResponse>('/auth/register', body),
  refresh: (refreshToken: string) =>
    api.post<AuthResponse>('/auth/refresh', { refreshToken }),
}

export const dashboardApi = {
  get: () => api.get<DashboardResponse>('/dashboard'),
}

export const subscriptionApi = {
  get: (businessId: string) =>
    api.get<SubscriptionResponse>(`/subscriptions/${businessId}`),
  create: (tier: string) =>
    api.post<SubscriptionResponse>('/subscriptions/create', { tier }),
  changeTier: (newTier: string) =>
    api.put<SubscriptionResponse>('/subscriptions/upgrade', { newTier }),
  cancel: () => api.delete<void>('/subscriptions/cancel'),
}
