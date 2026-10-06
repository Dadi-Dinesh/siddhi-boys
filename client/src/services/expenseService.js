import api from './api'

// API calls for the admin Expenses page.
// The API sends amount as a number (e.g. 650.5) and date as "YYYY-MM-DD".

// { items, total } — newest date first (sorted by the backend)
export async function getExpenses() {
  const { data } = await api.get('/expenses')
  return data.data
}

// `expense` = { title, description, amount, date }. createdBy is set by the server.
export async function createExpense(expense) {
  const { data } = await api.post('/expenses', expense)
  return data.data
}

export async function updateExpense(id, expense) {
  const { data } = await api.put(`/expenses/${id}`, expense)
  return data.data
}

export async function deleteExpense(id) {
  await api.delete(`/expenses/${id}`)
}
