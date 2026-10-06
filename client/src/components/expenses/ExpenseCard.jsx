import { Pencil, Trash2 } from 'lucide-react'
import Button from '../Button'
import { formatDate, formatRupees } from '../../utils/format'

// Phone view: one card per expense with easy-to-tap buttons.
export default function ExpenseCard({ expense: e, deleting, onEdit, onDelete }) {
  return (
    <li className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-slate-900">{e.title}</p>
          {e.description && <p className="mt-0.5 text-sm text-slate-600">{e.description}</p>}
          <p className="mt-1 text-xs text-slate-500">
            {formatDate(e.date)}
            {e.createdBy?.name && ` · Added by ${e.createdBy.name}`}
          </p>
        </div>
        <span className="shrink-0 font-semibold tabular-nums text-slate-900">{formatRupees(e.amount)}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={() => onEdit(e)} disabled={deleting}>
          <Pencil size={16} aria-hidden="true" />
          Edit<span className="sr-only"> {e.title}</span>
        </Button>
        <Button variant="danger-outline" onClick={() => onDelete(e)} loading={deleting} loadingText="Deleting...">
          <Trash2 size={16} aria-hidden="true" />
          Delete<span className="sr-only"> {e.title}</span>
        </Button>
      </div>
    </li>
  )
}
