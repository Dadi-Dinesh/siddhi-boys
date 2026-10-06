import { createContext, useContext } from 'react'

export const GroupContext = createContext(null)

// The group summary loaded once by the layout: { status, data, error, reload }.
//   const group = useGroup(); group.data?.groupName
export function useGroup() {
  const context = useContext(GroupContext)
  if (!context) throw new Error('useGroup must be used inside <GroupProvider>')
  return context
}
