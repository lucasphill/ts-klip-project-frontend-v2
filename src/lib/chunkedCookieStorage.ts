import {
  getCookie,
  getJsonCookie,
  removeCookie,
  setCookie,
  setJsonCookie,
  type CookieOptions,
} from './cookies'

type ChunkManifestEntry = {
  key: string
  chunks: number
}

type ChunkManifest = Record<string, ChunkManifestEntry>

const CHUNK_SIZE = 2800

const hashString = (value: string) => {
  let hash = 0x811c9dc5

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }

  return (hash >>> 0).toString(36)
}

const toBase64Url = (value: string) => {
  const bytes = new TextEncoder().encode(value)
  let binary = ''

  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.slice(index, index + 0x8000))
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

const fromBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), '=')
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

const splitChunks = (value: string) => {
  const chunks: string[] = []

  for (let index = 0; index < value.length; index += CHUNK_SIZE) {
    chunks.push(value.slice(index, index + CHUNK_SIZE))
  }

  return chunks.length > 0 ? chunks : ['']
}

export class ChunkedCookieStorage {
  private readonly namespace: string
  private readonly options: CookieOptions
  private readonly manifestCookieName: string

  constructor(namespace: string, options: CookieOptions) {
    this.namespace = namespace
    this.options = options
    this.manifestCookieName = `${namespace}_manifest`
  }

  get(key: string) {
    const manifest = this.getManifest()
    const entry = manifest[this.getKeyId(key)]

    if (!entry || entry.key !== key) return undefined

    const chunks: string[] = []

    for (let index = 0; index < entry.chunks; index += 1) {
      const chunk = getCookie(this.getChunkCookieName(key, index))

      if (chunk === undefined) {
        this.remove(key)
        return undefined
      }

      chunks.push(chunk)
    }

    try {
      return fromBase64Url(chunks.join(''))
    } catch {
      this.remove(key)
      return undefined
    }
  }

  set(key: string, value: string) {
    const manifest = this.getManifest()
    this.removeChunks(key, manifest[this.getKeyId(key)]?.chunks)

    const encodedValue = toBase64Url(value)
    const chunks = splitChunks(encodedValue)

    chunks.forEach((chunk, index) => {
      setCookie(this.getChunkCookieName(key, index), chunk, this.options)
    })

    manifest[this.getKeyId(key)] = { key, chunks: chunks.length }
    setJsonCookie(this.manifestCookieName, manifest, this.options)
  }

  remove(key: string) {
    const manifest = this.getManifest()
    const keyId = this.getKeyId(key)
    this.removeChunks(key, manifest[keyId]?.chunks)

    if (manifest[keyId]) {
      delete manifest[keyId]
      setJsonCookie(this.manifestCookieName, manifest, this.options)
    }
  }

  allKeys() {
    return Object.values(this.getManifest()).map(entry => entry.key)
  }

  private getManifest(): ChunkManifest {
    return getJsonCookie<ChunkManifest>(this.manifestCookieName) ?? {}
  }

  private getKeyId(key: string) {
    return hashString(key)
  }

  private getChunkCookieName(key: string, chunkIndex: number) {
    return `${this.namespace}_${this.getKeyId(key)}_${chunkIndex}`
  }

  private removeChunks(key: string, count = 0) {
    for (let index = 0; index < count; index += 1) {
      removeCookie(this.getChunkCookieName(key, index), this.options)
    }
  }
}
