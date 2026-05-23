import { useState, type ReactNode } from 'react'
import { AuthContext, loadAuthState, type AuthState } from '../store/authStore'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadAuthState)

  function login(token: string, refreshToken: string, businessId: string, email: string) {
    localStorage.setItem('jadify_token', token)
    localStorage.setItem('jadify_refresh', refreshToken)
    localStorage.setItem('jadify_business_id', businessId)
    localStorage.setItem('jadify_email', email)
    setState({ token, refreshToken, businessId, email })
  }

  function logout() {
    localStorage.removeItem('jadify_token')
    localStorage.removeItem('jadify_refresh')
    localStorage.removeItem('jadify_business_id')
    localStorage.removeItem('jadify_email')
    setState({ token: null, refreshToken: null, businessId: null, email: null })
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
