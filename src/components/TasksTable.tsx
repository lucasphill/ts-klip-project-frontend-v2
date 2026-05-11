import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import {
  Button,
  Empty,
  Input,
  Popconfirm,
  Popover,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
  theme as antTheme,
} from 'antd'
import {
  CheckCircleOutlined,
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  FilterOutlined,
  PlusOutlined,
  RightOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnFiltersState,
  type ColumnResizeMode,
  type SortingState,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useAppData, useTheme } from '../contexts/appContexts'
import { useUserPreference } from '../hooks/useUserPreference'
import { taskBelongsToProject } from '../lib/klipAdapters'
import { matchesSearchText } from '../lib/search'
import {
  compareTaskDisplayText as compareText,
  getCustomFieldValue,
  getTaskProjectIds,
} from '../lib/taskDisplay'
import { TASK_STATUS_FILTER_OPTIONS, type TaskStatusFilter } from '../types/preferences'
import type { CustomField, Task } from '../types/domain'

const { Text } = Typography

type TaskTableRow = Task & {
  depth: number
  hasChildren: boolean
  childCount: number
  isExpanded: boolean
  hasHiddenParent: boolean
}

const taskTableColumnHelper = createColumnHelper<TaskTableRow>()
const TASK_TABLE_FIXED_LEFT_COLS = ['done']
const TASK_TABLE_FIXED_RIGHT_COLS = ['actions']
const TASK_TABLE_SIZE_OPTIONS = [
  { label: 'Compacto', value: 'compact' },
  { label: 'Padrão', value: 'default' },
  { label: 'Confortável', value: 'comfortable' },
]

const normalizeParentTaskId = (value?: string | null) => {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  return trimmed.length > 0 ? trimmed : undefined
}

const getCustomFieldValueLabel = (field: CustomField, value: unknown) => {
  if (value === undefined || value === null || value === '') return ''

  if (field.type === 'checkbox') {
    if (value === true || value === 'true' || value === 1 || value === '1') return 'Sim'
    if (value === false || value === 'false' || value === 0 || value === '0') return 'Não'
    return String(value)
  }

  if (field.type === 'date' && typeof value === 'string') {
    const normalizedDate = value.split('T')[0]
    if (!normalizedDate) return ''
    const parts = normalizedDate.split('-')
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
    return new Date(`${normalizedDate}T12:00:00`).toLocaleDateString('pt-BR')
  }

  return String(value)
}

const renderCustomFieldValue = (field: CustomField, value: unknown) => {
  const label = getCustomFieldValueLabel(field, value)

  if (!label) {
    return <Text type="secondary" style={{ fontSize: 12 }}>-</Text>
  }

  if (field.type === 'checkbox') {
    return (
      <Tag color={label === 'Sim' ? 'success' : 'default'} style={{ margin: 0 }}>
        {label}
      </Tag>
    )
  }

  return (
    <Text style={{ fontSize: 12 }} ellipsis>
      {label}
    </Text>
  )
}

const getDueDateLabel = (value?: string) => {
  if (!value) return ''
  const parts = value.split('T')[0].split('-')
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
  return new Date(`${value.split('T')[0]}T12:00:00`).toLocaleDateString('pt-BR')
}

export const TasksTable: React.FC<{
  onEdit: (task: Task) => void
  onAddSubtask: (task: Task) => void
  filterPid?: string
}> = ({ onEdit, onAddSubtask, filterPid }) => {
  const { tasks, projects, customFields, deleteTask, updateTask } = useAppData()
  const { isDark } = useTheme()
  const { token } = antTheme.useToken()

  const [sorting, setSorting] = useUserPreference('taskSorting')
  const [columnFilters, setColumnFilters] = useUserPreference('taskColumnFilters')
  const [globalFilter, setGlobalFilterPreference] = useUserPreference('taskGlobalFilter')
  const [globalFilterInput, setGlobalFilterInput] = useState(globalFilter)
  const [columnResizeMode] = useState<ColumnResizeMode>('onChange')
  const [activeFilterCol, setActiveFilterCol] = useState<string | null>(null)
  const [tableSize, setTableSize] = useUserPreference('taskTableSize')
  const [statusFilter, setStatusFilter] = useUserPreference('taskStatusFilter')
  const [collapsedTaskIds, setCollapsedTaskIds] = useState<string[]>([])
  const [middleColOrder, setMiddleColOrder] = useUserPreference('taskColumnOrder')
  const deferredGlobalFilterInput = useDeferredValue(globalFilterInput)
  const deferredGlobalFilter = deferredGlobalFilterInput

  useEffect(() => {
    setGlobalFilterInput(globalFilter)
  }, [globalFilter])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (globalFilterInput !== globalFilter) setGlobalFilterPreference(globalFilterInput)
    }, 250)

    return () => window.clearTimeout(timer)
  }, [globalFilter, globalFilterInput, setGlobalFilterPreference])

  const projMap = useMemo(
    () => Object.fromEntries(projects.map(project => [project.id, project])),
    [projects],
  )

  const scopedTasks = useMemo(
    () => (filterPid ? tasks.filter(task => taskBelongsToProject(task, filterPid)) : tasks),
    [filterPid, tasks],
  )

  const collapsibleTaskIds = useMemo(() => {
    const taskIds = new Set(scopedTasks.map(task => task.id))
    const parentIds = new Set<string>()

    scopedTasks.forEach(task => {
      const parentTaskId = normalizeParentTaskId(task.parentTaskId)
      if (parentTaskId && parentTaskId !== task.id && taskIds.has(parentTaskId)) {
        parentIds.add(parentTaskId)
      }
    })

    return parentIds
  }, [scopedTasks])

  useEffect(() => {
    setCollapsedTaskIds(previous => {
      const next = previous.filter(taskId => collapsibleTaskIds.has(taskId))
      return next.length === previous.length ? previous : next
    })
  }, [collapsibleTaskIds])

  const activeCustomFields = useMemo(
    () => customFields
      .filter(field => {
        if (field.scope === 'universal') return true
        if (filterPid) return field.projectIds.includes(filterPid)
        return false
      })
      .sort((left, right) => {
        if (left.scope !== right.scope) return left.scope === 'universal' ? -1 : 1
        return compareText(left.name, right.name)
      }),
    [customFields, filterPid],
  )
  const activeCustomFieldByColumnId = useMemo(
    () => new Map(activeCustomFields.map(field => [`cf-${field.id}`, field])),
    [activeCustomFields],
  )

  const desiredMiddleColOrder = useMemo(
    () => [
      'title',
      ...(!filterPid ? ['project'] : []),
      'dueDate',
      ...activeCustomFields.map(field => `cf-${field.id}`),
    ],
    [activeCustomFields, filterPid],
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMiddleColOrder(previous => {
        const kept = previous.filter(columnId => desiredMiddleColOrder.includes(columnId))
        const missing = desiredMiddleColOrder.filter(columnId => !kept.includes(columnId))
        const next = [...kept, ...missing]
        const isSame = next.length === previous.length && next.every((columnId, index) => columnId === previous[index])
        return isSame ? previous : next
      })
    }, 0)

    return () => window.clearTimeout(timer)
  }, [desiredMiddleColOrder, setMiddleColOrder])

  const effectiveMiddleColOrder = middleColOrder.length > 0 ? middleColOrder : desiredMiddleColOrder
  const columnOrder = useMemo(
    () => [...TASK_TABLE_FIXED_LEFT_COLS, ...effectiveMiddleColOrder, ...TASK_TABLE_FIXED_RIGHT_COLS],
    [effectiveMiddleColOrder],
  )

  const columnFilterMap = useMemo(
    () => Object.fromEntries(columnFilters.map(filter => [filter.id, String(filter.value ?? '')])),
    [columnFilters],
  )
  const projectFilterOptions = useMemo(
    () => projects.map(project => ({ value: project.name, label: project.name })),
    [projects],
  )

  const getProjectLabel = useCallback((task: Task) => {
    const labels = getTaskProjectIds(task)
      .map(projectId => projMap[projectId]?.name)
      .filter((name): name is string => Boolean(name))

    return labels.join(' ')
  }, [projMap])

  const rowsData = useMemo<TaskTableRow[]>(() => {
    const taskMap = new Map(scopedTasks.map(task => [task.id, task]))
    const childrenByParentId = new Map<string, Task[]>()
    const rootTasks: Task[] = []
    const completedMatchesFilter = (task: Task) => {
      if (statusFilter === 'completed') return task.status === 'done'
      if (statusFilter === 'pending') return task.status !== 'done'
      return true
    }

    scopedTasks.forEach(task => {
      const parentTaskId = normalizeParentTaskId(task.parentTaskId)
      if (parentTaskId && parentTaskId !== task.id && taskMap.has(parentTaskId)) {
        const siblings = childrenByParentId.get(parentTaskId) ?? []
        siblings.push(task)
        childrenByParentId.set(parentTaskId, siblings)
        return
      }

      rootTasks.push(task)
    })

    const activeColumnFilters = Object.entries(columnFilterMap)
      .map(([columnId, value]) => [columnId, value.trim()] as const)
      .filter(([, value]) => value.length > 0)

    const normalizedGlobalFilter = deferredGlobalFilter.trim()
    const hasActiveFilters =
      statusFilter !== 'all' ||
      normalizedGlobalFilter.length > 0 ||
      activeColumnFilters.length > 0

    const taskMatchesColumnFilters = (task: Task) => {
      if (!completedMatchesFilter(task)) return false

      for (const [columnId, value] of activeColumnFilters) {
        if (columnId === 'title' && !matchesSearchText(`${task.title} ${task.description}`, value)) {
          return false
        }

        if (columnId === 'project' && !matchesSearchText(getProjectLabel(task), value)) {
          return false
        }

        if (columnId === 'dueDate' && !matchesSearchText(getDueDateLabel(task.dueDate), value)) {
          return false
        }

        if (columnId.startsWith('cf-')) {
          const field = activeCustomFieldByColumnId.get(columnId)
          if (!field) continue

          const fieldValue = getCustomFieldValue(task, field)
          if (!matchesSearchText(getCustomFieldValueLabel(field, fieldValue), value)) {
            return false
          }
        }
      }

      if (!normalizedGlobalFilter) return true

      const customFieldText = activeCustomFields
        .map(field => getCustomFieldValueLabel(field, getCustomFieldValue(task, field)))
        .join(' ')
      const searchableText = [
        task.title,
        task.description,
        getProjectLabel(task),
        getDueDateLabel(task.dueDate),
        customFieldText,
      ].join(' ')

      return matchesSearchText(searchableText, normalizedGlobalFilter)
    }

    const matchedTaskIds = hasActiveFilters
      ? new Set(scopedTasks.filter(taskMatchesColumnFilters).map(task => task.id))
      : new Set(scopedTasks.map(task => task.id))

    const ancestorTaskIds = new Set<string>()

    if (hasActiveFilters) {
      matchedTaskIds.forEach(taskId => {
        const visitedTaskIds = new Set<string>()
        let currentTask = taskMap.get(taskId)

        while (currentTask) {
          const parentTaskId = normalizeParentTaskId(currentTask.parentTaskId)
          if (!parentTaskId || visitedTaskIds.has(parentTaskId) || !taskMap.has(parentTaskId)) break

          ancestorTaskIds.add(parentTaskId)
          visitedTaskIds.add(parentTaskId)
          currentTask = taskMap.get(parentTaskId)
        }
      })
    }

    const contextualTaskIds = hasActiveFilters
      ? new Set([...matchedTaskIds, ...ancestorTaskIds])
      : new Set(scopedTasks.map(task => task.id))

    const collapsedTaskIdsSet = new Set(collapsedTaskIds)
    const sortDescriptor = sorting[0]
    const directionFactor = sortDescriptor?.desc ? -1 : 1

    const compareTasks = (left: Task, right: Task) => {
      if (!sortDescriptor) return compareText(left.title, right.title)

      if (sortDescriptor.id === 'done') {
        return (Number(left.status === 'done') - Number(right.status === 'done')) * directionFactor
      }

      if (sortDescriptor.id === 'title') {
        return compareText(left.title, right.title) * directionFactor
      }

      if (sortDescriptor.id === 'project') {
        return compareText(getProjectLabel(left), getProjectLabel(right)) * directionFactor
      }

      if (sortDescriptor.id === 'dueDate') {
        return compareText(left.dueDate, right.dueDate) * directionFactor
      }

      if (sortDescriptor.id.startsWith('cf-')) {
        const field = activeCustomFieldByColumnId.get(sortDescriptor.id)
        if (!field) return 0

        const leftValue = getCustomFieldValueLabel(field, getCustomFieldValue(left, field))
        const rightValue = getCustomFieldValueLabel(field, getCustomFieldValue(right, field))
        return compareText(leftValue, rightValue) * directionFactor
      }

      return compareText(left.title, right.title) * directionFactor
    }

    const sortTasks = (items: Task[]) => [...items].sort(compareTasks)
    const sortedRootTasks = sortTasks(rootTasks)
    const sortedTasks = sortTasks(scopedTasks)
    const sortedChildrenByParentId = new Map<string, Task[]>()
    childrenByParentId.forEach((children, parentId) => {
      sortedChildrenByParentId.set(parentId, sortTasks(children))
    })
    const rows: TaskTableRow[] = []
    const visitedTaskIds = new Set<string>()

    const visitTask = (task: Task, depth: number) => {
      if (visitedTaskIds.has(task.id)) return
      visitedTaskIds.add(task.id)

      const allChildren = sortedChildrenByParentId.get(task.id) ?? []
      const visibleChildren = hasActiveFilters
        ? allChildren.filter(child => contextualTaskIds.has(child.id))
        : allChildren
      const isExpanded =
        visibleChildren.length > 0 &&
        !collapsedTaskIdsSet.has(task.id)
      const parentTaskId = normalizeParentTaskId(task.parentTaskId)

      rows.push({
        ...task,
        depth,
        hasChildren: allChildren.length > 0,
        childCount: allChildren.length,
        isExpanded,
        hasHiddenParent: Boolean(parentTaskId && !taskMap.has(parentTaskId)),
      })

      if (!isExpanded) return

      visibleChildren.forEach(child => {
        if (hasActiveFilters && !contextualTaskIds.has(child.id)) return
        visitTask(child, depth + 1)
      })
    }

    sortedRootTasks.forEach(task => {
      if (hasActiveFilters && !contextualTaskIds.has(task.id)) return
      visitTask(task, 0)
    })

    sortedTasks.forEach(task => {
      if (visitedTaskIds.has(task.id)) return
      const parentTaskId = normalizeParentTaskId(task.parentTaskId)
      if (parentTaskId && parentTaskId !== task.id && taskMap.has(parentTaskId)) return
      if (hasActiveFilters && !contextualTaskIds.has(task.id)) return
      visitTask(task, 0)
    })

    return rows
  }, [
    activeCustomFieldByColumnId,
    activeCustomFields,
    collapsedTaskIds,
    columnFilterMap,
    getProjectLabel,
    deferredGlobalFilter,
    scopedTasks,
    sorting,
    statusFilter,
  ])

  const rowHeight = tableSize === 'compact' ? 36 : tableSize === 'comfortable' ? 56 : 44
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'
  const headerBg = isDark ? '#171717' : '#ffffff'
  const headerShadow = isDark ? '0 8px 18px rgba(0,0,0,0.34)' : '0 8px 18px rgba(15,23,42,0.10)'
  const bodyBg = isDark ? '#121212' : '#ffffff'
  const doneBg = isDark ? '#12251d' : '#f6fffb'
  const childBg = isDark ? '#171717' : '#fafafa'
  const bodyHoverBg = isDark ? '#1b1b1b' : '#f7f8fa'
  const doneHoverBg = isDark ? '#183324' : '#effcf6'
  const childHoverBg = isDark ? '#202020' : '#f3f4f6'

  const toggleTaskCollapsed = useCallback((taskId: string) => {
    setCollapsedTaskIds(previous =>
      previous.includes(taskId)
        ? previous.filter(currentTaskId => currentTaskId !== taskId)
        : [...previous, taskId],
    )
  }, [])

  const getColumnFilter = (columnId: string) =>
    columnFilters.find(filter => filter.id === columnId)?.value as string | undefined

  const setColumnFilter = (columnId: string, value: string | undefined) => {
    setColumnFilters(previous => {
      const rest = previous.filter(filter => filter.id !== columnId)
      return value ? [...rest, { id: columnId, value }] : rest
    })
  }

  const handleColumnFiltersChange = (
    updaterOrValue: ColumnFiltersState | ((previous: ColumnFiltersState) => ColumnFiltersState),
  ) => {
    setColumnFilters(previous => {
      const nextFilters =
        typeof updaterOrValue === 'function'
          ? updaterOrValue(previous as ColumnFiltersState)
          : updaterOrValue

      return nextFilters
        .map(filter => ({ id: filter.id, value: String(filter.value ?? '') }))
        .filter(filter => filter.value.length > 0)
    })
  }

  const columns = useMemo(() => {
    const customFieldColumns = activeCustomFields.map(field =>
      taskTableColumnHelper.display({
        id: `cf-${field.id}`,
        header: () => (
          <Space size={4}>
            <span>{field.name}</span>
            <Tag color={field.scope === 'universal' ? 'purple' : 'blue'} style={{ margin: 0, fontSize: 10 }}>
              {field.scope === 'universal' ? 'Universal' : 'Projeto'}
            </Tag>
          </Space>
        ),
        size: field.type === 'checkbox' ? 120 : 160,
        minSize: 96,
        cell: ({ row }) => renderCustomFieldValue(field, getCustomFieldValue(row.original, field)),
      }),
    )

    return [
      taskTableColumnHelper.accessor('status', {
        id: 'done',
        header: () => <span className="klip-sr-only">Concluída</span>,
        size: 52,
        minSize: 52,
        maxSize: 52,
        enableResizing: false,
        cell: ({ row }) => {
          const task = row.original
          const isDone = task.status === 'done'

          return (
            <Tooltip title={isDone ? 'Marcar como pendente' : 'Marcar como concluída'} placement="right">
              <button
                className="klip-done-button"
                aria-label={`${isDone ? 'Marcar como pendente' : 'Marcar como concluída'}: ${task.title}`}
                onClick={() => { void updateTask(task.id, { status: isDone ? 'todo' : 'done' }) }}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                }}
              >
                {isDone ? (
                  <CheckCircleOutlined style={{ fontSize: 18, color: '#10b981' }} />
                ) : (
                  <span
                    style={{
                      display: 'block',
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      border: `1.5px solid ${isDark ? '#555' : '#ccc'}`,
                    }}
                  />
                )}
              </button>
            </Tooltip>
          )
        },
      }),
      taskTableColumnHelper.accessor('title', {
        id: 'title',
        header: 'Tarefa',
        size: 340,
        minSize: 180,
        cell: ({ getValue, row }) => {
          const task = row.original
          const isDone = task.status === 'done'

          return (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                minWidth: 0,
                paddingLeft: task.depth * 18,
              }}
            >
              {task.hasChildren ? (
                <Button
                  className="klip-collapse-button"
                  type="text"
                  size="small"
                  icon={task.isExpanded ? <DownOutlined /> : <RightOutlined />}
                  aria-label={`${task.isExpanded ? 'Recolher' : 'Expandir'} subtarefas de ${task.title}`}
                  onClick={event => {
                    event.stopPropagation()
                    toggleTaskCollapsed(task.id)
                  }}
                  style={{ width: 22, height: 22, minWidth: 22 }}
                />
              ) : (
                <span style={{ width: 22, minWidth: 22 }} />
              )}
              <button
                className="klip-task-title-button"
                type="button"
                aria-label={`Editar ${task.title}`}
                onClick={() => onEdit(task)}
                style={{
                  opacity: isDone ? 0.48 : 1,
                  border: 0,
                  background: 'transparent',
                  color: 'inherit',
                  font: 'inherit',
                  minWidth: 0,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  padding: 0,
                  textAlign: 'left',
                }}
              >
                <Space size={6} style={{ minWidth: 0, maxWidth: '100%' }}>
                  <Text
                    strong
                    style={{
                      fontSize: 13,
                      textDecoration: isDone ? 'line-through' : 'none',
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {getValue()}
                  </Text>
                  {task.depth > 0 && <Tag style={{ margin: 0 }}>Subtarefa</Tag>}
                  {task.childCount > 0 && <Tag style={{ margin: 0 }}>{task.childCount}</Tag>}
                  {task.hasHiddenParent && <Tag color="warning" style={{ margin: 0 }}>Pai fora do filtro</Tag>}
                </Space>
                {task.description && tableSize !== 'compact' && (
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 11,
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {task.description}
                  </Text>
                )}
              </button>
            </div>
          )
        },
      }),
      ...(!filterPid ? [
        taskTableColumnHelper.display({
          id: 'project',
          header: 'Projeto',
          size: 170,
          minSize: 110,
          cell: ({ row }) => {
            const projectIds = getTaskProjectIds(row.original)
            if (projectIds.length === 0) {
              return <Text type="secondary" style={{ fontSize: 12 }}>Sem projeto</Text>
            }

            const firstProject = projMap[projectIds[0]]

            return (
              <Space size={4} style={{ minWidth: 0, maxWidth: '100%' }}>
                <Tag
                  style={{
                    borderLeft: `3px solid ${firstProject?.color ?? '#ccc'}`,
                    margin: 0,
                    paddingLeft: 6,
                    maxWidth: 130,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {firstProject?.name ?? 'Sem projeto'}
                </Tag>
                {projectIds.length > 1 && <Tag style={{ margin: 0 }}>+{projectIds.length - 1}</Tag>}
              </Space>
            )
          },
        }),
      ] : []),
      taskTableColumnHelper.accessor('dueDate', {
        id: 'dueDate',
        header: 'Prazo',
        size: 116,
        minSize: 86,
        cell: ({ getValue }) => {
          const label = getDueDateLabel(getValue())
          return label ? (
            <Text style={{ fontSize: 12 }}>{label}</Text>
          ) : (
            <Text type="secondary" style={{ fontSize: 12 }}>-</Text>
          )
        },
      }),
      ...customFieldColumns,
      taskTableColumnHelper.display({
        id: 'actions',
        header: () => <span className="klip-sr-only">Ações</span>,
        size: 104,
        minSize: 104,
        maxSize: 104,
        enableResizing: false,
        cell: ({ row }) => {
          const task = row.original

          return (
            <Space size={2} className="row-actions">
              <Tooltip title="Editar">
                <Button className="klip-row-action-button" type="text" size="small" icon={<EditOutlined />} aria-label={`Editar ${task.title}`} onClick={() => onEdit(task)} />
              </Tooltip>
              <Tooltip title="Adicionar subtarefa">
                <Button className="klip-row-action-button" type="text" size="small" icon={<PlusOutlined />} aria-label={`Adicionar subtarefa em ${task.title}`} onClick={() => onAddSubtask(task)} />
              </Tooltip>
              <Popconfirm
                title="Remover tarefa?"
                description={`"${task.title}" será removida.`}
                okText="Remover"
                cancelText="Cancelar"
                okButtonProps={{ danger: true }}
                onConfirm={() => { void deleteTask(task.id) }}
              >
                <Button
                  className="klip-row-action-button"
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  aria-label={`Remover ${task.title}`}
                />
              </Popconfirm>
            </Space>
          )
        },
      }),
    ]
  }, [
    activeCustomFields,
    deleteTask,
    filterPid,
    isDark,
    onAddSubtask,
    onEdit,
    projMap,
    tableSize,
    toggleTaskCollapsed,
    updateTask,
  ])

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: rowsData,
    columns,
    state: {
      sorting: sorting as SortingState,
      columnFilters: columnFilters as ColumnFiltersState,
      globalFilter: deferredGlobalFilter,
      columnOrder,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: handleColumnFiltersChange,
    onGlobalFilterChange: setGlobalFilterInput,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode,
    enableColumnResizing: true,
    manualSorting: true,
    getRowId: row => row.id,
  })

  const { rows } = table.getRowModel()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollAreaRef.current,
    estimateSize: () => rowHeight,
    overscan: 10,
  })
  const virtualRows = virtualizer.getVirtualItems()
  const totalHeight = virtualizer.getTotalSize()
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0
  const paddingBottom =
    virtualRows.length > 0
      ? totalHeight - (virtualRows[virtualRows.length - 1]?.end ?? 0)
      : 0

  useEffect(() => {
    virtualizer.measure()
  }, [rowHeight, rows.length, virtualizer])

  useEffect(() => {
    const id = 'klip-table-v2-styles'
    let style = document.getElementById(id) as HTMLStyleElement | null
    if (!style) {
      style = document.createElement('style')
      style.id = id
      document.head.appendChild(style)
    }
    style.textContent = `
      .klip-th-resizer {
        position: absolute; right: 0; top: 0;
        width: 4px; height: 100%;
        cursor: col-resize; user-select: none;
        background: transparent;
        transition: background var(--klip-motion-fast) var(--klip-motion-ease-out);
      }
      .klip-th-resizer:hover,
      .klip-th-resizer.isResizing { background: #6366f1; }
      .klip-table-shell {
        animation: klip-table-fade-in var(--klip-motion-mid) var(--klip-motion-ease-out) both;
      }
      .klip-table-toolbar {
        transition:
          border-color var(--klip-motion-mid) var(--klip-motion-ease-in-out),
          background var(--klip-motion-mid) var(--klip-motion-ease-in-out);
      }
      .klip-table-scroll {
        scroll-behavior: smooth;
      }
      .klip-tr {
        background: var(--klip-row-bg);
      }
      .klip-tr:hover > td {
        background: var(--klip-row-hover-bg) !important;
      }
      .klip-tr > td {
        transition: background var(--klip-motion-fast) var(--klip-motion-ease-out);
      }
      .klip-td-sticky {
        background: var(--klip-row-bg);
        background-clip: padding-box;
      }
      .klip-filter-trigger,
      .klip-done-button,
      .klip-task-title-button,
      .klip-collapse-button,
      .klip-row-action-button {
        transition:
          background var(--klip-motion-fast) var(--klip-motion-ease-out),
          color var(--klip-motion-fast) var(--klip-motion-ease-out),
          opacity var(--klip-motion-fast) var(--klip-motion-ease-out),
          transform var(--klip-motion-fast) var(--klip-motion-ease-out),
          box-shadow var(--klip-motion-fast) var(--klip-motion-ease-out);
      }
      .klip-filter-trigger:hover,
      .klip-done-button:hover,
      .klip-task-title-button:hover,
      .klip-collapse-button:hover,
      .klip-row-action-button:hover {
        transform: translateY(-1px);
      }
      .klip-task-title-button:hover {
        color: var(--klip-color-primary) !important;
      }
      @keyframes klip-table-fade-in {
        from { opacity: 0; transform: translateY(4px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .klip-sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      @media (prefers-reduced-motion: reduce) {
        .klip-table-shell,
        .klip-th-resizer,
        .klip-tr > td,
        .klip-filter-trigger,
        .klip-done-button,
        .klip-task-title-button,
        .klip-collapse-button,
        .klip-row-action-button {
          animation: none;
          transition: none;
        }
      }
    `
  }, [])

  const tableWidth = Math.max(table.getCenterTotalSize(), 780)
  const hasFilters = columnFilters.length > 0 || globalFilterInput.trim().length > 0 || statusFilter !== 'all'

  return (
    <div
      className="klip-table-shell"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden',
        ['--klip-motion-fast' as string]: token.motionDurationFast,
        ['--klip-motion-mid' as string]: token.motionDurationMid,
        ['--klip-motion-ease-out' as string]: token.motionEaseOut,
        ['--klip-motion-ease-in-out' as string]: token.motionEaseInOut,
        ['--klip-color-primary' as string]: token.colorPrimary,
      } as React.CSSProperties}
    >
      <div
        className="klip-table-toolbar"
        style={{
          height: 44,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 12px',
          borderBottom: `1px solid ${border}`,
          flexShrink: 0,
        }}
      >
        <Input
          id="table-search"
          name="table-search"
          size="small"
          placeholder="Buscar em tarefas e campos..."
          prefix={<SearchOutlined style={{ color: token.colorTextQuaternary }} />}
          value={globalFilterInput}
          onChange={event => setGlobalFilterInput(event.target.value)}
          onBlur={() => setGlobalFilterPreference(globalFilterInput)}
          allowClear
          style={{ width: 240 }}
        />
        <Select
          aria-label="Filtrar tarefas por status"
          size="small"
          value={statusFilter}
          onChange={(value: TaskStatusFilter) => setStatusFilter(value)}
          options={TASK_STATUS_FILTER_OPTIONS}
          style={{ width: 136 }}
        />
        <div style={{ flex: 1 }} />
        <Select
          aria-label="Densidade da tabela"
          size="small"
          value={tableSize}
          onChange={setTableSize}
          style={{ width: 120 }}
          options={TASK_TABLE_SIZE_OPTIONS}
        />
      </div>

      <div
        className="klip-table-scroll"
        ref={scrollAreaRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'auto',
          minHeight: 0,
        }}
      >
        <table
          aria-label="Tabela de tarefas"
          className="klip-task-table"
          style={{
            width: tableWidth,
            minWidth: '100%',
            borderCollapse: 'separate',
            borderSpacing: 0,
            tableLayout: 'fixed',
          }}
        >
          <colgroup>
            {table.getFlatHeaders().map(header => (
              <col key={header.id} style={{ width: header.getSize() }} />
            ))}
          </colgroup>
          <thead style={{ position: 'sticky', top: 0, zIndex: 8, background: headerBg, boxShadow: headerShadow }}>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  const columnId = header.column.id
                  const canSort = header.column.getCanSort()
                  const sortDirection = header.column.getIsSorted()
                  const isLeftSticky = columnId === 'done'
                  const isRightSticky = columnId === 'actions'
                  const stickyLeft = isLeftSticky ? 0 : undefined
                  const isFilterable =
                    columnId === 'title' ||
                    columnId === 'project' ||
                    columnId === 'dueDate' ||
                    columnId.startsWith('cf-')
                  const hasColumnFilter = Boolean(getColumnFilter(columnId))
                  const accessibleColumnLabel =
                    columnId === 'done'
                      ? 'Concluída'
                      : columnId === 'title'
                        ? 'Tarefa'
                        : columnId === 'project'
                          ? 'Projeto'
                          : columnId === 'dueDate'
                            ? 'Prazo'
                            : columnId === 'actions'
                              ? 'Ações'
                              : activeCustomFieldByColumnId.get(columnId)?.name ?? 'Campo personalizado'

                  const filterControl = columnId === 'project' ? (
                    <Select
                      aria-label={`Filtrar ${accessibleColumnLabel}`}
                      id={`filter-${columnId}`}
                      size="small"
                      placeholder="Todos"
                      allowClear
                      value={getColumnFilter(columnId)}
                      onChange={value => setColumnFilter(columnId, value)}
                      style={{ width: 170 }}
                      options={projectFilterOptions}
                    />
                  ) : (
                    <Input
                      aria-label={`Filtrar ${accessibleColumnLabel}`}
                      id={`filter-${columnId}`}
                      name={`filter-${columnId}`}
                      size="small"
                      placeholder="Filtrar..."
                      value={getColumnFilter(columnId) ?? ''}
                      onChange={event => setColumnFilter(columnId, event.target.value || undefined)}
                      allowClear
                      autoFocus
                      style={{ width: 170 }}
                    />
                  )

                  return (
                    <th
                      key={header.id}
                      scope="col"
                      aria-sort={sortDirection === 'asc' ? 'ascending' : sortDirection === 'desc' ? 'descending' : undefined}
                      style={{
                        position: 'sticky',
                        top: 0,
                        left: isLeftSticky ? stickyLeft : undefined,
                        right: isRightSticky ? 0 : undefined,
                        zIndex: isLeftSticky || isRightSticky ? 11 : 9,
                        height: 38,
                        padding: '0 10px',
                        background: headerBg,
                        backgroundClip: 'padding-box',
                        borderBottom: `2px solid ${border}`,
                        borderRight: `1px solid ${border}`,
                        boxShadow: isRightSticky
                            ? `-4px 0 12px -6px rgba(0,0,0,0.35), ${headerShadow}`
                            : isLeftSticky
                              ? `2px 0 8px -4px rgba(0,0,0,0.30), ${headerShadow}`
                              : undefined,
                        fontSize: 12,
                        fontWeight: 600,
                        color: token.colorTextSecondary,
                        textAlign: 'left',
                        userSelect: 'none',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                        {canSort ? (
                          <button
                            aria-label={`Ordenar por ${accessibleColumnLabel}`}
                            onClick={header.column.getToggleSortingHandler()}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              minHeight: 24,
                              padding: '2px 0',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 3,
                              color: 'inherit',
                              fontSize: 'inherit',
                              fontWeight: 'inherit',
                              minWidth: 0,
                            }}
                          >
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </span>
                            <span style={{ fontSize: 10, opacity: sortDirection ? 1 : 0.3 }}>
                              {sortDirection === 'asc' ? '^' : sortDirection === 'desc' ? 'v' : '^'}
                            </span>
                          </button>
                        ) : (
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                        )}

                        {isFilterable && (
                          <Popover
                            content={<div style={{ padding: 4 }} onClick={event => event.stopPropagation()}>{filterControl}</div>}
                            trigger="click"
                            open={activeFilterCol === columnId}
                            onOpenChange={open => setActiveFilterCol(open ? columnId : null)}
                          >
                            <button
                              className="klip-filter-trigger"
                              aria-label={`Filtrar ${accessibleColumnLabel}`}
                              onClick={event => {
                                event.stopPropagation()
                                setActiveFilterCol(activeFilterCol === columnId ? null : columnId)
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                width: 24,
                                height: 24,
                                minWidth: 24,
                                padding: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: hasColumnFilter ? token.colorPrimary : token.colorTextQuaternary,
                                fontSize: 11,
                              }}
                            >
                              <FilterOutlined style={{ fontSize: 10 }} />
                            </button>
                          </Popover>
                        )}
                      </div>

                      {header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className={`klip-th-resizer${header.column.getIsResizing() ? ' isResizing' : ''}`}
                        />
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {paddingTop > 0 && <tr><td style={{ height: paddingTop }} colSpan={columns.length} /></tr>}

            {virtualRows.map(virtualRow => {
              const row = rows[virtualRow.index]
              if (!row) return null
              const rowBg = row.original.status === 'done'
                ? doneBg
                : row.original.depth > 0 ? childBg : bodyBg
              const rowHoverBg = row.original.status === 'done'
                ? doneHoverBg
                : row.original.depth > 0 ? childHoverBg : bodyHoverBg

              return (
                <tr
                  key={row.id}
                  className="klip-tr"
                  style={{
                    ['--klip-row-bg' as string]: rowBg,
                    ['--klip-row-hover-bg' as string]: rowHoverBg,
                  } as React.CSSProperties}
                >
                  {row.getVisibleCells().map(cell => {
                    const columnId = cell.column.id
                    const isLeftSticky = columnId === 'done'
                    const isRightSticky = columnId === 'actions'
                    const stickyLeft = isLeftSticky ? 0 : undefined
                    const cellBg = rowBg

                    return (
                      <td
                        key={cell.id}
                        className={isLeftSticky || isRightSticky ? 'klip-td-sticky' : undefined}
                        style={{
                          position: isLeftSticky || isRightSticky ? 'sticky' : undefined,
                          left: isLeftSticky ? stickyLeft : undefined,
                          right: isRightSticky ? 0 : undefined,
                          zIndex: isLeftSticky || isRightSticky ? 3 : undefined,
                          height: rowHeight,
                          padding: '0 10px',
                          borderBottom: `1px solid ${border}`,
                          borderRight: `1px solid ${border}`,
                          boxShadow: isRightSticky
                              ? '-4px 0 12px -6px rgba(0,0,0,0.35)'
                              : isLeftSticky
                                ? '2px 0 8px -4px rgba(0,0,0,0.30)'
                                : undefined,
                          overflow: 'hidden',
                          background: cellBg,
                          backgroundClip: 'padding-box',
                          transition: 'background 0.1s',
                          verticalAlign: 'middle',
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    )
                  })}
                </tr>
              )
            })}

            {paddingBottom > 0 && <tr><td style={{ height: paddingBottom }} colSpan={columns.length} /></tr>}

            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    textAlign: 'center',
                    padding: '48px 0',
                    borderBottom: `1px solid ${border}`,
                  }}
                >
                  <Empty description="Nenhuma tarefa encontrada" />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div
        style={{
          height: 32,
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          borderTop: `1px solid ${border}`,
          flexShrink: 0,
          gap: 8,
        }}
      >
        <Text type="secondary" style={{ fontSize: 11 }}>
          {rows.length} de {scopedTasks.length} tarefa{scopedTasks.length !== 1 ? 's' : ''}
          {hasFilters ? ' (filtradas)' : ''}
        </Text>
        {hasFilters && (
          <Button
            size="small"
            type="link"
            style={{ fontSize: 11, padding: 0, height: 'auto' }}
            onClick={() => {
              setColumnFilters([])
              setGlobalFilterInput('')
              setGlobalFilterPreference('')
              setStatusFilter('all')
            }}
          >
            Limpar filtros
          </Button>
        )}
      </div>
    </div>
  )
}
