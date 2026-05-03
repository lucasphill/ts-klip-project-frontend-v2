import axios, { AxiosError } from 'axios'
import type {
  CreateCustomFieldDefinitionDto,
  CreateCustomFieldValueDto,
  CreateProjectDto,
  CreateTaskDto,
  GetCustomFieldDefinitionDto,
  GetProjectsDto,
  GetTasksDto,
  GetTasksWithCustomFieldsDto,
  HealthResponseDto,
  ResponseModelDto,
} from '../types/apiTypes'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.klip.app.br/api'

type AccessTokenOptions = {
  forceRefresh?: boolean
}

type AccessTokenProvider = (options?: AccessTokenOptions) => Promise<string | undefined>
type AuthErrorHandler = () => void
type RetriableRequestConfig = NonNullable<AxiosError['config']> & {
  _authRetry?: boolean
}

let accessTokenProvider: AccessTokenProvider | null = null
let authErrorHandler: AuthErrorHandler | null = null

export const setAccessTokenProvider = (
  provider: AccessTokenProvider | null,
  onAuthError?: AuthErrorHandler,
) => {
  accessTokenProvider = provider
  authErrorHandler = onAuthError ?? null
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
})

api.interceptors.request.use(async (config) => {
  if (!accessTokenProvider) return config

  const token = await accessTokenProvider()
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => {
    if (
      response.data &&
      typeof response.data === 'object' &&
      'status' in response.data &&
      response.data.status === false
    ) {
      throw new Error(response.data.message || 'A API retornou uma falha.')
    }

    return response
  },
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      const originalRequest = error.config as RetriableRequestConfig | undefined

      if (accessTokenProvider && originalRequest && !originalRequest._authRetry) {
        originalRequest._authRetry = true

        try {
          const token = await accessTokenProvider({ forceRefresh: true })

          if (token) {
            originalRequest.headers = originalRequest.headers || {}
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api.request(originalRequest)
          }
        } catch {
          authErrorHandler?.()
          return Promise.reject(error)
        }
      }

      authErrorHandler?.()
    }

    return Promise.reject(error)
  },
)

export const healthApi = {
  getHealth: async () => {
    const response = await api.get<HealthResponseDto>('/health')
    return response.data
  },
}

export const customFieldDefinitionsApi = {
  create: async (data: CreateCustomFieldDefinitionDto) => {
    const response = await api.post<ResponseModelDto<unknown>>('/CustomFieldDefinitions', data)
    return response.data
  },
  getAll: async () => {
    const response = await api.get<ResponseModelDto<GetCustomFieldDefinitionDto[]>>('/CustomFieldDefinitions')
    return response.data
  },
  update: async (customFieldDefinitionId: string, data: CreateCustomFieldDefinitionDto) => {
    const response = await api.put<ResponseModelDto<unknown>>(
      `/CustomFieldDefinitions/${customFieldDefinitionId}`,
      data,
    )
    return response.data
  },
  remove: async (customFieldDefinitionId: string) => {
    const response = await api.delete<ResponseModelDto<unknown>>(
      `/CustomFieldDefinitions/${customFieldDefinitionId}`,
    )
    return response.data
  },
}

export const customFieldValuesApi = {
  create: async (data: CreateCustomFieldValueDto, projectId?: string) => {
    const response = await api.post<ResponseModelDto<unknown>>('/CustomFieldValues', data, {
      params: { projectId },
    })
    return response.data
  },
  update: async (data: CreateCustomFieldValueDto, projectId?: string) => {
    const response = await api.put<ResponseModelDto<unknown>>('/CustomFieldValues', data, {
      params: { projectId },
    })
    return response.data
  },
  remove: async (customFieldValueId: string, projectId?: string) => {
    const response = await api.delete<ResponseModelDto<unknown>>(
      `/CustomFieldValues/${customFieldValueId}`,
      { params: { projectId } },
    )
    return response.data
  },
}

export const projectsApi = {
  create: async (data: CreateProjectDto) => {
    const response = await api.post<ResponseModelDto<GetProjectsDto>>('/Projects', data)
    return response.data
  },
  getAll: async () => {
    const response = await api.get<ResponseModelDto<GetProjectsDto[]>>('/Projects')
    return response.data
  },
  update: async (projectId: string, data: CreateProjectDto) => {
    const response = await api.put<ResponseModelDto<unknown>>(`/Projects/${projectId}`, data)
    return response.data
  },
  remove: async (projectId: string) => {
    const response = await api.delete<ResponseModelDto<unknown>>(`/Projects/${projectId}`)
    return response.data
  },
}

export const projectsCustomFieldDefinitionsApi = {
  assign: async (projectId?: string, customFieldDefinitionId?: string) => {
    const response = await api.post<ResponseModelDto<unknown>>(
      '/ProjectsCustomFieldDefinitions/assign',
      undefined,
      { params: { projectId, customFieldDefinitionId } },
    )
    return response.data
  },
  getByProject: async (projectId: string) => {
    const response = await api.get<ResponseModelDto<GetCustomFieldDefinitionDto[]>>(
      `/ProjectsCustomFieldDefinitions/project/${projectId}/custom-field-definitions`,
    )
    return response.data
  },
  unassign: async (projectId?: string, customFieldDefinitionId?: string) => {
    const response = await api.delete<ResponseModelDto<unknown>>(
      '/ProjectsCustomFieldDefinitions/unassign',
      { params: { projectId, customFieldDefinitionId } },
    )
    return response.data
  },
}

export const projectsTasksApi = {
  assign: async (projectId?: string, taskId?: string) => {
    const response = await api.post<ResponseModelDto<unknown>>('/ProjectsTasks/assign', undefined, {
      params: { projectId, taskId },
    })
    return response.data
  },
  getByProject: async (projectId: string) => {
    const response = await api.get<ResponseModelDto<GetTasksDto[]>>(
      `/ProjectsTasks/project/${projectId}/tasks`,
    )
    return response.data
  },
  getWithCustomFieldsByProject: async (projectId: string) => {
    const response = await api.get<ResponseModelDto<GetTasksWithCustomFieldsDto[]>>(
      `/ProjectsTasks/project/${projectId}/tasks-with-custom-fields`,
    )
    return response.data
  },
  unassign: async (projectId?: string, taskId?: string) => {
    const response = await api.delete<ResponseModelDto<unknown>>('/ProjectsTasks/unassign', {
      params: { projectId, taskId },
    })
    return response.data
  },
}

export const tasksApi = {
  create: async (data: CreateTaskDto) => {
    const response = await api.post<ResponseModelDto<GetTasksDto>>('/Tasks', data)
    return response.data
  },
  getAll: async () => {
    const response = await api.get<ResponseModelDto<GetTasksDto[]>>('/Tasks')
    return response.data
  },
  getAllWithUniversalCustomFields: async () => {
    const response = await api.get<ResponseModelDto<GetTasksWithCustomFieldsDto[]>>(
      '/Tasks/with-universal-custom-fields',
    )
    return response.data
  },
  update: async (taskId: string, data: CreateTaskDto) => {
    const response = await api.put<ResponseModelDto<unknown>>(`/Tasks/${taskId}`, data)
    return response.data
  },
  remove: async (taskId: string) => {
    const response = await api.delete<ResponseModelDto<unknown>>(`/Tasks/${taskId}`)
    return response.data
  },
}

export default api
