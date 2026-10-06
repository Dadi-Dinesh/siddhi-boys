import api from './api'

// One request returns the whole report (totals, every month, expenses, insights),
// worked out by the backend from the existing contribution and expense records.
//   period: 'all' | '3' | '6' | '12'  (last N months, ending this month)
export async function getReport(period = 'all') {
  const { data } = await api.get('/reports/summary', {
    params: period === 'all' ? undefined : { months: period },
  })
  return data.data
}
