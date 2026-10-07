import { useState, useRef } from 'react'
import { AlertCircle, CheckCircle2, Clock, Eye, ImageIcon, RotateCcw, UploadCloud, X, XCircle } from 'lucide-react'
import { submitPaymentVerification } from '../../services/paymentVerificationService'
import { getErrorMessage } from '../../services/api'
import { formatDate, formatDateLong, formatRupees, todayInputDate } from '../../utils/format'
import Alert from '../Alert'
import Badge from '../Badge'
import Button from '../Button'
import Card from '../Card'
import ImageModal from '../ImageModal'
import Input from '../Input'

export default function MemberPaymentActionCard({ record, onSubmitted }) {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [paymentDate, setPaymentDate] = useState(todayInputDate())
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isResubmitting, setIsResubmitting] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const fileInputRef = useRef(null)

  if (!record) return null

  const isPaid = record.status === 'PAID'
  const verification = record.verification
  const isPending = !isPaid && verification?.status === 'PENDING'
  const isDeclined = !isPaid && verification?.status === 'DECLINED'

  function handleFileChange(e) {
    const selected = e.target.files?.[0]
    if (!selected) return

    if (!selected.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG, or WebP).')
      return
    }

    if (selected.size > 4 * 1024 * 1024) {
      setError('File size must be 4MB or smaller.')
      return
    }

    setError('')
    setFile(selected)
    setPreviewUrl(URL.createObjectURL(selected))
  }

  function handleRemoveFile() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!paymentDate) {
      setError('Payment date is required.')
      return
    }
    if (paymentDate > todayInputDate()) {
      setError('Payment date cannot be in the future.')
      return
    }
    if (!file) {
      setError('Payment screenshot is required.')
      return
    }

    setError('')
    setSubmitting(true)

    try {
      await submitPaymentVerification({
        contributionId: record.id,
        file,
        paymentDate,
        note,
      })
      handleRemoveFile()
      setPaymentDate(todayInputDate())
      setNote('')
      setIsResubmitting(false)
      setSuccess('Payment screenshot submitted successfully! An admin will verify it.')
      if (onSubmitted) await onSubmitted()
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to submit payment verification.')
    } finally {
      setSubmitting(false)
    }
  }

  // Dynamic fine calculation for unpaid payment form
  const baseAmount = Number(record.amount)
  const isLate = Boolean(record.dueDate && paymentDate > record.dueDate)
  const fineAmount = isLate ? Number(record.lateFine ?? 20) : 0
  const totalPayable = baseAmount + fineAmount

  // CASE 1: Paid
  if (isPaid) {
    const paidFine = Number(record.fineAmount || 0)
    const paidTotal = Number(record.totalPaidAmount || (baseAmount + paidFine))
    const displayDate = record.paymentDate ? formatDate(record.paymentDate) : (record.paidAt ? formatDate(record.paidAt) : null)

    return (
      <Card className="border-emerald-200/70 bg-gradient-to-r from-emerald-50/50 to-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 size={22} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900">Current Month Paid</h3>
                <Badge variant="success">PAID</Badge>
              </div>
              <p className="mt-0.5 text-sm text-slate-600">
                Your contribution for {record.label} is paid{displayDate ? ` on ${displayDate}` : ''}.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-700 bg-emerald-50/60 rounded-lg p-2.5 border border-emerald-100">
                <span>Base: <strong>{formatRupees(baseAmount)}</strong></span>
                {paidFine > 0 && <span className="text-amber-800">Late Fine: <strong>+{formatRupees(paidFine)}</strong></span>}
                <span className="text-emerald-900 font-bold">Total Paid: {formatRupees(paidTotal)}</span>
              </div>
            </div>
          </div>
          {verification?.screenshotUrl && (
            <>
              <Button size="sm" variant="secondary" onClick={() => setPreviewModalOpen(true)}>
                <Eye size={14} aria-hidden="true" />
                View Screenshot
              </Button>
              <ImageModal
                open={previewModalOpen}
                onClose={() => setPreviewModalOpen(false)}
                imageUrl={verification.screenshotUrl}
                title={`Payment Receipt · ${record.label}`}
                subtitle={`Total: ${formatRupees(paidTotal)} · Paid on ${displayDate || '—'}`}
              />
            </>
          )}
        </div>
      </Card>
    )
  }

  // CASE 3: Payment Verification Pending
  if (isPending) {
    const pendingTotal = Number(verification?.totalAmount || record.totalPaidAmount || record.amount)
    const pendingFine = Number(verification?.fineAmount || 0)
    const payDate = verification?.paymentDate ? formatDate(verification.paymentDate) : null

    return (
      <Card className="border-amber-200/80 bg-gradient-to-r from-amber-50/40 to-white">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Clock size={22} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900">Payment Verification Pending</h3>
                  <Badge variant="warning">PENDING VERIFICATION</Badge>
                </div>
                <p className="mt-0.5 text-sm text-slate-600">
                  Your payment screenshot has been submitted. An admin will verify it.
                </p>
              </div>
            </div>
            {verification?.screenshotUrl && (
              <Button size="sm" variant="secondary" onClick={() => setPreviewModalOpen(true)}>
                <Eye size={14} aria-hidden="true" />
                View Submitted Screenshot
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl bg-white p-3.5 border border-slate-200/80 text-sm">
            <div>
              <p className="text-xs text-slate-500 font-medium">Month</p>
              <p className="font-semibold text-slate-900">{record.label}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Base Contribution</p>
              <p className="font-semibold text-slate-900 tabular-nums">{formatRupees(baseAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Late Fine</p>
              <p className="font-semibold text-amber-700 tabular-nums">{pendingFine > 0 ? `+${formatRupees(pendingFine)}` : '₹0'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Paid</p>
              <p className="font-bold text-slate-900 tabular-nums">{formatRupees(pendingTotal)}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 bg-amber-50/60 p-2.5 rounded-lg border border-amber-100">
            <span>Payment Date: <strong>{payDate || '—'}</strong></span>
            <span>Submitted On: {formatDate(verification?.submittedAt)}</span>
          </div>

          {verification?.note && (
            <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              Note: &quot;{verification.note}&quot;
            </p>
          )}

          {verification?.screenshotUrl && (
            <ImageModal
              open={previewModalOpen}
              onClose={() => setPreviewModalOpen(false)}
              imageUrl={verification.screenshotUrl}
              title={`Submitted Payment Screenshot · ${record.label}`}
              subtitle={`Total: ${formatRupees(pendingTotal)} · Payment Date: ${payDate || '—'}`}
            />
          )}
        </div>
      </Card>
    )
  }

  // CASE 4: Payment Verification Declined (not currently resubmitting)
  if (isDeclined && !isResubmitting) {
    return (
      <Card className="border-danger-200/80 bg-gradient-to-r from-danger-50/30 to-white">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-danger-100 text-danger-700">
              <XCircle size={22} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900">Payment Verification Declined</h3>
                <Badge variant="danger">DECLINED</Badge>
              </div>
              <p className="mt-0.5 text-sm text-slate-600">
                Your payment submission for {record.label} ({formatRupees(record.amount)}) was declined by an admin.
              </p>
              {verification?.rejectionReason && (
                <div className="mt-2 rounded-lg bg-danger-50 p-2.5 text-xs text-danger-800 border border-danger-200/60">
                  <strong>Reason:</strong> {verification.rejectionReason}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <Button onClick={() => setIsResubmitting(true)}>
              <RotateCcw size={15} aria-hidden="true" />
              Submit New Payment Screenshot
            </Button>
            {verification?.screenshotUrl && (
              <Button variant="secondary" onClick={() => setPreviewModalOpen(true)}>
                <Eye size={15} aria-hidden="true" />
                View Previous Screenshot
              </Button>
            )}
          </div>

          {verification?.screenshotUrl && (
            <ImageModal
              open={previewModalOpen}
              onClose={() => setPreviewModalOpen(false)}
              imageUrl={verification.screenshotUrl}
              title={`Declined Screenshot · ${record.label}`}
              subtitle={`Reason: ${verification.rejectionReason || 'No reason provided'}`}
            />
          )}
        </div>
      </Card>
    )
  }

  // CASE 2: Payment Required (Unpaid, upload screenshot form)
  return (
    <Card className="border-primary-200/80 bg-gradient-to-b from-primary-50/20 to-white shadow-md">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
            <AlertCircle size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-slate-900 text-lg">Your contribution for this month is pending</h3>
              <Badge variant="warning">PENDING</Badge>
            </div>
            <p className="mt-0.5 text-sm text-slate-600">
              Please pay your monthly contribution and upload the payment confirmation screenshot for admin verification.
            </p>
          </div>
        </div>

        {/* Contribution & Fine details banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl bg-slate-50 p-4 border border-slate-200/80 text-sm">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Contribution</span>
            <span className="font-bold text-slate-900 text-base">{formatRupees(baseAmount)}</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Payment Due Date</span>
            <span className="font-semibold text-slate-800 text-sm">
              {record.dueDateLabel || (record.dueDate ? formatDateLong(record.dueDate) : '—')}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Late Fine</span>
            <span className={`font-bold text-base tabular-nums ${isLate ? 'text-amber-700' : 'text-slate-600'}`}>
              {isLate ? formatRupees(fineAmount) : '₹0'}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Total Payable</span>
            <span className="font-extrabold text-primary-700 text-base tabular-nums">{formatRupees(totalPayable)}</span>
          </div>
        </div>

        {/* Fine status message */}
        {isLate ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900 flex items-center justify-between">
            <span>Late payment fine: <strong>{formatRupees(fineAmount)}</strong></span>
            <span className="font-bold">Total payable: {formatRupees(totalPayable)}</span>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 flex items-center justify-between">
            <span>Payment is on or before due date ({record.dueDateLabel || (record.dueDate ? formatDateLong(record.dueDate) : '—')}). Fine: <strong>₹0</strong></span>
            <span className="font-bold text-slate-900">Total payable: {formatRupees(totalPayable)}</span>
          </div>
        )}

        {success && <Alert variant="success">{success}</Alert>}
        {error && <Alert variant="error">{error}</Alert>}

        {/* Submission Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Payment Date Field */}
          <div>
            <Input
              type="date"
              label="Payment Date"
              value={paymentDate}
              max={todayInputDate()}
              onChange={(e) => setPaymentDate(e.target.value)}
              hint="Enter the actual date the payment was completed (cannot be a future date)."
              required
            />
            {paymentDate && (
              <p className="mt-1 text-xs text-slate-500">
                Declared payment date: <strong className="text-slate-800">{formatDateLong(paymentDate)}</strong>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1.5">
              Upload Payment Screenshot <span className="text-danger-600">*</span>
            </label>

            {!file ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-xl hover:border-primary-500 cursor-pointer bg-white hover:bg-primary-50/20 transition-all text-center"
              >
                <UploadCloud size={32} className="text-primary-600 mb-1.5" />
                <p className="text-sm font-semibold text-slate-800">Click to upload payment screenshot</p>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG, or WebP up to 4MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="h-12 w-12 object-cover rounded-lg border border-slate-200 shrink-0"
                    />
                  ) : (
                    <ImageIcon size={24} className="text-slate-400 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  disabled={submitting}
                  className="p-1 rounded-md text-slate-400 hover:text-danger-600 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>
            )}
          </div>

          <Input
            label="Payment note / Reference (optional)"
            placeholder="e.g. Paid via Google Pay, UPI Ref: 123456789"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
          />

          <div className="flex items-center gap-2 pt-2">
            <Button
              type="submit"
              loading={submitting}
              loadingText="Submitting..."
              disabled={!file}
              className="w-full sm:w-auto"
            >
              Submit Payment
            </Button>
            {isDeclined && isResubmitting && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsResubmitting(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </div>
    </Card>
  )
}
