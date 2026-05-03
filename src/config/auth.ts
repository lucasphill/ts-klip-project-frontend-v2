type Auth0AuthorizationParams = {
  redirect_uri?: string
  audience: string
  scope: string
}

const getRequiredEnv = (key: 'VITE_AUTH0_DOMAIN' | 'VITE_AUTH0_CLIENT_ID' | 'VITE_AUTH0_AUDIENCE') => {
  const value = import.meta.env[key]?.trim()
  if (!value) {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${key}`)
  }
  return value
}

export const auth0Config = {
  domain: getRequiredEnv('VITE_AUTH0_DOMAIN'),
  clientId: getRequiredEnv('VITE_AUTH0_CLIENT_ID'),
  audience: getRequiredEnv('VITE_AUTH0_AUDIENCE'),
}

export const getAuth0AuthorizationParams = (): Auth0AuthorizationParams => ({
  redirect_uri: window.location.origin,
  audience: auth0Config.audience,
  scope: 'openid profile email',
})

export const getAuth0TokenParams = (): Omit<Auth0AuthorizationParams, 'redirect_uri'> => ({
  audience: auth0Config.audience,
  scope: 'openid profile email',
})
