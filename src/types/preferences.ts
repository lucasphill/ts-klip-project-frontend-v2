export type ThemePreference = 'light' | 'dark'
export type TaskStatusFilter = 'all' | 'completed' | 'pending'
export type TaskTableSize = 'compact' | 'default' | 'comfortable'

export type TaskSortingPreference = Array<{
  id: string
  desc: boolean
}>

export type TaskColumnFilterPreference = Array<{
  id: string
  value: string
}>

export type UserPreferences = {
  theme: ThemePreference
  taskStatusFilter: TaskStatusFilter
  taskGlobalFilter: string
  taskColumnFilters: TaskColumnFilterPreference
  taskSorting: TaskSortingPreference
  taskTableSize: TaskTableSize
  taskCollapsedIds: string[]
  taskColumnOrder: string[]
  sidebarCollapsed: boolean
  sidebarWidth: number
  sidebarOpenKeys: string[]
  workspaceSearchQuery: string
}

export const TASK_STATUS_FILTER_OPTIONS: Array<{ label: string; value: TaskStatusFilter }> = [
  { label: 'Todas', value: 'all' },
  { label: 'Concluídas', value: 'completed' },
  { label: 'Pendentes', value: 'pending' },
]
