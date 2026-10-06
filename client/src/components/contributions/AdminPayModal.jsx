import { useState, useRef, useEffect } from 'react'
import { UploadCloud, X, ImageIcon } from 'lucide-react'
import { formatRupees, todayInputDate, formatDateLong } from '../../utils/format'
import Modal from '../Modal'
import Button from '../Button'
import Input from '../Input'
import Alert from '../Alert'

export default function AdminPayModal({ open, onClose, contribution, onSubmit, loading }) {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [paymentDate, setPaymentDate] = useState(todayInputDate())
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setPaymentDate(todayInputDate())
      setError('')
    }
  }, [open])

  function handleFileChange(e) {
    const selected = e.target.files?.[0]
    if (!selected) return

    if (!selected.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, WebP)')
      return
    }

    if (selected.size > 5 * 1024 * 1024) {
      setError('File size must be 5MB or smaller')
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

  function handleClose() {
    if (loading) return
    handleRemoveFile()
    setPaymentDate(todayInputDate())
    setNote('')
    setError('')
    onClose()
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
    await onSubmit({ contributionId: contribution.id, file, paymentDate, note })
    handleClose()
  }

  if (!contribution) return null

  // Calculate fine dynamically based on paymentDate vs dueDate
  const baseAmount = Number(contribution.amount)
  const isLate = Boolean(contribution.dueDate && paymentDate > contribution.dueDate)
  const fineAmount = isLate ? Number(contribution.lateFine ?? 20) : 0
  const totalAmount = baseAmount + fineAmount

  return (
    <Modal open={open} onClose={handleClose} title="Verify & Record Payment" busy={loading}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        {/* Member and payment summary */}
        <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/80 text-sm space-y-2">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
            <span className="text-slate-500">Member:</span>
            <span className="font-bold text-slate-900">{contribution.member?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Month:</span>
            <span className="font-medium text-slate-800">{contribution.label}</span>
          </div>
          {contribution.dueDate && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Payment Due Date:</span>
              <span className="font-medium text-slate-700">{contribution.dueDateLabel || formatDateLong(contribution.dueDate)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-500">Base Contribution:</span>
            <span className="font-semibold text-slate-900">{formatRupees(baseAmount)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Late Fine:</span>
            <span className={`font-semibold ${isLate ? 'text-amber-700' : 'text-slate-700'}`}>
              {formatRupees(fineAmount)}
              {isLate && <span className="ml-1 text-[11px] font-normal text-amber-600">(Paid after due date)</span>}
            </span>
          </div>
          <div className="flex justify-between pt-2 border-t border-slate-200/60 text-base">
            <span className="font-bold text-slate-900">Total:</span>
            <span className="font-extrabold text-primary-700">{formatRupees(totalAmount)}</span>
          </div>
        </div>

        {/* Payment Date input */}
        <div>
          <Input
            type="date"
            label="Payment Date"
            value={paymentDate}
            max={todayInputDate()}
            onChange={(e) => setPaymentDate(e.target.value)}
            hint={isLate ? `Payment is after due date (${contribution.dueDateLabel || formatDateLong(contribution.dueDate)}). Late fine applies.` : 'Payment is on or before due date. No fine applies.'}
            required
          />
        </div>

        {/* Screenshot Upload (Required) */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Payment Screenshot <span className="text-danger-600">*</span>
          </label>

          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-xl hover:border-primary-500 cursor-pointer bg-slate-50/50 hover:bg-primary-50/20 transition-colors"
            >
              <UploadCloud size={28} className="text-slate-400 mb-1.5" />
              <p className="text-sm font-medium text-slate-700">Click to upload payment screenshot</p>
              <p className="text-xs text-slate-400 mt-0.5">PNG, JPG, or WebP up to 5MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="relative rounded-xl border border-slate-200 p-2.5 bg-slate-50 flex items-center justify-between">
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
                  <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                disabled={loading}
                className="p-1 rounded-md text-slate-400 hover:text-danger-600 hover:bg-slate-200"
              >
                <X size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Optional Note */}
        <Input
          label="Note (optional)"
          placeholder="e.g. Paid via UPI / cash verification reference"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={200}
        />

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-slate-100">
          <Button variant="secondary" type="button" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} loadingText="Verifying..." disabled={!file}>
            Confirm Payment
          </Button>
        </div>
      </form>
    </Modal>
  )
}
