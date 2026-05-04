import type { Cacheable, ICache } from '@auth0/auth0-spa-js'
import { ChunkedCookieStorage } from './chunkedCookieStorage'
import { LocalStorageMirror } from './localStorageMirror'
import { MirroredStorage } from './mirroredStorage'

const AUTH0_CACHE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30
const AUTH0_CACHE_KEY_PREFIX = '@@auth0spajs@@'

const auth0TokenStorage = new MirroredStorage(
  new ChunkedCookieStorage('klip_auth0_cache', {
    maxAgeSeconds: AUTH0_CACHE_COOKIE_MAX_AGE_SECONDS,
    sameSite: 'Lax',
  }),
  new LocalStorageMirror('klip_auth0_cache', {
    useRawKeys: true,
    rawKeyPrefix: AUTH0_CACHE_KEY_PREFIX,
  }),
)

export const auth0CookieCache: ICache = {
  set<T = Cacheable>(key: string, entry: T) {
    auth0TokenStorage.set(key, JSON.stringify(entry))
  },

  get<T = Cacheable>(key: string) {
    const value = auth0TokenStorage.get(key)
    if (!value) return undefined

    try {
      return JSON.parse(value) as T
    } catch {
      auth0TokenStorage.remove(key)
      return undefined
    }
  },

  remove(key: string) {
    auth0TokenStorage.remove(key)
  },

  allKeys() {
    return auth0TokenStorage.allKeys()
  },
}
