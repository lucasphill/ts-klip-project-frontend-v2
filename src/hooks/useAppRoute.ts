import { useCallback, useEffect, useState } from 'react'
import { parseAppRoute, ROUTE_CHANGE_EVENT, routeToPath, type AppRoute } from '../lib/routes'

export const useAppRoute = () => {
  const [route, setRoute] = useState<AppRoute>(() => parseAppRoute(window.location.pathname))

  useEffect(() => {
    const syncRoute = () => setRoute(parseAppRoute(window.location.pathname))
    window.addEventListener('popstate', syncRoute)
    window.addEventListener(ROUTE_CHANGE_EVENT, syncRoute)
    return () => {
      window.removeEventListener('popstate', syncRoute)
      window.removeEventListener(ROUTE_CHANGE_EVENT, syncRoute)
    }
  }, [])

  const navigate = useCallback((nextRoute: AppRoute, options?: { replace?: boolean }) => {
    const nextPath = routeToPath(nextRoute)
    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`

    if (currentPath !== nextPath) {
      if (options?.replace) {
        window.history.replaceState(null, '', nextPath)
      } else {
        window.history.pushState(null, '', nextPath)
      }
    }

    setRoute(parseAppRoute(window.location.pathname))
    window.dispatchEvent(new Event(ROUTE_CHANGE_EVENT))
  }, [])

  return { route, navigate }
}
