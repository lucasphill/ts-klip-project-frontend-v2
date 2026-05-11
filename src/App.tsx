import React, {
  useState,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import {
  App as AntApp,
  Layout,
  Menu,
  Button,
  Table,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Select,
  DatePicker,
  Tag,
  Space,
  Typography,
  ConfigProvider,
  Spin,
  Splitter,
  theme as antTheme,
  ColorPicker,
  Avatar,
  Tooltip,
  Divider,
  Row,
  Col,
  InputNumber,
  Empty,
  Calendar,
  Badge,
  Card,
} from 'antd'
import ptBR from 'antd/locale/pt_BR'
import type { MenuProps, BadgeProps, CalendarProps } from 'antd'
import {
  SearchOutlined,
  CheckSquareOutlined,
  FolderOutlined,
  SettingOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  EditOutlined,
  SunOutlined,
  MoonOutlined,
  CalendarOutlined,
  DatabaseOutlined,
  RobotOutlined,
  LinkOutlined,
  GithubOutlined,
  GlobalOutlined,
  LogoutOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './contexts/authState'
import {
  AppDataContext,
  LoaderContext,
  TaskEditContext,
  ThemeContext,
  useAppData,
  useLoader,
  useTaskEdit,
  useTheme,
} from './contexts/appContexts'
import { useKlipData } from './hooks/useKlipData'
import { useAppRoute } from './hooks/useAppRoute'
import { useUserPreference } from './hooks/useUserPreference'
import { getRouteMenuKey, ROUTE_CHANGE_EVENT } from './lib/routes'
import { matchesSearchText, normalizeSearchText } from './lib/search'
import { getTaskProjectIds } from './lib/taskDisplay'
import {
  PROJECT_COLORS,
  getContrastColor,
} from './constants/ui'
import type { CustomField, FieldType, Project, Task, TaskStatus } from './types/domain'

const { Header, Content, Footer } = Layout
const { Text } = Typography

const TasksTable = React.lazy(() =>
  import('./components/TasksTable').then(module => ({ default: module.TasksTable })),
)
const MobileApp = React.lazy(() => import('./MobileApp'))

dayjs.locale('pt-br')

export type { CustomField, FieldType, Project, Task, TaskStatus }

const LoaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false)
  const { isDark } = useTheme()
  const showLoader = useCallback(() => setLoading(true), [])
  const hideLoader = useCallback(() => setLoading(false), [])
  return (
    <LoaderContext.Provider value={{ loading, showLoader, hideLoader }}>
      {loading && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          background: isDark
            ? 'rgba(8, 8, 12, 0.55)'
            : 'rgba(230, 230, 248, 0.45)',
        }}>
          {/* Glass card */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
            padding: '40px 56px',
            borderRadius: 24,
            background: isDark
              ? 'rgba(255, 255, 255, 0.06)'
              : 'rgba(255, 255, 255, 0.55)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.80)'}`,
            boxShadow: isDark
              ? '0 8px 40px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.07)'
              : '0 8px 40px rgba(99,102,241,0.10), inset 0 1px 0 rgba(255,255,255,0.90)',
          }}>
            {/* Klip icon */}
            <svg width="52" height="52" viewBox="0 0 191 191" style={{ borderRadius: 12 }}>
              <path d="M 75.00 29.77 L 75.00 160.00 L 71.75 159.90 C60.29,159.54 49.27,152.47 43.84,142.00 C41.51,137.53 41.50,137.27 41.22,96.10 L 41.21 95.49 C40.97,59.07 40.91,50.73 44.72,44.93 C45.88,43.17 47.38,41.65 49.35,39.65 C55.74,33.15 60.71,30.73 68.75,30.19 Z" fill="rgb(102,172,203)" />
              <path d="M 127.25 77.27 C116.94,87.28 103.44,100.40 97.25,106.43 L 86.00 117.39 L 86.00 71.41 L 97.00 61.50 C107.43,52.10 108.00,51.38 108.00,47.68 C108.00,42.45 111.39,36.71 116.00,34.12 C119.31,32.26 121.38,32.00 132.89,32.00 L 146.00 32.00 L 146.00 59.08 ZM 125.81 156.60 C122.88,158.08 118.30,159.33 114.45,159.69 L 108.00 160.29 L 108.00 131.56 L 102.75 126.25 L 97.50 120.93 L 106.02 112.72 C110.71,108.20 116.40,102.77 118.65,100.66 L 122.76 96.83 L 129.88 103.95 C133.80,107.87 138.19,113.41 139.63,116.27 C143.10,123.11 143.85,131.92 141.56,138.83 C139.41,145.28 132.30,153.31 125.81,156.60 Z" fill="rgb(238,128,91)" />
              <path fillRule="evenodd" d="M 0.00 95.50 L 0.00 0.00 L 191.00 0.00 L 191.00 191.00 L 0.00 191.00 Z M 75.00 94.88 L 75.00 29.77 L 68.75 30.19 C60.71,30.73 55.74,33.15 49.35,39.65 C40.86,48.28 40.89,48.04 41.22,96.10 C41.50,137.27 41.51,137.53 43.84,142.00 C49.27,152.47 60.29,159.54 71.75,159.90 L 75.00 160.00 Z M 125.81 156.60 C132.30,153.31 139.41,145.28 141.56,138.83 C143.85,131.92 143.10,123.11 139.63,116.27 C138.19,113.41 133.80,107.87 129.88,103.95 L 122.76 96.83 L 118.65 100.66 C116.40,102.77 110.71,108.20 106.02,112.72 L 97.50 120.93 L 102.75 126.25 L 108.00 131.56 L 108.00 160.29 L 114.45 159.69 C118.30,159.33 122.88,158.08 125.81,156.60 Z M 127.25 77.27 L 146.00 59.08 L 146.00 32.00 L 132.89 32.00 C121.38,32.00 119.31,32.26 116.00,34.12 C111.39,36.71 108.00,42.45 108.00,47.68 C108.00,51.38 107.43,52.10 97.00,61.50 L 86.00 71.41 L 86.00 117.39 L 97.25 106.43 C103.44,100.40 116.94,87.28 127.25,77.27 Z" fill={isDark ? '#111111' : '#fefefe'} />
            </svg>
            <ConfigProvider theme={{ components: { Spin: { dotSize: 32, colorPrimary: '#6366f1' } } }}>
              <Spin size="large" />
            </ConfigProvider>
          </div>
        </div>
      )}
      {children}
    </LoaderContext.Provider>
  )
}

const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { notification } = AntApp.useApp()
  const { isAuthenticated } = useAuth()
  const { showLoader, hideLoader } = useLoader()
  const data = useKlipData({ notification, isAuthenticated, showLoader, hideLoader })

  return (
    <AppDataContext.Provider value={data}>
      {children}
    </AppDataContext.Provider>
  )
}

// ─── LOGO ─────────────────────────────────────────────────────────────────────

export const AppLogo: React.FC<{ collapsed: boolean; onClick: () => void }> = ({ collapsed, onClick }) => {
  const { isDark } = useTheme()
  return (
    <button type="button" onClick={onClick} aria-label="Klip Task Manager App - Ir para a página inicial" style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: collapsed ? '18px 0' : '18px 20px',
      justifyContent: collapsed ? 'center' : 'flex-start',
      borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
      overflow: 'hidden',
      flexShrink: 0,
      width: '100%',
      background: 'transparent',
      borderTop: 0,
      borderLeft: 0,
      borderRight: 0,
      color: 'inherit',
      cursor: 'pointer',
      textAlign: 'left',
    }}>
      <svg width="32" height="32" viewBox="0 0 191 191" style={{ flexShrink: 0, borderRadius: 7, display: 'block' }}>
        <path d="M 75.00 29.77 L 75.00 160.00 L 71.75 159.90 C60.29,159.54 49.27,152.47 43.84,142.00 C41.51,137.53 41.50,137.27 41.22,96.10 L 41.21 95.49 C40.97,59.07 40.91,50.73 44.72,44.93 C45.88,43.17 47.38,41.65 49.35,39.65 C55.74,33.15 60.71,30.73 68.75,30.19 Z" fill="rgb(102,172,203)" />
        <path d="M 127.25 77.27 C116.94,87.28 103.44,100.40 97.25,106.43 L 86.00 117.39 L 86.00 71.41 L 97.00 61.50 C107.43,52.10 108.00,51.38 108.00,47.68 C108.00,42.45 111.39,36.71 116.00,34.12 C119.31,32.26 121.38,32.00 132.89,32.00 L 146.00 32.00 L 146.00 59.08 ZM 125.81 156.60 C122.88,158.08 118.30,159.33 114.45,159.69 L 108.00 160.29 L 108.00 131.56 L 102.75 126.25 L 97.50 120.93 L 106.02 112.72 C110.71,108.20 116.40,102.77 118.65,100.66 L 122.76 96.83 L 129.88 103.95 C133.80,107.87 138.19,113.41 139.63,116.27 C143.10,123.11 143.85,131.92 141.56,138.83 C139.41,145.28 132.30,153.31 125.81,156.60 Z" fill="rgb(238,128,91)" />
      </svg>
      {!collapsed && (
        <div style={{ lineHeight: 1.15, overflow: 'hidden', whiteSpace: 'nowrap' }}>
          <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.5px', color: isDark ? '#fff' : '#1a1a1a' }}>
            Klip
          </div>
          <div style={{ fontSize: 10, letterSpacing: '1.5px', opacity: 0.4, textTransform: 'uppercase' }}>
            Task Manager App
          </div>
        </div>
      )}
    </button>
  )
}

// ─── TASK DRAWER ──────────────────────────────────────────────────────────────

const PageHeader: React.FC<{
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
}> = ({ title, description, action }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexShrink: 0,
    flexWrap: 'wrap',
  }}>
    <Space orientation="vertical" size={0} style={{ minWidth: 0, flex: '1 1 220px' }}>
      <Text strong style={{ fontSize: 18 }}>{title}</Text>
      {description && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {description}
        </Text>
      )}
    </Space>
    {action ? <div style={{ flexShrink: 0 }}>{action}</div> : null}
  </div>
)

interface TaskFormValues {
  title: string
  description?: string
  projectId?: string
  parentTaskId?: string
  dueDate?: dayjs.Dayjs
  assignee?: string
  customFieldValues?: Record<string, unknown>
}

interface ProjectFormValues {
  name: string
  description?: string
  color?: string
  cfIds?: string[]
}

interface CustomFieldFormValues {
  name: string
  type: FieldType
  scope: 'universal' | 'project'
  projectIds?: string[]
  options?: string
}

const BOOLEAN_FIELD_OPTIONS = [
  { value: 'true', label: 'Sim' },
  { value: 'false', label: 'Não' },
]

const FIELD_TYPE_OPTIONS = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Data' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'select', label: 'Seleção' },
]

const FIELD_SCOPE_OPTIONS = [
  { value: 'project', label: 'Por projeto (vinculado manualmente)' },
  { value: 'universal', label: 'Universal (todas as tarefas)' },
]

const LLM_PROVIDER_OPTIONS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'ollama', label: 'Ollama (local)' },
]

const LLM_MODEL_OPTIONS = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o mini' },
  { value: 'claude-3-5-sonnet', label: 'claude-3-5-sonnet' },
]

const getTaskCustomFieldValue = (values: Record<string, unknown>, field: CustomField) => {
  const candidateKeys = [field.id, field.name, normalizeSearchText(field.name)]

  for (const key of candidateKeys) {
    if (Object.prototype.hasOwnProperty.call(values, key)) return values[key]
  }

  const normalizedName = normalizeSearchText(field.name)
  return Object.entries(values).find(([key]) => normalizeSearchText(key) === normalizedName)?.[1]
}

export const TaskDrawer: React.FC<{
  open: boolean
  onClose: () => void
  editingTask: Task | null
  defaultProjectId?: string
  defaultParentTaskId?: string
  defaultDueDate?: string
}> = ({ open, onClose, editingTask, defaultProjectId, defaultParentTaskId, defaultDueDate }) => {
  const { tasks, projects, customFields, addTask, updateTask } = useAppData()
  const [form] = Form.useForm<TaskFormValues>()
  const [submitting, setSubmitting] = useState(false)
  const watchedProjectId = Form.useWatch('projectId', form) as string | undefined
  const selectedProjectId = watchedProjectId ?? defaultProjectId ?? ''
  const projFields = useMemo(
    () => customFields.filter(f => f.scope === 'universal' || f.projectIds.includes(selectedProjectId)),
    [customFields, selectedProjectId],
  )
  const projectOptions = useMemo(
    () => projects.map(project => ({
      value: project.id,
      label: (
        <Space>
          <span style={{ display: 'inline-block', width: 8, height: 8, background: project.color }} />
          {project.name}
        </Space>
      ),
    })),
    [projects],
  )
  const parentTaskOptions = useMemo(
    () => tasks
      .filter(task => task.id !== editingTask?.id)
      .map(task => ({ value: task.id, label: task.title })),
    [editingTask?.id, tasks],
  )
  const handleClose = useCallback(() => {
    form.resetFields()
    onClose()
  }, [form, onClose])

  useEffect(() => {
    if (!open) return
    if (editingTask) {
      const customFieldValues = Object.fromEntries(
        customFields.flatMap((field) => {
          const value = getTaskCustomFieldValue(editingTask.customFieldValues ?? {}, field)
          if (value === undefined) return []
          if (field.type === 'date' && typeof value === 'string') return [[field.id, dayjs(value)]]
          return [[field.id, value]]
        }),
      )

      form.setFieldsValue({
        ...editingTask,
        customFieldValues,
        dueDate: editingTask.dueDate ? dayjs(editingTask.dueDate) : undefined,
      })
    } else {
      form.resetFields()
      const pid = defaultProjectId ?? undefined
      form.setFieldsValue({
        projectId: pid,
        parentTaskId: defaultParentTaskId,
        dueDate: defaultDueDate ? dayjs(defaultDueDate) : undefined,
      })
    }
  }, [open, editingTask, defaultProjectId, defaultParentTaskId, defaultDueDate, customFields, form])

  const handleSubmit = async (values: TaskFormValues) => {
    if (submitting) return
    setSubmitting(true)
    const projectIds = values.projectId ? [values.projectId] : []
    const activeFieldIds = new Set(projFields.map(field => field.id))
    const customFieldValues = Object.fromEntries(
      Object.entries(values.customFieldValues ?? {}).filter(([fieldId]) => activeFieldIds.has(fieldId)).map(([fieldId, value]) => {
        const field = customFields.find(item => item.id === fieldId)
        if (field?.type === 'date' && dayjs.isDayjs(value)) {
          return [fieldId, value.format('YYYY-MM-DD')]
        }
        return [fieldId, value]
      }),
    )
    const processed: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
      title: values.title,
      description: values.description ?? '',
      status: editingTask?.status ?? 'todo',
      priority: editingTask?.priority ?? 'medium',
      projectId: values.projectId ?? '',
      projectIds,
      parentTaskId: values.parentTaskId || undefined,
      assignee: undefined,
      dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : undefined,
      customFieldValues,
    }
    try {
      if (editingTask) {
        await updateTask(editingTask.id, processed)
      } else {
        await addTask(processed)
      }
      handleClose()
    } catch {
      // API hooks already surface the failure through notifications.
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Drawer
      title={editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
      open={open}
      onClose={handleClose}
      size="min(100vw, 460px)"
      destroyOnHidden
      keyboard
      mask={{ closable: true }}
      afterOpenChange={(visible) => {
        if (!visible) form.resetFields()
      }}
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={handleClose} disabled={submitting}>Cancelar</Button>
          <Button type="primary" htmlType="submit" form="task-drawer-form" loading={submitting}>
            {editingTask ? 'Salvar alterações' : 'Criar Tarefa'}
          </Button>
        </Space>
      }
    >
      <Form id="task-drawer-form" form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item name="title" label="Título" htmlFor="task-title" rules={[{ required: true, message: 'Informe o título' }]}>
          <Input id="task-title" name="task-title" autoComplete="off" placeholder="Título da tarefa" />
        </Form.Item>
        <Form.Item name="description" label="Descrição" htmlFor="task-description">
          <Input.TextArea id="task-description" name="task-description" autoComplete="off" rows={3} placeholder="Descrição..." />
        </Form.Item>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="projectId" label="Projeto">
              <Select allowClear placeholder="Sem projeto vinculado" options={projectOptions} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="dueDate" label="Prazo" htmlFor="task-due-date">
              <DatePicker id="task-due-date" name="task-due-date" style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="parentTaskId" label="Subtarefa de">
          <Select
            allowClear
            showSearch={{ optionFilterProp: 'label' }}
            placeholder="Nenhuma tarefa pai"
            options={parentTaskOptions}
          />
        </Form.Item>
        <Form.Item name="assignee" label="Responsável" htmlFor="task-assignee">
          <Input id="task-assignee" name="task-assignee" autoComplete="off" disabled placeholder="Em desenvolvimento" />
        </Form.Item>
        {projFields.length > 0 && (
          <>
            <Divider titlePlacement="start" style={{ fontSize: 12, marginTop: 8 }}>
              Campos Personalizados
            </Divider>
            {projFields.map(f => (
              <Form.Item
                key={f.id}
                name={['customFieldValues', f.id]}
                htmlFor={`task-custom-field-${f.id}`}
                label={
                  <Space size={4}>
                    {f.name}
                    {f.scope === 'universal' && (
                      <Tag color="purple" style={{ fontSize: 10, margin: 0, lineHeight: '16px', padding: '0 4px' }}>
                        Universal
                      </Tag>
                    )}
                  </Space>
                }
              >
                {f.type === 'text' && <Input id={`task-custom-field-${f.id}`} name={`task-custom-field-${f.id}`} autoComplete="off" />}
                {f.type === 'number' && <InputNumber style={{ width: '100%' }} />}
                {f.type === 'date' && <DatePicker id={`task-custom-field-${f.id}`} name={`task-custom-field-${f.id}`} style={{ width: '100%' }} format="DD/MM/YYYY" />}
                {f.type === 'checkbox' && (
                  <Select options={BOOLEAN_FIELD_OPTIONS} />
                )}
                {f.type === 'select' && (
                  <Select options={f.options?.map(option => ({ value: option, label: option }))} />
                )}
              </Form.Item>
            ))}
          </>
        )}
      </Form>
    </Drawer>
  )
}

// ─── PROJECT DRAWER ───────────────────────────────────────────────────────────

export const ProjectDrawer: React.FC<{
  open: boolean
  onClose: () => void
  editingProject: Project | null
}> = ({ open, onClose, editingProject }) => {
  const { customFields, addProject, updateProject, setProjectFields } = useAppData()
  const [form] = Form.useForm<ProjectFormValues>()
  const [submitting, setSubmitting] = useState(false)
  const projectCustomFieldOptions = useMemo(
    () => customFields
      .filter(field => field.scope === 'project')
      .map(field => ({
        value: field.id,
        label: (
          <Space size={4}>
            <span>{field.name}</span>
            <Text type="secondary" style={{ fontSize: 11 }}>({field.type})</Text>
          </Space>
        ),
      })),
    [customFields],
  )
  const handleClose = useCallback(() => {
    form.resetFields()
    onClose()
  }, [form, onClose])

  useEffect(() => {
    if (!open) return
    if (editingProject) {
      form.setFieldsValue({
        ...editingProject,
        cfIds: customFields
          .filter(f => f.scope === 'project' && f.projectIds.includes(editingProject.id))
          .map(f => f.id),
      })
    } else {
      form.resetFields()
      form.setFieldValue('color', PROJECT_COLORS[0])
    }
  }, [open, editingProject, form, customFields])

  const handleSubmit = async (values: ProjectFormValues) => {
    if (submitting) return
    setSubmitting(true)
    try {
      if (editingProject) {
        await updateProject(editingProject.id, {
          name: values.name,
          color: values.color,
          description: values.description,
        })
        await setProjectFields(editingProject.id, values.cfIds ?? [])
      } else {
        const newProj = await addProject({
          name: values.name,
          color: values.color ?? PROJECT_COLORS[0],
          description: values.description ?? '',
        })
        await setProjectFields(newProj.id, values.cfIds ?? [])
      }
      handleClose()
    } catch {
      // API hooks already surface the failure through notifications.
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Drawer
      title={editingProject ? 'Editar Projeto' : 'Novo Projeto'}
      open={open}
      onClose={handleClose}
      size="min(100vw, 440px)"
      destroyOnHidden
      keyboard
      mask={{ closable: true }}
      afterOpenChange={(visible) => {
        if (!visible) form.resetFields()
      }}
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={handleClose} disabled={submitting}>Cancelar</Button>
          <Button type="primary" htmlType="submit" form="project-drawer-form" loading={submitting}>
            {editingProject ? 'Salvar alterações' : 'Criar Projeto'}
          </Button>
        </Space>
      }
    >
      <Form id="project-drawer-form" form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item name="name" label="Nome do Projeto" htmlFor="project-name" rules={[{ required: true, message: 'Informe o nome' }]}>
          <Input id="project-name" name="project-name" autoComplete="off" placeholder="ex: Frontend v2" />
        </Form.Item>
        <Form.Item name="description" label="Descrição" htmlFor="project-description">
          <Input.TextArea id="project-description" name="project-description" autoComplete="off" rows={3} placeholder="Descreva o projeto..." />
        </Form.Item>
        <Form.Item
          name="color"
          label="Cor de Identificação"
          getValueFromEvent={(color: { toHexString: () => string }) => color.toHexString()}
        >
          <ColorPicker
            format="hex"
            showText
            presets={[{ label: 'Sugeridas', colors: PROJECT_COLORS }]}
          />
        </Form.Item>
        <Form.Item
          name="cfIds"
          label="Campos Personalizados"
          extra="Campos com escopo Universal estão disponíveis em todos os projetos automaticamente."
        >
          <Select mode="multiple" placeholder="Selecione campos por projeto..." options={projectCustomFieldOptions} />
        </Form.Item>
      </Form>
    </Drawer>
  )
}


// ─── PROJECT HERO ─────────────────────────────────────────────────────────────

const ProjectHero: React.FC<{
  project: Project
  onEdit: () => void
}> = ({ project, onEdit }) => {
  const c = project.color

  return (
    <div style={{ marginBottom: 20 }}>
      <PageHeader
        title={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, background: c, borderRadius: 3 }} />
            <span>{project.name}</span>
          </span>
        }
        description={project.description}
        action={
          <Tooltip title="Editar projeto">
            <Button icon={<EditOutlined />} onClick={onEdit}>
              Editar
            </Button>
          </Tooltip>
        }
      />
    </div>
  )
}

// ─── STATS ROW ────────────────────────────────────────────────────────────────

// ─── TASK EDIT CONTEXT ────────────────────────────────────────────────────────

const TaskEditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [taskOpen, setTaskOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [defaultPid, setDefaultPid] = useState<string | undefined>()
  const [defaultParentTaskId, setDefaultParentTaskId] = useState<string | undefined>()
  const [defaultDueDate, setDefaultDueDate] = useState<string | undefined>()

  const openEditTask = useCallback((task: Task | null, defaultProjectId?: string, parentTaskId?: string, dueDate?: string) => {
    setEditingTask(task)
    setDefaultPid(defaultProjectId)
    setDefaultParentTaskId(parentTaskId)
    setDefaultDueDate(dueDate)
    setTaskOpen(true)
  }, [])

  return (
    <TaskEditContext.Provider value={{ openEditTask }}>
      {children}
      <TaskDrawer
        open={taskOpen}
        onClose={() => {
          setTaskOpen(false)
          setEditingTask(null)
          setDefaultPid(undefined)
          setDefaultParentTaskId(undefined)
          setDefaultDueDate(undefined)
        }}
        editingTask={editingTask}
        defaultProjectId={defaultPid}
        defaultParentTaskId={defaultParentTaskId}
        defaultDueDate={defaultDueDate}
      />
    </TaskEditContext.Provider>
  )
}

type GlobalSearchResult =
  | { type: 'task'; id: string; label: string; description: string; task: Task; projectId?: string }
  | { type: 'project'; id: string; label: string; description: string; project: Project }

const GlobalSearchInput: React.FC<{
  query: string
  onQueryChange: (query: string) => void
  projects: Project[]
  tasks: Task[]
  isDark: boolean
  border: string
  navigate: ReturnType<typeof useAppRoute>['navigate']
  openEditTask: ReturnType<typeof useTaskEdit>['openEditTask']
  setTaskGlobalFilter: (query: string) => void
}> = ({ query, onQueryChange, projects, tasks, isDark, border, navigate, openEditTask, setTaskGlobalFilter }) => {
  const [focused, setFocused] = useState(false)
  const [searchValue, setSearchValue] = useState(query)
  const deferredSearchValue = useDeferredValue(searchValue)
  const trimmedQuery = deferredSearchValue.trim()
  const immediateTrimmedQuery = searchValue.trim()
  const projectById = useMemo(
    () => new Map(projects.map(project => [project.id, project])),
    [projects],
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchValue !== query) onQueryChange(searchValue)
    }, 250)

    return () => window.clearTimeout(timer)
  }, [onQueryChange, query, searchValue])

  const results = useMemo<GlobalSearchResult[]>(() => {
    if (!trimmedQuery) return []

    const taskResults = tasks
      .filter(task => {
        const project = projectById.get(task.projectId) ?? task.projectIds.map(id => projectById.get(id)).find(Boolean)
        return [
          task.title,
          task.description,
          project?.name,
          project?.description,
        ].some(value => matchesSearchText(value, trimmedQuery))
      })
      .slice(0, 5)
      .map(task => {
        const projectId = task.projectId || task.projectIds[0]
        const project = projectId ? projectById.get(projectId) : undefined
        return {
          type: 'task' as const,
          id: task.id,
          label: task.title,
          description: project?.name ? `Tarefa · ${project.name}` : 'Tarefa',
          task,
          projectId,
        }
      })

    const projectResults = projects
      .filter(project => matchesSearchText(`${project.name} ${project.description}`, trimmedQuery))
      .slice(0, 5)
      .map(project => ({
        type: 'project' as const,
        id: project.id,
        label: project.name,
        description: 'Projeto',
        project,
      }))

    return [...taskResults, ...projectResults]
  }, [projectById, projects, tasks, trimmedQuery])

  const selectResult = useCallback((result: GlobalSearchResult) => {
    setFocused(false)
    if (result.type === 'project') {
      navigate({ view: 'project', projectId: result.project.id })
      return
    }

    if (result.projectId) {
      navigate({ view: 'project', projectId: result.projectId })
    } else {
      navigate({ view: 'tasks' })
    }
    openEditTask(result.task)
  }, [navigate, openEditTask])

  const handleEnter = useCallback(() => {
    if (!immediateTrimmedQuery) return
    const firstResult = results[0]
    if (firstResult) {
      selectResult(firstResult)
      return
    }

    setTaskGlobalFilter(immediateTrimmedQuery)
    onQueryChange(searchValue)
    navigate({ view: 'tasks' })
    setFocused(false)
  }, [immediateTrimmedQuery, navigate, onQueryChange, results, searchValue, selectResult, setTaskGlobalFilter])

  const handleBlur = useCallback(() => {
    onQueryChange(searchValue)
    window.setTimeout(() => setFocused(false), 120)
  }, [onQueryChange, searchValue])

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Escape') return
    setFocused(false)
  }, [])

  const showDropdown = focused && immediateTrimmedQuery.length > 0

  return (
    <div style={{ flex: 1, maxWidth: 420, position: 'relative', zIndex: 1 }}>
      <Input
        id="global-search"
        name="global-search"
        aria-label="Pesquisar tarefas e projetos"
        aria-expanded={showDropdown}
        aria-controls={showDropdown ? 'global-search-results' : undefined}
        autoComplete="off"
        prefix={<SearchOutlined style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)' }} />}
        placeholder="Pesquisar tarefas, projetos..."
        value={searchValue}
        onChange={e => setSearchValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onPressEnter={handleEnter}
        allowClear
        style={{
          width: '100%',
          background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
          border: `1px solid ${border}`,
          borderRadius: 8,
        }}
      />
      {showDropdown && (
        <div
          id="global-search-results"
          aria-label="Resultados da busca global"
          onMouseDown={event => event.preventDefault()}
          style={{
            position: 'absolute',
            zIndex: 3000,
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            padding: 6,
            borderRadius: 10,
            border: `1px solid ${border}`,
            background: isDark ? '#181818' : '#ffffff',
            boxShadow: isDark ? '0 16px 40px rgba(0,0,0,0.55)' : '0 16px 40px rgba(15,23,42,0.16)',
          }}
        >
          {results.length === 0 ? (
            <div style={{ padding: '10px 12px' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Nenhum resultado</Text>
            </div>
          ) : (
            results.map(result => (
              <button
                key={`${result.type}-${result.id}`}
                type="button"
                onClick={() => selectResult(result)}
                style={{
                  width: '100%',
                  border: 0,
                  borderRadius: 8,
                  background: 'transparent',
                  color: isDark ? '#f5f5f5' : '#1f2937',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  padding: '9px 10px',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {result.label}
                </span>
                <span style={{ fontSize: 11, opacity: 0.62 }}>{result.description}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ─── CALENDAR VIEW ────────────────────────────────────────────────────────────

export const CalendarView: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { tasks } = useAppData()
  const { openEditTask } = useTaskEdit()
  const { isDark } = useTheme()
  const border = isDark ? '#3a3a3a' : 'rgba(0,0,0,0.07)'
  const glass = { backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {}
    tasks.forEach(task => {
      if (task.dueDate) {
        if (!map[task.dueDate]) map[task.dueDate] = []
        map[task.dueDate].push(task)
      }
    })
    return map
  }, [tasks])

  const statusToBadge = (s: TaskStatus): BadgeProps['status'] => {
    switch (s) {
      case 'done': return 'success'
      case 'in_progress': return 'processing'
      case 'review': return 'warning'
      case 'cancelled': return 'error'
      default: return 'default'
    }
  }

  const dateCellRender = (value: dayjs.Dayjs) => {
    const dayTasks = tasksByDate[value.format('YYYY-MM-DD')] ?? []
    const visibleTasks = dayTasks.slice(0, compact ? 2 : 4)
    const hiddenTaskCount = dayTasks.length - visibleTasks.length
    return (
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {visibleTasks.map(task => (
          <li
            key={task.id}
            style={{ marginBottom: 2 }}
          >
            <button
              type="button"
              aria-label={`Editar tarefa ${task.title}`}
              onClick={e => { e.stopPropagation(); openEditTask(task) }}
              style={{
                width: '100%',
                minWidth: 0,
                border: 0,
                background: 'transparent',
                color: 'inherit',
                cursor: 'pointer',
                padding: 0,
                textAlign: 'left',
              }}
            >
              <Badge status={statusToBadge(task.status)} text={task.title} style={{ fontSize: compact ? 11 : 12 }} />
            </button>
          </li>
        ))}
        {hiddenTaskCount > 0 && (
          <li style={{ marginTop: 2 }}>
            <Text type="secondary" style={{ fontSize: 11 }}>
              +{hiddenTaskCount} tarefa{hiddenTaskCount !== 1 ? 's' : ''}
            </Text>
          </li>
        )}
      </ul>
    )
  }

  const cellRender: CalendarProps<dayjs.Dayjs>['cellRender'] = (current, info) => {
    if (info.type === 'date') return dateCellRender(current)
    return info.originNode
  }

  const handleCalendarSelect: CalendarProps<dayjs.Dayjs>['onSelect'] = (date, info) => {
    if (info.source !== 'date') return
    openEditTask(null, undefined, undefined, date.format('YYYY-MM-DD'))
  }

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: compact ? 10 : 16 }}>
      <PageHeader
        title="Calendário"
        description="Acompanhe prazos e tarefas distribuídas por data."
        action={(
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditTask(null)}>
            Nova Tarefa
          </Button>
        )}
      />
      <div className={compact ? 'klip-calendar-compact' : undefined} style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: isDark ? 'rgba(22,22,22,0.85)' : 'rgba(255,255,255,0.72)',
        border: `1px solid ${border}`,
        ...glass,
      }}>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: compact ? 8 : 16 }}>
          <Calendar cellRender={cellRender} onSelect={handleCalendarSelect} />
        </div>
      </div>
    </div>
  )
}

// ─── USER SETTINGS VIEW ────────────────────────────────────────────────────────

interface ApiToken { id: string; name: string; prefix: string; createdAt: string }

const SettingsCard: React.FC<{
  title: React.ReactNode
  extra?: React.ReactNode
  children: React.ReactNode
  bodyStyle?: React.CSSProperties
}> = ({ title, extra, children, bodyStyle }) => {
  const { token } = antTheme.useToken()

  return (
    <Card
      size="small"
      title={title}
      extra={extra}
      style={{ borderColor: token.colorBorderSecondary }}
      styles={{
        header: { minHeight: 42, paddingInline: 16 },
        body: { padding: 16, ...bodyStyle },
      }}
    >
      {children}
    </Card>
  )
}

export const UserSettingsView: React.FC = () => {
  const { isDark, toggle } = useTheme()
  const { logout } = useAuth()

  const tokenColumns = [
    { title: 'Nome', dataIndex: 'name', key: 'name' },
    { title: 'Prefixo', dataIndex: 'prefix', key: 'prefix', render: (v: string) => <code>{v}</code> },
    { title: 'Criado em', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: '',
      key: 'actions',
      render: (_: unknown, rec: ApiToken) => (
        <Button size="small" danger disabled aria-label={`Revogar token ${rec.name}`}>
          Revogar
        </Button>
      ),
    },
  ]

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PageHeader
        title="Usuário"
        description="Gerencie preferências, perfil, contas vinculadas e configurações da conta."
        action={(
          <Button danger icon={<LogoutOutlined />} onClick={logout}>
            Desconectar
          </Button>
        )}
      />
      {/* Preferências */}
      <SettingsCard title={<Text strong style={{ fontSize: 13 }}>Preferências</Text>}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <Space orientation="vertical" size={0}>
            <Text style={{ fontSize: 13 }}>Tema</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{isDark ? 'Modo escuro ativado' : 'Modo claro ativado'}</Text>
          </Space>
          <Button
            type={isDark ? 'default' : 'primary'}
            size="small"
            icon={isDark ? <SunOutlined /> : <MoonOutlined />}
            onClick={toggle}
          >
            {isDark ? 'Modo claro' : 'Modo escuro'}
          </Button>
        </div>
      </SettingsCard>

      {/* Profile */}
      <SettingsCard
        title={(
          <Space size={8}>
            <Text strong style={{ fontSize: 13 }}>Perfil</Text>
            <Tag style={{ margin: 0 }}>Em desenvolvimento</Tag>
          </Space>
        )}
      >
        <Space size={24} align="start" wrap>
          <Avatar size={72} icon={<UserOutlined />} style={{ background: '#4f46e5', flexShrink: 0 }} />
          <Form layout="vertical" style={{ flex: '1 1 320px', minWidth: 0 }} name="profile-settings-form">
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item label="Nome completo" htmlFor="profile-full-name">
                  <Input id="profile-full-name" name="profile-full-name" autoComplete="name" disabled placeholder="Em desenvolvimento" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="E-mail" htmlFor="profile-email">
                  <Input id="profile-email" name="profile-email" autoComplete="email" disabled placeholder="Em desenvolvimento" />
                </Form.Item>
              </Col>
            </Row>
            <Button type="primary" disabled>Salvar perfil</Button>
          </Form>
        </Space>
      </SettingsCard>

      {/* Account links */}
      <SettingsCard
        title={(
          <Space size={8}>
            <Text strong style={{ fontSize: 13 }}>Contas vinculadas</Text>
            <Tag style={{ margin: 0 }}>Em desenvolvimento</Tag>
          </Space>
        )}
      >
        <Space orientation="vertical" style={{ width: '100%' }} size={16}>
          {[
            { icon: <GithubOutlined />, label: 'GitHub' },
            { icon: <GlobalOutlined />, label: 'Google' },
            { icon: <LinkOutlined />, label: 'Microsoft' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <Space>
                {item.icon}
                <Text>{item.label}</Text>
              </Space>
              <Button size="small" disabled>Vincular</Button>
            </div>
          ))}
        </Space>
      </SettingsCard>

      {/* API Tokens */}
      <SettingsCard
        title={(
          <Space size={8}>
            <Text strong style={{ fontSize: 13 }}>Tokens de API</Text>
            <Tag style={{ margin: 0 }}>Em desenvolvimento</Tag>
          </Space>
        )}
        extra={<Button size="small" type="primary" disabled>Novo token</Button>}
      >
        <Table
          dataSource={[] as ApiToken[]}
          columns={tokenColumns}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </SettingsCard>

      {/* LLM Settings */}
      <SettingsCard
        title={(
          <Space size={8}>
            <Text strong style={{ fontSize: 13 }}>Configurações de LLM</Text>
            <Tag style={{ margin: 0 }}>Em desenvolvimento</Tag>
          </Space>
        )}
      >
        <Form layout="vertical" disabled name="llm-settings-form">
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item label="Provedor">
                  <Select defaultValue="openai" options={LLM_PROVIDER_OPTIONS} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="Modelo">
                  <Select defaultValue="gpt-4o" options={LLM_MODEL_OPTIONS} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="Chave de API" htmlFor="llm-api-key">
              <Input.Password id="llm-api-key" name="llm-api-key" autoComplete="new-password" placeholder="sk-..." />
            </Form.Item>
            <Form.Item label="Prompt de sistema (opcional)" htmlFor="llm-system-prompt">
              <Input.TextArea id="llm-system-prompt" name="llm-system-prompt" autoComplete="off" rows={3} placeholder="Você é um assistente de gestão de projetos..." />
            </Form.Item>
            <Button type="primary" icon={<RobotOutlined />} disabled>Salvar configurações de LLM</Button>
        </Form>
      </SettingsCard>
    </div>
  )
}

// ─── CUSTOM FIELDS SETTINGS VIEW ──────────────────────────────────────────────

export const CustomFieldsSettingsView: React.FC = () => {
  const { isDark } = useTheme()
  const { customFields, projects, addCustomField, updateCustomField, deleteCustomField } = useAppData()
  const cardBg = isDark ? 'rgba(22,22,22,0.85)' : 'rgba(255,255,255,0.72)'
  const border = isDark ? '#3a3a3a' : 'rgba(0,0,0,0.08)'
  const fieldTypeLabels: Record<FieldType, string> = {
    text: 'Texto',
    number: 'Número',
    date: 'Data',
    checkbox: 'Checkbox',
    select: 'Seleção',
  }

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingField, setEditingField] = useState<CustomField | null>(null)
  const [form] = Form.useForm<CustomFieldFormValues>()
  const [submitting, setSubmitting] = useState(false)
  const [scopeVal, setScopeVal] = useState<'universal' | 'project'>('project')
  const [typeVal, setTypeVal] = useState<FieldType>('text')
  const projectById = useMemo(
    () => new Map(projects.map(project => [project.id, project])),
    [projects],
  )
  const projectOptions = useMemo(
    () => projects.map(project => ({ value: project.id, label: project.name })),
    [projects],
  )
  const closeDrawer = useCallback(() => {
    setDrawerOpen(false)
    setEditingField(null)
    setScopeVal('project')
    setTypeVal('text')
    form.resetFields()
  }, [form])

  const openNew = () => {
    setEditingField(null)
    form.resetFields()
    form.setFieldsValue({ scope: 'project', type: 'text' })
    setScopeVal('project')
    setTypeVal('text')
    setDrawerOpen(true)
  }

  const openEdit = (f: CustomField) => {
    setEditingField(f)
    form.setFieldsValue({
      name: f.name,
      type: f.type,
      scope: f.scope,
      projectIds: f.projectIds,
      options: f.options?.join('\n') ?? '',
    })
    setScopeVal(f.scope)
    setTypeVal(f.type)
    setDrawerOpen(true)
  }

  const handleSave = async (values: CustomFieldFormValues) => {
    if (submitting) return
    setSubmitting(true)
    const opts = values.options
      ? values.options.split('\n').map(option => option.trim()).filter(Boolean)
      : undefined
    const payload: Omit<CustomField, 'id'> = {
      name: values.name,
      type: values.type,
      scope: values.scope,
      projectIds: values.scope === 'project' ? (values.projectIds ?? []) : [],
      options: opts,
    }

    try {
      if (editingField) {
        await updateCustomField(editingField.id, payload)
      } else {
        await addCustomField(payload)
      }
      closeDrawer()
    } catch {
      // API hooks already surface the failure through notifications.
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { title: 'Nome', dataIndex: 'name', key: 'name', render: (v: string) => <Text strong>{v}</Text> },
    {
      title: 'Tipo',
      dataIndex: 'type',
      key: 'type',
      render: (v: FieldType) => <Tag>{fieldTypeLabels[v]}</Tag>,
    },
    {
      title: 'Escopo',
      dataIndex: 'scope',
      key: 'scope',
      render: (v: string) => <Tag color={v === 'universal' ? 'purple' : 'blue'}>{v === 'universal' ? 'Universal' : 'Projeto'}</Tag>,
    },
    {
      title: 'Projetos vinculados',
      key: 'projects',
      render: (_: unknown, f: CustomField) => {
        if (f.scope === 'universal') return <Text type="secondary" style={{ fontSize: 12 }}>Todos</Text>
        if (!f.projectIds.length) return <Text type="secondary" style={{ fontSize: 12 }}>Nenhum</Text>
        return (
          <Space size={4} wrap>
            {f.projectIds.map(pid => {
              const p = projectById.get(pid)
              return p ? <Tag key={pid} style={{ backgroundColor: p.color, color: getContrastColor(p.color), border: 'none' }}>{p.name}</Tag> : null
            })}
          </Space>
        )
      },
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (_: unknown, f: CustomField) => (
        <Space>
          <Button size="small" onClick={() => openEdit(f)}>Editar</Button>
          <Popconfirm
            title="Excluir campo?"
            description={`"${f.name}" será removido.`}
            okText="Excluir"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
            onConfirm={() => { void deleteCustomField(f.id) }}
          >
            <Button size="small" danger>Excluir</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PageHeader
        title="Campos Personalizados"
        description="Defina campos universais ou vinculados aos projetos para organizar as tarefas."
        action={(
          <Button type="primary" icon={<DatabaseOutlined />} onClick={openNew}>
            Novo campo
          </Button>
        )}
      />

      <div className="klip-fields-mobile-list" style={{ flexDirection: 'column', gap: 8 }}>
        {customFields.length === 0 ? (
          <div style={{ background: cardBg, border: `1px solid ${border}`, padding: 32 }}>
            <Empty description="Nenhum campo personalizado" />
          </div>
        ) : customFields.map(field => {
          const linkedProjects = field.scope === 'universal'
            ? []
            : field.projectIds.map(projectId => projectById.get(projectId)).filter((project): project is Project => Boolean(project))

          return (
            <div key={field.id} style={{ background: cardBg, border: `1px solid ${border}`, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                <Space orientation="vertical" size={2} style={{ minWidth: 0 }}>
                  <Text strong style={{ fontSize: 13 }}>{field.name}</Text>
                  <Space size={4} wrap>
                    <Tag style={{ margin: 0 }}>{fieldTypeLabels[field.type]}</Tag>
                    <Tag color={field.scope === 'universal' ? 'purple' : 'blue'} style={{ margin: 0 }}>
                      {field.scope === 'universal' ? 'Universal' : 'Projeto'}
                    </Tag>
                  </Space>
                </Space>
                <Space size={2}>
                  <Button size="small" onClick={() => openEdit(field)} aria-label={`Editar ${field.name}`}>Editar</Button>
                  <Popconfirm
                    title="Excluir campo?"
                    description={`"${field.name}" será removido.`}
                    okText="Excluir"
                    cancelText="Cancelar"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => { void deleteCustomField(field.id) }}
                  >
                    <Button size="small" danger style={{ color: '#cf1322' }} aria-label={`Excluir ${field.name}`}>Excluir</Button>
                  </Popconfirm>
                </Space>
              </div>
              <div>
                {field.scope === 'universal' ? (
                  <Text style={{ fontSize: 12, color: isDark ? 'rgba(255,255,255,0.68)' : '#595959' }}>Disponível para todos os projetos.</Text>
                ) : linkedProjects.length > 0 ? (
                  <Space size={4} wrap>
                    {linkedProjects.map(project => {
                      const tagColor = project.color.toLowerCase() === '#6366f1' ? '#4f46e5' : project.color
                      return (
                        <Tag key={project.id} style={{ backgroundColor: tagColor, color: getContrastColor(tagColor), border: 'none', margin: 0 }}>
                          {project.name}
                        </Tag>
                      )
                    })}
                  </Space>
                ) : (
                  <Text style={{ fontSize: 12, color: isDark ? 'rgba(255,255,255,0.68)' : '#595959' }}>Nenhum projeto vinculado.</Text>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="klip-fields-table-panel" style={{ background: cardBg, border: `1px solid ${border}`, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 44, padding: '0 16px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <Space size={8}>
            <Text strong style={{ fontSize: 13 }}>Biblioteca de campos</Text>
            <Tag style={{ margin: 0 }}>{customFields.length}</Tag>
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {customFields.filter(field => field.scope === 'universal').length} universais · {customFields.filter(field => field.scope === 'project').length} por projeto
          </Text>
        </div>
        <div style={{ minHeight: 0, overflow: 'auto' }}>
          <Table
            dataSource={customFields}
            columns={columns}
            rowKey="id"
            size="small"
            pagination={false}
            scroll={{ x: 720 }}
            locale={{ emptyText: <Empty description="Nenhum campo personalizado" /> }}
          />
        </div>
      </div>

      <Drawer
        title={editingField ? 'Editar campo' : 'Novo campo'}
        open={drawerOpen}
        onClose={closeDrawer}
        size="min(100vw, 440px)"
        destroyOnHidden
        keyboard
        mask={{ closable: true }}
        afterOpenChange={(visible) => {
          if (!visible) form.resetFields()
        }}
        footer={
          <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={closeDrawer} disabled={submitting}>Cancelar</Button>
            <Button type="primary" htmlType="submit" form="custom-field-drawer-form" loading={submitting}>
              {editingField ? 'Salvar alterações' : 'Criar campo'}
            </Button>
          </Space>
        }
      >
        <Form id="custom-field-drawer-form" form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label="Nome" htmlFor="custom-field-name" rules={[{ required: true, message: 'Informe o nome' }]}>
            <Input id="custom-field-name" name="custom-field-name" autoComplete="off" placeholder="ex: Story Points" />
          </Form.Item>
          <Form.Item name="type" label="Tipo" rules={[{ required: true }]}>
            <Select options={FIELD_TYPE_OPTIONS} onChange={(v) => setTypeVal(v as FieldType)} />
          </Form.Item>
          {typeVal === 'select' && (
            <Form.Item
              name="options"
              label="Opções (uma por linha)"
              htmlFor="custom-field-options"
              rules={[{ required: true, message: 'Adicione pelo menos uma opção' }]}
            >
              <Input.TextArea id="custom-field-options" name="custom-field-options" autoComplete="off" rows={4} placeholder={"Opção 1\nOpção 2\nOpção 3"} />
            </Form.Item>
          )}
          <Form.Item name="scope" label="Escopo" rules={[{ required: true }]}>
            <Select options={FIELD_SCOPE_OPTIONS} onChange={(v) => setScopeVal(v as 'universal' | 'project')} />
          </Form.Item>
          {scopeVal === 'project' && (
            <Form.Item name="projectIds" label="Projetos">
              <Select mode="multiple" placeholder="Selecione os projetos..." options={projectOptions} />
            </Form.Item>
          )}
        </Form>
      </Drawer>
    </div>
  )
}

const ProjectsOverview: React.FC<{
  projects: Project[]
  tasks: Task[]
  onSelectProject: (projectId: string) => void
  onEditProject: (project: Project) => void
  onNewProject: () => void
}> = ({ projects, tasks, onSelectProject, onEditProject, onNewProject }) => {
  const { isDark } = useTheme()
  const border = isDark ? '#3a3a3a' : 'rgba(0,0,0,0.08)'
  const cardBg = isDark ? 'rgba(22,22,22,0.85)' : 'rgba(255,255,255,0.72)'
  const projectTaskCounts = useMemo(() => {
    const counts = new Map(projects.map(project => [project.id, 0]))

    tasks.forEach(task => {
      getTaskProjectIds(task).forEach(projectId => {
        if (counts.has(projectId)) counts.set(projectId, (counts.get(projectId) ?? 0) + 1)
      })
    })

    return counts
  }, [projects, tasks])

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Space orientation="vertical" size={0}>
          <Text strong style={{ fontSize: 18 }}>Projetos</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>Abra um projeto para ver suas tarefas em uma URL dedicada.</Text>
        </Space>
        <Button type="primary" icon={<FolderOutlined />} onClick={onNewProject}>
          Novo Projeto
        </Button>
      </div>

      {!projects.length ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${border}`, background: cardBg }}>
          <Empty description="Nenhum projeto" />
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 12,
        }}>
          {projects.map(project => {
            const taskCount = projectTaskCounts.get(project.id) ?? 0
            return (
              <Card
                key={project.id}
                size="small"
                hoverable
                onClick={() => onSelectProject(project.id)}
                style={{ borderColor: border, borderLeft: `4px solid ${project.color}`, background: cardBg }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <Space size={8} align="start">
                      <span style={{ display: 'inline-block', width: 10, height: 10, background: project.color, borderRadius: 3, marginTop: 5, flexShrink: 0 }} />
                      <div>
                        <Text strong>{project.name}</Text>
                        {project.description && (
                          <Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 2 }}>
                            {project.description}
                          </Text>
                        )}
                      </div>
                    </Space>
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={(event) => {
                        event.stopPropagation()
                        onEditProject(project)
                      }}
                    />
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{taskCount} tarefas</Text>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

const MainApp: React.FC = () => {
  const { isDark } = useTheme()
  const { projects, tasks } = useAppData()
  const { openEditTask } = useTaskEdit()
  const { route, navigate } = useAppRoute()

  const [siderWidthPreference, setSiderWidthPreference] = useUserPreference('sidebarWidth')
  const [siderWidth, setLiveSiderWidth] = useState(siderWidthPreference)
  const siderWidthPersistTimerRef = useRef<number | undefined>(undefined)
  const [collapsed, setCollapsed] = useUserPreference('sidebarCollapsed')
  const [openKeys, setOpenKeys] = useUserPreference('sidebarOpenKeys')
  const [projOpen, setProjOpen] = useState(false)
  const [editingProj, setEditingProj] = useState<Project | null>(null)
  const [searchQuery, setSearchQuery] = useUserPreference('workspaceSearchQuery')
  const [, setTaskGlobalFilter] = useUserPreference('taskGlobalFilter')
  const filterPid = route.view === 'project' ? route.projectId : undefined
  const projectById = useMemo(
    () => new Map(projects.map(project => [project.id, project])),
    [projects],
  )
  const currentProject = filterPid ? projectById.get(filterPid) : undefined
  const selectedMenuKey = getRouteMenuKey(route)
  const goHome = useCallback(() => {
    window.history.pushState(null, '', '/')
    window.dispatchEvent(new Event(ROUTE_CHANGE_EVENT))
  }, [])

  const queueSiderWidthPersist = useCallback((width: number) => {
    window.clearTimeout(siderWidthPersistTimerRef.current)
    siderWidthPersistTimerRef.current = window.setTimeout(() => {
      setSiderWidthPreference(width)
    }, 180)
  }, [setSiderWidthPreference])

  useEffect(() => () => {
    window.clearTimeout(siderWidthPersistTimerRef.current)
  }, [])

  useEffect(() => {
    if (collapsed) return
    const keyToOpen =
      route.view === 'project' || route.view === 'projects'
        ? 'projects'
        : route.view === 'settings-user' || route.view === 'settings-fields'
          ? 'settings'
          : undefined

    if (!keyToOpen) return

    const timer = window.setTimeout(() => {
      setOpenKeys(prev => prev.includes(keyToOpen) ? prev : [...prev, keyToOpen])
    }, 0)

    return () => window.clearTimeout(timer)
  }, [collapsed, route.view, setOpenKeys])

  const COLLAPSED_W = 64
  const MIN_SIDER_W = 200
  const glass = { backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }
  const border = isDark ? '#3a3a3a' : 'rgba(0,0,0,0.08)'
  const siderBg = isDark ? 'rgba(10,10,10,0.97)' : 'rgba(252,252,255,0.94)'
  const panelBg = isDark ? 'rgba(22,22,22,0.96)' : 'rgba(255,255,255,0.90)'

  const menuItems: MenuProps['items'] = [
    { key: 'tasks', icon: <CheckSquareOutlined />, label: 'Minhas tarefas' },
    {
      key: 'projects',
      icon: <FolderOutlined />,
      label: 'Projetos',
      children: projects.map(p => ({
        key: `pid-${p.id}`,
        label: (
          <Space size={6}>
            <span style={{ display: 'inline-block', width: 8, height: 8, background: p.color, flexShrink: 0 }} />
            {p.name}
          </Space>
        ),
      })),
    },
    { key: 'calendar', icon: <CalendarOutlined />, label: 'Calendário' },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Configurações',
      children: [
        { key: 'settings-user', icon: <UserOutlined />, label: 'Usuário' },
        { key: 'settings-customfields', icon: <DatabaseOutlined />, label: 'Campos Personalizados' },
      ],
    },
  ]

  const onMenuClick = ({ key }: { key: string }) => {
    if (key.startsWith('pid-')) {
      navigate({ view: 'project', projectId: key.replace('pid-', '') })
    } else if (key === 'projects') {
      navigate({ view: 'projects' })
    } else if (key === 'settings') {
      navigate({ view: 'settings-user' })
      setOpenKeys(prev => prev.includes('settings') ? prev : [...prev, 'settings'])
    } else if (key === 'settings-user') {
      navigate({ view: 'settings-user' })
    } else if (key === 'settings-customfields') {
      navigate({ view: 'settings-fields' })
    } else if (key === 'calendar') {
      navigate({ view: 'calendar' })
    } else {
      navigate({ view: 'tasks' })
    }
  }

  const handleCollapse = () => {
    setCollapsed(v => {
      const next = !v
      setOpenKeys(next ? [] : ['projects'])
      return next
    })
  }

  return (
    <div style={{
      height: '100vh',
      background: isDark
        ? 'linear-gradient(160deg, #1c1c1c 0%, #0d0d0d 100%)'
        : filterPid && currentProject
          ? `radial-gradient(ellipse at 20% 20%, ${currentProject.color}30 0%, #f2f2fb 60%)`
          : 'radial-gradient(ellipse at 20% 20%, #dcdcf4 0%, #f2f2fb 60%)',
      transition: 'background 0.6s ease',
    }}>
      <Splitter
        style={{ height: '100vh' }}
        onResize={(sizes: number[]) => {
          if (collapsed) return
          const w = sizes[0]
          if (w < MIN_SIDER_W) {
            setCollapsed(true)
          } else {
            setLiveSiderWidth(w)
            queueSiderWidthPersist(w)
          }
        }}
      >
        {/* ── SIDEBAR PANEL ── */}
        <Splitter.Panel size={collapsed ? COLLAPSED_W : siderWidth} min={collapsed ? COLLAPSED_W : MIN_SIDER_W} max={380}>
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: siderBg,
            borderRight: `1px solid ${border}`,
            overflow: 'hidden',
            ...glass,
          }}>
            <AppLogo collapsed={collapsed} onClick={goHome} />
            <div style={{
              padding: collapsed ? '6px 0' : '6px 10px',
              textAlign: collapsed ? 'center' : 'right',
              flexShrink: 0,
            }}>
              <Tooltip title={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'} placement="right">
                <Button
                  type="text"
                  size="small"
                  aria-label={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
                  icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                  onClick={handleCollapse}
                  style={{ opacity: 0.5 }}
                />
              </Tooltip>
            </div>
            <div style={{
              padding: collapsed ? '8px 0' : '8px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              flexShrink: 0,
              alignItems: collapsed ? 'center' : 'stretch',
            }}>
              {collapsed ? (
                <>
                  <Tooltip title="Nova Tarefa" placement="right">
                    <Button
                      type="primary"
                      icon={<CheckSquareOutlined />}
                      onClick={() => openEditTask(null, filterPid)}
                      style={{ width: 40, height: 32 }}
                    />
                  </Tooltip>
                  <Tooltip title="Novo Projeto" placement="right">
                    <Button
                      icon={<FolderOutlined />}
                      onClick={() => { setEditingProj(null); setProjOpen(true) }}
                      style={{ width: 40, height: 32 }}
                    />
                  </Tooltip>
                </>
              ) : (
                <>
                  <Button
                    type="primary"
                    icon={<CheckSquareOutlined />}
                    onClick={() => openEditTask(null, filterPid)}
                    block
                    size="small"
                  >
                    Nova Tarefa
                  </Button>
                  <Button
                    icon={<FolderOutlined />}
                    onClick={() => { setEditingProj(null); setProjOpen(true) }}
                    block
                    size="small"
                  >
                    Novo Projeto
                  </Button>
                </>
              )}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', alignItems: collapsed ? 'center' : 'stretch' }}>
              <Menu
                mode="inline"
                selectedKeys={[selectedMenuKey]}
                openKeys={openKeys}
                onOpenChange={keys => setOpenKeys(keys as string[])}
                inlineCollapsed={collapsed}
                items={menuItems}
                onClick={onMenuClick}
                theme={isDark ? 'dark' : 'light'}
                style={{ background: 'transparent', border: 'none', width: collapsed ? COLLAPSED_W : '100%' }}
              />
            </div>
            {!collapsed && (
              <div style={{
                padding: '10px 16px',
                borderTop: `1px solid ${border}`,
                fontSize: 11,
                opacity: 0.38,
                flexShrink: 0,
              }}>
                {projects.length} projetos · {tasks.length} tarefas
              </div>
            )}
          </div>
        </Splitter.Panel>

        {/* ── MAIN LAYOUT PANEL ── */}
        <Splitter.Panel>
          <Layout style={{ height: '100vh', background: 'transparent' }}>

            {/* HEADER */}
            <Header style={{
              background: panelBg,
              borderBottom: `1px solid ${border}`,
              padding: '0 20px',
              height: 54,
              lineHeight: '54px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
              gap: 12,
              position: 'relative',
              zIndex: 30,
              ...glass,
            }}>
              <GlobalSearchInput
                query={searchQuery}
                onQueryChange={setSearchQuery}
                projects={projects}
                tasks={tasks}
                isDark={isDark}
                border={border}
                navigate={navigate}
                openEditTask={openEditTask}
                setTaskGlobalFilter={setTaskGlobalFilter}
              />
              <Space size={4} style={{ flexShrink: 0 }}>
                <Tooltip title="Minha conta">
                  <button
                    type="button"
                    aria-label="Minha conta"
                    onClick={() => {
                      navigate({ view: 'settings-user' })
                      setOpenKeys(prev => prev.includes('settings') ? prev : [...prev, 'settings'])
                    }}
                    style={{
                      border: 0,
                      background: 'transparent',
                      padding: 0,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Avatar
                      size={28}
                      style={{ backgroundColor: '#4f46e5', fontSize: 12 }}
                      icon={<UserOutlined />}
                    />
                  </button>
                </Tooltip>
              </Space>
            </Header>

            {/* CONTENT */}
            <Content style={{ padding: 20, overflow: 'hidden', background: 'transparent', display: 'flex', flexDirection: 'column' }}>
              {route.view === 'calendar' ? (
                <CalendarView />
              ) : route.view === 'settings-user' ? (
                <UserSettingsView />
              ) : route.view === 'settings-fields' ? (
                <CustomFieldsSettingsView />
              ) : route.view === 'projects' ? (
                <ProjectsOverview
                  projects={projects}
                  tasks={tasks}
                  onSelectProject={(projectId) => navigate({ view: 'project', projectId })}
                  onEditProject={(project) => { setEditingProj(project); setProjOpen(true) }}
                  onNewProject={() => { setEditingProj(null); setProjOpen(true) }}
                />
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  {currentProject ? (
                    <div style={{ flexShrink: 0 }}>
                      <ProjectHero
                        project={currentProject}
                        onEdit={() => { setEditingProj(currentProject); setProjOpen(true) }}
                      />
                    </div>
                  ) : null}
                  {!filterPid && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        marginBottom: 16,
                        flexShrink: 0,
                      }}
                    >
                      <Space orientation="vertical" size={0}>
                        <Text strong style={{ fontSize: 18 }}>Todas as Tarefas</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Visualize tarefas, subtarefas e campos universais em uma única lista.
                        </Text>
                      </Space>
                      <Button
                        type="primary"
                        icon={<DatabaseOutlined />}
                        onClick={() => navigate({ view: 'settings-fields' })}
                      >
                        Campos Personalizados
                      </Button>
                    </div>
                  )}
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                    background: isDark ? 'rgba(22,22,22,0.85)' : 'rgba(255,255,255,0.72)',
                    border: `1px solid ${border}`,
                    overflow: 'hidden',
                    ...glass,
                  }}>
                    <div style={{
                      padding: '10px 16px',
                      borderBottom: `1px solid ${border}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexShrink: 0,
                    }}>
                      <Text strong style={{ fontSize: 13 }}>
                        {filterPid ? `Tarefas — ${currentProject?.name}` : 'Lista de tarefas'}
                      </Text>
                      {filterPid && (
                        <Button type="text" size="small" onClick={() => navigate({ view: 'tasks' })}>
                          Ver todas ×
                        </Button>
                      )}
                    </div>
                    <React.Suspense
                      fallback={(
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Spin />
                        </div>
                      )}
                    >
                      <TasksTable
                        onEdit={openEditTask}
                        onAddSubtask={(task) => openEditTask(null, task.projectId || task.projectIds[0] || filterPid, task.id)}
                        filterPid={filterPid}
                      />
                    </React.Suspense>
                  </div>
                </div>
              )}
            </Content>

            {/* FOOTER */}
            <Footer style={{
              background: panelBg,
              borderTop: `1px solid ${border}`,
              padding: '8px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
              ...glass,
            }}>
              <Text style={{ fontSize: 11, opacity: 0.35 }}>Klip Task Manager</Text>
              <Text style={{ fontSize: 11, opacity: 0.35 }}>v2.0.0 · {new Date().getFullYear()}</Text>
            </Footer>

          </Layout>
        </Splitter.Panel>
      </Splitter>

      {/* DRAWERS */}
      <ProjectDrawer
        open={projOpen}
        onClose={() => { setProjOpen(false); setEditingProj(null) }}
        editingProject={editingProj}
      />
    </div>
  )
}

// ─── THEME WRAPPER ────────────────────────────────────────────────────────────

const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themePreference, setThemePreference] = useUserPreference('theme')
  const isDark = themePreference === 'dark'
  const toggle = useCallback(() => {
    setThemePreference(currentTheme => currentTheme === 'dark' ? 'light' : 'dark')
  }, [setThemePreference])

  useEffect(() => {
    document.documentElement.dataset.theme = themePreference
    document.documentElement.style.colorScheme = themePreference
  }, [themePreference])

  return (
    <ThemeContext.Provider value={{ isDark, toggle }}>
      <ConfigProvider
        locale={ptBR}
        getPopupContainer={(triggerNode) =>
          (triggerNode?.closest('.ant-drawer, .ant-modal') as HTMLElement | null) ?? document.body
        }
        theme={{
          cssVar: { key: `klip-${themePreference}` },
          algorithm: isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
          token: {
            colorPrimary: '#4f46e5',
            fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          },
          components: {
            Layout: {
              headerBg: 'transparent',
              bodyBg: 'transparent',
            },
            Menu: {
              itemBg: 'transparent',
              subMenuItemBg: 'transparent',
              darkItemBg: 'transparent',
              darkSubMenuItemBg: 'transparent',
            },
          },
        }}
      >
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  )
}

// ─── MOBILE DETECTION ─────────────────────────────────────────────────────────

const useMobileDetect = () => {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 768px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isMobile
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────

const AuthenticatedShell: React.FC = () => {
  const { isAuthenticated, loading } = useAuth()
  const isMobile = useMobileDetect()

  if (loading || !isAuthenticated) return null

  return (
    <AppDataProvider>
      <TaskEditProvider>
        {isMobile ? (
          <React.Suspense fallback={null}>
            <MobileApp />
          </React.Suspense>
        ) : (
          <MainApp />
        )}
      </TaskEditProvider>
    </AppDataProvider>
  )
}

export default function App() {
  return (
    <ThemeWrapper>
      <AntApp>
        <LoaderProvider>
          <AuthProvider>
            <AuthenticatedShell />
          </AuthProvider>
        </LoaderProvider>
      </AntApp>
    </ThemeWrapper>
  )
}
