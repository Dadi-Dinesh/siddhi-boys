import api from './api'

// Member submits payment screenshot
export async function submitPaymentVerification({ contributionId, file, paymentDate, note }) {
  const formData = new FormData()
  formData.append('contributionId', contributionId)
  formData.append('screenshot', file)
  if (paymentDate) formData.append('paymentDate', paymentDate)
  if (note) formData.append('note', note)

  const { data } = await api.post('/payment-verifications', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}

// Admin marks contribution as paid with mandatory screenshot upload
export async function adminMarkPaidWithScreenshot({ contributionId, file, paymentDate, note }) {
  const formData = new FormData()
  formData.append('screenshot', file)
  if (paymentDate) formData.append('paymentDate', paymentDate)
  if (note) formData.append('note', note)

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

// Admin: accept verification
export async function acceptVerification(id) {
  const { data } = await api.patch(`/admin/payment-verifications/${id}/accept`)
  return data.data
}

// Admin: decline verification
export async function declineVerification(id, rejectionReason) {
  const { data } = await api.patch(`/admin/payment-verifications/${id}/decline`, {
    rejectionReason,
  })
  return data.data
}
