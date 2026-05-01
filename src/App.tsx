import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import dayjs from 'dayjs'
import {
  App as AntApp,
  Layout,
  Menu,
  Button,
  Table,
  Drawer,
  Form,
  Input,
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
  Modal,
  Card,
  Alert,
} from 'antd'
import type { TableColumnsType, MenuProps, BadgeProps, CalendarProps } from 'antd'
import {
  SearchOutlined,
  CheckSquareOutlined,
  FolderOutlined,
  SettingOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  EditOutlined,
  DeleteOutlined,
  SunOutlined,
  MoonOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  CalendarOutlined,
  DatabaseOutlined,
  RobotOutlined,
  LinkOutlined,
  CopyOutlined,
  GithubOutlined,
  GlobalOutlined,
} from '@ant-design/icons'

const { Header, Content, Footer } = Layout
const { Text } = Typography

// ─── TYPES ────────────────────────────────────────────────────────────────────

type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
type FieldType = 'text' | 'number' | 'date' | 'select' | 'checkbox'

interface CustomField {
  id: string
  name: string
  type: FieldType
  options?: string[]
  scope: 'universal' | 'project'
  projectIds: string[]
}

interface Project {
  id: string
  name: string
  color: string
  description: string
  createdAt: string
}

interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  projectId: string
  dueDate?: string
  assignee?: string
  customFieldValues: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  todo: { label: 'A fazer', color: 'default' },
  in_progress: { label: 'Em progresso', color: 'processing' },
  review: { label: 'Em revisão', color: 'warning' },
  done: { label: 'Concluído', color: 'success' },
  cancelled: { label: 'Cancelado', color: 'error' },
}

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string }> = {
  low: { label: 'Baixa', color: 'cyan' },
  medium: { label: 'Média', color: 'blue' },
  high: { label: 'Alta', color: 'orange' },
  urgent: { label: 'Urgente', color: 'red' },
}

const PROJECT_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
]

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const MOCK_FIELDS: CustomField[] = [
  { id: 'cf1', name: 'Sprint', type: 'select', options: ['Sprint 1', 'Sprint 2', 'Sprint 3', 'Sprint 4'], scope: 'project', projectIds: ['p1', 'p2'] },
  { id: 'cf2', name: 'Story Points', type: 'number', scope: 'project', projectIds: ['p1', 'p3'] },
  { id: 'cf3', name: 'Ambiente', type: 'select', options: ['Dev', 'Staging', 'Produção'], scope: 'project', projectIds: ['p2'] },
  { id: 'cf4', name: 'Bloqueado', type: 'checkbox', scope: 'universal', projectIds: [] },
  { id: 'cf5', name: 'Dt. Entrega', type: 'date', scope: 'project', projectIds: ['p2'] },
]

const MOCK_PROJECTS: Project[] = [
  { id: 'p1', name: 'Frontend v2', color: '#6366f1', description: 'Redesign do frontend', createdAt: '2024-01-01' },
  { id: 'p2', name: 'API Gateway', color: '#10b981', description: 'Gateway com autenticação e rate limiting', createdAt: '2024-01-15' },
  { id: 'p3', name: 'Mobile App', color: '#f59e0b', description: 'Aplicativo mobile multiplataforma', createdAt: '2024-02-01' },
]

const MOCK_TASKS: Task[] = [
  { id: 't1', title: 'Setup arquitetura', description: 'Estrutura de pastas e CI/CD', status: 'done', priority: 'high', projectId: 'p1', dueDate: '2024-01-20', assignee: 'Alice', customFieldValues: { cf1: 'Sprint 1', cf2: 8, cf4: 'false' }, createdAt: '2024-01-02', updatedAt: '2024-01-18' },
  { id: 't2', title: 'Design System', description: 'Configurar tokens e estilos', status: 'in_progress', priority: 'high', projectId: 'p1', dueDate: '2024-02-01', assignee: 'Bob', customFieldValues: { cf1: 'Sprint 2', cf2: 13, cf4: 'false' }, createdAt: '2024-01-10', updatedAt: '2024-01-25' },
  { id: 't3', title: 'UI de Tarefas', description: 'Tabela, drawers e formulários', status: 'in_progress', priority: 'high', projectId: 'p1', dueDate: '2024-02-15', assignee: 'Alice', customFieldValues: { cf1: 'Sprint 2', cf2: 21, cf4: 'false' }, createdAt: '2024-01-12', updatedAt: '2024-01-28' },
  { id: 't4', title: 'Auth Middleware', description: 'JWT e refresh token', status: 'todo', priority: 'urgent', projectId: 'p2', dueDate: '2024-02-10', assignee: 'Charlie', customFieldValues: { cf1: 'Sprint 1', cf3: 'Dev', cf5: '2024-03-01' }, createdAt: '2024-01-20', updatedAt: '2024-01-20' },
  { id: 't5', title: 'Rate Limiting', description: 'Sliding window com Redis', status: 'todo', priority: 'medium', projectId: 'p2', dueDate: '2024-02-20', assignee: 'Dave', customFieldValues: { cf1: 'Sprint 2', cf3: 'Staging' }, createdAt: '2024-01-22', updatedAt: '2024-01-22' },
  { id: 't6', title: 'Documentação API', description: 'OpenAPI 3.0 e Swagger UI', status: 'review', priority: 'low', projectId: 'p2', dueDate: '2024-02-05', assignee: 'Charlie', customFieldValues: { cf3: 'Produção', cf5: '2024-02-28' }, createdAt: '2024-01-18', updatedAt: '2024-01-30' },
  { id: 't7', title: 'Navegação React Native', description: 'Tab e stack navigation', status: 'todo', priority: 'high', projectId: 'p3', dueDate: '2024-03-01', assignee: 'Eve', customFieldValues: { cf2: 5, cf4: 'true' }, createdAt: '2024-02-01', updatedAt: '2024-02-01' },
  { id: 't8', title: 'Push Notifications', description: 'Integração FCM', status: 'cancelled', priority: 'medium', projectId: 'p3', dueDate: '2024-03-15', assignee: 'Bob', customFieldValues: { cf2: 3, cf4: 'false' }, createdAt: '2024-02-05', updatedAt: '2024-02-10' },
]

// ─── THEME CONTEXT ────────────────────────────────────────────────────────────

interface ThemeCtx { isDark: boolean; toggle: () => void }
const ThemeContext = createContext<ThemeCtx>({ isDark: false, toggle: () => { } })
const useTheme = () => useContext(ThemeContext)

// ─── LOADER CONTEXT ───────────────────────────────────────────────────────────

interface LoaderCtx { loading: boolean; showLoader: () => void; hideLoader: () => void }
const LoaderContext = createContext<LoaderCtx>({ loading: false, showLoader: () => { }, hideLoader: () => { } })
export const useLoader = () => useContext(LoaderContext)

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

// ─── APP DATA CONTEXT ─────────────────────────────────────────────────────────

interface AppDataCtx {
  tasks: Task[]
  projects: Project[]
  customFields: CustomField[]
  addTask: (t: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateTask: (id: string, u: Partial<Task>) => void
  deleteTask: (id: string) => void
  addProject: (p: Omit<Project, 'id' | 'createdAt'>) => Project
  updateProject: (id: string, u: Partial<Project>) => void
  deleteProject: (id: string) => void
  addCustomField: (f: Omit<CustomField, 'id'>) => void
  updateCustomField: (id: string, u: Partial<Omit<CustomField, 'id'>>) => void
  deleteCustomField: (id: string) => void
  setProjectFields: (projectId: string, fieldIds: string[]) => void
}

const AppDataContext = createContext<AppDataCtx>({
  tasks: [], projects: [], customFields: [],
  addTask: () => { }, updateTask: () => { }, deleteTask: () => { },
  addProject: () => ({} as Project), updateProject: () => { }, deleteProject: () => { },
  addCustomField: () => { }, updateCustomField: () => { }, deleteCustomField: () => { },
  setProjectFields: () => { },
})
export const useAppData = () => useContext(AppDataContext)

const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { notification } = AntApp.useApp()
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS)
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS)
  const [customFields, setCustomFields] = useState<CustomField[]>(MOCK_FIELDS)

  const addTask = useCallback((data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    const task: Task = { ...data, id: `t${Date.now()}`, createdAt: now, updatedAt: now }
    setTasks(prev => [task, ...prev])
    notification.success({ message: 'Tarefa criada', description: `"${task.title}" adicionada.`, placement: 'topRight' })
  }, [notification])

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t))
    if (updates.status) {
      notification.info({ message: 'Status atualizado', description: `Status alterado para "${STATUS_CONFIG[updates.status].label}".`, placement: 'topRight' })
    } else {
      notification.success({ message: 'Tarefa atualizada', description: 'Alterações salvas com sucesso.', placement: 'topRight' })
    }
  }, [notification])

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === id)
      notification.warning({ message: 'Tarefa removida', description: `"${task?.title}" foi removida.`, placement: 'topRight' })
      return prev.filter(t => t.id !== id)
    })
  }, [notification])

  const addProject = useCallback((data: Omit<Project, 'id' | 'createdAt'>) => {
    const proj: Project = { ...data, id: `p${Date.now()}`, createdAt: new Date().toISOString() }
    setProjects(prev => [proj, ...prev])
    notification.success({ message: 'Projeto criado', description: `"${proj.name}" adicionado.`, placement: 'topRight' })
    return proj
  }, [notification])

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
    notification.success({ message: 'Projeto atualizado', description: 'Alterações salvas.', placement: 'topRight' })
  }, [notification])

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => {
      const proj = prev.find(p => p.id === id)
      notification.warning({ message: 'Projeto removido', description: `"${proj?.name}" removido.`, placement: 'topRight' })
      return prev.filter(p => p.id !== id)
    })
  }, [notification])

  const addCustomField = useCallback((data: Omit<CustomField, 'id'>) => {
    const field: CustomField = { ...data, id: `cf${Date.now()}` }
    setCustomFields(prev => [...prev, field])
    notification.success({ message: 'Campo criado', description: `"${field.name}" adicionado.`, placement: 'topRight' })
  }, [notification])

  const updateCustomField = useCallback((id: string, updates: Partial<Omit<CustomField, 'id'>>) => {
    setCustomFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f))
    notification.success({ message: 'Campo atualizado', description: 'Alterações salvas.', placement: 'topRight' })
  }, [notification])

  const deleteCustomField = useCallback((id: string) => {
    setCustomFields(prev => {
      const field = prev.find(f => f.id === id)
      notification.warning({ message: 'Campo removido', description: `"${field?.name}" foi removido.`, placement: 'topRight' })
      return prev.filter(f => f.id !== id)
    })
  }, [notification])

  const setProjectFields = useCallback((projectId: string, fieldIds: string[]) => {
    setCustomFields(prev => prev.map(f => {
      if (f.scope !== 'project') return f
      const hasProject = f.projectIds.includes(projectId)
      const shouldHave = fieldIds.includes(f.id)
      if (hasProject === shouldHave) return f
      return {
        ...f,
        projectIds: shouldHave
          ? [...f.projectIds, projectId]
          : f.projectIds.filter(id => id !== projectId),
      }
    }))
  }, [])

  return (
    <AppDataContext.Provider value={{
      tasks, projects, customFields,
      addTask, updateTask, deleteTask,
      addProject, updateProject, deleteProject,
      addCustomField, updateCustomField, deleteCustomField, setProjectFields,
    }}>
      {children}
    </AppDataContext.Provider>
  )
}

// ─── LOGO ─────────────────────────────────────────────────────────────────────

const AppLogo: React.FC<{ collapsed: boolean }> = ({ collapsed }) => {
  const { isDark } = useTheme()
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: collapsed ? '18px 0' : '18px 20px',
      justifyContent: collapsed ? 'center' : 'flex-start',
      borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
      overflow: 'hidden',
      flexShrink: 0,
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
    </div>
  )
}

// ─── TASK DRAWER ──────────────────────────────────────────────────────────────

interface TaskFormValues {
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  projectId: string
  dueDate?: dayjs.Dayjs
  assignee?: string
  customFieldValues?: Record<string, unknown>
}

const TaskDrawer: React.FC<{
  open: boolean
  onClose: () => void
  editingTask: Task | null
  defaultProjectId?: string
}> = ({ open, onClose, editingTask, defaultProjectId }) => {
  const { projects, customFields, addTask, updateTask } = useAppData()
  const [form] = Form.useForm<TaskFormValues>()
  const [selPid, setSelPid] = useState(defaultProjectId ?? projects[0]?.id ?? '')
  const projFields = customFields.filter(f => f.scope === 'universal' || f.projectIds.includes(selPid))

  useEffect(() => {
    if (!open) return
    if (editingTask) {
      form.setFieldsValue({
        ...editingTask,
        dueDate: editingTask.dueDate ? dayjs(editingTask.dueDate) : undefined,
      })
      setSelPid(editingTask.projectId)
    } else {
      form.resetFields()
      const pid = defaultProjectId ?? projects[0]?.id ?? ''
      form.setFieldsValue({ status: 'todo', priority: 'medium', projectId: pid })
      setSelPid(pid)
    }
  }, [open, editingTask, defaultProjectId, projects, form])

  const handleSubmit = () =>
    form.validateFields().then((values: TaskFormValues) => {
      const processed: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
        title: values.title,
        description: values.description ?? '',
        status: values.status,
        priority: values.priority,
        projectId: values.projectId,
        assignee: values.assignee,
        dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : undefined,
        customFieldValues: values.customFieldValues ?? {},
      }
      if (editingTask) {
        updateTask(editingTask.id, processed)
      } else {
        addTask(processed)
      }
      onClose()
    })

  return (
    <Drawer
      title={editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
      open={open}
      onClose={onClose}
      width={460}
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="primary" onClick={handleSubmit}>
            {editingTask ? 'Salvar alterações' : 'Criar Tarefa'}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item name="title" label="Título" rules={[{ required: true, message: 'Informe o título' }]}>
          <Input placeholder="Título da tarefa" />
        </Form.Item>
        <Form.Item name="description" label="Descrição">
          <Input.TextArea rows={3} placeholder="Descrição..." />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="status" label="Status" rules={[{ required: true }]}>
              <Select>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <Select.Option key={k} value={k}>{v.label}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="priority" label="Prioridade" rules={[{ required: true }]}>
              <Select>
                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                  <Select.Option key={k} value={k}>{v.label}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="projectId" label="Projeto" rules={[{ required: true }]}>
              <Select onChange={(v: string) => setSelPid(v)}>
                {projects.map(p => (
                  <Select.Option key={p.id} value={p.id}>
                    <Space>
                      <span style={{ display: 'inline-block', width: 8, height: 8, background: p.color }} />
                      {p.name}
                    </Space>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="dueDate" label="Prazo">
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="assignee" label="Responsável">
          <Input placeholder="Nome do responsável" />
        </Form.Item>
        {projFields.length > 0 && (
          <>
            <Divider orientation="left" style={{ fontSize: 12, marginTop: 8 }}>
              Campos Personalizados
            </Divider>
            {projFields.map(f => (
              <Form.Item
                key={f.id}
                name={['customFieldValues', f.id]}
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
                {f.type === 'text' && <Input />}
                {f.type === 'number' && <InputNumber style={{ width: '100%' }} />}
                {f.type === 'date' && <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />}
                {f.type === 'checkbox' && (
                  <Select>
                    <Select.Option value="true">Sim</Select.Option>
                    <Select.Option value="false">Não</Select.Option>
                  </Select>
                )}
                {f.type === 'select' && (
                  <Select>
                    {f.options?.map(o => <Select.Option key={o} value={o}>{o}</Select.Option>)}
                  </Select>
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

const ProjectDrawer: React.FC<{
  open: boolean
  onClose: () => void
  editingProject: Project | null
}> = ({ open, onClose, editingProject }) => {
  const { customFields, addProject, updateProject, setProjectFields } = useAppData()
  const [form] = Form.useForm()

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

  const handleSubmit = () =>
    form.validateFields().then((values) => {
      if (editingProject) {
        updateProject(editingProject.id, {
          name: values.name,
          color: values.color,
          description: values.description,
        })
        setProjectFields(editingProject.id, values.cfIds ?? [])
      } else {
        const newProj = addProject({
          name: values.name,
          color: values.color ?? PROJECT_COLORS[0],
          description: values.description ?? '',
        })
        setProjectFields(newProj.id, values.cfIds ?? [])
      }
      onClose()
    })

  return (
    <Drawer
      title={editingProject ? 'Editar Projeto' : 'Novo Projeto'}
      open={open}
      onClose={onClose}
      width={440}
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="primary" onClick={handleSubmit}>
            {editingProject ? 'Salvar alterações' : 'Criar Projeto'}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item name="name" label="Nome do Projeto" rules={[{ required: true, message: 'Informe o nome' }]}>
          <Input placeholder="ex: Frontend v2" />
        </Form.Item>
        <Form.Item name="description" label="Descrição">
          <Input.TextArea rows={3} placeholder="Descreva o projeto..." />
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
          <Select mode="multiple" placeholder="Selecione campos por projeto...">
            {customFields.filter(f => f.scope === 'project').map(f => (
              <Select.Option key={f.id} value={f.id}>
                {f.name}{' '}
                <Text type="secondary" style={{ fontSize: 11 }}>({f.type})</Text>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Drawer>
  )
}

// ─── LOAD MORE ROW ────────────────────────────────────────────────────────────

const LoadMoreRow: React.FC<{
  remaining: number
  onLoad: () => void
  isDark: boolean
  border: string
}> = ({ remaining, onLoad, isDark, border }) => {
  const [hovered, setHovered] = useState(false)
  const hoverBg = isDark ? 'rgba(99,102,241,0.07)' : 'rgba(99,102,241,0.04)'
  return (
    <div
      onClick={onLoad}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        padding: '9px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        cursor: 'pointer',
        borderTop: `1px dashed ${border}`,
        background: hovered ? hoverBg : 'transparent',
        transition: 'background 0.15s',
        userSelect: 'none',
      }}
    >
      <PlusOutlined style={{ fontSize: 11, color: '#6366f1', opacity: 0.8 }} />
      <Text style={{ fontSize: 12, color: '#6366f1', opacity: 0.85 }}>
        Ver mais · {remaining} restante{remaining !== 1 ? 's' : ''}
      </Text>
    </div>
  )
}

// ─── TASKS TABLE ──────────────────────────────────────────────────────────────

const TasksTable: React.FC<{
  onEdit: (t: Task) => void
  filterPid?: string
}> = ({ onEdit, filterPid }) => {
  const { tasks, projects, deleteTask, updateTask } = useAppData()
  const { isDark } = useTheme()
  const [pageSize, setPageSize] = useState(10)
  const [visibleCount, setVisibleCount] = useState(10)
  const [tableSize, setTableSize] = useState<'small' | 'middle' | 'large'>('small')

  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [scrollY, setScrollY] = useState(300)

  useEffect(() => {
    const el = scrollAreaRef.current
    if (!el) return
    const update = () => setScrollY(Math.max(100, el.clientHeight - 39))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const all = filterPid ? tasks.filter(t => t.projectId === filterPid) : tasks
  const data = all.slice(0, visibleCount)
  const projMap = Object.fromEntries(projects.map(p => [p.id, p]))
  const border = isDark ? '#3a3a3a' : 'rgba(0,0,0,0.07)'

  const handlePageSizeChange = (v: number) => {
    setPageSize(v)
    setVisibleCount(v)
  }

  const columns: TableColumnsType<Task> = [
    {
      key: 'done',
      width: 36,
      render: (_: unknown, r: Task) => {
        const isDone = r.status === 'done'
        return (
          <Tooltip title={isDone ? 'Marcar como pendente' : 'Marcar como concluída'} placement="right">
            <button
              onClick={() => updateTask(r.id, { status: isDone ? 'todo' : 'done' })}
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                border: `2px solid ${isDone ? '#10b981' : isDark ? '#555' : '#ccc'}`,
                background: isDone ? '#10b981' : 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                transition: 'all 0.15s',
                flexShrink: 0,
              }}
            >
              {isDone && (
                <CheckCircleOutlined style={{ fontSize: 11, color: '#fff', lineHeight: 1 }} />
              )}
            </button>
          </Tooltip>
        )
      },
    },
    {
      title: 'Tarefa',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string, r: Task) => (
        <div style={{ opacity: r.status === 'done' ? 0.45 : 1, transition: 'opacity 0.15s' }}>
          <Text strong style={{ fontSize: 13, textDecoration: r.status === 'done' ? 'line-through' : 'none' }}>
            {text}
          </Text>
          {r.description && (
            <div>
              <Text type="secondary" style={{ fontSize: 11 }}>{r.description}</Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 148,
      filters: Object.entries(STATUS_CONFIG).map(([k, v]) => ({ text: v.label, value: k })),
      onFilter: (v, r) => r.status === (v as TaskStatus),
      render: (s: TaskStatus, r: Task) => (
        <Select
          size="small"
          value={s}
          variant="borderless"
          onChange={(val: TaskStatus) => updateTask(r.id, { status: val })}
          style={{ width: '100%' }}
          popupMatchSelectWidth={false}
          options={Object.entries(STATUS_CONFIG).map(([k, v]) => ({
            value: k,
            label: <Tag color={v.color} style={{ margin: 0 }}>{v.label}</Tag>,
          }))}
        />
      ),
    },
    {
      title: 'Prioridade',
      dataIndex: 'priority',
      key: 'priority',
      width: 110,
      filters: Object.entries(PRIORITY_CONFIG).map(([k, v]) => ({ text: v.label, value: k })),
      onFilter: (v, r) => r.priority === (v as TaskPriority),
      render: (p: TaskPriority) => (
        <Tag color={PRIORITY_CONFIG[p].color} style={{ margin: 0 }}>
          {PRIORITY_CONFIG[p].label}
        </Tag>
      ),
    },
    {
      title: 'Projeto',
      dataIndex: 'projectId',
      key: 'project',
      width: 140,
      render: (id: string) => {
        const proj = projMap[id]
        return (
          <Tag style={{
            borderLeft: `3px solid ${proj?.color ?? '#ccc'}`,
            margin: 0,
            paddingLeft: 6,
          }}>
            {proj?.name ?? id}
          </Tag>
        )
      },
    },
    {
      title: 'Responsável',
      dataIndex: 'assignee',
      key: 'assignee',
      width: 130,
      render: (a?: string) =>
        a ? (
          <Space size={4}>
            <Avatar size={18} style={{ backgroundColor: '#6366f1', fontSize: 10 }}>{a[0]}</Avatar>
            <Text style={{ fontSize: 12 }}>{a}</Text>
          </Space>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>—</Text>
        ),
    },
    {
      title: 'Prazo',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 100,
      sorter: (a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''),
      render: (d?: string) =>
        d ? (
          <Text style={{ fontSize: 12 }}>{new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')}</Text>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>—</Text>
        ),
    },
    {
      title: '',
      key: 'actions',
      width: 68,
      render: (_: unknown, r: Task) => (
        <Space size={2}>
          <Tooltip title="Editar">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => onEdit(r)} />
          </Tooltip>
          <Tooltip title="Remover">
            <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => deleteTask(r.id)} />
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
      <div ref={scrollAreaRef} style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          size={tableSize}
          pagination={false}
          scroll={{ x: 780, y: scrollY }}
          locale={{ emptyText: <Empty description="Nenhuma tarefa encontrada" /> }}
        />
      </div>

      {/* ── VER MAIS — full-width row ── */}
      {visibleCount < all.length && (
        <LoadMoreRow
          remaining={all.length - visibleCount}
          onLoad={() => setVisibleCount(v => v + pageSize)}
          isDark={isDark}
          border={border}
        />
      )}

      {/* ── TABLE TOOLBAR ── */}
      <div style={{
        padding: '8px 16px',
        borderTop: `1px solid ${border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        flexShrink: 0,
      }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {Math.min(visibleCount, all.length)} de {all.length} tarefa{all.length !== 1 ? 's' : ''}
        </Text>
        <Space size={6}>
          <Select
            size="small"
            value={tableSize}
            onChange={setTableSize}
            style={{ width: 108 }}
            options={[
              { label: 'Compacto', value: 'small' },
              { label: 'Padrão', value: 'middle' },
              { label: 'Espaçoso', value: 'large' },
            ]}
          />
          <Select
            size="small"
            value={pageSize}
            onChange={handlePageSizeChange}
            style={{ width: 80 }}
            options={[
              { label: '5 / vez', value: 5 },
              { label: '10 / vez', value: 10 },
              { label: '20 / vez', value: 20 },
              { label: '50 / vez', value: 50 },
            ]}
          />
        </Space>
      </div>
    </div>
  )
}

// ─── PROJECT HERO ─────────────────────────────────────────────────────────────

const ProjectHero: React.FC<{
  project: Project
  onEdit: () => void
}> = ({ project, onEdit }) => {
  const { isDark } = useTheme()

  const c = project.color
  const border = isDark ? '#3a3a3a' : 'rgba(0,0,0,0.08)'

  return (
    <div style={{
      marginBottom: 20,
      position: 'relative',
      overflow: 'hidden',
      borderTop: `1px solid ${border}`,
      borderRight: `1px solid ${border}`,
      borderBottom: `1px solid ${border}`,
      borderLeft: `4px solid ${c}`,
      background: isDark
        ? `linear-gradient(135deg, ${c}18 0%, ${c}06 40%, transparent 70%)`
        : `linear-gradient(135deg, ${c}12 0%, ${c}05 40%, transparent 70%)`,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    }}>
      {/* top colour stripe */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${c} 0%, ${c}00 100%)` }} />

      <div style={{ padding: '20px 24px 18px' }}>
        {/* title row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 14, height: 14, background: c, flexShrink: 0, marginTop: 2 }} />
            <Text style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>{project.name}</Text>
          </div>
          <Tooltip title="Editar projeto">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={onEdit}
              style={{ opacity: 0.5, flexShrink: 0 }}
            />
          </Tooltip>
        </div>

        {/* description */}
        {project.description && (
          <Text type="secondary" style={{ fontSize: 13, display: 'block', paddingLeft: 24 }}>
            {project.description}
          </Text>
        )}
      </div>
    </div>
  )
}

// ─── STATS ROW ────────────────────────────────────────────────────────────────

// ─── TASK EDIT CONTEXT ────────────────────────────────────────────────────────

interface TaskEditCtx {
  openEditTask: (task: Task | null, defaultProjectId?: string) => void
}
const TaskEditContext = createContext<TaskEditCtx>({ openEditTask: () => { } })
const useTaskEdit = () => useContext(TaskEditContext)

const TaskEditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [taskOpen, setTaskOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [defaultPid, setDefaultPid] = useState<string | undefined>()

  const openEditTask = useCallback((task: Task | null, defaultProjectId?: string) => {
    setEditingTask(task)
    setDefaultPid(defaultProjectId)
    setTaskOpen(true)
  }, [])

  return (
    <TaskEditContext.Provider value={{ openEditTask }}>
      {children}
      <TaskDrawer
        open={taskOpen}
        onClose={() => { setTaskOpen(false); setEditingTask(null) }}
        editingTask={editingTask}
        defaultProjectId={defaultPid}
      />
    </TaskEditContext.Provider>
  )
}

// ─── CALENDAR VIEW ────────────────────────────────────────────────────────────

const CalendarView: React.FC = () => {
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
    return (
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {dayTasks.map(task => (
          <li
            key={task.id}
            onClick={e => { e.stopPropagation(); openEditTask(task) }}
            style={{ cursor: 'pointer', marginBottom: 2 }}
          >
            <Badge status={statusToBadge(task.status)} text={task.title} style={{ fontSize: 12 }} />
          </li>
        ))}
      </ul>
    )
  }

  const cellRender: CalendarProps<dayjs.Dayjs>['cellRender'] = (current, info) => {
    if (info.type === 'date') return dateCellRender(current)
    return info.originNode
  }

  return (
    <div style={{
      background: isDark ? 'rgba(22,22,22,0.85)' : 'rgba(255,255,255,0.72)',
      border: `1px solid ${border}`,
      padding: 16,
      ...glass,
    }}>
      <Calendar cellRender={cellRender} />
    </div>
  )
}

// ─── USER SETTINGS VIEW ────────────────────────────────────────────────────────

interface ApiToken { id: string; name: string; prefix: string; createdAt: string }

const UserSettingsView: React.FC = () => {
  const { isDark } = useTheme()
  const cardBg = isDark ? '#1e1e1e' : '#fff'
  const border = isDark ? '#3a3a3a' : '#f0f0f0'

  const [tokens, setTokens] = useState<ApiToken[]>([
    { id: 'tk1', name: 'CI/CD Pipeline', prefix: 'klip_ci_xxxx', createdAt: '2024-01-15' },
  ])
  const [tokenModalOpen, setTokenModalOpen] = useState(false)
  const [newTokenVisible, setNewTokenVisible] = useState<string | null>(null)
  const [tokenForm] = Form.useForm()

  const handleCreateToken = () => {
    tokenForm.validateFields().then((values) => {
      const raw = `klip_${Math.random().toString(36).slice(2, 10)}_${Math.random().toString(36).slice(2, 18)}`
      const token: ApiToken = {
        id: `tk${Date.now()}`,
        name: values.tokenName,
        prefix: raw.slice(0, 14) + '…',
        createdAt: new Date().toISOString().slice(0, 10),
      }
      setTokens(prev => [...prev, token])
      setNewTokenVisible(raw)
      setTokenModalOpen(false)
      tokenForm.resetFields()
    })
  }

  const tokenColumns = [
    { title: 'Nome', dataIndex: 'name', key: 'name' },
    { title: 'Prefixo', dataIndex: 'prefix', key: 'prefix', render: (v: string) => <code>{v}</code> },
    { title: 'Criado em', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: '',
      key: 'actions',
      render: (_: unknown, rec: ApiToken) => (
        <Button size="small" danger onClick={() => setTokens(prev => prev.filter(t => t.id !== rec.id))}>
          Revogar
        </Button>
      ),
    },
  ]

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Profile */}
      <Card title="Perfil" style={{ background: cardBg, border: `1px solid ${border}` }}>
        <Space size={24} align="start">
          <Avatar size={72} icon={<UserOutlined />} style={{ background: '#6366f1', flexShrink: 0 }} />
          <Form layout="vertical" style={{ flex: 1 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Nome completo">
                  <Input defaultValue="Lucas Dev" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="E-mail">
                  <Input defaultValue="lucas@example.com" />
                </Form.Item>
              </Col>
            </Row>
            <Button type="primary">Salvar perfil</Button>
          </Form>
        </Space>
      </Card>

      {/* Account links */}
      <Card title="Contas vinculadas" style={{ background: cardBg, border: `1px solid ${border}` }}>
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          {[
            { icon: <GithubOutlined />, label: 'GitHub', connected: true },
            { icon: <GlobalOutlined />, label: 'Google', connected: false },
            { icon: <LinkOutlined />, label: 'Microsoft', connected: false },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Space>
                {item.icon}
                <Text>{item.label}</Text>
                {item.connected && <Tag color="success">Conectado</Tag>}
              </Space>
              <Button size="small">{item.connected ? 'Desvincular' : 'Vincular'}</Button>
            </div>
          ))}
        </Space>
      </Card>

      {/* API Tokens */}
      <Card
        title="Tokens de API"
        style={{ background: cardBg, border: `1px solid ${border}` }}
        extra={<Button size="small" type="primary" onClick={() => setTokenModalOpen(true)}>Novo token</Button>}
      >
        {newTokenVisible && (
          <Alert
            type="success"
            showIcon
            style={{ marginBottom: 12 }}
            message="Token criado — copie agora, ele não será exibido novamente."
            description={
              <Space>
                <code style={{ wordBreak: 'break-all' }}>{newTokenVisible}</code>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => { navigator.clipboard.writeText(newTokenVisible); setNewTokenVisible(null) }}
                >
                  Copiar e fechar
                </Button>
              </Space>
            }
            closable
            onClose={() => setNewTokenVisible(null)}
          />
        )}
        <Table
          dataSource={tokens}
          columns={tokenColumns}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>

      {/* LLM Settings */}
      <Card title="Configurações de LLM" style={{ background: cardBg, border: `1px solid ${border}` }}>
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Provedor">
                <Select defaultValue="openai">
                  <Select.Option value="openai">OpenAI</Select.Option>
                  <Select.Option value="anthropic">Anthropic</Select.Option>
                  <Select.Option value="ollama">Ollama (local)</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Modelo">
                <Select defaultValue="gpt-4o">
                  <Select.Option value="gpt-4o">GPT-4o</Select.Option>
                  <Select.Option value="gpt-4o-mini">GPT-4o mini</Select.Option>
                  <Select.Option value="claude-3-5-sonnet">claude-3-5-sonnet</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Chave de API">
            <Input.Password placeholder="sk-..." />
          </Form.Item>
          <Form.Item label="Prompt de sistema (opcional)">
            <Input.TextArea rows={3} placeholder="Você é um assistente de gestão de projetos..." />
          </Form.Item>
          <Button type="primary" icon={<RobotOutlined />}>Salvar configurações de LLM</Button>
        </Form>
      </Card>

      {/* New token modal */}
      <Modal
        title="Novo token de API"
        open={tokenModalOpen}
        onCancel={() => { setTokenModalOpen(false); tokenForm.resetFields() }}
        onOk={handleCreateToken}
        okText="Criar token"
      >
        <Form form={tokenForm} layout="vertical">
          <Form.Item name="tokenName" label="Nome do token" rules={[{ required: true, message: 'Informe um nome' }]}>
            <Input placeholder="ex: CI/CD Pipeline" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

// ─── CUSTOM FIELDS SETTINGS VIEW ──────────────────────────────────────────────

const CustomFieldsSettingsView: React.FC = () => {
  const { isDark } = useTheme()
  const { customFields, projects, addCustomField, updateCustomField, deleteCustomField } = useAppData()
  const cardBg = isDark ? '#1e1e1e' : '#fff'
  const border = isDark ? '#3a3a3a' : '#f0f0f0'

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingField, setEditingField] = useState<CustomField | null>(null)
  const [form] = Form.useForm()
  const [scopeVal, setScopeVal] = useState<'universal' | 'project'>('project')
  const [typeVal, setTypeVal] = useState<FieldType>('text')

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

  const handleSave = () => {
    form.validateFields().then((values) => {
      const opts = values.options
        ? (values.options as string).split('\n').map((o: string) => o.trim()).filter(Boolean)
        : undefined
      const payload: Omit<CustomField, 'id'> = {
        name: values.name,
        type: values.type as FieldType,
        scope: values.scope,
        projectIds: values.scope === 'project' ? (values.projectIds ?? []) : [],
        options: opts,
      }
      if (editingField) {
        updateCustomField(editingField.id, payload)
      } else {
        addCustomField(payload)
      }
      setDrawerOpen(false)
    })
  }

  const columns = [
    { title: 'Nome', dataIndex: 'name', key: 'name', render: (v: string) => <Text strong>{v}</Text> },
    {
      title: 'Tipo',
      dataIndex: 'type',
      key: 'type',
      render: (v: string) => <Tag>{v}</Tag>,
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
              const p = projects.find(pr => pr.id === pid)
              return p ? <Tag key={pid} color={p.color} style={{ color: '#fff', border: 'none' }}>{p.name}</Tag> : null
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
          <Button size="small" danger onClick={() => deleteCustomField(f.id)}>Excluir</Button>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <Card
        title="Campos Personalizados"
        style={{ background: cardBg, border: `1px solid ${border}` }}
        extra={<Button type="primary" onClick={openNew}>Novo campo</Button>}
      >
        <Table
          dataSource={customFields}
          columns={columns}
          rowKey="id"
          size="middle"
          pagination={false}
        />
      </Card>

      <Drawer
        title={editingField ? 'Editar campo' : 'Novo campo'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={440}
        footer={
          <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => setDrawerOpen(false)}>Cancelar</Button>
            <Button type="primary" onClick={handleSave}>
              {editingField ? 'Salvar alterações' : 'Criar campo'}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Nome" rules={[{ required: true, message: 'Informe o nome' }]}>
            <Input placeholder="ex: Story Points" />
          </Form.Item>
          <Form.Item name="type" label="Tipo" rules={[{ required: true }]}>
            <Select onChange={(v) => setTypeVal(v as FieldType)}>
              <Select.Option value="text">Texto</Select.Option>
              <Select.Option value="number">Número</Select.Option>
              <Select.Option value="date">Data</Select.Option>
              <Select.Option value="checkbox">Checkbox</Select.Option>
              <Select.Option value="select">Seleção</Select.Option>
            </Select>
          </Form.Item>
          {typeVal === 'select' && (
            <Form.Item
              name="options"
              label="Opções (uma por linha)"
              rules={[{ required: true, message: 'Adicione pelo menos uma opção' }]}
            >
              <Input.TextArea rows={4} placeholder={"Opção 1\nOpção 2\nOpção 3"} />
            </Form.Item>
          )}
          <Form.Item name="scope" label="Escopo" rules={[{ required: true }]}>
            <Select onChange={(v) => setScopeVal(v as 'universal' | 'project')}>
              <Select.Option value="project">Por projeto (vinculado manualmente)</Select.Option>
              <Select.Option value="universal">Universal (todas as tarefas)</Select.Option>
            </Select>
          </Form.Item>
          {scopeVal === 'project' && (
            <Form.Item name="projectIds" label="Projetos">
              <Select mode="multiple" placeholder="Selecione os projetos...">
                {projects.map(p => (
                  <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}
        </Form>
      </Drawer>
    </div>
  )
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

const MainApp: React.FC = () => {
  const { isDark, toggle } = useTheme()
  const { projects, tasks } = useAppData()
  const { showLoader, hideLoader } = useLoader()
  const { openEditTask } = useTaskEdit()

  const [siderWidth, setSiderWidth] = useState(240)
  const [collapsed, setCollapsed] = useState(false)
  const [openKeys, setOpenKeys] = useState<string[]>(['projects'])
  const [activeKey, setActiveKey] = useState('tasks')
  const [filterPid, setFilterPid] = useState<string | undefined>()
  const [projOpen, setProjOpen] = useState(false)
  const [editingProj, setEditingProj] = useState<Project | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Simulate initial data load
  useEffect(() => {
    showLoader()
    const t = setTimeout(hideLoader, 1400)
    return () => clearTimeout(t)
  }, [showLoader, hideLoader])

  const COLLAPSED_W = 64
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
      setFilterPid(key.replace('pid-', ''))
      setActiveKey('tasks')
    } else if (key === 'settings') {
      setFilterPid(undefined)
      setActiveKey('settings-user')
      setOpenKeys(prev => prev.includes('settings') ? prev : [...prev, 'settings'])
    } else {
      setFilterPid(undefined)
      setActiveKey(key)
    }
  }

  const handleCollapse = () => {
    setCollapsed(v => {
      const next = !v
      setOpenKeys(next ? [] : ['projects'])
      return next
    })
  }

  const currentProject = projects.find(p => p.id === filterPid)

  return (
    <div style={{
      height: '100vh',
      background: isDark
        ? 'linear-gradient(160deg, #1c1c1c 0%, #0d0d0d 100%)'
        : 'radial-gradient(ellipse at 20% 20%, #dcdcf4 0%, #f2f2fb 60%)',
    }}>
      <Splitter
        style={{ height: '100vh' }}
        onResize={(sizes: number[]) => {
          if (!collapsed && sizes[0] > COLLAPSED_W) setSiderWidth(sizes[0])
        }}
      >
        {/* ── SIDEBAR PANEL ── */}
        <Splitter.Panel size={collapsed ? COLLAPSED_W : siderWidth} min={COLLAPSED_W} max={380}>
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: siderBg,
            borderRight: `1px solid ${border}`,
            overflow: 'hidden',
            ...glass,
          }}>
            <AppLogo collapsed={collapsed} />
            <div style={{
              padding: collapsed ? '6px 0' : '6px 10px',
              textAlign: collapsed ? 'center' : 'right',
              flexShrink: 0,
            }}>
              <Tooltip title={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'} placement="right">
                <Button
                  type="text"
                  size="small"
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
                selectedKeys={[filterPid ? `pid-${filterPid}` : activeKey]}
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
              ...glass,
            }}>
              <Input
                prefix={<SearchOutlined style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)' }} />}
                placeholder="Pesquisar tarefas, projetos..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                allowClear
                style={{
                  flex: 1,
                  maxWidth: 420,
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  border: `1px solid ${border}`,
                  borderRadius: 8,
                }}
              />
              <Space size={4} style={{ flexShrink: 0 }}>
                <Tooltip title={isDark ? 'Modo claro' : 'Modo escuro'}>
                  <Button
                    type="text"
                    size="small"
                    icon={isDark ? <SunOutlined style={{ fontSize: 15 }} /> : <MoonOutlined style={{ fontSize: 15 }} />}
                    onClick={toggle}
                    style={{ color: isDark ? '#facc15' : '#6366f1' }}
                  />
                </Tooltip>
                <Tooltip title="Minha conta">
                  <Avatar
                    size={28}
                    style={{ backgroundColor: '#6366f1', fontSize: 12, cursor: 'pointer' }}
                    icon={<UserOutlined />}
                    onClick={() => {
                      setFilterPid(undefined)
                      setActiveKey('settings-user')
                      setOpenKeys(prev => prev.includes('settings') ? prev : [...prev, 'settings'])
                    }}
                  />
                </Tooltip>
              </Space>
            </Header>

            {/* CONTENT */}
            <Content style={{ padding: 20, overflow: 'hidden', background: 'transparent', display: 'flex', flexDirection: 'column' }}>
              {activeKey === 'calendar' ? (
                <CalendarView />
              ) : activeKey === 'settings-user' ? (
                <UserSettingsView />
              ) : activeKey === 'settings-customfields' ? (
                <CustomFieldsSettingsView />
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
                        {filterPid ? `Tarefas — ${currentProject?.name}` : 'Todas as Tarefas'}
                      </Text>
                      {filterPid && (
                        <Button type="text" size="small" onClick={() => setFilterPid(undefined)}>
                          Ver todas ×
                        </Button>
                      )}
                    </div>
                    <TasksTable
                      onEdit={openEditTask}
                      filterPid={filterPid}
                    />
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
  const [isDark, setIsDark] = useState(false)
  const toggle = useCallback(() => setIsDark(v => !v), [])

  return (
    <ThemeContext.Provider value={{ isDark, toggle }}>
      <ConfigProvider
        theme={{
          cssVar: true,
          algorithm: isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
          token: {
            colorPrimary: '#6366f1',
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

// ─── ROOT ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <ThemeWrapper>
      <AntApp>
        <LoaderProvider>
          <AppDataProvider>
            <TaskEditProvider>
              <MainApp />
            </TaskEditProvider>
          </AppDataProvider>
        </LoaderProvider>
      </AntApp>
    </ThemeWrapper>
  )
}
