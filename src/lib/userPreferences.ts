import { ChunkedCookieStorage } from './chunkedCookieStorage'
import { LocalStorageMirror } from './localStorageMirror'
import { MirroredStorage } from './mirroredStorage'
import type {
  TaskColumnFilterPreference,
  TaskSortingPreference,
  TaskStatusFilter,
  TaskTableSize,
  ThemePreference,
  UserPreferences,
} from '../types/preferences'

const USER_PREFERENCES_STORAGE_KEY = 'user_preferences'
const USER_PREFERENCES_MAX_AGE_SECONDS = 60 * 60 * 24 * 365
const userPreferencesStorage = new MirroredStorage(
  new ChunkedCookieStorage('klip_preferences', {
    maxAgeSeconds: USER_PREFERENCES_MAX_AGE_SECONDS,
    sameSite: 'Lax',
  }),
  new LocalStorageMirror('klip_preferences'),
)

export const USER_PREFERENCES_CHANGED_EVENT = 'klip:user-preferences-changed'

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: 'light',
  taskStatusFilter: 'all',
  taskGlobalFilter: '',
  taskColumnFilters: [],
  taskSorting: [],
  taskTableSize: 'default',
  taskCollapsedIds: [],
  taskColumnOrder: [],
  sidebarCollapsed: false,
  sidebarWidth: 240,
  sidebarOpenKeys: ['projects'],
  workspaceSearchQuery: '',
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(item => typeof item === 'string')

const parseTheme = (value: unknown): ThemePreference =>
  value === 'dark' || value === 'light' ? value : DEFAULT_USER_PREFERENCES.theme

const parseTaskStatusFilter = (value: unknown): TaskStatusFilter =>
  value === 'completed' || value === 'pending' || value === 'all'
    ? value
    : DEFAULT_USER_PREFERENCES.taskStatusFilter

const parseTaskTableSize = (value: unknown): TaskTableSize =>
  value === 'compact' || value === 'comfortable' || value === 'default'
    ? value
    : DEFAULT_USER_PREFERENCES.taskTableSize

const parseTaskSorting = (value: unknown): TaskSortingPreference => {
  if (!Array.isArray(value)) return DEFAULT_USER_PREFERENCES.taskSorting

  return value
    .filter(isRecord)
    .filter(item => typeof item.id === 'string')
    .map(item => ({ id: String(item.id), desc: Boolean(item.desc) }))
}

const parseTaskColumnFilters = (value: unknown): TaskColumnFilterPreference => {
  if (!Array.isArray(value)) return DEFAULT_USER_PREFERENCES.taskColumnFilters

  return value
    .filter(isRecord)
    .filter(item => typeof item.id === 'string')
    .map(item => ({ id: String(item.id), value: String(item.value ?? '') }))
    .filter(item => item.value.length > 0)
}

const sanitizePreferences = (value: unknown): UserPreferences => {
  const raw = isRecord(value) ? value : {}
  const sidebarWidth = typeof raw.sidebarWidth === 'number' ? raw.sidebarWidth : DEFAULT_USER_PREFERENCES.sidebarWidth

  return {
    theme: parseTheme(raw.theme),
    taskStatusFilter: parseTaskStatusFilter(raw.taskStatusFilter),
    taskGlobalFilter: typeof raw.taskGlobalFilter === 'string' ? raw.taskGlobalFilter : DEFAULT_USER_PREFERENCES.taskGlobalFilter,
    taskColumnFilters: parseTaskColumnFilters(raw.taskColumnFilters),
    taskSorting: parseTaskSorting(raw.taskSorting),
    taskTableSize: parseTaskTableSize(raw.taskTableSize),
    taskCollapsedIds: isStringArray(raw.taskCollapsedIds) ? raw.taskCollapsedIds : DEFAULT_USER_PREFERENCES.taskCollapsedIds,
    taskColumnOrder: isStringArray(raw.taskColumnOrder) ? raw.taskColumnOrder : DEFAULT_USER_PREFERENCES.taskColumnOrder,
    sidebarCollapsed: typeof raw.sidebarCollapsed === 'boolean' ? raw.sidebarCollapsed : DEFAULT_USER_PREFERENCES.sidebarCollapsed,
    sidebarWidth: Number.isFinite(sidebarWidth)
      ? Math.min(380, Math.max(200, Math.round(sidebarWidth)))
      : DEFAULT_USER_PREFERENCES.sidebarWidth,
    sidebarOpenKeys: isStringArray(raw.sidebarOpenKeys) ? raw.sidebarOpenKeys : DEFAULT_USER_PREFERENCES.sidebarOpenKeys,
    workspaceSearchQuery: typeof raw.workspaceSearchQuery === 'string'
      ? raw.workspaceSearchQuery
      : DEFAULT_USER_PREFERENCES.workspaceSearchQuery,
  }
}

export const readUserPreferences = () => {
  const value = userPreferencesStorage.get(USER_PREFERENCES_STORAGE_KEY)

  if (!value) return DEFAULT_USER_PREFERENCES

  try {
    return sanitizePreferences(JSON.parse(value))
  } catch {
    userPreferencesStorage.remove(USER_PREFERENCES_STORAGE_KEY)
    return DEFAULT_USER_PREFERENCES
  }
}

export const writeUserPreferences = (preferences: UserPreferences) => {
  userPreferencesStorage.set(USER_PREFERENCES_STORAGE_KEY, JSON.stringify(sanitizePreferences(preferences)))
}

export const writeUserPreferencesPatch = (patch: Partial<UserPreferences>) => {
  const nextPreferences = sanitizePreferences({
    ...readUserPreferences(),
    ...patch,
  })

  writeUserPreferences(nextPreferences)
  window.dispatchEvent(new CustomEvent<Partial<UserPreferences>>(USER_PREFERENCES_CHANGED_EVENT, {
    detail: patch,
  }))
}
