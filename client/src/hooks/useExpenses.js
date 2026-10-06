import { getExpenses } from '../services/expenseService'
import { getDashboardSummary } from '../services/dashboardService'
import { useLoad } from './useLoad'

// Loads the expense list and the fund totals together (2 requests in parallel).
// Totals come from the dashboard summary API, so the frontend never adds money up itself.
async function loadExpenses() {
  const [list, summary] = await Promise.all([getExpenses(), getDashboardSummary()])
  return {
    items: list.items,
    count: list.total,
    totalExpenses: summary.totalExpenses,
    currentBalance: summary.currentBalance,
  }
}

export function useExpenses() {
  return useLoad(loadExpenses)
}
