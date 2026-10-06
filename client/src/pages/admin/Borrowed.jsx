import { useState } from 'react'
import { HandCoins, Plus } from 'lucide-react'
import { useLoad } from '../../hooks/useLoad'
import { useFlash } from '../../hooks/useFlash'
import { createBorrowed, deleteBorrowed, getBorrowed, markBorrowedReturned } from '../../services/borrowedService'
import { getMembers } from '../../services/memberService'
import { formatDate, formatRupees, todayInputDate } from '../../utils/format'
import Alert from '../../components/Alert'
import Button from '../../components/Button'
import Card from '../../components/Card'
import ConfirmDialog from '../../components/ConfirmDialog'
import EmptyState from '../../components/EmptyState'
import Input from '../../components/Input'
import LoadError from '../../components/LoadError'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import RefreshButton from '../../components/RefreshButton'
import SkeletonBlocks from '../../components/SkeletonBlocks'
import StatCard from '../../components/StatCard'
import BorrowedForm from '../../components/borrowed/BorrowedForm'
import BorrowedList from '../../components/borrowed/BorrowedList'
import BorrowedStatus from '../../components/borrowed/BorrowedStatus'

// Network/server problems get a fixed friendly message; validation errors (400)
// show the backend's own message, e.g. "Amount is more than the available balance".
function friendlyError(error, fallback) {
  const status = error.response?.status
  if (!status || status >= 500) return fallback
  return error.response.data?.message || fallback
}

// Records + totals (from the backend) and the members to choose from, loaded together.
async function loadBorrowedPage() {
  const [borrowed, members] = await Promise.all([getBorrowed(), getMembers()])
  return { ...borrowed, members: members.filter((m) => m.isActive) }
}

// Money temporarily given to a member from the group fund. This is NOT an expense:
// it lowers the available balance until it is marked as returned.
export default function Borrowed() {
  const { status, data, error, reload } = useLoad(loadBorrowedPage)
  const { flash, showFlash, clearFlash } = useFlash()

  const [refreshing, setRefreshing] = useState(false)
  async function handleRefresh() {
    setRefreshing(true)
    const result = await reload()
    if (result.error && data) showFlash('error', `Couldn't refresh: ${result.error}`)
    setRefreshing(false)
  }

  // ---- Add
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  async function handleAdd(values) {
    setSaving(true)
    setFormError('')
    try {
      await createBorrowed(values)
      await reload()
      setFormOpen(false)
      showFlash('success', 'Borrowed amount recorded.')
    } catch (err) {
      setFormError(friendlyError(err, 'Unable to record borrowed amount. Please try again.'))
    } finally {
      setSaving(false)
    }
  }

  // ---- Mark returned
  const [returnTarget, setReturnTarget] = useState(null)
  const [returnDate, setReturnDate] = useState('')
  const [returnError, setReturnError] = useState('')
  const [returning, setReturning] = useState(false)
  function openReturn(record) {
    setReturnTarget(record)
    setReturnDate(todayInputDate())
    setReturnError('')
  }
  async function confirmReturn() {
    if (!returnDate) return setReturnError('Returned date is required.')
    setReturning(true)
    setReturnError('')
    try {
      await markBorrowedReturned(returnTarget.id, returnDate)
      await reload()
      showFlash('success', `${returnTarget.member.name}'s ${formatRupees(returnTarget.amount)} marked as returned.`)
      setReturnTarget(null)
    } catch (err) {
      setReturnError(friendlyError(err, 'Unable to mark as returned.'))
    } finally {
      setReturning(false)
    }
  }

  // ---- View / Delete
  const [viewing, setViewing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  async function confirmDelete() {
    const record = deleteTarget
    setDeletingId(record.id)
    try {
      await deleteBorrowed(record.id)
      await reload()
      showFlash('success', 'Borrowed record deleted.')
    } catch (err) {
      showFlash('error', friendlyError(err, 'Unable to delete record.'))
    } finally {
      setDeletingId(null)
      setDeleteTarget(null)
    }
  }

  const summary = data?.summary

  return (
    <div className="space-y-6">
      <PageHeader
        title="Borrowed"
        subtitle="Group money temporarily given to members (not an expense)"
        actions={
          <>
            <RefreshButton onClick={handleRefresh} refreshing={refreshing} disabled={status === 'loading'} />
            <Button
              onClick={() => {
                setFormError('')
                setFormOpen(true)
              }}
              disabled={status !== 'ready'}
              className="flex-1 sm:flex-none"
            >
              <Plus size={16} aria-hidden="true" />
              Add Borrowed
            </Button>
          </>
        }
      />

      {flash && (
        <Alert variant={flash.variant} onClose={clearFlash}>
          {flash.text}
        </Alert>
      )}

      {status === 'loading' && <SkeletonBlocks label="Loading borrowed records..." rows={4} />}

      {status === 'error' && (
        <LoadError title="Unable to load borrowed records." detail={error} onRetry={handleRefresh} retrying={refreshing} />
      )}

      {status === 'ready' && (
        <>
          {/* Summary — totals come from the backend */}
          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Total borrowed" value={formatRupees(summary.totalBorrowed)} hint="All time" />
            <StatCard label="Total returned" value={formatRupees(summary.totalReturned)} hint="Back in the fund" />
            <StatCard
              label="Currently borrowed"
              value={formatRupees(summary.currentlyBorrowed)}
              hint="Not yet returned"
              tone={summary.currentlyBorrowed > 0 ? 'text-warning-700' : ''}
            />
            <StatCard
              label="Available balance"
              value={formatRupees(summary.availableBalance)}
              hint="Collected − expenses − borrowed"
              tone={summary.availableBalance < 0 ? 'text-danger-700' : 'text-success-700'}
            />
          </dl>

          <Card>
            {data.items.length === 0 ? (
              <EmptyState icon={HandCoins} title="No borrowed money">
                <p>When a member borrows money from the group, record it here.</p>
              </EmptyState>
            ) : (
              <BorrowedList
                items={data.items}
                onReturn={openReturn}
                onView={setViewing}
                onDelete={setDeleteTarget}
                busyId={deletingId}
              />
            )}
          </Card>
        </>
      )}

      <Modal open={formOpen} title="Add Borrowed" onClose={() => setFormOpen(false)} busy={saving}>
        {formOpen && (
          <BorrowedForm
            members={data?.members ?? []}
            availableBalance={summary?.availableBalance ?? 0}
            onSubmit={handleAdd}
            onCancel={() => setFormOpen(false)}
            saving={saving}
            errorText={formError}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(returnTarget)}
        title="Mark as returned?"
        confirmLabel="Mark Returned"
        loading={returning}
        loadingText="Saving..."
        onConfirm={confirmReturn}
        onCancel={() => setReturnTarget(null)}
      >
        {returnTarget && (
          <div className="space-y-4">
            {returnError && <Alert>{returnError}</Alert>}
            <p>
              <span className="font-medium text-slate-900">{returnTarget.member.name}</span> returned the full{' '}
              <span className="font-medium text-slate-900">{formatRupees(returnTarget.amount)}</span> borrowed on{' '}
              {formatDate(returnTarget.borrowedAt)}.
            </p>
            <Input
              label="Returned date"
              type="date"
              value={returnDate}
              min={returnTarget.borrowedAt}
              max={todayInputDate()}
              onChange={(e) => setReturnDate(e.target.value)}
            />
          </div>
        )}
      </ConfirmDialog>

      <Modal open={Boolean(viewing)} title="Borrowed details" onClose={() => setViewing(null)}>
        {viewing && (
          <>
            <dl className="mt-4 space-y-2 text-sm">
              <DetailRow label="Member" value={viewing.member.name} />
              <DetailRow label="Amount" value={formatRupees(viewing.amount)} />
              <DetailRow label="Borrowed on" value={formatDate(viewing.borrowedAt)} />
              <DetailRow label="Purpose" value={viewing.purpose || '—'} />
              <DetailRow label="Status" value={<BorrowedStatus status={viewing.status} />} />
              <DetailRow label="Returned on" value={viewing.returnedAt ? formatDate(viewing.returnedAt) : '—'} />
            </dl>
            <div className="mt-6 flex justify-end">
              <Button variant="secondary" onClick={() => setViewing(null)}>
                Close
              </Button>
            </div>
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete borrowed record?"
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={Boolean(deletingId)}
        loadingText="Deleting..."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      >
        {deleteTarget && (
          <>
            <p>Only delete a record that was entered by mistake:</p>
            <p className="mt-2 font-medium text-slate-900">
              {deleteTarget.member.name} — {formatRupees(deleteTarget.amount)} on {formatDate(deleteTarget.borrowedAt)}
            </p>
            <p className="mt-2">This action cannot be undone.</p>
          </>
        )}
      </ConfirmDialog>
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-2 last:border-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{value}</dd>
    </div>
  )
}
