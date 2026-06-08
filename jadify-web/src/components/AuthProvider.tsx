import { useState, useEffect, type ReactNode } from 'react'
import { AuthContext, loadAuthState, type AuthState } from '../store/authStore'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadAuthState)

  function login(
    token: string,
    refreshToken: string,
    businessId: string,
    email: string,
    businessType: string,
    slug: string,
  ) {
    localStorage.setItem('jadify_token', token)
    localStorage.setItem('jadify_refresh', refreshToken)
    localStorage.setItem('jadify_business_id', businessId)
    localStorage.setItem('jadify_email', email)
    localStorage.setItem('jadify_business_type', businessType)
    localStorage.setItem('jadify_slug', slug)
    setState({ token, refreshToken, businessId, email, businessType, slug })
  }

  function logout() {
    localStorage.removeItem('jadify_token')
    localStorage.removeItem('jadify_refresh')
    localStorage.removeItem('jadify_business_id')
    localStorage.removeItem('jadify_email')
    localStorage.removeItem('jadify_business_type')
    localStorage.removeItem('jadify_slug')
    setState({ token: null, refreshToken: null, businessId: null, email: null, businessType: null, slug: null })
  }

  // Auto-logout when the API client detects an expired/invalid token
  useEffect(() => {
    function handleForceLogout() {
      logout()
      window.location.replace('/login')
    }
    window.addEventListener('jadify:logout', handleForceLogout)
    return () => window.removeEventListener('jadify:logout', handleForceLogout)
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
