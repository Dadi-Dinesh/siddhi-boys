import api from './api'

// The ledger, built by the backend from the real records:
// PAID contributions (money IN) + expenses (money OUT), newest first.
// Each item: { id, type, direction, title, description, amount, date, member, period }
export async function getTransactions() {
  const { data } = await api.get('/transactions')
  return data.data.items
}
