import { useCallback, useEffect, useRef, type FC, type ReactNode } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { setAccessTokenProvider } from '../services/api'
import { getAuth0AuthorizationParams, getAuth0TokenParams } from '../config/auth'
import { AuthContext } from './authState'

type AuthTokenError = Error & {
  error?: string
  error_description?: string
}

const LOGOUT_AUTH_ERROR_CODES = new Set([
  'consent_required',
  'interaction_required',
  'invalid_grant',
  'login_required',
  'missing_refresh_token',
  'missing_scopes',
])

const isAuthTokenError = (error: unknown): error is AuthTokenError => {
  if (!(error instanceof Error)) return false

  const authError = error as AuthTokenError
  if (authError.error && LOGOUT_AUTH_ERROR_CODES.has(authError.error)) return true

  const message = error.message.toLowerCase()
  return message.includes('missing refresh token') || message.includes('refresh token')
}

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const auth0 = useAuth0()
  const { getAccessTokenSilently, isAuthenticated, isLoading, loginWithRedirect, logout, user } = auth0
  const logoutStartedRef = useRef(false)

  const redirectToLogout = useCallback(() => {
    if (logoutStartedRef.current) return

    logoutStartedRef.current = true
    void logout({ logoutParams: { returnTo: window.location.origin } })
  }, [logout])

  const getAccessTokenOrLogout = useCallback(async (forceRefresh = false) => {
    const authorizationParams = getAuth0TokenParams()

    try {
      const token = await getAccessTokenSilently({
        authorizationParams,
        ...(forceRefresh ? { cacheMode: 'off' as const } : {}),
      })

      if (token) return token

      if (!forceRefresh) {
        const refreshedToken = await getAccessTokenSilently({
          authorizationParams,
          cacheMode: 'off',
        })

        if (refreshedToken) return refreshedToken
      }

      redirectToLogout()
      throw new Error('Auth0 did not return an access token.')
    } catch (error) {
      if (isAuthTokenError(error)) {
        redirectToLogout()
      }

      throw error
    }
  }, [getAccessTokenSilently, redirectToLogout])

  useEffect(() => {
    setAccessTokenProvider(
      ({ forceRefresh } = {}) => getAccessTokenOrLogout(forceRefresh),
      redirectToLogout,
    )

    return () => setAccessTokenProvider(null)
  }, [getAccessTokenOrLogout, redirectToLogout])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      void loginWithRedirect({
        authorizationParams: getAuth0AuthorizationParams(),
      })
    }
  }, [isAuthenticated, isLoading, loginWithRedirect])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading: isLoading,
        login: () => void loginWithRedirect({
          authorizationParams: getAuth0AuthorizationParams(),
        }),
        logout: () => logout({ logoutParams: { returnTo: window.location.origin } }),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
