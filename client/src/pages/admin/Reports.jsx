import { useCallback, useState } from 'react'
import { BarChart3, SearchX } from 'lucide-react'
import { useLoad } from '../../hooks/useLoad'
import { getReport } from '../../services/reportService'
import { formatRupees } from '../../utils/format'
import Card from '../../components/Card'
import EmptyState from '../../components/EmptyState'
import LoadError from '../../components/LoadError'
import PageHeader from '../../components/PageHeader'
import RefreshButton from '../../components/RefreshButton'
import SkeletonBlocks from '../../components/SkeletonBlocks'
import StatCard from '../../components/StatCard'
import MonthlyCollectionChart from '../../components/dashboard/MonthlyCollectionChart'
import MonthlyReportTable from '../../components/reports/MonthlyReportTable'
import { ContributionPerformance, ExpenseSummary, MonthInsights } from '../../components/reports/ReportDetails'

const PERIODS = [
  { value: 'all', label: 'All time' },
  { value: '3', label: 'Last 3 months' },
  { value: '6', label: 'Last 6 months' },
  { value: '12', label: 'Last 12 months' },
]

// Admin-only financial report. Every number comes from GET /api/reports/summary,
// which builds it from the existing contribution and expense records.
export default function Reports() {
  const [period, setPeriod] = useState('all')
  const loader = useCallback(() => getReport(period), [period]) // reloads when the period changes
  const { status, data: report, error, reload } = useLoad(loader)
  const [refreshing, setRefreshing] = useState(false)

  async function handleRefresh() {
    setRefreshing(true)
    await reload()
    setRefreshing(false)
  }

  // While a newly chosen period is loading, the previous report stays visible but faded.
  const updating = report && report.period !== period
  const allTime = period === 'all'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Reports"
        subtitle="Monthly and overall SiddhiBoys fund summary"
        actions={<RefreshButton onClick={handleRefresh} refreshing={refreshing} disabled={status === 'loading'} />}
      />

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="report-period" className="text-sm font-medium text-slate-700">
          Report period
        </label>
        <select
          id="report-period"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-8 text-sm font-medium text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {PERIODS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        {updating && (
          <span className="text-sm text-slate-500" role="status">
            Updating...
          </span>
        )}
      </div>

      {status === 'loading' && (
        <SkeletonBlocks label="Loading financial reports..." stats={4} rows={6} statsClassName="grid-cols-2 xl:grid-cols-4" />
      )}

      {status === 'error' && (
        <LoadError title="Unable to load financial reports." detail={error} onRetry={handleRefresh} retrying={refreshing} />
      )}

      {status === 'ready' && !report.hasData && (
        <Card>
          <EmptyState icon={BarChart3} title="No financial data yet.">
            Once contributions are collected or expenses are recorded, your reports will appear here.
          </EmptyState>
        </Card>
      )}

      {status === 'ready' && report.hasData && (
        <div className={`space-y-6 transition-opacity ${updating ? 'opacity-60' : ''}`} aria-busy={updating || undefined}>
          {/* Overall summary */}
          <dl className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StatCard
              label="Total collected"
              value={formatRupees(report.totals.totalCollected)}
              hint={Number(report.totals.totalFinesCollected || 0) > 0 ? `Includes ${formatRupees(report.totals.totalFinesCollected)} fines` : 'Paid contributions'}
              tone="text-success-700"
            />
            <StatCard label="Total expenses" value={formatRupees(report.totals.totalExpenses)} hint="Money spent" />
            {allTime ? (
              <StatCard
                label="Current balance"
                value={formatRupees(report.totals.currentBalance)}
                hint="Collected − expenses"
                tone={report.totals.currentBalance < 0 ? 'text-danger-700' : 'text-success-700'}
              />
            ) : (
              <StatCard
                label="Net for period"
                value={formatRupees(report.totals.net)}
                hint={`Current balance: ${formatRupees(report.totals.currentBalance)}`}
                tone={report.totals.net < 0 ? 'text-danger-700' : 'text-success-700'}
              />
            )}
            <StatCard
              label="Total expected"
              value={formatRupees(report.totals.totalExpected)}
              hint={`${formatRupees(report.totals.totalPending)} pending`}
            />
          </dl>

          {report.monthly.length === 0 && report.expenses.count === 0 ? (
            <Card>
              <EmptyState icon={SearchX} title="No records in this period.">
                Try a longer report period.
              </EmptyState>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="xl:col-span-2">
                  <MonthlyCollectionChart months={report.monthly} />
                </div>
                <ContributionPerformance contributions={report.contributions} totals={report.totals} />
              </div>

              {report.monthly.length > 0 && <MonthlyReportTable months={report.monthly} />}

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ExpenseSummary expenses={report.expenses} />
                {report.bestMonth && <MonthInsights best={report.bestMonth} lowest={report.lowestMonth} />}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
