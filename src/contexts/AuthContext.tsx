import { useEffect, type FC, type ReactNode } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { setAccessTokenProvider } from '../services/api'
import { getAuth0AuthorizationParams, getAuth0TokenParams } from '../config/auth'
import { AuthContext } from './authState'

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const auth0 = useAuth0()
  const { getAccessTokenSilently, isAuthenticated, isLoading, loginWithRedirect, logout, user } = auth0

  useEffect(() => {
    setAccessTokenProvider(
      async () => {
        return getAccessTokenSilently({
          authorizationParams: getAuth0TokenParams(),
        })
      },
      () => logout({ logoutParams: { returnTo: window.location.origin } }),
    )

    return () => setAccessTokenProvider(null)
  }, [getAccessTokenSilently, logout])

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
