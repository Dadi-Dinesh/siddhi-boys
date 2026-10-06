import { Link } from 'react-router-dom'
import { CalendarDays, IndianRupee, Users, Wallet, Receipt, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useDashboard } from '../../hooks/useDashboard'
import { useGroup } from '../../hooks/useGroup'
import { formatRupees, greeting, percentOf } from '../../utils/format'
import Alert from '../../components/Alert'
import LoadError from '../../components/LoadError'
import PageHeader from '../../components/PageHeader'
import RefreshButton from '../../components/RefreshButton'
import ProgressBar from '../../components/ProgressBar'
import SummaryCard from '../../components/dashboard/SummaryCard'
import CollectionProgress from '../../components/dashboard/CollectionProgress'
import MonthlyCollectionChart from '../../components/dashboard/MonthlyCollectionChart'
import CollectionHistory from '../../components/dashboard/CollectionHistory'
import TransactionList from '../../components/dashboard/TransactionList'
import RecentExpenses from '../../components/dashboard/RecentExpenses'
import QuickActions from '../../components/dashboard/QuickActions'
import DashboardSkeleton from '../../components/dashboard/DashboardSkeleton'

export default function AdminDashboard() {
  const { user } = useAuth()
  const group = useGroup()
  const { data, status, refreshing, refreshError, refresh, retry } = useDashboard()
  const summary = data?.summary
  const month = summary?.currentMonth

  // Refresh also reloads the group name (it may have been changed in Settings).
  function refreshAll() {
    refresh()
    group.reload()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        documentTitle="Dashboard"
        title={`${greeting()}, ${user.name} 👋`}
        subtitle={
          <>
            Here&apos;s the current overview of{' '}
            {group.data ? <span className="font-medium text-slate-700">{group.data.groupName}</span> : 'SiddhiBoys'}.
          </>
        }
        actions={status === 'ready' && <RefreshButton onClick={refreshAll} refreshing={refreshing} />}
      />
      {month && (
        <p className="-mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700 ring-1 ring-slate-200">
          <CalendarDays size={15} className="text-primary-600" aria-hidden="true" />
          {month.label}
        </p>
      )}

      <div>
        {status === 'loading' && <DashboardSkeleton />}

        {status === 'error' && <LoadError title="Unable to load dashboard data." detail={refreshError} onRetry={retry} />}

        {status === 'ready' && (
          <div className="space-y-6">
            {refreshError && <Alert>Couldn&apos;t refresh: {refreshError} Showing the last loaded data.</Alert>}

            {/* Summary cards: 1 column on phones, 2 on tablets, 4 on wide screens */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard icon={Users} label="Total members" value={summary.totalMembers} hint="Active members" />
              <ThisMonthCard month={month} />
              <SummaryCard
                icon={Receipt}
                label="Total expenses"
                value={formatRupees(summary.totalExpenses)}
                hint="Total spent"
                tone="danger"
              />
              <SummaryCard
                icon={Wallet}
                label="Current balance"
                value={formatRupees(summary.currentBalance)}
                hint={summary.currentBalance < 0 ? 'Expenses are more than collections' : 'Available balance'}
                tone={summary.currentBalance < 0 ? 'danger' : 'success'}
              />
            </div>

            {/* Payment Verification section */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  (summary.pendingVerifications ?? 0) > 0
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  <ShieldCheck size={22} />
                </span>
                <div>
                  <h3 className="text-sm font-medium text-slate-500">Payment Verification</h3>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <p className="text-2xl font-bold tracking-tight text-slate-900">
                      {summary.pendingVerifications ?? 0}
                    </p>
                    <span className="text-xs text-slate-500">
                      pending verification{(summary.pendingVerifications ?? 0) === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
              </div>
              <Link
                to="/admin/payment-verifications"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-primary-700 transition-colors"
              >
                Review
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <div className="xl:col-span-2">
                <CollectionProgress month={month} />
              </div>
              <QuickActions />

              <div className="xl:col-span-2">
                <MonthlyCollectionChart months={data.monthly} />
              </div>
              <CollectionHistory months={data.monthly} />

              <div className="xl:col-span-2">
                <TransactionList transactions={data.transactions} />
              </div>
              <RecentExpenses expenses={data.expenses} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Card 2: "₹2,100 / ₹2,500 · 84% collected" with a small progress bar.
function ThisMonthCard({ month }) {
  if (!month || month.totalMembers === 0) {
    return <SummaryCard icon={IndianRupee} label="This month" value={formatRupees(0)} hint="Month not created yet" />
  }
  const percent = percentOf(month.collected, month.expected)
  return (
    <SummaryCard
      icon={IndianRupee}
      label="This month"
      value={
        <>
          {formatRupees(month.collected)}
          <span className="text-base font-medium text-slate-400"> / {formatRupees(month.expected)}</span>
        </>
      }
      hint={`${percent}% collected`}
    >
      <ProgressBar percent={percent} label={`${percent}% collected this month`} className="mt-3" />
    </SummaryCard>
  )
}
