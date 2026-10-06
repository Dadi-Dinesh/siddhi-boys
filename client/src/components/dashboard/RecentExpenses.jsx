import { Link } from 'react-router-dom'
import { Receipt } from 'lucide-react'
import Card from '../Card'
import EmptyState from '../EmptyState'
import { formatDate, formatRupees } from '../../utils/format'

export default function RecentExpenses({ expenses }) {
  return (
    <Card
      title="Recent expenses"
      action={
        <Link to="/admin/expenses" className="text-sm font-medium text-primary-600 hover:text-primary-700">
          View all expenses
        </Link>
      }
    >
      {expenses.length === 0 ? (
        <EmptyState icon={Receipt} title="No expenses recorded yet." />
      ) : (
        <ul className="divide-y divide-slate-100">
          {expenses.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">{e.title}</p>
                <p className="text-xs text-slate-500">{formatDate(e.date)}</p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-slate-900">{formatRupees(e.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
