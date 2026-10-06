import { ArrowLeftRight, LayoutDashboard } from 'lucide-react'
import AppLayout from './AppLayout'

const MEMBER_NAV = [
  { to: '/member', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/member/group-activity', label: 'Group Activity', icon: ArrowLeftRight },
]

export default function MemberLayout() {
  return <AppLayout navItems={MEMBER_NAV} />
}
