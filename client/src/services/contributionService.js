import api from './api'

// API calls for the admin Contributions page.
// Each returns the `data` part of the { success, message, data } response.

// One month: { label, isCreated, summary, items, total }. `search` filters by name/email on the server.
export async function getMonthContributions(year, month, search = '') {
  const { data } = await api.get(`/contributions/month/${year}/${month}`, {
    params: search ? { search } : undefined,
  })
  return data.data
}

// Creates UNPAID records for all active members. Returns the server's message too.
export async function createMonth(year, month) {
  const { data } = await api.post('/contributions/create-month', { year, month })
  return { result: data.data, message: data.message }
}

export async function markPaid(id) {
  const { data } = await api.patch(`/contributions/${id}/pay`)
  return data.data
}

export async function markUnpaid(id) {
  const { data } = await api.patch(`/contributions/${id}/unpay`)
  return data.data
}
