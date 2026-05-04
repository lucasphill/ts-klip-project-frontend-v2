export const normalizeSearchText = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLocaleLowerCase('pt-BR')

export const matchesSearchText = (value: unknown, query: string) =>
  normalizeSearchText(value).includes(normalizeSearchText(query))
