import { useCallback, useEffect, useState } from 'react'
import { getMonthContributions } from '../services/contributionService'
import { getErrorMessage } from '../services/api'

// Never throws: returns { data } or { error } so the caller just stores it.
async function load(year, month, search) {
  try {
    return { data: await getMonthContributions(year, month, search) }
  } catch (error) {
    return { error: getErrorMessage(error) }
  }
}

// Loads one month of contributions and reloads whenever year, month or search change.
//
//   status     'loading' → first load of this month (show skeleton)
//              'error'   → couldn't load (show Retry)
//              'ready'   → data is available
//   searching  true while a new search is loading (old rows stay visible)
//   reload()   fetch again without the skeleton (after Mark Paid, Refresh, Create Month)
export function useContributionMonth(year, month, search) {
  // Each result remembers which month/search it belongs to, so a slow response
  // for a month the admin already left can never overwrite the current one.
  const [result, setResult] = useState(null)
  const monthKey = `${year}-${month}`

  useEffect(() => {
    let active = true
    load(year, month, search).then((r) => active && setResult({ monthKey: `${year}-${month}`, search, ...r }))
    return () => {
      active = false
    }
  }, [year, month, search])

  const reload = useCallback(async () => {
    const r = await load(year, month, search)
    setResult((current) =>
      // Ignore if the admin switched month/search while we were loading.
      current && current.monthKey === `${year}-${month}` && current.search === search
        ? { monthKey: `${year}-${month}`, search, ...r }
        : current,
    )
    return r
  }, [year, month, search])

  const isThisMonth = result?.monthKey === monthKey
  let status = 'loading'
  if (isThisMonth) status = result.error ? 'error' : 'ready'

  return {
    status,
    data: isThisMonth ? result.data : null,
    error: isThisMonth ? result.error : null,
    searching: isThisMonth && result.search !== search,
    reload,
  }
}
