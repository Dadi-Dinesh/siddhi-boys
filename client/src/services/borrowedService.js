import api from './api'

// Money borrowed from the group by members. Everyone can view; only the admin can change.
// The API sends amount as a number and dates as "YYYY-MM-DD".

// { items, total, summary: { totalBorrowed, totalReturned, currentlyBorrowed, availableBalance } }
export async function getBorrowed() {
  const { data } = await api.get('/borrowed')
  return data.data
}

// `record` = { memberId, amount, borrowedAt, purpose }
export async function createBorrowed(record) {
  const { data } = await api.post('/borrowed', record)
  return data.data
}

export async function markBorrowedReturned(id, returnedAt) {
  const { data } = await api.patch(`/borrowed/${id}/return`, { returnedAt })
  return data.data
}

export async function deleteBorrowed(id) {
  await api.delete(`/borrowed/${id}`)
}
