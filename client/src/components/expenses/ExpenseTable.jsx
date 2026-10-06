import { Pencil, Trash2 } from 'lucide-react'
import ActionLabel from '../ActionLabel'
import Button from '../Button'
import { formatDate, formatRupees } from '../../utils/format'

// Desktop/tablet view of the expenses. (Phones use ExpenseCard instead.)
export default function ExpenseTable({ items, deletingId, onEdit, onDelete }) {
  return (
    <table className="w-full table-fixed text-left text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
          <th scope="col" className="w-[22%] py-3 pr-4 font-medium">Expense</th>
          <th scope="col" className="px-4 py-3 font-medium">Description</th>
          <th scope="col" className="w-28 px-4 py-3 text-right font-medium">Amount</th>
          <th scope="col" className="w-32 px-4 py-3 font-medium">Date</th>
          <th scope="col" className="hidden w-32 px-4 py-3 font-medium xl:table-cell">Added by</th>
          <th scope="col" className="w-28 py-3 pl-4 text-right font-medium xl:w-48">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {items.map((e) => (
          <tr key={e.id}>
            <td className="truncate py-3 pr-4 font-medium text-slate-900" title={e.title}>
              {e.title}
            </td>
            <td className="truncate px-4 py-3 text-slate-600" title={e.description || undefined}>
              {e.description || <span className="text-slate-400">—</span>}
            </td>
            <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-900">{formatRupees(e.amount)}</td>
            <td className="px-4 py-3 text-slate-600">{formatDate(e.date)}</td>
            <td className="hidden truncate px-4 py-3 text-slate-600 xl:table-cell">{e.createdBy?.name ?? '—'}</td>
            <td className="py-3 pl-4">
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="secondary" onClick={() => onEdit(e)} disabled={deletingId === e.id} title={`Edit ${e.title}`}>
                  <Pencil size={14} aria-hidden="true" />
                  <ActionLabel text="Edit" title={e.title} />
                </Button>
                <Button
                  size="sm"
                  variant="danger-outline"
                  onClick={() => onDelete(e)}
                  loading={deletingId === e.id}
                  loadingText="Deleting..."
                  title={`Delete ${e.title}`}
                >
                  <Trash2 size={14} aria-hidden="true" />
                  <ActionLabel text="Delete" title={e.title} />
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

