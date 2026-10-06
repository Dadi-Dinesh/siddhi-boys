import { useEffect, useState, useMemo } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Eye,
  HandCoins,
  IndianRupee,
  Receipt,
  Users,
  Wallet,
} from 'lucide-react'
import { getGroupSummary } from '../../services/groupService'
import { getMonthContributions } from '../../services/contributionService'
import { getExpenses } from '../../services/expenseService'
import { getTransactions } from '../../services/transactionService'
import { getBorrowed } from '../../services/borrowedService'
import { formatDate, formatRupees } from '../../utils/format'
import { buildMonthOptions, currentMonth, monthLabel } from '../../utils/months'
import Badge from '../../components/Badge'
import Card from '../../components/Card'
import EmptyState from '../../components/EmptyState'
import ImageModal from '../../components/ImageModal'
import LoadError from '../../components/LoadError'
import Avatar from '../../components/Avatar'
import PageHeader from '../../components/PageHeader'
import RefreshButton from '../../components/RefreshButton'
import SkeletonBlocks from '../../components/SkeletonBlocks'
import StatCard from '../../components/StatCard'
import MonthSelector from '../../components/contributions/MonthSelector'
import BorrowedList from '../../components/borrowed/BorrowedList'

export default function GroupActivity() {
  const [activeTab, setActiveTab] = useState('contributions') // 'contributions' | 'expenses' | 'borrowed' | 'transactions'
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  // Data states
  const [groupSummary, setGroupSummary] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [transactions, setTransactions] = useState([])
  const [borrowed, setBorrowed] = useState([])

  // Month state for contributions tab
  const today = useMemo(() => currentMonth(), [])
  const [selectedMonth, setSelectedMonth] = useState({ year: today.year, month: today.month })
  const [monthData, setMonthData] = useState(null)
  const [loadingMonth, setLoadingMonth] = useState(false)

  // Screenshot modal preview
  const [selectedReceipt, setSelectedReceipt] = useState(null)

  // Month selector options
  const monthOptions = useMemo(() => buildMonthOptions([], selectedMonth), [selectedMonth])

  async function loadInitialData() {
    setError(null)
    try {
      const [summaryRes, expensesRes, transRes, borrowedRes] = await Promise.all([
        getGroupSummary(),
        getExpenses(),
        getTransactions(),
        getBorrowed(),
      ])
      setGroupSummary(summaryRes)
      setExpenses(expensesRes.items || [])
      setTransactions(transRes || [])
      setBorrowed(borrowedRes.items || [])

      // Initial month contributions load
      const mYear = summaryRes?.currentMonth?.year ?? today.year
      const mMonth = summaryRes?.currentMonth?.month ?? today.month
      setSelectedMonth({ year: mYear, month: mMonth })
      const mRes = await getMonthContributions(mYear, mMonth)
      setMonthData(mRes)
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Unable to load group activity.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  async function handleRefresh() {
    setRefreshing(true)
    setError(null)
    try {
      const [summaryRes, expensesRes, transRes, borrowedRes, mRes] = await Promise.all([
        getGroupSummary(),
        getExpenses(),
        getTransactions(),
        getBorrowed(),
        getMonthContributions(selectedMonth.year, selectedMonth.month),
      ])
      setGroupSummary(summaryRes)
      setExpenses(expensesRes.items || [])
      setTransactions(transRes || [])
      setBorrowed(borrowedRes.items || [])
      setMonthData(mRes)
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Unable to refresh group activity.')
    } finally {
      setRefreshing(false)
    }
  }

  async function handleMonthChange(newMonth) {
    setSelectedMonth(newMonth)
    setLoadingMonth(true)
    try {
      const res = await getMonthContributions(newMonth.year, newMonth.month)
      setMonthData(res)
    } catch {
      setMonthData(null)
    } finally {
      setLoadingMonth(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Group Activity" subtitle="Loading group financial data..." />
        <SkeletonBlocks rows={4} label="Loading group activity..." />
      </div>
    )
  }

  if (error && !groupSummary) {
    return (
      <div className="space-y-6">
        <PageHeader title="Group Activity" subtitle="Transparent group ledger" />
        <LoadError title="Unable to load group activity." detail={error} onRetry={loadInitialData} />
      </div>
    )
  }

  const groupName = groupSummary?.groupName || 'SiddhiBoys'
  const totalMembers = groupSummary?.activeMembers ?? 0
  const totalCollected = groupSummary?.totalCollected ?? 0
  const totalExpenses = groupSummary?.totalExpenses ?? 0
  const currentlyBorrowed = groupSummary?.currentlyBorrowed ?? 0
  const currentBalance = groupSummary?.currentBalance ?? 0

  return (
    <div className="space-y-6">
      <PageHeader
        documentTitle="Group Activity"
        title="Group Activity"
        subtitle={`Live financial transparency for all ${groupName} members`}
        actions={<RefreshButton onClick={handleRefresh} refreshing={refreshing} />}
      />

      {/* Part 10: Group Summary */}
      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          icon={Users}
          label="Group Members"
          value={totalMembers}
          hint={`${groupName}`}
        />
        <StatCard
          icon={IndianRupee}
          label="Total Collected"
          value={formatRupees(totalCollected)}
          hint="From paid contributions"
          tone="text-emerald-700"
        />
        <StatCard
          icon={Receipt}
          label="Total Expenses"
          value={formatRupees(totalExpenses)}
          hint="Group spending"
          tone="text-danger-700"
        />
        <StatCard
          icon={HandCoins}
          label="Currently Borrowed"
          value={formatRupees(currentlyBorrowed)}
          hint="Not yet returned"
        />
        <StatCard
          icon={Wallet}
          label="Available Balance"
          value={formatRupees(currentBalance)}
          hint="Collected − expenses − borrowed"
          tone={currentBalance < 0 ? 'text-danger-700' : 'text-success-700'}
          className="col-span-2 lg:col-span-1"
        />
      </dl>

      {/* Tab Controls */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
          <button
            type="button"
            onClick={() => setActiveTab('contributions')}
            className={`whitespace-nowrap pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'contributions'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            Contributions
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('expenses')}
            className={`whitespace-nowrap pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'expenses'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            Expenses ({expenses.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('borrowed')}
            className={`whitespace-nowrap pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'borrowed'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            Borrowed ({borrowed.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className={`whitespace-nowrap pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'transactions'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            Transactions ({transactions.length})
          </button>
        </nav>
      </div>

      {/* TAB 1: CONTRIBUTIONS */}
      {activeTab === 'contributions' && (
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="font-semibold text-slate-900 text-base">
                Monthly Contributions · {monthLabel(selectedMonth.year, selectedMonth.month)}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Check contribution and verification status for all members
              </p>
            </div>
            <MonthSelector
              year={selectedMonth.year}
              month={selectedMonth.month}
              options={monthOptions}
              onChange={handleMonthChange}
            />
          </div>

          {loadingMonth ? (
            <div className="py-8">
              <SkeletonBlocks rows={3} label="Loading contributions..." />
            </div>
          ) : !monthData?.isCreated || monthData?.items?.length === 0 ? (
            <div className="py-6">
              <EmptyState
                icon={Users}
                title={`No records for ${monthLabel(selectedMonth.year, selectedMonth.month)}`}
              >
                The admin has not created contribution records for this month yet.
              </EmptyState>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto mt-4">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                      <th scope="col" className="py-3 pr-3 font-medium">Member</th>
                      <th scope="col" className="px-3 py-3 font-medium">Month</th>
                      <th scope="col" className="px-3 py-3 text-right font-medium">Base</th>
                      <th scope="col" className="px-3 py-3 text-right font-medium">Fine</th>
                      <th scope="col" className="px-3 py-3 text-right font-medium">Total</th>
                      <th scope="col" className="px-3 py-3 font-medium">Payment Date</th>
                      <th scope="col" className="px-3 py-3 font-medium">Status</th>
                      <th scope="col" className="py-3 pl-3 text-right font-medium">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {monthData.items.map((c) => {
                      const isPaid = c.status === 'PAID'
                      const isPending = !isPaid && c.verification?.status === 'PENDING'
                      const isDeclined = !isPaid && c.verification?.status === 'DECLINED'
                      const hasScreenshot = Boolean(c.verification?.screenshotUrl)
                      const baseVal = Number(c.amount)
                      const fineVal = Number(c.fineAmount || 0)
                      const totalVal = isPaid
                        ? (c.totalPaidAmount !== null && c.totalPaidAmount !== undefined ? Number(c.totalPaidAmount) : baseVal + fineVal)
                        : baseVal
                      const paymentDateLabel = c.paymentDate ? formatDate(c.paymentDate) : (c.paidAt ? formatDate(c.paidAt) : null)

                      return (
                        <tr key={c.id} className="hover:bg-slate-50/50">
                          <td className="py-3 pr-3 font-medium text-slate-900">
                            <div className="flex items-center gap-2.5">
                              <Avatar src={c.member?.profileImageUrl} name={c.member?.name || c.name} size="xs" />
                              <span>{c.member?.name || c.name}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-slate-600">
                            {c.label || monthLabel(selectedMonth.year, selectedMonth.month)}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums text-slate-700">
                            {formatRupees(baseVal)}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums">
                            {fineVal > 0 ? (
                              <span className="font-semibold text-amber-700">+{formatRupees(fineVal)}</span>
                            ) : (
                              <span className="text-slate-400">₹0</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums font-bold text-slate-900">
                            {formatRupees(totalVal)}
                          </td>
                          <td className="px-3 py-3 text-xs text-slate-600">
                            {paymentDateLabel ? (
                              <span className="font-medium text-slate-800">{paymentDateLabel}</span>
                            ) : (
                              <span className="text-slate-400">{c.dueDate ? `Due: ${formatDate(c.dueDate)}` : '—'}</span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            {isPaid && <Badge variant="success">PAID</Badge>}
                            {isPending && <Badge variant="warning">Pending Verification</Badge>}
                            {isDeclined && <Badge variant="danger">DECLINED</Badge>}
                            {!isPaid && !isPending && !isDeclined && <Badge variant="neutral">UNPAID</Badge>}
                          </td>
                          <td className="py-3 pl-3 text-right">
                            {hasScreenshot ? (
                              <button
                                type="button"
                                onClick={() => setSelectedReceipt({
                                  url: c.verification.screenshotUrl,
                                  title: `Payment Receipt · ${c.member?.name || c.name}`,
                                  subtitle: `${c.label} · Total: ${formatRupees(totalVal)} · ${paymentDateLabel ? `Paid on ${paymentDateLabel}` : 'Pending Verification'}`,
                                })}
                                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors"
                              >
                                <Eye size={13} />
                                View
                              </button>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <ul className="divide-y divide-slate-100 sm:hidden mt-3">
                {monthData.items.map((c) => {
                  const isPaid = c.status === 'PAID'
                  const isPending = !isPaid && c.verification?.status === 'PENDING'
                  const isDeclined = !isPaid && c.verification?.status === 'DECLINED'
                  const hasScreenshot = Boolean(c.verification?.screenshotUrl)
                  const baseVal = Number(c.amount)
                  const fineVal = Number(c.fineAmount || 0)
                  const totalVal = isPaid
                    ? (c.totalPaidAmount !== null && c.totalPaidAmount !== undefined ? Number(c.totalPaidAmount) : baseVal + fineVal)
                    : baseVal
                  const paymentDateLabel = c.paymentDate ? formatDate(c.paymentDate) : (c.paidAt ? formatDate(c.paidAt) : null)

                  return (
                    <li key={c.id} className="py-3 first:pt-0 last:pb-0 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar src={c.member?.profileImageUrl} name={c.member?.name || c.name} size="sm" />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{c.member?.name || c.name}</p>
                            <p className="text-xs text-slate-500">
                              {c.label} {paymentDateLabel ? `· Paid ${paymentDateLabel}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isPaid && <Badge variant="success">PAID</Badge>}
                          {isPending && <Badge variant="warning">Pending</Badge>}
                          {isDeclined && <Badge variant="danger">Declined</Badge>}
                          {!isPaid && !isPending && !isDeclined && <Badge variant="neutral">UNPAID</Badge>}

                          {hasScreenshot && (
                            <button
                              type="button"
                              onClick={() => setSelectedReceipt({
                                url: c.verification.screenshotUrl,
                                title: `Payment Receipt · ${c.member?.name || c.name}`,
                                subtitle: `${c.label} · Total: ${formatRupees(totalVal)}`,
                              })}
                              className="p-1 rounded text-primary-700 hover:bg-primary-50"
                              title="View screenshot"
                            >
                              <Eye size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
                        <span>Base: {formatRupees(baseVal)}</span>
                        {fineVal > 0 ? (
                          <span className="text-amber-700 font-semibold">Fine: +{formatRupees(fineVal)}</span>
                        ) : (
                          <span className="text-slate-400">Fine: ₹0</span>
                        )}
                        <span className="font-bold text-slate-900">Total: {formatRupees(totalVal)}</span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </Card>
      )}

      {/* TAB 2: EXPENSES */}
      {activeTab === 'expenses' && (
        <Card title="Group Expenses">
          {expenses.length === 0 ? (
            <EmptyState icon={Receipt} title="No expenses recorded">
              No expenses have been recorded for the group yet.
            </EmptyState>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                      <th scope="col" className="py-3 pr-4 font-medium">Expense Title</th>
                      <th scope="col" className="px-4 py-3 font-medium">Description</th>
                      <th scope="col" className="px-4 py-3 font-medium">Date</th>
                      <th scope="col" className="py-3 pl-4 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expenses.map((e) => (
                      <tr key={e.id}>
                        <td className="py-3 pr-4 font-medium text-slate-900">{e.title}</td>
                        <td className="px-4 py-3 text-slate-600 text-xs max-w-xs truncate">
                          {e.description || '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{formatDate(e.date)}</td>
                        <td className="py-3 pl-4 text-right tabular-nums font-semibold text-danger-700">
                          {formatRupees(e.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <ul className="divide-y divide-slate-100 sm:hidden">
                {expenses.map((e) => (
                  <li key={e.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{e.title}</p>
                      {e.description && <p className="text-xs text-slate-500 mt-0.5">{e.description}</p>}
                      <p className="text-xs text-slate-400 mt-1">{formatDate(e.date)}</p>
                    </div>
                    <span className="font-bold text-danger-700 tabular-nums shrink-0">
                      {formatRupees(e.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      )}

      {/* TAB 3: BORROWED (read-only) */}
      {activeTab === 'borrowed' && (
        <Card title="Borrowed Money">
          <p className="-mt-2 mb-4 text-xs text-slate-500">
            Group money temporarily given to members. It is not an expense and returns to the fund when paid back.
          </p>
          {borrowed.length === 0 ? (
            <EmptyState icon={HandCoins} title="No borrowed money">
              Nobody has borrowed money from the group.
            </EmptyState>
          ) : (
            <BorrowedList items={borrowed} />
          )}
        </Card>
      )}

      {/* TAB 4: TRANSACTIONS */}
      {activeTab === 'transactions' && (
        <Card title="Transaction Ledger">
          {transactions.length === 0 ? (
            <EmptyState icon={Wallet} title="No transactions yet">
              Paid contributions, expenses and borrowed money will appear here.
            </EmptyState>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                      <th scope="col" className="py-3 pr-4 font-medium">Date</th>
                      <th scope="col" className="px-4 py-3 font-medium">Description</th>
                      <th scope="col" className="px-4 py-3 font-medium">Type</th>
                      <th scope="col" className="py-3 pl-4 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map((t) => {
                      const isMoneyIn = t.direction === 'IN' || t.type === 'CONTRIBUTION'
                      return (
                        <tr key={`${t.type}-${t.id}`}>
                          <td className="py-3 pr-4 text-slate-600">{formatDate(t.date)}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {t.title}
                            {t.description && (
                              <span className="block text-xs text-slate-500 font-normal">{t.description}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isMoneyIn ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                <ArrowDownLeft size={13} />
                                Money In
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-danger-700 bg-danger-50 px-2 py-0.5 rounded-md">
                                <ArrowUpRight size={13} />
                                Money Out
                              </span>
                            )}
                          </td>
                          <td className={`py-3 pl-4 text-right tabular-nums font-bold ${
                            isMoneyIn ? 'text-emerald-700' : 'text-danger-700'
                          }`}>
                            {isMoneyIn ? `+${formatRupees(t.amount)}` : `-${formatRupees(t.amount)}`}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <ul className="divide-y divide-slate-100 sm:hidden">
                {transactions.map((t) => {
                  const isMoneyIn = t.direction === 'IN' || t.type === 'CONTRIBUTION'
                  return (
                    <li key={`${t.type}-${t.id}`} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{t.title}</p>
                        <p className="text-xs text-slate-500">{formatDate(t.date)}</p>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span className={`font-bold tabular-nums text-sm ${
                          isMoneyIn ? 'text-emerald-700' : 'text-danger-700'
                        }`}>
                          {isMoneyIn ? `+${formatRupees(t.amount)}` : `-${formatRupees(t.amount)}`}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {isMoneyIn ? 'Money In' : 'Money Out'}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </Card>
      )}

      {/* Screenshot Preview Modal */}
      {selectedReceipt && (
        <ImageModal
          open={Boolean(selectedReceipt)}
          onClose={() => setSelectedReceipt(null)}
          imageUrl={selectedReceipt.url}
          title={selectedReceipt.title}
          subtitle={selectedReceipt.subtitle}
        />
      )}
    </div>
  )
}
