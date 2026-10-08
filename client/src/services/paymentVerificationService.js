import api from './api'

// Member submits payment verification (Online screenshot or Cash)
export async function submitPaymentVerification({ contributionId, paymentMethod = 'ONLINE', file, paymentDate, note, includeFine }) {
  const formData = new FormData()
  formData.append('contributionId', contributionId)
  formData.append('paymentMethod', paymentMethod)
  if (file) formData.append('screenshot', file)
  if (paymentDate) formData.append('paymentDate', paymentDate)
  if (note) formData.append('note', note)
  if (includeFine !== undefined) formData.append('includeFine', String(includeFine))

  const { data } = await api.post('/payment-verifications', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}

// Admin marks contribution as paid (Online with screenshot or Cash directly)
export async function adminMarkPaidWithScreenshot({ contributionId, paymentMethod = 'ONLINE', file, paymentDate, note, includeFine }) {
  const formData = new FormData()
  formData.append('paymentMethod', paymentMethod)
  if (file) formData.append('screenshot', file)
  if (paymentDate) formData.append('paymentDate', paymentDate)
  if (note) formData.append('note', note)
  if (includeFine !== undefined) formData.append('includeFine', String(includeFine))

  const { data } = await api.patch(`/contributions/${contributionId}/pay`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}

// Admin: list all verifications (supports ?status=PENDING)
export async function listVerifications(params = {}) {
  const { data } = await api.get('/admin/payment-verifications', { params })
  return data.data
}

// Admin: accept verification (with optional fine override)
export async function acceptVerification(id, { includeFine } = {}) {
  const { data } = await api.patch(`/admin/payment-verifications/${id}/accept`, {
    ...(includeFine !== undefined ? { includeFine } : {}),
  })
  return data.data
}

// Admin: decline verification
export async function declineVerification(id, rejectionReason) {
  const { data } = await api.patch(`/admin/payment-verifications/${id}/decline`, {
    rejectionReason,
  })
  return data.data
}
