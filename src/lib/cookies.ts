export type CookieSameSite = 'Lax' | 'Strict' | 'None'

export type CookieOptions = {
  path?: string
  maxAgeSeconds?: number
  sameSite?: CookieSameSite
  secure?: boolean
}

const DEFAULT_COOKIE_PATH = '/'
const DEFAULT_SAME_SITE: CookieSameSite = 'Lax'

const isBrowser = () => typeof document !== 'undefined'

const shouldUseSecureCookie = () =>
  typeof window !== 'undefined' && window.location.protocol === 'https:'

const getCookieAttributes = (options: CookieOptions = {}) => {
  const path = options.path ?? DEFAULT_COOKIE_PATH
  const sameSite = options.sameSite ?? DEFAULT_SAME_SITE
  const secure = options.secure ?? shouldUseSecureCookie()
  const attributes = [`Path=${path}`, `SameSite=${sameSite}`]

  if (typeof options.maxAgeSeconds === 'number') {
    attributes.push(`Max-Age=${Math.max(0, Math.floor(options.maxAgeSeconds))}`)
  }

  if (secure || sameSite === 'None') {
    attributes.push('Secure')
  }

  return attributes.join('; ')
}

export const getCookie = (name: string) => {
  if (!isBrowser()) return undefined

  const encodedName = encodeURIComponent(name)
  const match = document.cookie
    .split(';')
    .map(part => part.trim())
    .find(part => part.startsWith(`${encodedName}=`))

  if (!match) return undefined

  try {
    return decodeURIComponent(match.slice(encodedName.length + 1))
  } catch {
    return undefined
  }
}

export const setCookie = (name: string, value: string, options: CookieOptions = {}) => {
  if (!isBrowser()) return

  document.cookie = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    getCookieAttributes(options),
  ].join('; ')
}

export const removeCookie = (name: string, options: CookieOptions = {}) => {
  setCookie(name, '', { ...options, maxAgeSeconds: 0 })
}

export const getJsonCookie = <T>(name: string): T | undefined => {
  const raw = getCookie(name)
  if (!raw) return undefined

  try {
    return JSON.parse(raw) as T
  } catch {
    return undefined
  }
}

export const setJsonCookie = (name: string, value: unknown, options: CookieOptions = {}) => {
  setCookie(name, JSON.stringify(value), options)
}

