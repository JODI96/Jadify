import { createContext, useContext } from 'react'

export interface AuthState {
  token: string | null
  refreshToken: string | null
  businessId: string | null
  email: string | null
  businessType: string | null
}

export interface AuthContextValue extends AuthState {
  login: (token: string, refreshToken: string, businessId: string, email: string, businessType: string) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}

export function loadAuthState(): AuthState {
  return {
    token: localStorage.getItem('jadify_token'),
    refreshToken: localStorage.getItem('jadify_refresh'),
    businessId: localStorage.getItem('jadify_business_id'),
    email: localStorage.getItem('jadify_email'),
    businessType: localStorage.getItem('jadify_business_type'),
  }
}
