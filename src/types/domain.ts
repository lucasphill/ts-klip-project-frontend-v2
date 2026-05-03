export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type FieldType = 'text' | 'number' | 'date' | 'select' | 'checkbox'

export interface CustomField {
  id: string
  name: string
  type: FieldType
  options?: string[]
  scope: 'universal' | 'project'
  projectIds: string[]
}

export interface Project {
  id: string
  name: string
  color: string
  description: string
  createdAt: string
}

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  projectId: string
  projectIds: string[]
  dueDate?: string
  assignee?: string
  parentTaskId?: string
  customFieldValues: Record<string, unknown>
  createdAt: string
  updatedAt: string
}
