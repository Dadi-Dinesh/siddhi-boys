import api from './api'

// { groupName, monthlyContribution, updatedAt }
export async function getSettings() {
  const { data } = await api.get('/settings')
  return data.data
}

// Send only the fields that changed: { groupName?, monthlyContribution? }
export async function updateSettings(changes) {
  const { data } = await api.patch('/settings', changes)
  return data.data
}
