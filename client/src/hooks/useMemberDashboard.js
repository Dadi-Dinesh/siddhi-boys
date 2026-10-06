import { getMyHistory, getMySummary } from '../services/memberDashboardService'
import { useGroup } from './useGroup'
import { useLoad } from './useLoad'

async function loadMyContributions() {
  const [summary, history] = await Promise.all([getMySummary(), getMyHistory()])
  return { summary, history }
}

// Two independent pieces: the member's own records, and the group summary (already
// loaded by the layout). If one fails, the other still shows.
export function useMemberDashboard() {
  const mine = useLoad(loadMyContributions)
  const group = useGroup()
  return { mine, group }
}
