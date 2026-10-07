import { useState } from 'react'
import { SearchX, UserPlus, Users } from 'lucide-react'
import { useMembers } from '../../hooks/useMembers'
import { useFlash } from '../../hooks/useFlash'
import { activateMember, createMember, deactivateMember, updateMember } from '../../services/memberService'
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
import MemberCard from '../../components/members/MemberCard'
import MemberDetails from '../../components/members/MemberDetails'
import MemberForm from '../../components/members/MemberForm'
import MemberTable from '../../components/members/MemberTable'

// Network/server problems get a fixed friendly message; validation errors (400)
// show the backend's own message, e.g. "Please enter a valid email address".
// Upload problems (502/503, e.g. "Image upload is not configured") keep the server's message too.
function friendlyError(error, fallback) {
  const status = error.response?.status
  if (!status || (status >= 500 && status !== 502 && status !== 503)) return fallback
  return error.response.data?.message || fallback
}

// The list is small, so search simply filters it on the page (no extra requests).
function matches(member, term) {
  return `${member.name} ${member.email}`.toLowerCase().includes(term.toLowerCase())
}

export default function Members() {
  const { status, data: members, error, reload } = useMembers()
  const { flash, showFlash, clearFlash } = useFlash()
  const [query, setQuery] = useState('')

  const [refreshing, setRefreshing] = useState(false)
  async function handleRefresh() {
    setRefreshing(true)
    const result = await reload()
    if (result.error && members) showFlash('error', `Couldn't refresh: ${result.error}`)
    setRefreshing(false)
  }

  // ---- Add / Edit (one form for both). `editing` is null when adding.
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [emailTaken, setEmailTaken] = useState(false)

  function openForm(member) {
    setEditing(member)
    setFormError('')
    setEmailTaken(false)
    setFormOpen(true)
  }

  async function handleSave(fields) {
    setSaving(true)
    setFormError('')
    setEmailTaken(false)
    try {
      if (editing) await updateMember(editing.id, fields)
      else await createMember(fields)
      await reload()
      setFormOpen(false)
      showFlash(
        'success',
        editing
          ? 'Member updated successfully.'
          : `Member added. They can log in with ${fields.email} and the default password (username@123).`,
      )
    } catch (err) {
      if (err.response?.status === 409) {
        setEmailTaken(true) // shown under the Email field
      } else {
        setFormError(friendlyError(err, editing ? 'Unable to update member.' : 'Unable to add member.'))
      }
    } finally {
      setSaving(false)
    }
  }

  // ---- Activate / Deactivate. Deactivating asks first; activating is safe to do directly.
  const [busyId, setBusyId] = useState(null)
  const [deactivateTarget, setDeactivateTarget] = useState(null)

  async function changeStatus(member, action, successText) {
    setBusyId(member.id)
    try {
      await action(member.id)
      await reload()
      showFlash('success', successText)
    } catch (err) {
      showFlash('error', friendlyError(err, 'Unable to update member status.'))
    } finally {
      setBusyId(null)
    }
  }

  const handleActivate = (m) => changeStatus(m, activateMember, `${m.name} is active again.`)
  async function confirmDeactivate() {
    await changeStatus(deactivateTarget, deactivateMember, `${deactivateTarget.name} has been deactivated.`)
    setDeactivateTarget(null)
  }

  // ---- Details pop-up
  const [viewing, setViewing] = useState(null)

  const active = members ? members.filter((m) => m.isActive).length : 0
  const term = query.trim()
  const visible = members ? (term ? members.filter((m) => matches(m, term)) : members) : []
  const rowProps = { onView: setViewing, onEdit: openForm, onDeactivate: setDeactivateTarget, onActivate: handleActivate }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Members"
        subtitle="Manage people participating in the SiddhiBoys group"
        actions={
          <>
            <RefreshButton onClick={handleRefresh} refreshing={refreshing} disabled={status === 'loading'} />
            <Button onClick={() => openForm(null)} disabled={status !== 'ready'} className="flex-1 sm:flex-none">
              <UserPlus size={16} aria-hidden="true" />
              Add Member
            </Button>
          </>
        }
      />

      {flash && (
        <Alert variant={flash.variant} onClose={clearFlash}>
          {flash.text}
        </Alert>
      )}

      {status === 'loading' && <SkeletonBlocks label="Loading members..." rows={4} statsClassName="grid-cols-3" />}

      {status === 'error' && (
        <LoadError title="Unable to load members." detail={error} onRetry={handleRefresh} retrying={refreshing} />
      )}

      {status === 'ready' && (
        <>
          {/* Counted from the member list (only MEMBER accounts; admins aren't listed) */}
          <dl className="grid grid-cols-3 gap-3">
            <StatCard label="Total members" value={members.length} />
            <StatCard label="Active" value={active} />
            <StatCard label="Inactive" value={members.length - active} />
          </dl>
          <p className="-mt-3 text-xs text-slate-500">Only active members get records when a new month is created.</p>

          <Card>
            {members.length === 0 ? (
              <EmptyState icon={Users} title="No members yet">
                <p>Add your first batch member to start managing contributions.</p>
                <Button onClick={() => openForm(null)} className="mt-4">
                  <UserPlus size={16} aria-hidden="true" />
                  Add Member
                </Button>
              </EmptyState>
            ) : (
              <>
                <SearchInput value={query} onChange={setQuery} placeholder="Search members..." label="Search members" />
                {visible.length === 0 ? (
                  <EmptyState icon={SearchX} title="No members found">
                    Try a different name or email.
                  </EmptyState>
                ) : (
                  <>
                    <div className="hidden lg:block">
                      <MemberTable members={visible} busyId={busyId} {...rowProps} />
                    </div>
                    <ul className="space-y-3 lg:hidden">
                      {visible.map((m) => (
                        <MemberCard key={m.id} member={m} busy={busyId === m.id} {...rowProps} />
                      ))}
                    </ul>
                  </>
                )}
              </>
            )}
          </Card>
        </>
      )}

      <Modal open={formOpen} title={editing ? 'Edit Member' : 'Add Member'} onClose={() => setFormOpen(false)} busy={saving}>
        <MemberForm
          member={editing}
          onSubmit={handleSave}
          onCancel={() => setFormOpen(false)}
          saving={saving}
          serverError={formError}
          emailTaken={emailTaken}
        />
      </Modal>

      <Modal open={Boolean(viewing)} title={viewing?.name ?? ''} onClose={() => setViewing(null)}>
        {viewing && <MemberDetails key={viewing.id} memberId={viewing.id} />}
      </Modal>

      <ConfirmDialog
        open={Boolean(deactivateTarget)}
        title="Deactivate member?"
        confirmLabel="Deactivate"
        confirmVariant="danger"
        loading={Boolean(busyId)}
        loadingText="Deactivating..."
        onConfirm={confirmDeactivate}
        onCancel={() => setDeactivateTarget(null)}
      >
        {deactivateTarget && (
          <>
            <p>
              <strong className="text-slate-900">{deactivateTarget.name}</strong> will no longer be included when creating new
              monthly contribution records, and won&apos;t be able to log in.
            </p>
            <p className="mt-2">Existing contribution history will remain unchanged. You can activate them again at any time.</p>
          </>
        )}
      </ConfirmDialog>
    </div>
  )
}
