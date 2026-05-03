import type { CustomField, FieldType, Project, Task } from '../types/domain'
import type {
  CreateCustomFieldDefinitionDto,
  CreateCustomFieldValueDto,
  CreateProjectDto,
  CreateTaskDto,
  CustomFieldType,
  CustomFieldValue,
  GetCustomFieldDefinitionDto,
  GetProjectsDto,
  GetTasksWithCustomFieldsDto,
} from '../types/apiTypes'

const DEFAULT_PROJECT_COLOR = '#6366f1'

export const normalizeDateValue = (value?: string | null) => {
  if (!value) return undefined
  return value.split('T')[0]
}

export const normalizeFieldOptions = (options?: string | string[] | null): string[] => {
  if (Array.isArray(options)) {
    return options.map(option => option.trim()).filter(Boolean)
  }

  return String(options ?? '')
    .split(',')
    .map(option => option.trim())
    .filter(Boolean)
}

export const toUiFieldType = (type: CustomFieldType | string): FieldType => {
  if (type === 'boolean') return 'checkbox'
  if (type === 'enum') return 'select'
  if (type === 'number' || type === 'date' || type === 'text') return type
  return 'text'
}

export const toApiFieldType = (type: FieldType): CustomFieldType => {
  if (type === 'checkbox') return 'boolean'
  if (type === 'select') return 'enum'
  return type
}

export const fromApiProject = (project: GetProjectsDto): Project => ({
  id: project.id,
  name: project.name,
  color: project.color || DEFAULT_PROJECT_COLOR,
  description: project.description || '',
  createdAt: project.createdAt,
})

export const toApiProjectPayload = (project: Pick<Project, 'name' | 'description' | 'color'>): CreateProjectDto => ({
  name: project.name,
  description: project.description || undefined,
  color: project.color || DEFAULT_PROJECT_COLOR,
})

export const fromApiCustomField = (
  field: GetCustomFieldDefinitionDto,
  projectIds: string[] = [],
): CustomField => ({
  id: field.id,
  name: field.name,
  type: toUiFieldType(field.type),
  options: normalizeFieldOptions(field.options),
  scope: field.isUniversal ? 'universal' : 'project',
  projectIds: field.isUniversal ? [] : Array.from(new Set(projectIds)),
})

export const toApiCustomFieldPayload = (
  field: Omit<CustomField, 'id'> | CustomField,
): CreateCustomFieldDefinitionDto => ({
  name: field.name,
  type: toApiFieldType(field.type),
  isUniversal: field.scope === 'universal',
  options: field.options && field.options.length > 0 ? field.options.join(',') : undefined,
})

export const fromApiTask = (
  task: GetTasksWithCustomFieldsDto,
  projectIds: string[] = [],
  customFieldValues?: Record<string, CustomFieldValue>,
): Task => {
  const normalizedProjectIds = Array.from(new Set(projectIds.filter(Boolean)))
  const createdAt = task.createdAt || new Date().toISOString()

  return {
    id: task.id,
    title: task.title,
    description: task.notes || '',
    status: task.isCompleted ? 'done' : 'todo',
    priority: 'medium',
    projectId: normalizedProjectIds[0] || '',
    projectIds: normalizedProjectIds,
    dueDate: normalizeDateValue(task.dueDate),
    parentTaskId: task.parentTaskId || undefined,
    customFieldValues: {
      ...(task.customFields ?? {}),
      ...(customFieldValues ?? {}),
    },
    createdAt,
    updatedAt: createdAt,
  }
}

export const toApiTaskPayload = (task: Pick<Task, 'title' | 'description' | 'status' | 'dueDate' | 'parentTaskId'>): CreateTaskDto => ({
  title: task.title,
  notes: task.description || undefined,
  dueDate: task.dueDate || undefined,
  isCompleted: task.status === 'done',
  parentTaskId: task.parentTaskId || undefined,
})

export const taskBelongsToProject = (task: Task, projectId?: string) => {
  if (!projectId) return true
  return task.projectId === projectId || task.projectIds.includes(projectId)
}

export const buildCustomFieldValuePayload = (
  taskId: string,
  customFieldId: string,
  fieldType: FieldType,
  value: unknown,
): CreateCustomFieldValueDto => {
  const payload: CreateCustomFieldValueDto = {
    taskId,
    customFieldId,
  }

  if (fieldType === 'number') {
    payload.valueNumber =
      value === undefined || value === null || value === '' ? undefined : Number(value)
    return payload
  }

  payload.valueText = value === undefined || value === null ? '' : String(value)
  return payload
}
