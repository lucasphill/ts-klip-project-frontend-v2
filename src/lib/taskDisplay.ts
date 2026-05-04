import type { CustomField, Task } from '../types/domain'
import { normalizeSearchText } from './search'

export const compareTaskDisplayText = (left: unknown, right: unknown) =>
  String(left ?? '').localeCompare(String(right ?? ''), 'pt-BR', {
    sensitivity: 'base',
    numeric: true,
  })

export const getTaskProjectIds = (task: Task) =>
  Array.from(new Set([task.projectId, ...task.projectIds].filter((id): id is string => Boolean(id))))

export const getCustomFieldValue = (task: Task, field: CustomField) => {
  const values = task.customFieldValues ?? {}
  const candidateKeys = [field.id, field.name, normalizeSearchText(field.name)]

  for (const key of candidateKeys) {
    if (Object.prototype.hasOwnProperty.call(values, key)) return values[key]
  }

  const normalizedName = normalizeSearchText(field.name)
  const matchedEntry = Object.entries(values).find(([key]) => normalizeSearchText(key) === normalizedName)
  return matchedEntry?.[1]
}

export const getCustomFieldValueLabel = (field: CustomField, value: unknown) => {
  if (value === undefined || value === null || value === '') return ''

  if (field.type === 'checkbox') {
    if (value === true || value === 'true' || value === 1 || value === '1') return 'Sim'
    if (value === false || value === 'false' || value === 0 || value === '0') return 'Não'
    return String(value)
  }

  if (field.type === 'date' && typeof value === 'string') {
    const normalizedDate = value.split('T')[0]
    if (!normalizedDate) return ''
    return new Date(`${normalizedDate}T12:00:00`).toLocaleDateString('pt-BR')
  }

  return String(value)
}

export const getDueDateLabel = (value?: string) => {
  if (!value) return ''
  return new Date(`${value.split('T')[0]}T12:00:00`).toLocaleDateString('pt-BR')
}
