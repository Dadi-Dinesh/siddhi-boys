import { formatDate } from '../../utils/format'
import { describeTransaction } from '../../utils/transactions'
import { SignedAmount, TypeBadge } from './TransactionParts'

// Phone/tablet view of one ledger row.
export default function TransactionCard({ transaction: t }) {
  const { heading, detail, note } = describeTransaction(t)
  return (
    <li className="rounded-xl border border-slate-200 p-4">
      <p className="text-xs text-slate-500">{formatDate(t.date)}</p>
      <p className="mt-1 font-medium text-slate-900">{heading}</p>
      <p className="text-sm text-slate-600">{detail}</p>
      {note && <p className="text-sm text-slate-500">{note}</p>}
      <div className="mt-3 flex items-center justify-between">
        <TypeBadge direction={t.direction} />
        <SignedAmount amount={t.amount} direction={t.direction} />
      </div>
    </li>
  )
}
