import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react'
import './index.css'
import App from './App.tsx'
import { auth0Config, getAuth0AuthorizationParams } from './config/auth'
import { auth0CookieCache } from './lib/auth0CookieCache'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Auth0Provider
      domain={auth0Config.domain}
      clientId={auth0Config.clientId}
      authorizationParams={getAuth0AuthorizationParams()}
      cache={auth0CookieCache}
      useRefreshTokens
      useRefreshTokensFallback
    >
      <App />
    </Auth0Provider>
  </StrictMode>,
)
