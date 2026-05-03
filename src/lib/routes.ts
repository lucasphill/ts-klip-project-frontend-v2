export type AppRoute =
  | { view: 'tasks' }
  | { view: 'projects' }
  | { view: 'project'; projectId: string }
  | { view: 'calendar' }
  | { view: 'settings-user' }
  | { view: 'settings-fields' }

export const ROUTE_CHANGE_EVENT = 'klip:route-change'

const cleanSegments = (pathname: string) =>
  pathname
    .split('/')
    .map(segment => segment.trim())
    .filter(Boolean)
    .map(decodeURIComponent)

export const parseAppRoute = (pathname: string): AppRoute => {
  const segments = cleanSegments(pathname)
  const [first, second] = segments

  if (!first || first === 'tasks') return { view: 'tasks' }
  if (first === 'calendar') return { view: 'calendar' }
  if (first === 'fields') return { view: 'settings-fields' }
  if (first === 'user') return { view: 'settings-user' }

  if (first === 'projects') {
    return second ? { view: 'project', projectId: second } : { view: 'projects' }
  }

  if (first === 'settings') {
    if (second === 'fields' || second === 'custom-fields' || second === 'customfields') {
      return { view: 'settings-fields' }
    }
    return { view: 'settings-user' }
  }

  return { view: 'tasks' }
}

export const routeToPath = (route: AppRoute) => {
  switch (route.view) {
    case 'tasks':
      return '/tasks'
    case 'projects':
      return '/projects'
    case 'project':
      return `/projects/${encodeURIComponent(route.projectId)}`
    case 'calendar':
      return '/calendar'
    case 'settings-user':
      return '/settings/user'
    case 'settings-fields':
      return '/settings/fields'
  }
}

export const getRouteMenuKey = (route: AppRoute) => {
  if (route.view === 'project') return `pid-${route.projectId}`
  if (route.view === 'settings-fields') return 'settings-customfields'
  if (route.view === 'settings-user') return 'settings-user'
  return route.view
}
