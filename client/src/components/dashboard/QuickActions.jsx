import { Link } from 'react-router-dom'
import { ChevronRight, IndianRupee, Receipt, ShieldCheck, UserPlus } from 'lucide-react'
import Card from '../Card'

const ACTIONS = [
  { to: '/admin/contributions', label: 'Manage Contributions', icon: IndianRupee },
  { to: '/admin/payment-verifications', label: 'Payment Verifications', icon: ShieldCheck },
  { to: '/admin/expenses', label: 'Add Expense', icon: Receipt },
  { to: '/admin/members', label: 'Add Member', icon: UserPlus },
]

export default function QuickActions() {
  return (
    <Card title="Quick actions">
      <ul className="space-y-2">
        {ACTIONS.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <Link
              to={to}
              className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700
                transition-colors hover:border-primary-500/40 hover:bg-primary-50 hover:text-primary-700
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <Icon size={18} className="text-primary-600" aria-hidden="true" />
              <span className="flex-1">{label}</span>
              <ChevronRight size={16} className="text-slate-400" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}
