import React, { useState, useMemo, useRef, useCallback } from 'react'
import {
  Badge,
  Button,
  Drawer,
  Empty,
  FloatButton,
  Segmented,
  Space,
  Tag,
  Typography,
} from 'antd'
import {
  CheckSquareOutlined,
  CalendarOutlined,
  FolderOutlined,
  SettingOutlined,
  UserOutlined,
  DatabaseOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import {
  CalendarView,
  UserSettingsView,
  CustomFieldsSettingsView,
  ProjectDrawer,
} from './App'
import { useAppData, useTaskEdit, useTheme } from './contexts/appContexts'
import { PRIORITY_CONFIG, STATUS_CONFIG } from './constants/ui'
import type { Project, Task } from './types/domain'
import { taskBelongsToProject } from './lib/klipAdapters'
import { useAppRoute } from './hooks/useAppRoute'
import { useUserPreference } from './hooks/useUserPreference'
import { TASK_STATUS_FILTER_OPTIONS, type TaskStatusFilter } from './types/preferences'
import { useVirtualizer } from '@tanstack/react-virtual'

const { Text } = Typography

const MOBILE_TASK_ITEM_HEIGHT = 118
const MOBILE_TASK_OVERSCAN = 4

// ─── LOGO SVG ─────────────────────────────────────────────────────────────────

const KlipLogoSvg: React.FC = () => (
  <svg width="26" height="26" viewBox="0 0 191 191" style={{ flexShrink: 0, borderRadius: 6, display: 'block' }}>
    <path d="M 75.00 29.77 L 75.00 160.00 L 71.75 159.90 C60.29,159.54 49.27,152.47 43.84,142.00 C41.51,137.53 41.50,137.27 41.22,96.10 L 41.21 95.49 C40.97,59.07 40.91,50.73 44.72,44.93 C45.88,43.17 47.38,41.65 49.35,39.65 C55.74,33.15 60.71,30.73 68.75,30.19 Z" fill="rgb(102,172,203)" />
    <path d="M 127.25 77.27 C116.94,87.28 103.44,100.40 97.25,106.43 L 86.00 117.39 L 86.00 71.41 L 97.00 61.50 C107.43,52.10 108.00,51.38 108.00,47.68 C108.00,42.45 111.39,36.71 116.00,34.12 C119.31,32.26 121.38,32.00 132.89,32.00 L 146.00 32.00 L 146.00 59.08 ZM 125.81 156.60 C122.88,158.08 118.30,159.33 114.45,159.69 L 108.00 160.29 L 108.00 131.56 L 102.75 126.25 L 97.50 120.93 L 106.02 112.72 C110.71,108.20 116.40,102.77 118.65,100.66 L 122.76 96.83 L 129.88 103.95 C133.80,107.87 138.19,113.41 139.63,116.27 C143.10,123.11 143.85,131.92 141.56,138.83 C139.41,145.28 132.30,153.31 125.81,156.60 Z" fill="rgb(238,128,91)" />
  </svg>
)

// ─── TASK CARD ────────────────────────────────────────────────────────────────

const TaskCard = React.memo<{
  task: Task
  project?: Project
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
}>(({ task, project, onEdit, onDelete }) => {
  const { isDark } = useTheme()
  const border = isDark ? '#3a3a3a' : '#f0f0f0'
  const bg = isDark ? '#1e1e1e' : '#fff'
  const secondaryTextColor = isDark ? 'rgba(255,255,255,0.68)' : '#595959'
  const statusCfg = STATUS_CONFIG[task.status]
  const priorityCfg = PRIORITY_CONFIG[task.priority]

  return (
    <div
      style={{
        height: MOBILE_TASK_ITEM_HEIGHT - 1,
        boxSizing: 'border-box',
        background: bg,
        border: `1px solid ${border}`,
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, minWidth: 0 }}>
        <button
          type="button"
          aria-label={`Abrir detalhes de ${task.title}`}
          onClick={() => onEdit(task)}
          style={{
            flex: 1,
            minWidth: 0,
            border: 0,
            background: 'transparent',
            color: 'inherit',
            cursor: 'pointer',
            font: 'inherit',
            fontSize: 14,
            fontWeight: 700,
            lineHeight: 1.4,
            padding: 0,
            textAlign: 'left',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {task.title}
        </button>
        <Space size={4} style={{ flexShrink: 0 }}>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            aria-label={`Editar ${task.title}`}
            onClick={() => onEdit(task)}
            style={{ padding: '0 4px' }}
          />
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            aria-label={`Remover ${task.title}`}
            onClick={() => onDelete(task.id)}
            style={{ padding: '0 4px' }}
          />
        </Space>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <Badge
          status={statusCfg.color as 'default' | 'processing' | 'success' | 'warning' | 'error'}
          text={<Text style={{ fontSize: 12 }}>{statusCfg.label}</Text>}
        />
        <Tag color={priorityCfg.color} style={{ fontSize: 11, margin: 0 }}>{priorityCfg.label}</Tag>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, overflow: 'hidden' }}>
        <Space size={4} style={{ minWidth: 0, overflow: 'hidden' }}>
          {project && <span style={{ display: 'inline-block', width: 8, height: 8, background: project.color, flexShrink: 0 }} />}
          <Text style={{ fontSize: 12, color: secondaryTextColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project?.name ?? 'Sem projeto'}</Text>
        </Space>
        {task.dueDate && (
          <Text style={{ fontSize: 12, color: secondaryTextColor }}>· {task.dueDate}</Text>
        )}
      </div>
    </div>
  )
})

TaskCard.displayName = 'TaskCard'

// ─── MOBILE TASK LIST ─────────────────────────────────────────────────────────

const MobileTaskList: React.FC<{ filterPid?: string }> = ({ filterPid }) => {
  const { tasks, projects, deleteTask } = useAppData()
  const { openEditTask } = useTaskEdit()
  const { isDark } = useTheme()
  const [statusFilter, setStatusFilter] = useUserPreference('taskStatusFilter')
  const border = isDark ? '#3a3a3a' : '#f0f0f0'
  const scrollRef = useRef<HTMLDivElement>(null)
  const projectById = useMemo(
    () => new Map(projects.map(project => [project.id, project])),
    [projects],
  )
  const handleDeleteTask = useCallback((taskId: string) => {
    void deleteTask(taskId)
  }, [deleteTask])

  const filtered = useMemo(() => {
    const scopedTasks = filterPid ? tasks.filter(t => taskBelongsToProject(t, filterPid)) : tasks

    if (statusFilter === 'completed') return scopedTasks.filter(task => task.status === 'done')
    if (statusFilter === 'pending') return scopedTasks.filter(task => task.status !== 'done')

    return scopedTasks
  }, [filterPid, statusFilter, tasks])
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => MOBILE_TASK_ITEM_HEIGHT,
    overscan: MOBILE_TASK_OVERSCAN,
  })
  const virtualItems = virtualizer.getVirtualItems()

  if (!filtered.length) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minHeight: 0 }}>
        <Segmented
          size="small"
          value={statusFilter}
          onChange={value => setStatusFilter(value as TaskStatusFilter)}
          options={TASK_STATUS_FILTER_OPTIONS}
          block
        />
        <div style={{ padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Empty description="Nenhuma tarefa" />
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minHeight: 0 }}>
      <Segmented
        size="small"
        value={statusFilter}
        onChange={value => setStatusFilter(value as TaskStatusFilter)}
        options={TASK_STATUS_FILTER_OPTIONS}
        block
      />
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          border: `1px solid ${border}`,
          contain: 'layout paint style',
        }}
      >
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
          {virtualItems.map(virtualItem => {
            const task = filtered[virtualItem.index]
            if (!task) return null

            return (
              <div
                key={task.id}
                data-index={virtualItem.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: MOBILE_TASK_ITEM_HEIGHT,
                  transform: `translateY(${virtualItem.start}px)`,
                  paddingBottom: 1,
                  boxSizing: 'border-box',
                  contain: 'layout paint style',
                }}
              >
                <TaskCard
                  task={task}
                  project={projectById.get(task.projectId)}
                  onEdit={openEditTask}
                  onDelete={handleDeleteTask}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── MOBILE PROJECTS LIST ─────────────────────────────────────────────────────

const MobileProjectsList: React.FC<{
  onSelectProject: (pid: string) => void
  onNewProject: () => void
  onEditProject: (p: Project) => void
}> = ({ onSelectProject, onNewProject, onEditProject }) => {
  const { projects, tasks, deleteProject } = useAppData()
  const { isDark } = useTheme()
  const border = isDark ? '#3a3a3a' : '#f0f0f0'
  const bg = isDark ? '#1e1e1e' : '#fff'
  const headerBg = isDark ? '#161616' : '#fafafa'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{
        padding: '10px 16px',
        borderBottom: `1px solid ${border}`,
        background: headerBg,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Text strong style={{ fontSize: 13 }}>Projetos</Text>
        <Button size="small" type="primary" icon={<PlusOutlined />} onClick={onNewProject}>
          Novo
        </Button>
      </div>
      {!projects.length && (
        <div style={{ padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Empty description="Nenhum projeto" />
        </div>
      )}
      {projects.map(p => {
        const count = tasks.filter(t => taskBelongsToProject(t, p.id)).length
        return (
          <div
            key={p.id}
            style={{
              background: bg,
              borderBottom: `1px solid ${border}`,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span
              style={{ display: 'inline-block', width: 12, height: 12, background: p.color, borderRadius: 3, flexShrink: 0 }}
            />
            <button
              type="button"
              aria-label={`Abrir projeto ${p.name}`}
              onClick={() => onSelectProject(p.id)}
              style={{
                flex: 1,
                border: 0,
                background: 'transparent',
                color: 'inherit',
                cursor: 'pointer',
                padding: 0,
                textAlign: 'left',
              }}
            >
              <Text strong style={{ fontSize: 14 }}>{p.name}</Text>
              {p.description && (
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{p.description}</Text>
              )}
            </button>
            <Text type="secondary" style={{ fontSize: 12, flexShrink: 0 }}>{count} tarefas</Text>
            <Space size={2}>
              <Button type="text" size="small" icon={<EditOutlined />} aria-label={`Editar ${p.name}`} onClick={() => onEditProject(p)} />
              <Button type="text" size="small" danger icon={<DeleteOutlined />} aria-label={`Excluir ${p.name}`} onClick={() => { void deleteProject(p.id) }} />
            </Space>
          </div>
        )
      })}
    </div>
  )
}

// ─── MOBILE SETTINGS ──────────────────────────────────────────────────────────

const MobileSettingsView: React.FC<{
  section: 'user' | 'customfields'
  onSectionChange: (section: 'user' | 'customfields') => void
}> = ({ section, onSectionChange }) => {
  const { isDark } = useTheme()
  const border = isDark ? '#3a3a3a' : '#f0f0f0'
  const headerBg = isDark ? '#161616' : '#fafafa'
  const activeSectionColor = isDark ? '#8b8df8' : '#4f46e5'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* tab switcher */}
      <div style={{
        display: 'flex',
        borderBottom: `1px solid ${border}`,
        background: headerBg,
        flexShrink: 0,
      }}>
        {([
          { key: 'user', icon: <UserOutlined />, label: 'Usuário' },
          { key: 'customfields', icon: <DatabaseOutlined />, label: 'Campos' },
        ] as const).map(item => (
          <button
            key={item.key}
            onClick={() => onSectionChange(item.key)}
            style={{
              flex: 1,
              padding: '12px 8px',
              border: 'none',
              borderBottom: section === item.key ? `2px solid ${activeSectionColor}` : '2px solid transparent',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              color: section === item.key ? activeSectionColor : (isDark ? 'rgba(255,255,255,0.68)' : '#595959'),
              fontSize: 13,
              fontWeight: section === item.key ? 600 : 400,
              transition: 'color 0.2s',
            }}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column' }}>
        {section === 'user' ? <UserSettingsView /> : <CustomFieldsSettingsView />}
      </div>
    </div>
  )
}

// ─── BOTTOM TAB BAR ───────────────────────────────────────────────────────────

type TabKey = 'tasks' | 'projects' | 'calendar' | 'settings'

const TABS: { key: TabKey; icon: React.ReactNode; label: string }[] = [
  { key: 'tasks', icon: <CheckSquareOutlined />, label: 'Tarefas' },
  { key: 'projects', icon: <FolderOutlined />, label: 'Projetos' },
  { key: 'calendar', icon: <CalendarOutlined />, label: 'Calendário' },
  { key: 'settings', icon: <SettingOutlined />, label: 'Config' },
]

// ─── MOBILE APP ───────────────────────────────────────────────────────────────

const MobileApp: React.FC = () => {
  const { isDark } = useTheme()
  const { projects } = useAppData()
  const { route, navigate } = useAppRoute()

  const [projDrawerOpen, setProjDrawerOpen] = useState(false)
  const [projOpen, setProjOpen] = useState(false)
  const [editingProj, setEditingProj] = useState<Project | null>(null)
  const { openEditTask } = useTaskEdit()
  const activeTab: TabKey =
    route.view === 'projects' ? 'projects' :
      route.view === 'calendar' ? 'calendar' :
        route.view === 'settings-user' || route.view === 'settings-fields' ? 'settings' :
          'tasks'
  const filterPid = route.view === 'project' ? route.projectId : undefined
  const settingsSection = route.view === 'settings-fields' ? 'customfields' : 'user'

  const border = isDark ? '#3a3a3a' : 'rgba(0,0,0,0.08)'
  const headerBg = isDark ? 'rgba(22,22,22,0.97)' : 'rgba(255,255,255,0.95)'
  const appBg = isDark
    ? 'linear-gradient(160deg, #1c1c1c 0%, #0d0d0d 100%)'
    : 'radial-gradient(ellipse at 20% 20%, #dcdcf4 0%, #f2f2fb 60%)'
  const tabBarBg = isDark ? 'rgba(16,16,16,0.97)' : 'rgba(255,255,255,0.97)'
  const activeColor = isDark ? '#8b8df8' : '#4f46e5'
  const inactiveColor = isDark ? 'rgba(255,255,255,0.68)' : 'rgba(0,0,0,0.62)'

  const currentProject = projects.find(p => p.id === filterPid)

  const handleSelectProject = (pid: string) => {
    navigate({ view: 'project', projectId: pid })
    setProjDrawerOpen(false)
  }

  const handleEditProject = (p: Project) => {
    setEditingProj(p)
    setProjOpen(true)
  }

  const filterLabel = filterPid && currentProject
    ? `Tarefas — ${currentProject.name}`
    : 'Todas as Tarefas'

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: appBg }}>

      {/* ── HEADER ── */}
      <div style={{
        height: 52,
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        borderBottom: `1px solid ${border}`,
        background: headerBg,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        flexShrink: 0,
        gap: 8,
      }}>
        <button
          type="button"
          aria-label="Klip - Ir para a página inicial"
          onClick={() => navigate({ view: 'tasks' })}
          style={{
            flex: 1,
            minWidth: 0,
            border: 0,
            background: 'transparent',
            color: 'inherit',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            textAlign: 'left',
            cursor: 'pointer',
          }}
        >
          <KlipLogoSvg />
          <div style={{ flex: 1, lineHeight: 1.2, overflow: 'hidden' }}>
            <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.3px', color: isDark ? '#fff' : '#1a1a1a', whiteSpace: 'nowrap' }}>
              Klip
            </div>
            {activeTab === 'tasks' && filterPid && (
              <div style={{ fontSize: 11, color: currentProject?.color ?? '#4f46e5', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentProject?.name}
              </div>
            )}
          </div>
        </button>

        <Space size={4}>
          <Button
            aria-label="Minha conta"
            type="text"
            size="small"
            icon={<UserOutlined style={{ fontSize: 15 }} />}
            onClick={() => navigate({ view: 'settings-user' })}
            style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }}
          />
        </Space>
      </div>

      {/* ── CONTENT ── */}
      <main style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'tasks' && (
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <div style={{
              padding: '8px 12px',
              borderBottom: `1px solid ${border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: isDark ? 'rgba(22,22,22,0.6)' : 'rgba(255,255,255,0.6)',
              border: `1px solid ${border}`,
            }}>
              <Text strong style={{ fontSize: 13 }}>{filterLabel}</Text>
              {filterPid && (
                <Button type="text" size="small" onClick={() => navigate({ view: 'tasks' })}>
                  Ver todas ×
                </Button>
              )}
            </div>
            <MobileTaskList filterPid={filterPid} />
          </div>
        )}

        {activeTab === 'projects' && (
          <MobileProjectsList
            onSelectProject={handleSelectProject}
            onNewProject={() => { setEditingProj(null); setProjOpen(true) }}
            onEditProject={handleEditProject}
          />
        )}

        {activeTab === 'calendar' && (
          <div style={{ flex: 1, minHeight: 0, padding: 12, display: 'flex', flexDirection: 'column' }}>
            <CalendarView compact />
          </div>
        )}

        {activeTab === 'settings' && (
          <MobileSettingsView
            section={settingsSection}
            onSectionChange={(section) => navigate({ view: section === 'user' ? 'settings-user' : 'settings-fields' })}
          />
        )}
      </main>

      {/* ── BOTTOM TAB BAR ── */}
      <div style={{
        height: 60,
        display: 'flex',
        borderTop: `1px solid ${border}`,
        background: tabBarBg,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        flexShrink: 0,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => {
                if (tab.key === 'projects') navigate({ view: 'projects' })
                else if (tab.key === 'calendar') navigate({ view: 'calendar' })
                else if (tab.key === 'settings') navigate({ view: 'settings-user' })
                else navigate({ view: 'tasks' })
              }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: isActive ? activeColor : inactiveColor,
                transition: 'color 0.15s',
                padding: 0,
              }}
            >
              <span style={{ fontSize: 20 }}>{tab.icon}</span>
              <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400 }}>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* ── FLOAT BUTTON (Nova Tarefa) ── */}
      {(activeTab === 'tasks' || activeTab === 'projects') && (
        <FloatButton
          icon={<PlusOutlined />}
          type="primary"
          style={{ bottom: 80, right: 20 }}
          tooltip="Nova Tarefa"
          onClick={() => openEditTask(null, filterPid)}
        />
      )}

      {/* ── DRAWERS ── */}
      <ProjectDrawer
        open={projOpen}
        onClose={() => { setProjOpen(false); setEditingProj(null) }}
        editingProject={editingProj}
      />

      {/* Project filter drawer (for tasks tab) */}
      <Drawer
        title="Filtrar por projeto"
        open={projDrawerOpen}
        onClose={() => setProjDrawerOpen(false)}
        placement="left"
        size="min(86vw, 280px)"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button
            onClick={() => { navigate({ view: 'tasks' }); setProjDrawerOpen(false) }}
            style={{
              padding: '10px 12px',
              border: 'none',
              borderRadius: 6,
              background: !filterPid ? '#4f46e520' : 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
              color: !filterPid ? '#4f46e5' : (isDark ? '#fff' : '#1a1a1a'),
              fontWeight: !filterPid ? 600 : 400,
              fontSize: 14,
            }}
          >
            Todas as tarefas
          </button>
          {projects.map(p => (
            <button
              key={p.id}
              onClick={() => handleSelectProject(p.id)}
              style={{
                padding: '10px 12px',
                border: 'none',
                borderRadius: 6,
                background: filterPid === p.id ? `${p.color}20` : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                color: filterPid === p.id ? p.color : (isDark ? '#fff' : '#1a1a1a'),
                fontWeight: filterPid === p.id ? 600 : 400,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ display: 'inline-block', width: 8, height: 8, background: p.color, borderRadius: 2, flexShrink: 0 }} />
              {p.name}
            </button>
          ))}
        </div>
      </Drawer>
    </div>
  )
}

export default MobileApp
