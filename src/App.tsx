import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
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
  Card,
} from 'antd'
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
} from '@ant-design/icons'
import { AuthProvider } from './contexts/AuthContext'
import { TasksTable } from './components/TasksTable'
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
import { taskBelongsToProject } from './lib/klipAdapters'
import { getRouteMenuKey } from './lib/routes'
import {
  API_SUPPORTED_STATUSES,
  PRIORITY_CONFIG,
  PROJECT_COLORS,
  STATUS_CONFIG,
  getContrastColor,
} from './constants/ui'
import type { CustomField, FieldType, Project, Task, TaskPriority, TaskStatus } from './types/domain'

const { Header, Content, Footer } = Layout
const { Text } = Typography

export type { CustomField, FieldType, Project, Task, TaskPriority, TaskStatus }

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

export const AppLogo: React.FC<{ collapsed: boolean }> = ({ collapsed }) => {
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
  projectId?: string
  parentTaskId?: string
  dueDate?: dayjs.Dayjs
  assignee?: string
  customFieldValues?: Record<string, unknown>
}

export const TaskDrawer: React.FC<{
  open: boolean
  onClose: () => void
  editingTask: Task | null
  defaultProjectId?: string
  defaultParentTaskId?: string
}> = ({ open, onClose, editingTask, defaultProjectId, defaultParentTaskId }) => {
  const { tasks, projects, customFields, addTask, updateTask } = useAppData()
  const [form] = Form.useForm<TaskFormValues>()
  const watchedProjectId = Form.useWatch('projectId', form) as string | undefined
  const selectedProjectId = watchedProjectId ?? defaultProjectId ?? ''
  const projFields = customFields.filter(f => f.scope === 'universal' || f.projectIds.includes(selectedProjectId))

  useEffect(() => {
    if (!open) return
    if (editingTask) {
      const customFieldValues = Object.fromEntries(
        Object.entries(editingTask.customFieldValues).map(([fieldId, value]) => {
          const field = customFields.find(item => item.id === fieldId)
          if (field?.type === 'date' && typeof value === 'string') return [fieldId, dayjs(value)]
          return [fieldId, value]
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
        status: 'todo',
        priority: 'medium',
        projectId: pid,
        parentTaskId: defaultParentTaskId,
      })
    }
  }, [open, editingTask, defaultProjectId, defaultParentTaskId, customFields, form])

  const handleSubmit = async () => {
    const values = await form.validateFields()
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
      status: values.status,
      priority: 'medium',
      projectId: values.projectId ?? '',
      projectIds,
      parentTaskId: values.parentTaskId || undefined,
      assignee: undefined,
      dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : undefined,
      customFieldValues,
    }
    if (editingTask) {
      await updateTask(editingTask.id, processed)
    } else {
      await addTask(processed)
    }
    onClose()
  }

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
          <Col xs={24} sm={12}>
            <Form.Item name="status" label="Status" rules={[{ required: true }]}>
              <Select>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => {
                  const status = k as TaskStatus
                  const supported = API_SUPPORTED_STATUSES.has(status)
                  return (
                    <Select.Option key={k} value={k} disabled={!supported}>
                      <Space size={6}>
                        {v.label}
                        {!supported && <Tag style={{ margin: 0 }}>Em desenvolvimento</Tag>}
                      </Space>
                    </Select.Option>
                  )
                })}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="priority"
              label={<Space size={6}>Prioridade<Tag style={{ margin: 0 }}>Em desenvolvimento</Tag></Space>}
              rules={[{ required: true }]}
            >
              <Select disabled>
                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                  <Select.Option key={k} value={k}>{v.label}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="projectId" label="Projeto">
              <Select allowClear placeholder="Sem projeto vinculado">
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
          <Col xs={24} sm={12}>
            <Form.Item name="dueDate" label="Prazo">
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="parentTaskId" label="Subtarefa de">
          <Select
            allowClear
            showSearch
            placeholder="Nenhuma tarefa pai"
            optionFilterProp="label"
            options={tasks
              .filter(task => task.id !== editingTask?.id)
              .map(task => ({ value: task.id, label: task.title }))}
          />
        </Form.Item>
        <Form.Item name="assignee" label="Responsável">
          <Input disabled placeholder="Em desenvolvimento" />
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

export const ProjectDrawer: React.FC<{
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

  const handleSubmit = async () => {
    const values = await form.validateFields()
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
    onClose()
  }

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

const TaskEditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [taskOpen, setTaskOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [defaultPid, setDefaultPid] = useState<string | undefined>()
  const [defaultParentTaskId, setDefaultParentTaskId] = useState<string | undefined>()

  const openEditTask = useCallback((task: Task | null, defaultProjectId?: string, parentTaskId?: string) => {
    setEditingTask(task)
    setDefaultPid(defaultProjectId)
    setDefaultParentTaskId(parentTaskId)
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
        }}
        editingTask={editingTask}
        defaultProjectId={defaultPid}
        defaultParentTaskId={defaultParentTaskId}
      />
    </TaskEditContext.Provider>
  )
}

// ─── CALENDAR VIEW ────────────────────────────────────────────────────────────

export const CalendarView: React.FC = () => {
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
      flex: 1,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: isDark ? 'rgba(22,22,22,0.85)' : 'rgba(255,255,255,0.72)',
      border: `1px solid ${border}`,
      ...glass,
    }}>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 16 }}>
        <Calendar cellRender={cellRender} />
      </div>
    </div>
  )
}

// ─── USER SETTINGS VIEW ────────────────────────────────────────────────────────

interface ApiToken { id: string; name: string; prefix: string; createdAt: string }

export const UserSettingsView: React.FC = () => {
  const { isDark, toggle } = useTheme()
  const { logout } = useAuth()
  const cardBg = isDark ? '#1e1e1e' : '#fff'
  const border = isDark ? '#3a3a3a' : '#f0f0f0'

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
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Preferências */}
      <div style={{ background: cardBg, border: `1px solid ${border}` }}>
        <div style={{ padding: '10px 16px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <Text strong style={{ fontSize: 13 }}>Preferências</Text>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Space direction="vertical" size={0}>
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
        </div>
      </div>

      {/* Profile */}
      <div style={{ background: cardBg, border: `1px solid ${border}` }}>
        <div style={{ padding: '10px 16px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <Space size={8}>
            <Text strong style={{ fontSize: 13 }}>Perfil</Text>
            <Tag style={{ margin: 0 }}>Em desenvolvimento</Tag>
          </Space>
        </div>
        <div style={{ padding: 16 }}>
          <Space size={24} align="start">
            <Avatar size={72} icon={<UserOutlined />} style={{ background: '#6366f1', flexShrink: 0 }} />
            <Form layout="vertical" style={{ flex: 1 }}>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item label="Nome completo">
                    <Input disabled placeholder="Em desenvolvimento" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="E-mail">
                    <Input disabled placeholder="Em desenvolvimento" />
                  </Form.Item>
                </Col>
              </Row>
              <Button type="primary" disabled>Salvar perfil</Button>
            </Form>
          </Space>
        </div>
      </div>

      {/* Account links */}
      <div style={{ background: cardBg, border: `1px solid ${border}` }}>
        <div style={{ padding: '10px 16px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <Space size={8}>
            <Text strong style={{ fontSize: 13 }}>Contas vinculadas</Text>
            <Tag style={{ margin: 0 }}>Em desenvolvimento</Tag>
          </Space>
        </div>
        <div style={{ padding: 16 }}>
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
                <Button size="small" disabled>{item.connected ? 'Desvincular' : 'Vincular'}</Button>
              </div>
            ))}
          </Space>
        </div>
      </div>

      {/* API Tokens */}
      <div style={{ background: cardBg, border: `1px solid ${border}` }}>
        <div style={{ padding: '10px 16px', borderBottom: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <Space size={8}>
            <Text strong style={{ fontSize: 13 }}>Tokens de API</Text>
            <Tag style={{ margin: 0 }}>Em desenvolvimento</Tag>
          </Space>
          <Button size="small" type="primary" disabled>Novo token</Button>
        </div>
        <div style={{ padding: 16 }}>
          <Table
            dataSource={[] as ApiToken[]}
            columns={tokenColumns}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </div>
      </div>

      {/* LLM Settings */}
      <div style={{ background: cardBg, border: `1px solid ${border}` }}>
        <div style={{ padding: '10px 16px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <Space size={8}>
            <Text strong style={{ fontSize: 13 }}>Configurações de LLM</Text>
            <Tag style={{ margin: 0 }}>Em desenvolvimento</Tag>
          </Space>
        </div>
        <div style={{ padding: 16 }}>
          <Form layout="vertical" disabled>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item label="Provedor">
                  <Select defaultValue="openai">
                    <Select.Option value="openai">OpenAI</Select.Option>
                    <Select.Option value="anthropic">Anthropic</Select.Option>
                    <Select.Option value="ollama">Ollama (local)</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
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
            <Button type="primary" icon={<RobotOutlined />} disabled>Salvar configurações de LLM</Button>
          </Form>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 8 }}>
        <Button danger icon={<LogoutOutlined />} onClick={logout}>
          Desconectar da conta
        </Button>
      </div>
    </div>
  )
}

// ─── CUSTOM FIELDS SETTINGS VIEW ──────────────────────────────────────────────

export const CustomFieldsSettingsView: React.FC = () => {
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

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Space direction="vertical" size={0}>
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
            const taskCount = tasks.filter(task => taskBelongsToProject(task, project.id)).length
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
  const { showLoader, hideLoader } = useLoader()
  const { openEditTask } = useTaskEdit()
  const { route, navigate } = useAppRoute()

  const [siderWidth, setSiderWidth] = useState(240)
  const [collapsed, setCollapsed] = useState(false)
  const [openKeys, setOpenKeys] = useState<string[]>(['projects'])
  const [projOpen, setProjOpen] = useState(false)
  const [editingProj, setEditingProj] = useState<Project | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const filterPid = route.view === 'project' ? route.projectId : undefined
  const currentProject = projects.find(p => p.id === filterPid)
  const selectedMenuKey = getRouteMenuKey(route)

  // Simulate initial data load
  useEffect(() => {
    showLoader()
    const t = setTimeout(hideLoader, 1400)
    return () => clearTimeout(t)
  }, [showLoader, hideLoader])

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
  }, [collapsed, route.view])

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
            setSiderWidth(w)
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
                <Tooltip title="Minha conta">
                  <Avatar
                    size={28}
                    style={{ backgroundColor: '#6366f1', fontSize: 12, cursor: 'pointer' }}
                    icon={<UserOutlined />}
                    onClick={() => {
                      navigate({ view: 'settings-user' })
                      setOpenKeys(prev => prev.includes('settings') ? prev : [...prev, 'settings'])
                    }}
                  />
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
                        <Button type="text" size="small" onClick={() => navigate({ view: 'tasks' })}>
                          Ver todas ×
                        </Button>
                      )}
                    </div>
                    <TasksTable
                      onEdit={openEditTask}
                      onAddSubtask={(task) => openEditTask(null, task.projectId || task.projectIds[0] || filterPid, task.id)}
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
          cssVar: { key: 'klip' },
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

import MobileApp from './MobileApp'

const AuthenticatedShell: React.FC = () => {
  const { isAuthenticated, loading } = useAuth()
  const isMobile = useMobileDetect()

  if (loading || !isAuthenticated) return null

  return (
    <AppDataProvider>
      <TaskEditProvider>
        {isMobile ? <MobileApp /> : <MainApp />}
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
