import { ArrowLeftRight, BarChart3, HandCoins, IndianRupee, LayoutDashboard, Receipt, Settings, ShieldCheck, Users } from 'lucide-react'
import AppLayout from './AppLayout'

const ADMIN_NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/contributions', label: 'Contributions', icon: IndianRupee },
  { to: '/admin/payment-verifications', label: 'Payment Verification', icon: ShieldCheck },
  { to: '/admin/expenses', label: 'Expenses', icon: Receipt },
  { to: '/admin/borrowed', label: 'Borrowed', icon: HandCoins },
  { to: '/admin/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { to: '/admin/members', label: 'Members', icon: Users },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout() {
  return <AppLayout navItems={ADMIN_NAV} />
}
