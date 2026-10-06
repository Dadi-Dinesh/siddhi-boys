import { useCallback, useEffect, useState } from 'react'
import { getDashboardData } from '../services/dashboardService'
import { getErrorMessage } from '../services/api'

// Never throws: returns { data } or { error } so the caller just puts it in state.
async function loadDashboard() {
  try {
    return { data: await getDashboardData() }
  } catch (error) {
    return { error: getErrorMessage(error) }
  }
}

// Loads the admin dashboard data once, with manual refresh/retry. No polling.
//   status: 'loading' (first load) | 'ready' | 'error' (first load failed)
//   refreshing: true while the Refresh button is reloading (old data stays visible)
//   refreshError: message if a refresh failed (old data stays visible)
export function useDashboard() {
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading')
  const [refreshing, setRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState('')

  const apply = useCallback((result) => {
    if (result.data) {
      setData(result.data)
      setStatus('ready')
      setRefreshError('')
    } else {
      // Keep showing old data if we have it; otherwise show the error screen.
      setStatus((current) => (current === 'ready' ? 'ready' : 'error'))
      setRefreshError(result.error)
    }
    setRefreshing(false)
  }, [])

  useEffect(() => {
    let active = true // ignore the result if the page was left before it arrived
    loadDashboard().then((result) => active && apply(result))
    return () => {
      active = false
    }
  }, [apply])

  const refresh = useCallback(() => {
    setRefreshing(true)
    loadDashboard().then(apply)
  }, [apply])

  const retry = useCallback(() => {
    setStatus('loading')
    loadDashboard().then(apply)
  }, [apply])

  return { data, status, refreshing, refreshError, refresh, retry }
}
