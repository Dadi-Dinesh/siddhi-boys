import { useState } from 'react'
import { Plus, Receipt, SearchX } from 'lucide-react'
import { useExpenses } from '../../hooks/useExpenses'
import { useFlash } from '../../hooks/useFlash'
import { createExpense, deleteExpense, updateExpense } from '../../services/expenseService'
import { formatRupees } from '../../utils/format'
import Alert from '../../components/Alert'
import Button from '../../components/Button'
import Card from '../../components/Card'
import LoadError from '../../components/LoadError'
import PageHeader from '../../components/PageHeader'
import RefreshButton from '../../components/RefreshButton'
import SkeletonBlocks from '../../components/SkeletonBlocks'
import StatCard from '../../components/StatCard'
import ConfirmDialog from '../../components/ConfirmDialog'
import EmptyState from '../../components/EmptyState'
import Modal from '../../components/Modal'
import SearchInput from '../../components/SearchInput'
import ExpenseCard from '../../components/expenses/ExpenseCard'
import ExpenseForm from '../../components/expenses/ExpenseForm'
import ExpenseTable from '../../components/expenses/ExpenseTable'

// Network/server problems get a fixed friendly message; validation errors (400)
// show the backend's own message, e.g. "Amount must be greater than 0".
function friendlyError(error, fallback) {
  const status = error.response?.status
  if (!status || status >= 500) return fallback
  return error.response.data?.message || fallback
}

// Simple search on the page: the list is small, so no server search is needed.
function matches(expense, term) {
  const text = `${expense.title} ${expense.description ?? ''}`.toLowerCase()
  return text.includes(term.toLowerCase())
}

export default function Expenses() {
  const { status, data, error, reload } = useExpenses()
  const { flash, showFlash, clearFlash } = useFlash()
  const [query, setQuery] = useState('')

  const [refreshing, setRefreshing] = useState(false)
  async function handleRefresh() {
    setRefreshing(true)
    const result = await reload()
    if (result.error && data) showFlash('error', `Couldn't refresh: ${result.error}`)
    setRefreshing(false)
  }

  // ---- Add / Edit (one form for both). `editing` is null when adding.
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  function openAdd() {
    setEditing(null)
    setFormError('')
    setFormOpen(true)
  }
  function openEdit(expense) {
    setEditing(expense)
    setFormError('')
    setFormOpen(true)
  }

  async function handleSave(values) {
    setSaving(true)
    setFormError('')
    try {
      if (editing) await updateExpense(editing.id, values)
      else await createExpense(values)
      await reload() // show what the server now has (list + totals)
      setFormOpen(false)
      showFlash('success', editing ? 'Expense updated successfully.' : 'Expense added successfully.')
    } catch (err) {
      // Keep the form open with the admin's input so they can fix and retry.
      setFormError(friendlyError(err, editing ? 'Unable to update expense.' : 'Unable to add expense. Please try again.'))
    } finally {
      setSaving(false)
    }
  }

  // ---- Delete (with confirmation)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  async function confirmDelete() {
    const expense = deleteTarget
    setDeletingId(expense.id)
    try {
      await deleteExpense(expense.id)
      await reload()
      showFlash('success', `"${expense.title}" deleted.`)
    } catch (err) {
      showFlash('error', friendlyError(err, 'Unable to delete expense.'))
    } finally {
      setDeletingId(null)
      setDeleteTarget(null)
    }
  }

  const term = query.trim()
  const visible = data ? (term ? data.items.filter((e) => matches(e, term)) : data.items) : []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        subtitle="Track and manage group spending"
        actions={
          <>
            <RefreshButton onClick={handleRefresh} refreshing={refreshing} disabled={status === 'loading'} />
            <Button onClick={openAdd} disabled={status !== 'ready'} className="flex-1 sm:flex-none">
              <Plus size={16} aria-hidden="true" />
              Add Expense
            </Button>
          </>
        }
      />

      {flash && (
        <Alert variant={flash.variant} onClose={clearFlash}>
          {flash.text}
        </Alert>
      )}

      {status === 'loading' && <SkeletonBlocks label="Loading expenses..." rows={4} />}

      {status === 'error' && (
        <LoadError title="Unable to load expenses." detail={error} onRetry={handleRefresh} retrying={refreshing} />
      )}

      {status === 'ready' && (
        <>
          {/* Summary — totals come from the backend */}
          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <StatCard label="Total expenses" value={formatRupees(data.totalExpenses)} />
            <StatCard label="Number of expenses" value={data.count} />
            <StatCard
              label="Current balance"
              value={formatRupees(data.currentBalance)}
              tone={data.currentBalance < 0 ? 'text-danger-700' : 'text-success-700'}
              className="col-span-2 lg:col-span-1"
            />
          </dl>

          <Card>
            {data.items.length === 0 ? (
              <EmptyState icon={Receipt} title="No expenses yet">
                <p>Expenses added from the group fund will appear here.</p>
                <Button onClick={openAdd} className="mt-4">
                  <Plus size={16} aria-hidden="true" />
                  Add Expense
                </Button>
              </EmptyState>
            ) : (
              <>
                <SearchInput value={query} onChange={setQuery} placeholder="Search expenses..." label="Search expenses" />
                {visible.length === 0 ? (
                  <EmptyState icon={SearchX} title="No expenses found">
                    Try a different title or description.
                  </EmptyState>
                ) : (
                  <>
                    <div className="hidden lg:block">
                      <ExpenseTable items={visible} deletingId={deletingId} onEdit={openEdit} onDelete={setDeleteTarget} />
                    </div>
                    <ul className="space-y-3 lg:hidden">
                      {visible.map((e) => (
                        <ExpenseCard
                          key={e.id}
                          expense={e}
                          deleting={deletingId === e.id}
                          onEdit={openEdit}
                          onDelete={setDeleteTarget}
                        />
                      ))}
                    </ul>
                  </>
                )}
              </>
            )}
          </Card>
        </>
      )}

      <Modal open={formOpen} title={editing ? 'Edit Expense' : 'Add Expense'} onClose={() => setFormOpen(false)} busy={saving}>
        <ExpenseForm
          expense={editing}
          onSubmit={handleSave}
          onCancel={() => setFormOpen(false)}
          saving={saving}
          errorText={formError}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete expense?"
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={Boolean(deletingId)}
        loadingText="Deleting..."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      >
        {deleteTarget && (
          <>
            <p>Are you sure you want to delete:</p>
            <p className="mt-2 font-medium text-slate-900">
              {deleteTarget.title} — {formatRupees(deleteTarget.amount)}
            </p>
            <p className="mt-2">This action cannot be undone.</p>
          </>
        )}
      </ConfirmDialog>
    </div>
  )
}
