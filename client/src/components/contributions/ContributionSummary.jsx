import StatCard from '../StatCard'
import { formatRupees } from '../../utils/format'

// Five small stat boxes. All values come from the API's month summary.
export default function ContributionSummary({ summary }) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      <StatCard label="Expected" value={formatRupees(summary.expected)} />
      <StatCard label="Collected" value={formatRupees(summary.collected)} tone="text-success-700" />
      <StatCard label="Pending" value={formatRupees(summary.pending)} tone={summary.pending > 0 ? 'text-warning-700' : ''} />
      <StatCard label="Paid" value={summary.paidMembers} suffix={`/ ${summary.totalMembers}`} />
      <StatCard
        label="Unpaid"
        value={summary.unpaidMembers}
        suffix={`/ ${summary.totalMembers}`}
        className="col-span-2 sm:col-span-1"
      />
    </dl>
  )
}
