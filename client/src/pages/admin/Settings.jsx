import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useGroup } from '../../hooks/useGroup'
import { useFlash } from '../../hooks/useFlash'
import { useLoad } from '../../hooks/useLoad'
import { getSettings, updateSettings } from '../../services/settingsService'
import { formatDate, formatRupees } from '../../utils/format'
import { roleLabel } from '../../utils/roles'
import Alert from '../../components/Alert'
import Card from '../../components/Card'
import ConfirmDialog from '../../components/ConfirmDialog'
import LoadError from '../../components/LoadError'
import PageHeader from '../../components/PageHeader'
import SettingsForm from '../../components/settings/SettingsForm'

function friendlyError(error) {
  const status = error.response?.status
  if (!status || status >= 500) return 'Unable to save settings. Please try again.'
  return error.response.data?.message || 'Unable to save settings. Please try again.'
}

export default function Settings() {
  const { user } = useAuth()
  const group = useGroup()
  const { status, data: settings, error, reload } = useLoad(getSettings)
  const { flash, showFlash, clearFlash } = useFlash()
  const [saving, setSaving] = useState(false)
  const [retrying, setRetrying] = useState(false)

  // Changing the amount affects future months, so it needs a confirmation first.
  const [pendingChanges, setPendingChanges] = useState(null)

  function handleSave(changes) {
    if (changes.monthlyContribution !== undefined) setPendingChanges(changes)
    else save(changes)
  }

  async function save(changes) {
    setSaving(true)
    clearFlash()
    try {
      await updateSettings(changes)
      await Promise.all([reload(), group.reload()]) // show what the server saved, everywhere (e.g. sidebar name)
      showFlash('success', 'Settings saved successfully.')
    } catch (err) {
      showFlash('error', friendlyError(err))
    } finally {
      setSaving(false)
      setPendingChanges(null)
    }
  }

  async function handleRetry() {
    setRetrying(true)
    await reload()
    setRetrying(false)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Settings" subtitle="Manage your SiddhiBoys group configuration" />

      {flash && (
        <Alert variant={flash.variant} onClose={clearFlash}>
          {flash.text}
        </Alert>
      )}

      {status === 'loading' && (
        <div aria-busy="true" className="space-y-6">
          <span className="sr-only" role="status">
            Loading settings...
          </span>
          {[1, 2].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-200/70" />
          ))}
        </div>
      )}

      {status === 'error' && (
        <LoadError title="Unable to load settings." detail={error} onRetry={handleRetry} retrying={retrying} />
      )}

      {status === 'ready' && (
        <>
          {/* key: start the form fresh from the server's values after each save */}
          <SettingsForm key={settings.updatedAt} settings={settings} onSave={handleSave} saving={saving} />
          <p className="-mt-3 text-xs text-slate-500">Last updated {formatDate(settings.updatedAt)}</p>
        </>
      )}

      <Card title="Account">
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Logged in as</dt>
            <dd className="mt-0.5 font-medium text-slate-900">{user.name}</dd>
            <dd className="break-all text-slate-600">{user.email}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Role</dt>
            <dd className="mt-0.5 font-medium text-slate-900">{roleLabel(user.role)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-slate-500">Password</dt>
            <dd className="mt-0.5 text-slate-600">Password changes are not available here yet.</dd>
          </div>
        </dl>
      </Card>

      <ConfirmDialog
        open={Boolean(pendingChanges)}
        title="Change monthly contribution?"
        confirmLabel="Confirm Change"
        loading={saving}
        loadingText="Saving..."
        onConfirm={() => save(pendingChanges)}
        onCancel={() => setPendingChanges(null)}
      >
        {pendingChanges && settings && (
          <>
            <p>
              You are changing the default monthly contribution from{' '}
              <strong className="text-slate-900">{formatRupees(settings.monthlyContribution)}</strong> to{' '}
              <strong className="text-slate-900">{formatRupees(Number(pendingChanges.monthlyContribution))}</strong>.
            </p>
            <p className="mt-2">This will affect future monthly contribution records. Existing months will remain unchanged.</p>
          </>
        )}
      </ConfirmDialog>
    </div>
  )
}
