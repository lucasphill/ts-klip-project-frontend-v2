type LocalStorageMirrorOptions = {
  useRawKeys?: boolean
  rawKeyPrefix?: string
}

const canUseLocalStorage = () =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

export class LocalStorageMirror {
  private readonly options: LocalStorageMirrorOptions
  private readonly keyPrefix: string

  constructor(namespace: string, options: LocalStorageMirrorOptions = {}) {
    this.options = options
    this.keyPrefix = `${namespace}:`
  }

  get(key: string) {
    if (!canUseLocalStorage()) return undefined

    try {
      return window.localStorage.getItem(this.getStorageKey(key)) ?? undefined
    } catch {
      return undefined
    }
  }

  set(key: string, value: string) {
    if (!canUseLocalStorage()) return

    try {
      window.localStorage.setItem(this.getStorageKey(key), value)
    } catch {
      // Storage quota or browser privacy settings can block this mirror.
    }
  }

  remove(key: string) {
    if (!canUseLocalStorage()) return

    try {
      window.localStorage.removeItem(this.getStorageKey(key))
    } catch {
      // Browser privacy settings can block localStorage access.
    }
  }

  allKeys() {
    if (!canUseLocalStorage()) return []

    try {
      return Object.keys(window.localStorage)
        .filter(key => this.isManagedKey(key))
        .map(key => this.getLogicalKey(key))
    } catch {
      return []
    }
  }

  private getStorageKey(key: string) {
    return this.options.useRawKeys ? key : `${this.keyPrefix}${key}`
  }

  private isManagedKey(key: string) {
    if (this.options.useRawKeys) {
      return this.options.rawKeyPrefix ? key.startsWith(this.options.rawKeyPrefix) : true
    }

    return key.startsWith(this.keyPrefix)
  }

  private getLogicalKey(key: string) {
    return this.options.useRawKeys ? key : key.slice(this.keyPrefix.length)
  }
}
