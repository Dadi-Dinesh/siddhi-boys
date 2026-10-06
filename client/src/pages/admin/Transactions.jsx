import { useState } from 'react'
import { ArrowLeftRight, SearchX } from 'lucide-react'
import { useTransactions } from '../../hooks/useTransactions'
import { useFlash } from '../../hooks/useFlash'
import { formatRupees, toDateKey } from '../../utils/format'
import { transactionSearchText } from '../../utils/transactions'
import Alert from '../../components/Alert'
import Card from '../../components/Card'
import LoadError from '../../components/LoadError'
import PageHeader from '../../components/PageHeader'
import RefreshButton from '../../components/RefreshButton'
import SkeletonBlocks from '../../components/SkeletonBlocks'
import StatCard from '../../components/StatCard'
import EmptyState from '../../components/EmptyState'
import TransactionCard from '../../components/transactions/TransactionCard'
import TransactionFilters from '../../components/transactions/TransactionFilters'
import TransactionTable from '../../components/transactions/TransactionTable'

const NO_FILTERS = { query: '', type: 'ALL', from: '', to: '' }

// Keeps the rows that match all the filters. Dates are compared as "YYYY-MM-DD" text.
function applyFilters(items, { query, type, from, to }) {
  const term = query.trim().toLowerCase()
  return items.filter((t) => {
    if (type !== 'ALL' && t.direction !== type) return false
    const day = toDateKey(t.date)
    if (from && day < from) return false
    if (to && day > to) return false
    if (term && !transactionSearchText(t).includes(term)) return false
    return true
  })
}

// Read-only ledger. Nothing can be edited here: contributions are changed on the
// Contributions page and expenses on the Expenses page, and this page reflects them.
export default function Transactions() {
  const { status, data, error, reload } = useTransactions()
  const { flash, showFlash, clearFlash } = useFlash()
  const [filters, setFilters] = useState(NO_FILTERS)

  const [refreshing, setRefreshing] = useState(false)
  async function handleRefresh() {
    setRefreshing(true)
    const result = await reload()
    if (result.error && data) showFlash('error', `Couldn't refresh: ${result.error}`)
    setRefreshing(false)
  }

  const badRange = filters.from && filters.to && filters.from > filters.to
  const visible = data && !badRange ? applyFilters(data.items, filters) : []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        subtitle="Complete history of money collected and spent"
        actions={<RefreshButton onClick={handleRefresh} refreshing={refreshing} disabled={status === 'loading'} />}
      />

      {flash && (
        <Alert variant={flash.variant} onClose={clearFlash}>
          {flash.text}
        </Alert>
      )}

      {status === 'loading' && <SkeletonBlocks label="Loading transactions..." />}

      {status === 'error' && (
        <LoadError title="Unable to load transactions." detail={error} onRetry={handleRefresh} retrying={refreshing} />
      )}

      {status === 'ready' && (
        <>
          {/* All-time totals from the backend (same numbers as the dashboard) */}
          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <StatCard label="Money in" value={formatRupees(data.moneyIn)} hint="Paid contributions" />
            <StatCard label="Money out" value={formatRupees(data.moneyOut)} hint="Expenses" />
            <StatCard
              label="Current balance"
              value={formatRupees(data.balance)}
              hint="Money in − money out"
              tone={data.balance < 0 ? 'text-danger-700' : 'text-success-700'}
              className="col-span-2 lg:col-span-1"
            />
          </dl>

          <Card>
            {data.items.length === 0 ? (
              <EmptyState icon={ArrowLeftRight} title="No transactions yet">
                Paid contributions and expenses will appear here.
              </EmptyState>
            ) : (
              <>
                <TransactionFilters filters={filters} onChange={setFilters} onClear={() => setFilters(NO_FILTERS)} />

                {badRange ? (
                  <EmptyState icon={SearchX} title="Check the dates">
                    The From date must be on or before the To date.
                  </EmptyState>
                ) : visible.length === 0 ? (
                  <EmptyState icon={SearchX} title="No matching transactions">
                    Try a different search, type or date range.
                  </EmptyState>
                ) : (
                  <>
                    <div className="hidden lg:block">
                      <TransactionTable items={visible} />
                    </div>
                    <ul className="space-y-3 lg:hidden">
                      {visible.map((t) => (
                        <TransactionCard key={`${t.type}-${t.id}`} transaction={t} />
                      ))}
                    </ul>
                  </>
                )}

                <p className="mt-4 text-xs text-slate-500" role="status">
                  Showing {visible.length} of {data.items.length} transactions. To change a record, use the Contributions or
                  Expenses page.
                </p>
              </>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
