import { createContext, useContext } from 'react'
import type { User } from '@auth0/auth0-react'

export interface AuthContextType {
  user?: User
  isAuthenticated: boolean
  loading: boolean
  login: () => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
