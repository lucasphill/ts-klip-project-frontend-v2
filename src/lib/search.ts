const searchCache = new Map<string, string>()

export const normalizeSearchText = (value: unknown) => {
  const strValue = String(value ?? '')
  if (searchCache.has(strValue)) return searchCache.get(strValue)!

  const normalized = strValue
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLocaleLowerCase('pt-BR')

  if (searchCache.size > 10000) searchCache.clear()
  searchCache.set(strValue, normalized)
  return normalized
}

export const matchesSearchText = (value: unknown, query: string) => {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) return true
  return normalizeSearchText(value).includes(normalizedQuery)
}
