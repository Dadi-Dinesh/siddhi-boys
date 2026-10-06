import { Link } from 'react-router-dom'
import { CalendarPlus, CheckCircle2, Clock } from 'lucide-react'
import Card from '../Card'
import EmptyState from '../EmptyState'
import ProgressBar from '../ProgressBar'
import { formatRupees, percentOf } from '../../utils/format'

// "October 2026 collection": collected vs expected, plus paid/unpaid members.
// Every number comes straight from the API; only the % is worked out here for display.
export default function CollectionProgress({ month }) {
  if (!month || month.totalMembers === 0) {
    return (
      <Card title={`${month?.label ?? 'This month'} collection`}>
        <EmptyState icon={CalendarPlus} title="This month hasn't been created yet.">
          <Link to="/admin/contributions" className="font-medium text-primary-600 hover:text-primary-700">
            Go to Contributions
          </Link>{' '}
          to create it.
        </EmptyState>
      </Card>
    )
  }

  const percent = percentOf(month.collected, month.expected)
  const paidShare = percentOf(month.paidMembers, month.totalMembers)

  return (
    <Card title={`${month.label} collection`}>
      <dl className="grid grid-cols-3 gap-3">
        <Stat label="Collected" value={formatRupees(month.collected)} />
        <Stat label="Expected" value={formatRupees(month.expected)} />
        <Stat label="Pending" value={formatRupees(month.pending)} />
      </dl>

      <div className="mt-5">
        <div className="mb-2 flex items-baseline justify-between text-sm">
          <span className="text-slate-600">
            {formatRupees(month.collected)} / {formatRupees(month.expected)}
          </span>
          <span className="font-semibold text-slate-900">{percent}%</span>
        </div>
        <ProgressBar percent={percent} label={`${percent}% of this month's contributions collected`} />
      </div>

      {/* Paid vs unpaid: one bar split in two, with a 2px gap between the parts */}
      <div className="mt-6">
        <div className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
          {month.paidMembers > 0 && <div className="bg-success-600" style={{ width: `${paidShare}%` }} />}
          {month.unpaidMembers > 0 && <div className="flex-1 bg-warning-600/70" />}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <span className="flex items-center gap-1.5 text-slate-700">
            <CheckCircle2 size={16} className="text-success-600" aria-hidden="true" />
            <span>
              Paid: <strong className="font-semibold">{month.paidMembers}</strong> / {month.totalMembers} members
            </span>
          </span>
          <span className="flex items-center gap-1.5 text-slate-700">
            <Clock size={16} className="text-warning-600" aria-hidden="true" />
            <span>
              Unpaid: <strong className="font-semibold">{month.unpaidMembers}</strong> / {month.totalMembers} members
            </span>
          </span>
        </div>
      </div>
    </Card>
  )
}

function Stat({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 truncate text-base font-semibold text-slate-900 sm:text-lg">{value}</dd>
    </div>
  )
}
