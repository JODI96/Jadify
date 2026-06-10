import { api } from './client'
import type {
  AuthResponse,
  BookingResponse,
  BusinessPublicResponse,
  CreateBookingRequest,
  CreatePaymentIntentRequest,
  CreatePaymentIntentResponse,
  DashboardResponse,
  ServiceOwnerResponse,
  SetBusinessHoursRequest,
  StaffHoursDto,
  StaffOwnerResponse,
  SubscriptionResponse,
  TableResponse,
  TimeSlot,
  UpdateBusinessRequest,
} from './types'

export * from './types'

export const businessApi = {
  getBySlug: (slug: string) =>
    api.get<BusinessPublicResponse>(`/businesses/${slug}`),
  update: (id: string, req: UpdateBusinessRequest) =>
    api.put<BusinessPublicResponse>(`/businesses/${id}`, req),
  getHours: (id: string) =>
    api.get<SetBusinessHoursRequest['hours']>(`/businesses/${id}/hours`),
  setHours: (id: string, req: SetBusinessHoursRequest) =>
    api.post<unknown>(`/businesses/${id}/hours`, req),
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
  getAvailableDates: (params: {
    businessId: string
    serviceId: string
    year: number
    month: number
    staffId?: string
  }) => {
    const q = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params)
          .filter(([, v]) => v != null)
          .map(([k, v]) => [k, String(v)])
      )
    )
    return api.get<string[]>(`/availability/month?${q}`)
  },
}

export const bookingApi = {
  createIntent: (req: CreatePaymentIntentRequest) =>
    api.post<CreatePaymentIntentResponse>('/payments/intent', req),
  create: (req: CreateBookingRequest) =>
    api.post<BookingResponse>('/bookings', req),
  getById: (id: string) =>
    api.get<BookingResponse>(`/bookings/${id}`),
  confirm: (id: string) =>
    api.put<BookingResponse>(`/bookings/${id}/confirm`, {}),
  cancel: (id: string, reason?: string) =>
    api.put<void>(`/bookings/${id}/cancel`, { reason }),
  cancelByCustomer: (id: string, token: string) =>
    api.post<BookingResponse>(`/bookings/${id}/cancel-self?token=${encodeURIComponent(token)}`, {}),
  forBusiness: (businessId: string, date?: string) => {
    const q = date ? `?date=${date}` : ''
    return api.get<BookingResponse[]>(`/businesses/${businessId}/bookings${q}`)
  },
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
  forgotPassword: (email: string) =>
    api.post<{ message: string }>('/auth/forgot-password', { email }),
  resetPassword: (email: string, token: string, newPassword: string) =>
    api.post<{ message: string }>('/auth/reset-password', { email, token, newPassword }),
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

export const serviceOwnerApi = {
  list: (businessId: string) =>
    api.get<ServiceOwnerResponse[]>(`/businesses/${businessId}/services`),
  create: (businessId: string, req: { name: string; description?: string; durationMinutes: number; price: number }) =>
    api.post<ServiceOwnerResponse>(`/businesses/${businessId}/services`, req),
  update: (id: string, req: { name: string; description?: string; durationMinutes: number; price: number; isActive: boolean }) =>
    api.put<ServiceOwnerResponse>(`/services/${id}`, req),
  remove: (id: string) =>
    api.delete<void>(`/services/${id}`),
}

export const staffOwnerApi = {
  list: (businessId: string) =>
    api.get<StaffOwnerResponse[]>(`/businesses/${businessId}/staff`),
  create: (businessId: string, req: { name: string; email: string; avatarUrl?: string; serviceIds?: string[] }) =>
    api.post<StaffOwnerResponse>(`/businesses/${businessId}/staff`, req),
  update: (id: string, req: { name: string; email: string; isActive: boolean; avatarUrl?: string; serviceIds?: string[] }) =>
    api.put<StaffOwnerResponse>(`/staff/${id}`, req),
  remove: (id: string) =>
    api.delete<void>(`/staff/${id}`),
  getHours: (staffId: string) =>
    api.get<StaffHoursDto[]>(`/staff/${staffId}/hours`),
  setHours: (staffId: string, hours: StaffHoursDto[]) =>
    api.post<StaffHoursDto[]>(`/staff/${staffId}/hours`, { hours }),
}

export const tableApi = {
  list: (businessId: string) =>
    api.get<TableResponse[]>(`/businesses/${businessId}/tables`),
  create: (businessId: string, req: { name: string; capacity: number }) =>
    api.post<TableResponse>(`/businesses/${businessId}/tables`, req),
  update: (id: string, req: { name: string; capacity: number; isActive: boolean }) =>
    api.put<TableResponse>(`/tables/${id}`, req),
  remove: (id: string) =>
    api.delete<void>(`/tables/${id}`),
}
