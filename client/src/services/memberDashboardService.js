import api from './api'

// Read-only API calls for the member dashboard. The backend works out who
// "my" is from the login token, so a member can only ever get their own records.

// { totalContributed, totalPending, monthsPaid, monthsUnpaid, currentMonth (record or null) }
export async function getMySummary() {
  const { data } = await api.get('/contributions/my-summary')
  return data.data
}

// The member's own contribution records, newest month first.
export async function getMyHistory() {
  const { data } = await api.get('/contributions/my-history')
  return data.data.items
}
