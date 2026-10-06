import { formatDate } from '../../utils/format'
import { describeTransaction } from '../../utils/transactions'
import { SignedAmount, TypeBadge } from './TransactionParts'

// Desktop view of the ledger. Read-only: records are changed on the Contributions/Expenses pages.
export default function TransactionTable({ items }) {
  return (
    <table className="w-full table-fixed text-left text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
          <th scope="col" className="w-32 py-3 pr-4 font-medium">Date</th>
          <th scope="col" className="w-[28%] px-4 py-3 font-medium">Description</th>
          <th scope="col" className="w-24 px-4 py-3 font-medium">Type</th>
          <th scope="col" className="px-4 py-3 font-medium">Member / Details</th>
          <th scope="col" className="w-32 py-3 pl-4 text-right font-medium">Amount</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {items.map((t) => {
          const { heading, detail, note } = describeTransaction(t)
          return (
            <tr key={`${t.type}-${t.id}`}>
              <td className="py-3 pr-4 text-slate-600">{formatDate(t.date)}</td>
              <td className="truncate px-4 py-3 font-medium text-slate-900" title={heading}>
                {heading}
              </td>
              <td className="px-4 py-3">
                <TypeBadge direction={t.direction} />
              </td>
              <td className="px-4 py-3">
                <div className="truncate text-slate-800">{detail}</div>
                {note && (
                  <div className="truncate text-xs text-slate-500" title={note}>
                    {note}
                  </div>
                )}
              </td>
              <td className="py-3 pl-4 text-right">
                <SignedAmount amount={t.amount} direction={t.direction} />
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
