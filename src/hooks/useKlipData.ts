import { useCallback, useEffect, useState } from 'react'
import {
  customFieldDefinitionsApi,
  customFieldValuesApi,
  projectsApi,
  projectsCustomFieldDefinitionsApi,
  projectsTasksApi,
  tasksApi,
} from '../services/api'
import {
  buildCustomFieldValuePayload,
  fromApiCustomField,
  fromApiProject,
  fromApiTask,
  normalizeFieldOptions,
  toApiCustomFieldPayload,
  toApiFieldType,
  toApiProjectPayload,
  toApiTaskPayload,
} from '../lib/klipAdapters'
import { normalizeSearchText } from '../lib/search'
import type { CustomField, Project, Task } from '../types/domain'
import type { CustomFieldValue, GetCustomFieldDefinitionDto, GetTasksWithCustomFieldsDto } from '../types/apiTypes'

type NotificationPayload = {
  title: string
  description?: string
  placement?: 'topRight'
}

type NotificationLike = {
  success: (payload: NotificationPayload) => void
  warning: (payload: NotificationPayload) => void
  error: (payload: NotificationPayload) => void
}

type UseKlipDataParams = {
  notification: NotificationLike
  isAuthenticated: boolean
  showLoader: () => void
  hideLoader: () => void
}

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback

const hasStoredCustomFieldValue = (values: Record<string, unknown>, field: CustomField) => {
  const candidateKeys = [field.id, field.name, normalizeSearchText(field.name)]

  return candidateKeys.some(key => Object.prototype.hasOwnProperty.call(values, key)) ||
    Object.keys(values).some(key => normalizeSearchText(key) === normalizeSearchText(field.name))
}

export const useKlipData = ({
  notification,
  isAuthenticated,
  showLoader,
  hideLoader,
}: UseKlipDataParams) => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [customFields, setCustomFields] = useState<CustomField[]>([])

  const loadData = useCallback(async () => {
    const projectsResponse = await projectsApi.getAll()
    const uiProjects = (projectsResponse.data ?? []).map(fromApiProject)

    const [tasksResponse, fieldsResponse] = await Promise.all([
      tasksApi.getAllWithUniversalCustomFields(),
      customFieldDefinitionsApi.getAll(),
    ])

    const taskById = new Map<string, GetTasksWithCustomFieldsDto>()
    const taskProjectIds = new Map<string, Set<string>>()
    const taskCustomValues = new Map<string, Record<string, CustomFieldValue>>()
    const fieldProjectIds = new Map<string, Set<string>>()

    for (const task of tasksResponse.data ?? []) {
      taskById.set(task.id, task)
      taskCustomValues.set(task.id, { ...(task.customFields ?? {}) })
    }

    await Promise.all(uiProjects.map(async (project) => {
      const [projectTasksResponse, projectFieldsResponse] = await Promise.all([
        projectsTasksApi.getWithCustomFieldsByProject(project.id),
        projectsCustomFieldDefinitionsApi.getByProject(project.id),
      ])

      for (const task of projectTasksResponse.data ?? []) {
        taskById.set(task.id, { ...(taskById.get(task.id) ?? task), ...task })

        const projectSet = taskProjectIds.get(task.id) ?? new Set<string>()
        projectSet.add(project.id)
        taskProjectIds.set(task.id, projectSet)

        if (task.customFields) {
          taskCustomValues.set(task.id, {
            ...(taskCustomValues.get(task.id) ?? {}),
            ...task.customFields,
          })
        }
      }

      for (const field of projectFieldsResponse.data ?? []) {
        if (field.isUniversal) continue
        const projectSet = fieldProjectIds.get(field.id) ?? new Set<string>()
        projectSet.add(project.id)
        fieldProjectIds.set(field.id, projectSet)
      }
    }))

    const uiTasks = Array.from(taskById.values()).map(task =>
      fromApiTask(
        task,
        Array.from(taskProjectIds.get(task.id) ?? []),
        taskCustomValues.get(task.id),
      ),
    )

    const uiFields = (fieldsResponse.data ?? []).map(field =>
      fromApiCustomField(field, Array.from(fieldProjectIds.get(field.id) ?? [])),
    )

    setProjects(uiProjects)
    setTasks(uiTasks)
    setCustomFields(uiFields)

    return { projects: uiProjects, fields: uiFields }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return

    let isMounted = true
    const loadTimer = window.setTimeout(() => {
      showLoader()
      loadData()
        .catch((error: unknown) => {
          if (!isMounted) return
          notification.error({
            title: 'Erro ao carregar dados',
            description: getErrorMessage(error, 'Nao foi possivel carregar os dados iniciais.'),
            placement: 'topRight',
          })
        })
        .finally(() => {
          if (isMounted) hideLoader()
        })
    }, 0)

    return () => {
      isMounted = false
      window.clearTimeout(loadTimer)
      hideLoader()
    }
  }, [hideLoader, isAuthenticated, loadData, notification, showLoader])

  const syncTaskProjects = useCallback(async (
    taskId: string,
    currentProjectIds: string[],
    nextProjectIds: string[],
  ) => {
    const current = Array.from(new Set(currentProjectIds.filter(Boolean)))
    const next = Array.from(new Set(nextProjectIds.filter(Boolean)))
    const toAssign = next.filter(projectId => !current.includes(projectId))
    const toUnassign = current.filter(projectId => !next.includes(projectId))

    await Promise.all([
      ...toAssign.map(projectId => projectsTasksApi.assign(projectId, taskId)),
      ...toUnassign.map(projectId => projectsTasksApi.unassign(projectId, taskId)),
    ])
  }, [])

  const syncCustomFieldValues = useCallback(async (
    taskId: string,
    values: Record<string, unknown>,
    projectId?: string,
    existingValues: Record<string, unknown> = {},
  ) => {
    await Promise.all(Object.entries(values).map(async ([fieldId, value]) => {
      const field = customFields.find(item => item.id === fieldId)
      if (!field) return

      const payload = buildCustomFieldValuePayload(taskId, fieldId, field.type, value)
      const scopedProjectId = field.scope === 'project' ? projectId : undefined
      const hasExistingValue = hasStoredCustomFieldValue(existingValues, field)

      try {
        if (hasExistingValue) {
          await customFieldValuesApi.update(payload, scopedProjectId)
          return
        }

        await customFieldValuesApi.create(payload, scopedProjectId)
      } catch {
        if (hasExistingValue) {
          await customFieldValuesApi.create(payload, scopedProjectId)
        } else {
          await customFieldValuesApi.update(payload, scopedProjectId)
        }
      }
    }))
  }, [customFields])

  const findCreatedField = useCallback((
    definitions: GetCustomFieldDefinitionDto[],
    field: Omit<CustomField, 'id'>,
  ) => {
    const options = normalizeFieldOptions(field.options)
    return definitions
      .filter(item =>
        item.name.trim().toLowerCase() === field.name.trim().toLowerCase() &&
        item.type === toApiFieldType(field.type) &&
        normalizeFieldOptions(item.options).join('|') === options.join('|'),
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
  }, [])

  const addTask = useCallback(async (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const projectIds = Array.from(new Set([data.projectId, ...(data.projectIds ?? [])].filter(Boolean)))
      const response = await tasksApi.create(toApiTaskPayload(data))
      const createdTaskId = response.data?.id

      if (createdTaskId) {
        await syncTaskProjects(createdTaskId, [], projectIds)
        await syncCustomFieldValues(createdTaskId, data.customFieldValues ?? {}, projectIds[0])
      }

      await loadData()
      notification.success({ title: 'Tarefa criada', description: `"${data.title}" adicionada.`, placement: 'topRight' })
    } catch (error: unknown) {
      notification.error({ title: 'Erro ao criar tarefa', description: getErrorMessage(error, 'Tente novamente.'), placement: 'topRight' })
      throw error
    }
  }, [loadData, notification, syncCustomFieldValues, syncTaskProjects])

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    const existing = tasks.find(task => task.id === id)
    if (!existing) return

    if (updates.status && updates.status !== 'todo' && updates.status !== 'done') {
      notification.warning({ title: 'Em desenvolvimento', description: 'A API ainda nao suporta este status.', placement: 'topRight' })
      return
    }

    const unsupportedPriorityChanged = updates.priority !== undefined && updates.priority !== existing.priority
    const unsupportedAssigneeChanged = updates.assignee !== undefined && updates.assignee !== existing.assignee

    if (unsupportedPriorityChanged || unsupportedAssigneeChanged) {
      notification.warning({ title: 'Em desenvolvimento', description: 'Prioridade e responsavel ainda nao possuem suporte na API.', placement: 'topRight' })
    }

    const merged: Task = {
      ...existing,
      ...updates,
      projectIds: updates.projectIds ??
        ('projectId' in updates
          ? (updates.projectId ? [updates.projectId] : [])
          : existing.projectIds),
      customFieldValues: {
        ...existing.customFieldValues,
        ...(updates.customFieldValues ?? {}),
      },
    }

    try {
      await tasksApi.update(id, toApiTaskPayload(merged))
      await syncTaskProjects(id, existing.projectIds, merged.projectIds)

      if (updates.customFieldValues) {
        await syncCustomFieldValues(id, updates.customFieldValues, merged.projectId, existing.customFieldValues)
      }

      await loadData()
      notification.success({ title: 'Tarefa atualizada', description: 'Alteracoes salvas com sucesso.', placement: 'topRight' })
    } catch (error: unknown) {
      notification.error({ title: 'Erro ao atualizar tarefa', description: getErrorMessage(error, 'Tente novamente.'), placement: 'topRight' })
      throw error
    }
  }, [loadData, notification, syncCustomFieldValues, syncTaskProjects, tasks])

  const deleteTask = useCallback(async (id: string) => {
    const task = tasks.find(item => item.id === id)
    try {
      await tasksApi.remove(id)
      await loadData()
      notification.warning({ title: 'Tarefa removida', description: `"${task?.title ?? 'Tarefa'}" foi removida.`, placement: 'topRight' })
    } catch (error: unknown) {
      notification.error({ title: 'Erro ao remover tarefa', description: getErrorMessage(error, 'Tente novamente.'), placement: 'topRight' })
      throw error
    }
  }, [loadData, notification, tasks])

  const addProject = useCallback(async (data: Omit<Project, 'id' | 'createdAt'>) => {
    try {
      await projectsApi.create(toApiProjectPayload(data))
      const loaded = await loadData()
      const created = [...loaded.projects]
        .filter(project => project.name === data.name)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

      if (!created) throw new Error('Projeto criado, mas nao localizado no recarregamento.')

      notification.success({ title: 'Projeto criado', description: `"${created.name}" adicionado.`, placement: 'topRight' })
      return created
    } catch (error: unknown) {
      notification.error({ title: 'Erro ao criar projeto', description: getErrorMessage(error, 'Tente novamente.'), placement: 'topRight' })
      throw error
    }
  }, [loadData, notification])

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    const existing = projects.find(project => project.id === id)
    if (!existing) return

    try {
      await projectsApi.update(id, toApiProjectPayload({ ...existing, ...updates }))
      await loadData()
      notification.success({ title: 'Projeto atualizado', description: 'Alteracoes salvas.', placement: 'topRight' })
    } catch (error: unknown) {
      notification.error({ title: 'Erro ao atualizar projeto', description: getErrorMessage(error, 'Tente novamente.'), placement: 'topRight' })
      throw error
    }
  }, [loadData, notification, projects])

  const deleteProject = useCallback(async (id: string) => {
    const project = projects.find(item => item.id === id)
    try {
      await projectsApi.remove(id)
      await loadData()
      notification.warning({ title: 'Projeto removido', description: `"${project?.name ?? 'Projeto'}" removido.`, placement: 'topRight' })
    } catch (error: unknown) {
      notification.error({ title: 'Erro ao remover projeto', description: getErrorMessage(error, 'Tente novamente.'), placement: 'topRight' })
      throw error
    }
  }, [loadData, notification, projects])

  const addCustomField = useCallback(async (data: Omit<CustomField, 'id'>) => {
    try {
      await customFieldDefinitionsApi.create(toApiCustomFieldPayload(data))
      const allFields = await customFieldDefinitionsApi.getAll()
      const created = findCreatedField(allFields.data ?? [], data)

      if (created && data.scope === 'project') {
        await Promise.all((data.projectIds ?? []).map(projectId =>
          projectsCustomFieldDefinitionsApi.assign(projectId, created.id),
        ))
      }

      await loadData()
      notification.success({ title: 'Campo criado', description: `"${data.name}" adicionado.`, placement: 'topRight' })
    } catch (error: unknown) {
      notification.error({ title: 'Erro ao criar campo', description: getErrorMessage(error, 'Tente novamente.'), placement: 'topRight' })
      throw error
    }
  }, [findCreatedField, loadData, notification])

  const updateCustomField = useCallback(async (id: string, updates: Partial<Omit<CustomField, 'id'>>) => {
    const existing = customFields.find(field => field.id === id)
    if (!existing) return

    const nextField: CustomField = { ...existing, ...updates }

    try {
      await customFieldDefinitionsApi.update(id, toApiCustomFieldPayload(nextField))

      if (nextField.scope === 'project') {
        const currentProjectIds = existing.projectIds
        const nextProjectIds = nextField.projectIds
        await Promise.all([
          ...nextProjectIds
            .filter(projectId => !currentProjectIds.includes(projectId))
            .map(projectId => projectsCustomFieldDefinitionsApi.assign(projectId, id)),
          ...currentProjectIds
            .filter(projectId => !nextProjectIds.includes(projectId))
            .map(projectId => projectsCustomFieldDefinitionsApi.unassign(projectId, id)),
        ])
      }

      await loadData()
      notification.success({ title: 'Campo atualizado', description: 'Alteracoes salvas.', placement: 'topRight' })
    } catch (error: unknown) {
      notification.error({ title: 'Erro ao atualizar campo', description: getErrorMessage(error, 'Tente novamente.'), placement: 'topRight' })
      throw error
    }
  }, [customFields, loadData, notification])

  const deleteCustomField = useCallback(async (id: string) => {
    const field = customFields.find(item => item.id === id)
    try {
      await customFieldDefinitionsApi.remove(id)
      await loadData()
      notification.warning({ title: 'Campo removido', description: `"${field?.name ?? 'Campo'}" foi removido.`, placement: 'topRight' })
    } catch (error: unknown) {
      notification.error({ title: 'Erro ao remover campo', description: getErrorMessage(error, 'Tente novamente.'), placement: 'topRight' })
      throw error
    }
  }, [customFields, loadData, notification])

  const setProjectFields = useCallback(async (projectId: string, fieldIds: string[]) => {
    const nextIds = Array.from(new Set(fieldIds.filter(Boolean)))
    const currentIds = customFields
      .filter(field => field.scope === 'project' && field.projectIds.includes(projectId))
      .map(field => field.id)

    try {
      await Promise.all([
        ...nextIds
          .filter(fieldId => !currentIds.includes(fieldId))
          .map(fieldId => projectsCustomFieldDefinitionsApi.assign(projectId, fieldId)),
        ...currentIds
          .filter(fieldId => !nextIds.includes(fieldId))
          .map(fieldId => projectsCustomFieldDefinitionsApi.unassign(projectId, fieldId)),
      ])
      await loadData()
    } catch (error: unknown) {
      notification.error({ title: 'Erro ao vincular campos', description: getErrorMessage(error, 'Tente novamente.'), placement: 'topRight' })
      throw error
    }
  }, [customFields, loadData, notification])

  return {
    tasks,
    projects,
    customFields,
    addTask,
    updateTask,
    deleteTask,
    addProject,
    updateProject,
    deleteProject,
    addCustomField,
    updateCustomField,
    deleteCustomField,
    setProjectFields,
  }
}
