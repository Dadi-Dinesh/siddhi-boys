import api from './api'

// All API calls used by the admin dashboard live here, not inside components.
// Each returns just the `data` part of the { success, message, data } response.

export async function getDashboardSummary() {
  const { data } = await api.get('/dashboard/summary')
  return data.data
}

export async function getMonthlySummary() {
  const { data } = await api.get('/dashboard/monthly-summary')
  return data.data.items // newest month first
}

export async function getRecentTransactions(limit = 5) {
  const { data } = await api.get('/transactions')
  return data.data.items.slice(0, limit) // already sorted newest first by the API
}

export async function getRecentExpenses(limit = 3) {
  const { data } = await api.get('/expenses')
  return data.data.items.slice(0, limit) // already sorted newest first by the API
}

// Loads everything the dashboard needs in parallel (4 requests at once, not one after another).
export async function getDashboardData() {
  const [summary, monthly, transactions, expenses] = await Promise.all([
    getDashboardSummary(),
    getMonthlySummary(),
    getRecentTransactions(5),
    getRecentExpenses(3),
  ])
  return { summary, monthly, transactions, expenses }
}
