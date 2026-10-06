import api from './api'

// API calls for the admin Members page. Passwords are only ever sent, never received.

// All MEMBER accounts, including deactivated ones (admins are never listed).
export async function getMembers() {
  const { data } = await api.get('/members', { params: { includeInactive: true } })
  return data.data.items
}

// { member, summary: { totalContributed, monthsPaid, monthsUnpaid }, paymentHistory }
export async function getMember(id) {
  const { data } = await api.get(`/members/${id}`)
  return data.data
}

// With a photo the fields are sent as a multipart form; otherwise as plain JSON.
function toPayload(fields) {
  if (!(fields.photo instanceof File)) return fields
  const form = new FormData()
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) form.append(key, value)
  })
  return form
}

// { name, email, phoneNumber, photo? } — the server gives new accounts the MEMBER role and default password.
export async function createMember(member) {
  const { data } = await api.post('/members', toPayload(member))
  return data.data
}

// Any of { name, email, phoneNumber, photo?, removePhoto, isActive, password }. Leave password out to keep it.
export async function updateMember(id, changes) {
  const { data } = await api.put(`/members/${id}`, toPayload(changes))
  return data.data
}

// Soft delete: sets isActive = false. History is kept.
export async function deactivateMember(id) {
  const { data } = await api.delete(`/members/${id}`)
  return data.data
}

export async function activateMember(id) {
  const { data } = await api.patch(`/members/${id}/activate`)
  return data.data
}
