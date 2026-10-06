import { CheckCircle2, Eye, Trash2 } from 'lucide-react'
import Button from '../Button'
import BorrowedStatus from './BorrowedStatus'
import { formatDate, formatRupees } from '../../utils/format'

// Borrowed records: a table on wide screens, cards on phones.
// Action handlers are optional: without them (member view) the list is read-only.
export default function BorrowedList({ items, onView, onReturn, onDelete, busyId }) {
  const hasActions = Boolean(onView || onReturn || onDelete)

  function actions(b, size) {
    return (
      <>
        {onReturn && b.status === 'BORROWED' && (
          <Button size={size} onClick={() => onReturn(b)} disabled={busyId === b.id}>
            <CheckCircle2 size={14} aria-hidden="true" />
            Mark Returned<span className="sr-only"> for {b.member.name}</span>
          </Button>
        )}
        {onView && (
          <Button size={size} variant="secondary" onClick={() => onView(b)}>
            <Eye size={14} aria-hidden="true" />
            View<span className="sr-only"> record for {b.member.name}</span>
          </Button>
        )}
        {onDelete && (
          <Button
            size={size}
            variant="danger-outline"
            onClick={() => onDelete(b)}
            loading={busyId === b.id}
            loadingText="Deleting..."
            title={`Delete record for ${b.member.name}`}
          >
            <Trash2 size={14} aria-hidden="true" />
            <span className="sr-only">Delete record for {b.member.name}</span>
          </Button>
        )}
      </>
    )
  }

  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <th scope="col" className="py-3 pr-4 font-medium">Member</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Amount</th>
              <th scope="col" className="px-4 py-3 font-medium">Date</th>
              <th scope="col" className="px-4 py-3 font-medium">Purpose</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 font-medium">Returned Date</th>
              {hasActions && <th scope="col" className="py-3 pl-4 text-right font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((b) => (
              <tr key={b.id}>
                <td className="py-3 pr-4 font-medium text-slate-900">{b.member.name}</td>
                <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-900">{formatRupees(b.amount)}</td>
                <td className="px-4 py-3 text-slate-600">{formatDate(b.borrowedAt)}</td>
                <td className="max-w-xs truncate px-4 py-3 text-slate-600" title={b.purpose || undefined}>
                  {b.purpose || <span className="text-slate-400">—</span>}
                </td>
                <td className="px-4 py-3">
                  <BorrowedStatus status={b.status} />
                </td>
                <td className="px-4 py-3 text-slate-600">{b.returnedAt ? formatDate(b.returnedAt) : '—'}</td>
                {hasActions && (
                  <td className="py-3 pl-4">
                    <div className="flex justify-end gap-2">{actions(b, 'sm')}</div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 lg:hidden">
        {items.map((b) => (
          <li key={b.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-slate-900">{b.member.name}</p>
                {b.purpose && <p className="mt-0.5 text-sm text-slate-600">{b.purpose}</p>}
                <p className="mt-1 text-xs text-slate-500">
                  Borrowed {formatDate(b.borrowedAt)}
                  {b.returnedAt && ` · Returned ${formatDate(b.returnedAt)}`}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <span className="font-semibold tabular-nums text-slate-900">{formatRupees(b.amount)}</span>
                <BorrowedStatus status={b.status} />
              </div>
            </div>
            {hasActions && <div className="mt-3 flex flex-wrap gap-2">{actions(b, 'md')}</div>}
          </li>
        ))}
      </ul>
    </>
  )
}
