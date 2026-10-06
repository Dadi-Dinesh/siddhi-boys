import { GroupContext } from '../hooks/useGroup'
import { useLoad } from '../hooks/useLoad'
import { getGroupSummary } from '../services/groupService'

// Loads the group summary once for the whole logged-in area (admin and member),
// so the group name can be shown in the layout and pages without fetching it again.
// Call group.reload() after something changes it (e.g. saving Settings).
export function GroupProvider({ children }) {
  const group = useLoad(getGroupSummary)
  return <GroupContext.Provider value={group}>{children}</GroupContext.Provider>
}
