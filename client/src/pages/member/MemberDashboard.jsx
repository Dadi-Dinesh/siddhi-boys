import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useMemberDashboard } from '../../hooks/useMemberDashboard'
import { formatRupees } from '../../utils/format'
import { currentMonth, monthLabel } from '../../utils/months'
import LoadError from '../../components/LoadError'
import RefreshButton from '../../components/RefreshButton'
import StatCard from '../../components/StatCard'
import CurrentMonthCard from '../../components/member/CurrentMonthCard'
import GroupFundSummary from '../../components/member/GroupFundSummary'
import MemberPaymentActionCard from '../../components/member/MemberPaymentActionCard'
import MyContributionHistory from '../../components/member/MyContributionHistory'

import Avatar from '../../components/Avatar'

// Read-only overview for a MEMBER. When current month is unpaid, pending, or declined,
// the payment action card is prominently displayed.
export default function MemberDashboard() {
  const { user } = useAuth()
  const { mine, group } = useMemberDashboard()
  const [refreshing, setRefreshing] = useState(false)
  const [retryingGroup, setRetryingGroup] = useState(false)

  useEffect(() => {
    document.title = 'Dashboard · SiddhiBoys'
  }, [])

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

  const phoneDisplay = user?.phoneNumber

  return (
    <div className="space-y-6">
      {/* Member Profile Header Card */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <Avatar src={user?.profileImageUrl} name={user?.name} size="xl" className="ring-4 ring-primary-50" />
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Welcome, {user?.name} 👋</h1>
            <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 border border-primary-200">
              Member
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-sm text-slate-600">
            <span className="tabular-nums font-medium text-slate-800">
              {phoneDisplay ? phoneDisplay : <span className="text-slate-400 italic font-normal">Phone not added</span>}
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-500">{user?.email}</span>
          </div>
        </div>
        <div className="self-center sm:self-start">
          <RefreshButton onClick={refreshAll} refreshing={refreshing} disabled={mine.status === 'loading'} />
        </div>
      </div>

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
