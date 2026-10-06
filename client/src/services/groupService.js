import api from './api'

// Group-level information any logged-in user may see (no other member's details):
// { groupName, monthlyContribution, activeMembers, totalCollected, totalExpenses,
//   currentlyBorrowed, currentBalance (available), currentMonth: { label, expected, collected, ... }, recentExpenses }
export async function getGroupSummary() {
  const { data } = await api.get('/group/summary')
  return data.data
}
