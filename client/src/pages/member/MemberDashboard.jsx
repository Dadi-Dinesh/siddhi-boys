import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useMemberDashboard } from '../../hooks/useMemberDashboard'
import { formatRupees } from '../../utils/format'
import { currentMonth, monthLabel } from '../../utils/months'
import LoadError from '../../components/LoadError'
import PageHeader from '../../components/PageHeader'
import RefreshButton from '../../components/RefreshButton'
import StatCard from '../../components/StatCard'
import CurrentMonthCard from '../../components/member/CurrentMonthCard'
import GroupFundSummary from '../../components/member/GroupFundSummary'
import MemberPaymentActionCard from '../../components/member/MemberPaymentActionCard'
import MyContributionHistory from '../../components/member/MyContributionHistory'

// Read-only overview for a MEMBER. When current month is unpaid, pending, or declined,
// the payment action card is prominently displayed.
export default function MemberDashboard() {
  const { user } = useAuth()
  const { mine, group } = useMemberDashboard()
  const [refreshing, setRefreshing] = useState(false)
  const [retryingGroup, setRetryingGroup] = useState(false)

  async function refreshAll() {
    setRefreshing(true)
    await Promise.all([mine.reload(), group.reload()])
    setRefreshing(false)
  }
  async function retryGroup() {
    setRetryingGroup(true)
    await group.reload()
    setRetryingGroup(false)
  }

  // The month name comes from the server (group summary); the browser date is only a fallback.
  const fallback = currentMonth()
  const thisMonthLabel =
    mine.data?.summary.currentMonth?.label ?? group.data?.currentMonth.label ?? monthLabel(fallback.year, fallback.month)

  return (
    <div className="space-y-6">
      <PageHeader
        documentTitle="My contributions"
        title={`Welcome, ${user.name} 👋`}
        subtitle="Your contribution overview"
        actions={<RefreshButton onClick={refreshAll} refreshing={refreshing} disabled={mine.status === 'loading'} />}
      />

      {/* self-start: each column is as tall as its own content (cards don't stretch) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 self-start xl:col-span-2">
          {mine.status === 'loading' && <PersonalSkeleton />}

          {mine.status === 'error' && (
            <LoadError title="Unable to load your contribution details." detail={mine.error} onRetry={refreshAll} retrying={refreshing} />
          )}

          {mine.status === 'ready' && (
            <>
              {mine.data.summary.currentMonth && mine.data.summary.currentMonth.status !== 'PAID' ? (
                <MemberPaymentActionCard
                  record={mine.data.summary.currentMonth}
                  onSubmitted={refreshAll}
                />
              ) : (
                <CurrentMonthCard
                  record={mine.data.summary.currentMonth}
                  monthLabel={thisMonthLabel}
                  currentAmount={group.data?.monthlyContribution}
                />
              )}

              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatCard label="Total contributed" value={formatRupees(mine.data.summary.totalContributed)} />
                <StatCard label="Months paid" value={mine.data.summary.monthsPaid} />
                <StatCard
                  label="Outstanding"
                  value={formatRupees(mine.data.summary.totalPending)}
                  hint={
                    mine.data.summary.monthsUnpaid > 0
                      ? `${mine.data.summary.monthsUnpaid} unpaid month${mine.data.summary.monthsUnpaid === 1 ? '' : 's'}`
                      : 'All paid up'
                  }
                  tone={mine.data.summary.totalPending > 0 ? 'text-warning-700' : 'text-success-700'}
                />
              </dl>

              <MyContributionHistory items={mine.data.history} />
            </>
          )}
        </div>

        <div className="self-start">
          <GroupFundSummary load={group} retrying={retryingGroup} onRetry={retryGroup} />
        </div>
      </div>
    </div>
  )
}

function PersonalSkeleton() {
  return (
    <div aria-busy="true" className="space-y-6">
      <span className="sr-only" role="status">
        Loading your contributions...
      </span>
      <div className="h-48 animate-pulse rounded-2xl bg-slate-200/70" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200/70" />
        ))}
      </div>
      <div className="h-56 animate-pulse rounded-2xl bg-slate-200/70" />
    </div>
  )
}
