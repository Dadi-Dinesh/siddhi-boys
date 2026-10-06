import { getMembers } from '../services/memberService'
import { useLoad } from './useLoad'

export function useMembers() {
  return useLoad(getMembers)
}
