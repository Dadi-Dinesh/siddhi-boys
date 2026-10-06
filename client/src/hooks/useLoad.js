import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage } from '../services/api'

// Loads data for a page once, with reload() for Refresh/Retry or after saving.
//   loader: an async function that returns the data (define it outside the component)
//   status: 'loading' (first load) | 'error' (first load failed) | 'ready'
//   reload(): fetch again, keeping the current data on screen. Resolves to { data } or { error }.
export function useLoad(loader) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)

  const run = useCallback(async () => {
    try {
      const result = { data: await loader() }
      setData(result.data)
      setError('')
      return result
    } catch (err) {
      const result = { error: getErrorMessage(err) }
      setError(result.error)
      return result
    } finally {
      setLoaded(true)
    }
  }, [loader])

  useEffect(() => {
    let active = true // ignore the result if the page was closed before it arrived
    loader()
      .then((result) => {
        if (!active) return
        setData(result)
        setError('')
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err))
      })
      .finally(() => {
        if (active) setLoaded(true)
      })
    return () => {
      active = false
    }
  }, [loader])

  let status = 'ready'
  if (!data) status = loaded && error ? 'error' : 'loading'

  return { status, data, error, reload: run }
}
