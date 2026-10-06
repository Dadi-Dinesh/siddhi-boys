import { TrendingDown, TrendingUp } from 'lucide-react'
import Card from '../Card'
import ProgressBar from '../ProgressBar'
import { formatDate, formatPercent, formatRupees } from '../../utils/format'

// Paid vs unpaid contribution records in the selected period.
export function ContributionPerformance({ contributions, totals }) {
  const { paidRecords, unpaidRecords, collectionPercent } = contributions
  const hasFines = totals && Number(totals.totalFinesCollected || 0) > 0

  return (
    <Card title="Contribution performance">
      <dl className="space-y-2 text-sm">
        <Row label="Paid contributions" value={paidRecords} />
        <Row label="Unpaid contributions" value={unpaidRecords} />
        {totals && (
          <>
            <Row label="Base contributions" value={formatRupees(totals.totalBaseCollected || totals.totalCollected)} />
            <Row
              label="Late fines collected"
              value={formatRupees(totals.totalFinesCollected || 0)}
              strong={hasFines}
            />
            <Row label="Total collected" value={formatRupees(totals.totalCollected)} strong />
          </>
        )}
        <Row label="Overall collection" value={formatPercent(collectionPercent)} strong />
      </dl>
      <ProgressBar percent={collectionPercent ?? 0} label={`Overall collection ${formatPercent(collectionPercent)}`} className="mt-4" />
    </Card>
  )
}

// Number of expenses, total, the biggest one and the most recent one.
export function ExpenseSummary({ expenses }) {
  return (
    <Card title="Expense summary">
      {expenses.count === 0 ? (
        <p className="text-sm text-slate-500">No expenses in this period.</p>
      ) : (
        <dl className="space-y-2 text-sm">
          <Row label="Expenses recorded" value={expenses.count} />
          <Row label="Total spent" value={formatRupees(expenses.total)} strong />
          <ExpenseRow label="Highest" expense={expenses.highest} />
          <ExpenseRow label="Latest" expense={expenses.latest} />
        </dl>
      )}
    </Card>
  )
}

// Best and lowest collection month (only shown when there are 2+ months to compare).
export function MonthInsights({ best, lowest }) {
  return (
    <Card title="Highlights">
      <dl className="space-y-4 text-sm">
        <Insight icon={TrendingUp} tone="text-success-600" label="Best collection month" month={best} />
        <Insight icon={TrendingDown} tone="text-warning-600" label="Lowest collection month" month={lowest} />
      </dl>
    </Card>
  )
}

function Row({ label, value, strong = false }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`tabular-nums text-slate-900 ${strong ? 'font-semibold' : 'font-medium'}`}>{value}</dd>
    </div>
  )
}

function ExpenseRow({ label, expense }) {
  return (
    <div className="flex items-start justify-between gap-3 border-t border-slate-100 pt-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="min-w-0 text-right">
        <span className="block truncate font-medium text-slate-900">
          {expense.title} — {formatRupees(expense.amount)}
        </span>
        <span className="text-xs text-slate-500">{formatDate(expense.date)}</span>
      </dd>
    </div>
  )
}

function Insight({ icon: Icon, tone, label, month }) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={18} className={`mt-0.5 shrink-0 ${tone}`} aria-hidden="true" />
      <div>
        <dt className="text-slate-500">{label}</dt>
        <dd className="font-medium text-slate-900">
          {month.label} — {formatPercent(month.collectionPercent)}
        </dd>
      </div>
    </div>
  )
}
