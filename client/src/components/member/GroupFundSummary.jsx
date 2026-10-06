import { AlertCircle } from 'lucide-react'
import Button from '../Button'
import Card from '../Card'
import ProgressBar from '../ProgressBar'
import { formatDate, formatRupees, percentOf } from '../../utils/format'

// Group-level information only: totals and recent spending, never other members' records.
//   load = { status, data, reload } from useLoad
export default function GroupFundSummary({ load, retrying, onRetry }) {
  if (load.status === 'loading') {
    return (
      <Card title="Group fund summary">
        <div className="space-y-3" aria-busy="true">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-5 animate-pulse rounded bg-slate-100" />
          ))}
        </div>
      </Card>
    )
  }

  if (load.status === 'error') {
    return (
      <Card title="Group fund summary">
        <p className="flex items-center gap-2 text-sm text-slate-600">
          <AlertCircle size={16} className="text-danger-600" aria-hidden="true" />
          The group summary is unavailable right now.
        </p>
        <Button variant="secondary" size="sm" onClick={onRetry} loading={retrying} loadingText="Retrying..." className="mt-3">
          Retry
        </Button>
      </Card>
    )
  }

  const g = load.data
  const month = g.currentMonth
  const percent = percentOf(month.collected, month.expected)

  return (
    <Card title="Group fund summary">
      <p className="text-lg font-semibold text-slate-900">{g.groupName}</p>

      <dl className="mt-3 space-y-2 text-sm">
        <Row label="Active members" value={g.activeMembers} />
        <Row label="Monthly contribution" value={formatRupees(g.monthlyContribution)} />
        <div className="my-3 border-t border-slate-100" />
        <Row label="Total collected" value={formatRupees(g.totalCollected)} />
        <Row label="Total expenses" value={formatRupees(g.totalExpenses)} />
        <Row label="Currently borrowed" value={formatRupees(g.currentlyBorrowed ?? 0)} />
        <Row
          label="Available balance"
          value={formatRupees(g.currentBalance)}
          strong
          tone={g.currentBalance < 0 ? 'text-danger-700' : 'text-success-700'}
        />
      </dl>

      {month.totalMembers > 0 && (
        <div className="mt-5">
          <div className="mb-1.5 flex items-baseline justify-between text-sm">
            <span className="font-medium text-slate-800">{month.label} collection</span>
            <span className="font-semibold text-slate-900">{percent}%</span>
          </div>
          <ProgressBar percent={percent} label={`${percent}% of ${month.label} collected`} />
          <p className="mt-1.5 text-xs text-slate-500">
            {formatRupees(month.collected)} collected / {formatRupees(month.expected)} expected
          </p>
        </div>
      )}

      {g.recentExpenses.length > 0 && (
        <div className="mt-5">
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Recent group expenses</h3>
          <ul className="divide-y divide-slate-100 text-sm">
            {g.recentExpenses.slice(0, 5).map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-slate-800">{e.title}</p>
                  <p className="text-xs text-slate-500">{formatDate(e.date)}</p>
                </div>
                <span className="shrink-0 tabular-nums text-slate-700">{formatRupees(e.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}

function Row({ label, value, strong = false, tone = '' }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`tabular-nums ${strong ? 'font-semibold' : 'font-medium'} text-slate-900 ${tone}`}>{value}</dd>
    </div>
  )
}
