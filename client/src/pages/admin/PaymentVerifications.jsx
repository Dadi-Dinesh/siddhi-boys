import { useEffect, useState, useCallback } from 'react'
import { Banknote, CheckCircle2, Clock, CreditCard, Eye, ShieldCheck, XCircle } from 'lucide-react'
import { acceptVerification, declineVerification, listVerifications } from '../../services/paymentVerificationService'
import { getErrorMessage } from '../../services/api'
import { formatDate, formatRupees } from '../../utils/format'
import Alert from '../../components/Alert'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import Card from '../../components/Card'
import ConfirmDialog from '../../components/ConfirmDialog'
import EmptyState from '../../components/EmptyState'
import ImageModal from '../../components/ImageModal'
import Input from '../../components/Input'
import LoadError from '../../components/LoadError'
import PageHeader from '../../components/PageHeader'
import RefreshButton from '../../components/RefreshButton'
import SkeletonBlocks from '../../components/SkeletonBlocks'

export default function PaymentVerifications() {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState('ALL') // ALL, PENDING, ACCEPTED, DECLINED

  // Flash message
  const [flash, setFlash] = useState(null)

  // Modals state
  const [previewItem, setPreviewItem] = useState(null)
  const [acceptItem, setAcceptItem] = useState(null)
  const [acceptIncludeFine, setAcceptIncludeFine] = useState(false)
  const [declineItem, setDeclineItem] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const data = await listVerifications()
      setItems(data.items || [])
      setStatus('ready')
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err))
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleRefresh() {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  function handleOpenAccept(item) {
    setAcceptItem(item)
    setAcceptIncludeFine(Number(item.fineAmount || 0) > 0)
  }

  async function handleConfirmAccept() {
    if (!acceptItem) return
    setActionLoading(true)
    try {
      await acceptVerification(acceptItem.id, { includeFine: acceptIncludeFine })
      const isCash = acceptItem.paymentMethod === 'CASH'
      setFlash({
        variant: 'success',
        text: `${isCash ? 'Cash payment' : 'Payment'} verified for ${acceptItem.contribution?.member?.name || 'member'}.`,
      })
      setAcceptItem(null)
      await loadData()
    } catch (err) {
      setFlash({ variant: 'error', text: getErrorMessage(err) || 'Failed to accept verification.' })
    } finally {
      setActionLoading(false)
    }
  }

  async function handleConfirmDecline() {
    if (!declineItem) return
    setActionLoading(true)
    try {
      await declineVerification(declineItem.id, rejectionReason)
      setFlash({ variant: 'info', text: `Payment declined for ${declineItem.contribution?.member?.name || 'member'}.` })
      setDeclineItem(null)
      setRejectionReason('')
      await loadData()
    } catch (err) {
      setFlash({ variant: 'error', text: getErrorMessage(err) || 'Failed to decline verification.' })
    } finally {
      setActionLoading(false)
    }
  }

  const filteredItems = items.filter((item) => {
    if (filter === 'ALL') return true
    return item.status === filter
  })

  const pendingCount = items.filter((i) => i.status === 'PENDING').length

  return (
    <div className="space-y-6">
      <PageHeader
        documentTitle="Payment Verifications"
        title="Payment Verifications"
        subtitle="Review and verify member payment screenshots and cash payments"
        actions={<RefreshButton onClick={handleRefresh} refreshing={refreshing} disabled={status === 'loading'} />}
      />

      {flash && (
        <Alert variant={flash.variant} onClose={() => setFlash(null)}>
          {flash.text}
        </Alert>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setFilter('ALL')}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            filter === 'ALL' ? 'bg-primary-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All ({items.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('PENDING')}
          className={`relative rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            filter === 'PENDING' ? 'bg-primary-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Pending Review
          {pendingCount > 0 && (
            <span className="ml-1.5 inline-flex items-center rounded-full bg-amber-400 px-1.5 py-0.2 text-[10px] font-bold text-slate-900">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setFilter('ACCEPTED')}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            filter === 'ACCEPTED' ? 'bg-primary-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Accepted ({items.filter((i) => i.status === 'ACCEPTED').length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('DECLINED')}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            filter === 'DECLINED' ? 'bg-primary-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Declined ({items.filter((i) => i.status === 'DECLINED').length})
        </button>
      </div>

      {status === 'loading' && <SkeletonBlocks label="Loading payment verifications..." stats={3} />}

      {status === 'error' && (
        <LoadError title="Unable to load payment verifications." detail={error} onRetry={handleRefresh} retrying={refreshing} />
      )}

      {status === 'ready' && (
        <Card>
          {filteredItems.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title={filter === 'PENDING' ? 'No pending verifications' : 'No payment verifications found'}
            >
              {filter === 'PENDING'
                ? 'All member payments have been verified.'
                : 'No submissions match the selected filter.'}
            </EmptyState>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                      <th scope="col" className="py-3 pr-3 font-medium">Member</th>
                      <th scope="col" className="px-3 py-3 font-medium">Month</th>
                      <th scope="col" className="px-3 py-3 font-medium">Method</th>
                      <th scope="col" className="px-3 py-3 text-right font-medium">Base</th>
                      <th scope="col" className="px-3 py-3 text-right font-medium">Fine</th>
                      <th scope="col" className="px-3 py-3 text-right font-medium">Total Paid</th>
                      <th scope="col" className="px-3 py-3 font-medium">Payment Date</th>
                      <th scope="col" className="px-3 py-3 font-medium">Status</th>
                      <th scope="col" className="py-3 pl-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.map((item) => {
                      const memberName = item.contribution?.member?.name || 'Unknown'
                      const memberEmail = item.contribution?.member?.email || ''
                      const isPending = item.status === 'PENDING'
                      const isCash = item.paymentMethod === 'CASH'
                      const baseAmount = item.contribution ? Number(item.contribution.amount) : 0
                      const fineAmount = Number(item.fineAmount || 0)
                      const totalAmount = item.totalAmount !== null && item.totalAmount !== undefined
                        ? Number(item.totalAmount)
                        : baseAmount + fineAmount

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="py-3 pr-3">
                            <span className="font-medium text-slate-900 block">{memberName}</span>
                            <span className="text-xs text-slate-500">{memberEmail}</span>
                          </td>
                          <td className="px-3 py-3 text-slate-800 font-medium">
                            {item.contribution?.label || '—'}
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                isCash
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200/70'
                              }`}
                            >
                              {isCash ? <Banknote size={13} /> : <CreditCard size={13} />}
                              {isCash ? 'Cash' : 'Online'}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums text-slate-700">
                            {formatRupees(baseAmount)}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums">
                            {fineAmount > 0 ? (
                              <span className="font-semibold text-amber-700">+{formatRupees(fineAmount)}</span>
                            ) : (
                              <span className="text-slate-400">₹0</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right font-bold tabular-nums text-slate-900">
                            {formatRupees(totalAmount)}
                          </td>
                          <td className="px-3 py-3 text-xs text-slate-600">
                            {item.paymentDate ? (
                              <span className="font-medium text-slate-800">{formatDate(item.paymentDate)}</span>
                            ) : (
                              <span>{formatDate(item.submittedAt)}</span>
                            )}
                            {item.note && <p className="text-slate-400 italic text-[11px] mt-0.5">&quot;{item.note}&quot;</p>}
                          </td>
                          <td className="px-3 py-3">
                            <VerificationBadge status={item.status} />
                            {item.status === 'DECLINED' && item.rejectionReason && (
                              <p className="text-[11px] text-danger-600 mt-0.5">Reason: {item.rejectionReason}</p>
                            )}
                          </td>
                          <td className="py-3 pl-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {item.screenshotUrl ? (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => setPreviewItem(item)}
                                  title="View screenshot"
                                >
                                  <Eye size={14} aria-hidden="true" />
                                  Screenshot
                                </Button>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200/60 font-medium">
                                  <Banknote size={12} />
                                  No proof needed
                                </span>
                              )}

                              {isPending && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleOpenAccept(item)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                  >
                                    Accept
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="danger-outline"
                                    onClick={() => {
                                      setDeclineItem(item)
                                      setRejectionReason('')
                                    }}
                                  >
                                    Decline
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <ul className="divide-y divide-slate-100 lg:hidden">
                {filteredItems.map((item) => {
                  const memberName = item.contribution?.member?.name || 'Unknown'
                  const isPending = item.status === 'PENDING'
                  const isCash = item.paymentMethod === 'CASH'
                  const baseAmount = item.contribution ? Number(item.contribution.amount) : 0
                  const fineAmount = Number(item.fineAmount || 0)
                  const totalAmount = item.totalAmount !== null && item.totalAmount !== undefined
                    ? Number(item.totalAmount)
                    : baseAmount + fineAmount

                  return (
                    <li key={item.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{memberName}</p>
                          <p className="text-xs text-slate-500">
                            {item.contribution?.label} · {isCash ? '💵 Cash' : '💳 Online'} · {item.paymentDate ? formatDate(item.paymentDate) : formatDate(item.submittedAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900 tabular-nums">
                            {formatRupees(totalAmount)}
                          </p>
                          <div className="mt-1">
                            <VerificationBadge status={item.status} />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
                        <span>Base: {formatRupees(baseAmount)}</span>
                        {fineAmount > 0 ? (
                          <span className="text-amber-700 font-semibold">Fine: +{formatRupees(fineAmount)}</span>
                        ) : (
                          <span className="text-slate-400">Fine: ₹0</span>
                        )}
                        <span className="font-bold text-slate-900">Total: {formatRupees(totalAmount)}</span>
                      </div>

                      {isCash && !item.screenshotUrl && (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50/70 p-2 rounded-lg border border-emerald-100">
                          <Banknote size={15} className="shrink-0 text-emerald-700" />
                          <span>Cash payment (no screenshot proof required)</span>
                        </div>
                      )}

                      {item.note && (
                        <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-2 italic">
                          Note: &quot;{item.note}&quot;
                        </p>
                      )}

                      {item.rejectionReason && (
                        <p className="text-xs text-danger-700 bg-danger-50 rounded-lg p-2">
                          Declined: {item.rejectionReason}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {item.screenshotUrl && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setPreviewItem(item)}
                            className="flex-1"
                          >
                            <Eye size={14} aria-hidden="true" />
                            View Screenshot
                          </Button>
                        )}
                        {isPending && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleOpenAccept(item)}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="danger-outline"
                              onClick={() => {
                                setDeclineItem(item)
                                setRejectionReason('')
                              }}
                              className="flex-1"
                            >
                              Decline
                            </Button>
                          </>
                        )}
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
      <ImageModal
        open={Boolean(previewItem)}
        onClose={() => setPreviewItem(null)}
        imageUrl={previewItem?.screenshotUrl}
        title={`Payment: ${previewItem?.contribution?.member?.name || 'Member'}`}
        subtitle={`${previewItem?.contribution?.label || ''} · ${
          previewItem ? formatRupees(previewItem.totalAmount || previewItem.contribution?.amount) : ''
        } · Payment Date: ${previewItem?.paymentDate ? formatDate(previewItem.paymentDate) : (previewItem ? formatDate(previewItem.submittedAt) : '')}`}
      />

      {/* Accept Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(acceptItem)}
        title={acceptItem?.paymentMethod === 'CASH' ? 'Accept cash payment?' : 'Accept payment verification?'}
        confirmLabel={acceptItem?.paymentMethod === 'CASH' ? 'Accept Cash & Mark Paid' : 'Accept & Mark Paid'}
        loading={actionLoading}
        loadingText="Accepting..."
        onConfirm={handleConfirmAccept}
        onCancel={() => setAcceptItem(null)}
      >
        {acceptItem && (() => {
          const acceptBase = Number(acceptItem.contribution?.amount || 0)
          const acceptLateFineRate = Number(acceptItem.contribution?.lateFine ?? 20)
          const memberIncludedFine = Number(acceptItem.fineAmount || 0) > 0
          const acceptFinalFine = acceptIncludeFine ? acceptLateFineRate : 0
          const acceptFinalTotal = acceptBase + acceptFinalFine

          return (
            <div className="space-y-3 text-sm text-slate-600">
              <p>
                Confirm accepting {acceptItem.paymentMethod === 'CASH' ? 'cash payment' : 'payment verification'} for{' '}
                <strong className="text-slate-900">{acceptItem.contribution?.member?.name}</strong> for{' '}
                <strong className="text-slate-900">{acceptItem.contribution?.label}</strong>:
              </p>

              {/* Late fine toggle checkbox */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    id="admin-accept-fine-checkbox"
                    checked={acceptIncludeFine}
                    onChange={(e) => setAcceptIncludeFine(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-amber-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-amber-950 block text-sm">
                      Include late fine of {formatRupees(acceptLateFineRate)}
                    </span>
                    <span className="text-amber-800 mt-0.5 block">
                      Member {memberIncludedFine ? 'marked late fine in submission (+₹' + acceptLateFineRate + ')' : 'did not include late fine'}.
                      You can check or uncheck to decide whether to add the late fine to the total.
                    </span>
                  </div>
                </label>
              </div>

              <div className="rounded-lg bg-slate-50 p-3 text-xs border border-slate-200/80 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Method:</span>
                  <span className="font-semibold text-slate-900">{acceptItem.paymentMethod === 'CASH' ? '💵 Cash' : '💳 Online'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Base Contribution:</span>
                  <span className="font-semibold text-slate-900">{formatRupees(acceptBase)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Late Fine:</span>
                  <span className={`font-semibold ${acceptFinalFine > 0 ? 'text-amber-700' : 'text-slate-700'}`}>
                    {acceptFinalFine > 0 ? `+${formatRupees(acceptFinalFine)}` : '₹0 (Waived)'}
                  </span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-slate-200 font-bold text-slate-900">
                  <span>Total Collected:</span>
                  <span className="text-emerald-700 text-sm">{formatRupees(acceptFinalTotal)}</span>
                </div>
                <div className="flex justify-between pt-1 text-[11px] text-slate-500">
                  <span>Payment Date:</span>
                  <span className="font-medium text-slate-700">{acceptItem.paymentDate ? formatDate(acceptItem.paymentDate) : formatDate(acceptItem.submittedAt)}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                This will mark the contribution as <strong className="text-emerald-700">PAID</strong> and add <strong className="text-slate-900">{formatRupees(acceptFinalTotal)}</strong> to the group fund collection.
              </p>
            </div>
          )
        })()}
      </ConfirmDialog>

      {/* Decline Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(declineItem)}
        title="Decline payment verification?"
        confirmLabel="Decline Payment"
        confirmVariant="danger"
        loading={actionLoading}
        loadingText="Declining..."
        onConfirm={handleConfirmDecline}
        onCancel={() => {
          setDeclineItem(null)
          setRejectionReason('')
        }}
      >
        {declineItem && (
          <div className="space-y-3 text-sm text-slate-600">
            <p>
              Decline the payment submission from{' '}
              <strong className="text-slate-900">{declineItem.contribution?.member?.name}</strong> for{' '}
              <strong className="text-slate-900">{declineItem.contribution?.label}</strong>?
            </p>
            <p className="text-xs text-slate-500">
              The contribution will remain <strong className="text-amber-700">UNPAID</strong>. The member will be notified and can submit again.
            </p>
            <Input
              label="Reason for decline (optional)"
              placeholder={declineItem.paymentMethod === 'CASH' ? 'e.g. Cash not received yet' : 'e.g. UTR number not matching, illegible screenshot'}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              maxLength={200}
            />
          </div>
        )}
      </ConfirmDialog>
    </div>
  )
}

function VerificationBadge({ status }) {
  if (status === 'ACCEPTED') {
    return (
      <Badge variant="success" icon={CheckCircle2}>
        Verified
      </Badge>
    )
  }
  if (status === 'DECLINED') {
    return (
      <Badge variant="danger" icon={XCircle}>
        Declined
      </Badge>
    )
  }
  return (
    <Badge variant="warning" icon={Clock}>
      Pending
    </Badge>
  )
}
