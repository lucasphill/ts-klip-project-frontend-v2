import { createContext, useContext } from 'react'
import type { CustomField, Project, Task } from '../types/domain'

interface ThemeCtx {
  isDark: boolean
  toggle: () => void
}

export const ThemeContext = createContext<ThemeCtx>({ isDark: false, toggle: () => { } })

export const useTheme = () => useContext(ThemeContext)

interface LoaderCtx {
  loading: boolean
  showLoader: () => void
  hideLoader: () => void
}

export const LoaderContext = createContext<LoaderCtx>({
  loading: false,
  showLoader: () => { },
  hideLoader: () => { },
})

export const useLoader = () => useContext(LoaderContext)

export interface AppDataCtx {
  tasks: Task[]
  projects: Project[]
  customFields: CustomField[]
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void | Promise<void>
  updateTask: (id: string, updates: Partial<Task>) => void | Promise<void>
  deleteTask: (id: string) => void | Promise<void>
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => Project | Promise<Project>
  updateProject: (id: string, updates: Partial<Project>) => void | Promise<void>
  deleteProject: (id: string) => void | Promise<void>
  addCustomField: (field: Omit<CustomField, 'id'>) => void | Promise<void>
  updateCustomField: (id: string, updates: Partial<Omit<CustomField, 'id'>>) => void | Promise<void>
  deleteCustomField: (id: string) => void | Promise<void>
  setProjectFields: (projectId: string, fieldIds: string[]) => void | Promise<void>
}

export const AppDataContext = createContext<AppDataCtx>({
  tasks: [],
  projects: [],
  customFields: [],
  addTask: () => { },
  updateTask: () => { },
  deleteTask: () => { },
  addProject: () => ({} as Project),
  updateProject: () => { },
  deleteProject: () => { },
  addCustomField: () => { },
  updateCustomField: () => { },
  deleteCustomField: () => { },
  setProjectFields: () => { },
})

export const useAppData = () => useContext(AppDataContext)

interface TaskEditCtx {
  openEditTask: (task: Task | null, defaultProjectId?: string) => void
}

export const TaskEditContext = createContext<TaskEditCtx>({ openEditTask: () => { } })

export const useTaskEdit = () => useContext(TaskEditContext)
