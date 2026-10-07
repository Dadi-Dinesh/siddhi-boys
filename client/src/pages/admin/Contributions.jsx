import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarPlus, SearchX } from 'lucide-react'
import { useContributionMonth } from '../../hooks/useContributionMonth'
import { useFlash } from '../../hooks/useFlash'
import { createMonth, markUnpaid } from '../../services/contributionService'
import { adminMarkPaidWithScreenshot } from '../../services/paymentVerificationService'
import { getMonthlySummary } from '../../services/dashboardService'
import { getSettings } from '../../services/settingsService'
import { getErrorMessage } from '../../services/api'
import { formatRupees } from '../../utils/format'
import { buildMonthOptions, currentMonth, monthLabel } from '../../utils/months'
import Alert from '../../components/Alert'
import Button from '../../components/Button'
import Card from '../../components/Card'
import LoadError from '../../components/LoadError'
import PageHeader from '../../components/PageHeader'
import RefreshButton from '../../components/RefreshButton'
import SkeletonBlocks from '../../components/SkeletonBlocks'
import ConfirmDialog from '../../components/ConfirmDialog'
import EmptyState from '../../components/EmptyState'
import SearchInput from '../../components/SearchInput'
import ImageModal from '../../components/ImageModal'
import AdminPayModal from '../../components/contributions/AdminPayModal'
import ContributionCard from '../../components/contributions/ContributionCard'
import ContributionSummary from '../../components/contributions/ContributionSummary'
import ContributionTable from '../../components/contributions/ContributionTable'
import MonthSelector from '../../components/contributions/MonthSelector'

// Read ?year=2026&month=10 from the URL, falling back to the current month.
// Keeping the month in the URL means refresh/back keep the admin on the same month.
function useSelectedMonth() {
  const [params, setParams] = useSearchParams()
  const year = Number(params.get('year'))
  const month = Number(params.get('month'))
  const valid = Number.isInteger(year) && year >= 2000 && year <= 2100 && Number.isInteger(month) && month >= 1 && month <= 12
  const selected = valid ? { year, month } : currentMonth()
  const select = useCallback((m) => setParams({ year: m.year, month: m.month }, { replace: true }), [setParams])
  return [selected, select]
}

// Friendly text for a failed Mark Paid / Mark Unpaid.
function actionError(error) {
  const status = error.response?.status
  // Upload problems (502/503) keep the server's message, e.g. "Could not upload the screenshot".
  if (!status || (status >= 500 && status !== 502 && status !== 503)) return 'Unable to update payment status. Please try again.'
  return getErrorMessage(error)
}

export default function Contributions() {
  const [{ year, month }, selectMonth] = useSelectedMonth()
  const label = monthLabel(year, month)

  // Search box: `query` updates on every key press, `search` 300ms after typing stops.
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 300)
    return () => clearTimeout(timer)
  }, [query])

  const { status, data, error, searching, reload } = useContributionMonth(year, month, search)

  // Which months already exist (for the dropdown labels).
  const [createdMonths, setCreatedMonths] = useState([])
  const loadCreatedMonths = useCallback(() => getMonthlySummary().then(setCreatedMonths).catch(() => {}), [])
  useEffect(() => {
    loadCreatedMonths()
  }, [loadCreatedMonths])

  // Success/error message at the top of the page.
  const { flash, showFlash, clearFlash } = useFlash()

  const [refreshing, setRefreshing] = useState(false)
  async function handleRefresh() {
    setRefreshing(true)
    await Promise.all([reload(), loadCreatedMonths()])
    setRefreshing(false)
  }

  // ---- Mark Paid / Mark Unpaid. Only the clicked row is disabled while it updates.
  const [pendingIds, setPendingIds] = useState(() => new Set())
  const setPending = (id, isPending) =>
    setPendingIds((current) => {
      const next = new Set(current)
      if (isPending) next.add(id)
      else next.delete(id)
      return next
    })

  async function updateStatus(contribution, action, successText) {
    setPending(contribution.id, true)
    try {
      await action(contribution.id) // the backend saves the change and the paid date
      await reload() // then show what the server now says (status, date, summary)
      showFlash('success', successText)
      return true
    } catch (err) {
      showFlash('error', actionError(err))
      return false
    } finally {
      setPending(contribution.id, false)
    }
  }

  // Modal state for verifying payment with screenshot upload
  const [payModalTarget, setPayModalTarget] = useState(null)
  const [payLoading, setPayLoading] = useState(false)
  const [previewContribution, setPreviewContribution] = useState(null)
  const handleMarkPaid = (contribution) => setPayModalTarget(contribution)

  // Clicking "Mark Paid" now opens the Verify Payment modal requiring a screenshot upload
  async function handleAdminPaySubmit({ contributionId, file, paymentDate, note }) {
    setPayLoading(true)
    try {
      await adminMarkPaidWithScreenshot({ contributionId, file, paymentDate, note })
      await reload()
      showFlash('success', `${payModalTarget.member?.name || 'Member'} marked as paid with screenshot.`)
      setPayModalTarget(null)
    } catch (err) {
      showFlash('error', actionError(err))
    } finally {
      setPayLoading(false)
    }
  }

  // Marking unpaid reverses a payment, so it asks first.
  const [unpayTarget, setUnpayTarget] = useState(null)
  async function confirmUnpay() {
    await updateStatus(unpayTarget, markUnpaid, `${unpayTarget.member.name} marked as unpaid.`)
    setUnpayTarget(null)
  }

  // ---- Create Month (with confirmation). Shows the current amount & fine from Settings.
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [defaultSettings, setDefaultSettings] = useState(null)
  function openCreate() {
    setCreateOpen(true)
    setDefaultSettings(null)
    getSettings()
      .then((s) => setDefaultSettings(s))
      .catch(() => setDefaultSettings(null))
  }
  async function confirmCreate() {
    setCreating(true)
    let flashMessage
    try {
      const { message } = await createMonth(year, month)
      flashMessage = ['success', message]
    } catch (err) {
      // e.g. 409 "October 2026 has already been created." is shown as-is.
      flashMessage = ['error', getErrorMessage(err)]
    }
    // Reload first, so the message appears together with the updated list.
    await Promise.all([reload(), loadCreatedMonths()])
    showFlash(...flashMessage)
    setCreating(false)
    setCreateOpen(false)
  }

  const monthExists = data?.isCreated

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contributions"
        subtitle="Manage monthly member contributions"
        actions={<RefreshButton onClick={handleRefresh} refreshing={refreshing} disabled={status === 'loading'} />}
      />

      {/* Month selector + Create Month */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <MonthSelector
          year={year}
          month={month}
          options={buildMonthOptions(createdMonths, { year, month })}
          onChange={(m) => {
            clearFlash() // messages belong to the month they were about
            selectMonth(m)
          }}
        />
        <Button onClick={openCreate} disabled={status !== 'ready'}>
          <CalendarPlus size={16} aria-hidden="true" />
          {monthExists ? 'Add Missing Members' : 'Create Month'}
        </Button>
      </div>

      {flash && (
        <Alert variant={flash.variant} onClose={clearFlash}>
          {flash.text}
        </Alert>
      )}

      {status === 'loading' && <SkeletonBlocks label="Loading contributions..." stats={5} statsClassName="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" />}

      {status === 'error' && (
        <LoadError title="Unable to load contributions." detail={error} onRetry={handleRefresh} retrying={refreshing} />
      )}

      {status === 'ready' && !monthExists && (
        <Card>
          <EmptyState icon={CalendarPlus} title="No contributions for this month">
            <p>Create monthly contribution records for all active members.</p>
            <Button onClick={openCreate} className="mt-4">
              Create {label}
            </Button>
          </EmptyState>
        </Card>
      )}

      {status === 'ready' && monthExists && (
        <>
          <ContributionSummary summary={data.summary} />

          <Card>
            <SearchInput value={query} onChange={setQuery} placeholder="Search member..." label="Search member" />

            <div className={searching ? 'opacity-60 transition-opacity' : ''} aria-busy={searching || undefined}>
              {data.items.length === 0 ? (
                <EmptyState icon={SearchX} title="No members found">
                  Try a different name or email.
                </EmptyState>
              ) : (
                <>
                  {/* Wide screens (table needs ~1024px beside the sidebar) */}
                  <div className="hidden lg:block">
                    <ContributionTable
                      items={data.items}
                      pendingIds={pendingIds}
                      onMarkPaid={handleMarkPaid}
                      onMarkUnpaid={setUnpayTarget}
                      onViewScreenshot={(c) => setPreviewContribution(c)}
                    />
                  </div>
                  {/* Phones & tablets */}
                  <ul className="space-y-3 lg:hidden">
                    {data.items.map((c) => (
                      <ContributionCard
                        key={c.id}
                        contribution={c}
                        pending={pendingIds.has(c.id)}
                        onMarkPaid={handleMarkPaid}
                        onMarkUnpaid={setUnpayTarget}
                        onViewScreenshot={(c) => setPreviewContribution(c)}
                      />
                    ))}
                  </ul>
                </>
              )}
            </div>
          </Card>
        </>
      )}

      {/* Verify & Record Payment Modal (Screenshot Required) */}
      <AdminPayModal
        open={Boolean(payModalTarget)}
        onClose={() => setPayModalTarget(null)}
        contribution={payModalTarget}
        onSubmit={handleAdminPaySubmit}
        loading={payLoading}
      />

      {/* Screenshot Preview Modal */}
      <ImageModal
        open={Boolean(previewContribution)}
        onClose={() => setPreviewContribution(null)}
        imageUrl={previewContribution?.verification?.screenshotUrl}
        title={`Payment: ${previewContribution?.member?.name || 'Member'}`}
        subtitle={`${previewContribution?.label || ''} · ${
          previewContribution ? formatRupees(previewContribution.amount) : ''
        }`}
      />

      <ConfirmDialog
        open={createOpen}
        title={monthExists ? `Add missing members to ${label}?` : 'Create monthly contributions?'}
        confirmLabel={monthExists ? 'Add Members' : 'Create Month'}
        loading={creating}
        loadingText="Creating..."
        onConfirm={confirmCreate}
        onCancel={() => setCreateOpen(false)}
      >
        {monthExists ? (
          <p>
            {label} already exists. Active members who don&apos;t have a record for this month yet (for example, newly
            added members) will be added as unpaid.
          </p>
        ) : (
          <p>This will create {label} contribution records for all active members using the current monthly contribution amount.</p>
        )}
        {defaultSettings && (
          <div className="mt-2.5 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-700 border border-slate-200/80 space-y-1">
            <p><span className="text-slate-500">Base Contribution:</span> <strong className="text-slate-900">{formatRupees(defaultSettings.monthlyContribution)}</strong></p>
            <p><span className="text-slate-500">Due Day:</span> <strong className="text-slate-900">{defaultSettings.dueDay || 10}th of the month</strong></p>
            <p><span className="text-slate-500">Late Fine:</span> <strong className="text-slate-900">{formatRupees(defaultSettings.fineAmount ?? 20)}</strong></p>
          </div>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(unpayTarget)}
        title="Mark contribution as unpaid?"
        confirmLabel="Mark Unpaid"
        confirmVariant="danger"
        loading={unpayTarget ? pendingIds.has(unpayTarget.id) : false}
        loadingText="Updating..."
        onConfirm={confirmUnpay}
        onCancel={() => setUnpayTarget(null)}
      >
        {unpayTarget && (
          <p>
            This will remove the recorded payment for <strong className="text-slate-800">{unpayTarget.member.name}</strong> for{' '}
            {unpayTarget.label}.
          </p>
        )}
      </ConfirmDialog>
    </div>
  )
}

// Simple placeholders while a month loads.
