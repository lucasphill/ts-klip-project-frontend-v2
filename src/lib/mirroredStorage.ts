type StringStorage = {
  get: (key: string) => string | undefined
  set: (key: string, value: string) => void
  remove: (key: string) => void
  allKeys: () => string[]
}

export class MirroredStorage implements StringStorage {
  private readonly primary: StringStorage
  private readonly mirror: StringStorage

  constructor(primary: StringStorage, mirror: StringStorage) {
    this.primary = primary
    this.mirror = mirror
  }

  get(key: string) {
    const primaryValue = this.primary.get(key)
    if (primaryValue !== undefined) return primaryValue

    const mirroredValue = this.mirror.get(key)
    if (mirroredValue !== undefined) {
      this.primary.set(key, mirroredValue)
    }

    return mirroredValue
  }

  set(key: string, value: string) {
    this.primary.set(key, value)
    this.mirror.set(key, value)
  }

  remove(key: string) {
    this.primary.remove(key)
    this.mirror.remove(key)
  }

  allKeys() {
    return Array.from(new Set([...this.primary.allKeys(), ...this.mirror.allKeys()]))
  }
}
