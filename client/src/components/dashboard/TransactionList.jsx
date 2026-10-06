import { Link } from 'react-router-dom'
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from 'lucide-react'
import Card from '../Card'
import EmptyState from '../EmptyState'
import { formatRelativeDate, formatSignedRupees } from '../../utils/format'
import { transactionTypeLabel } from '../../utils/transactions'

// Latest money movements. Green "+" = money received, red "−" = money spent.
// The sign and the arrow icon mean colour is never the only clue.
export default function TransactionList({ transactions }) {
  return (
    <Card
      title="Recent transactions"
      action={
        <Link to="/admin/transactions" className="text-sm font-medium text-primary-600 hover:text-primary-700">
          View all
        </Link>
      }
    >
      {transactions.length === 0 ? (
        <EmptyState icon={ArrowLeftRight} title="No transactions yet." />
      ) : (
        <ul className="divide-y divide-slate-100">
          {transactions.map((t) => {
            const isIn = t.direction === 'IN'
            const Icon = isIn ? ArrowDownLeft : ArrowUpRight
            return (
              <li key={`${t.type}-${t.id}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    isIn ? 'bg-success-50 text-success-600' : 'bg-danger-50 text-danger-600'
                  }`}
                >
                  <Icon size={18} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{t.title}</p>
                  <p className="text-xs text-slate-500">
                    {transactionTypeLabel(t)} · {formatRelativeDate(t.date)}
                  </p>
                </div>
                <span className={`shrink-0 text-sm font-semibold ${isIn ? 'text-success-700' : 'text-danger-700'}`}>
                  {formatSignedRupees(t.amount, t.direction)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
