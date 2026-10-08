import { useState, useRef, useEffect } from 'react'
import { UploadCloud, X, ImageIcon, Banknote, CreditCard } from 'lucide-react'
import { formatRupees, todayInputDate, formatDateLong } from '../../utils/format'
import Modal from '../Modal'
import Button from '../Button'
import Input from '../Input'
import Alert from '../Alert'

export default function AdminPayModal({ open, onClose, contribution, onSubmit, loading }) {
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [paymentDate, setPaymentDate] = useState(todayInputDate())
  const [note, setNote] = useState('')
  const [includeFine, setIncludeFine] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setPaymentMethod('CASH')
      setPaymentDate(todayInputDate())
      setIncludeFine(false)
      setError('')
      setFile(null)
      setPreviewUrl(null)
      setNote('')
    }
  }, [open])

  function handleFileChange(e) {
    const selected = e.target.files?.[0]
    if (!selected) return

    if (!selected.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, WebP)')
      return
    }

    if (selected.size > 4 * 1024 * 1024) {
      setError('File size must be 4MB or smaller')
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
    setIncludeFine(false)
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
    if (paymentMethod === 'ONLINE' && !file) {
      setError('Payment screenshot is required for online payments.')
      return
    }
    setError('')
    await onSubmit({
      contributionId: contribution.id,
      paymentMethod,
      file: paymentMethod === 'ONLINE' ? file : null,
      paymentDate,
      note,
      includeFine: isLate && includeFine,
    })
    handleClose()
  }

  if (!contribution) return null

  // Calculate fine dynamically based on paymentDate vs dueDate
  const baseAmount = Number(contribution.amount)
  const isLate = Boolean(contribution.dueDate && paymentDate > contribution.dueDate)
  const lateFineAmount = Number(contribution.lateFine ?? 20)
  const fineAmount = isLate && includeFine ? lateFineAmount : 0
  const totalAmount = baseAmount + fineAmount

  return (
    <Modal open={open} onClose={handleClose} title="Record Payment" busy={loading}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        {/* Payment Method Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Payment Method
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setPaymentMethod('CASH')
                setError('')
                handleRemoveFile()
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                paymentMethod === 'CASH'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Banknote size={17} />
              <span>Cash Payment</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPaymentMethod('ONLINE')
                setError('')
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                paymentMethod === 'ONLINE'
                  ? 'bg-white text-primary-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCard size={17} />
              <span>Online / Screenshot</span>
            </button>
          </div>
        </div>

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
            <span className={`font-semibold ${isLate && includeFine ? 'text-amber-700' : 'text-slate-700'}`}>
              {isLate ? (includeFine ? formatRupees(fineAmount) : '₹0 (Waived)') : '₹0'}
              {isLate && includeFine && <span className="ml-1 text-[11px] font-normal text-amber-600">(Applied)</span>}
            </span>
          </div>
          <div className="flex justify-between pt-2 border-t border-slate-200/60 text-base">
            <span className="font-bold text-slate-900">Total:</span>
            <span className="font-extrabold text-primary-700">{formatRupees(totalAmount)}</span>
          </div>
        </div>

        {/* Cash info notice */}
        {paymentMethod === 'CASH' && (
          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-3 text-xs text-emerald-950 flex items-center gap-2.5">
            <Banknote size={18} className="text-emerald-700 shrink-0" />
            <span>
              <strong>Cash payment:</strong> No screenshot proof is required. Marking this paid will update the contribution record directly.
            </span>
          </div>
        )}

        {/* Payment Date input */}
        <div>
          <Input
            type="date"
            label={paymentMethod === 'CASH' ? 'Cash Received Date' : 'Payment Date'}
            value={paymentDate}
            max={todayInputDate()}
            onChange={(e) => setPaymentDate(e.target.value)}
            hint={isLate ? `Payment date is after due date (${contribution.dueDateLabel || formatDateLong(contribution.dueDate)}).` : 'Payment is on or before due date. No fine applies.'}
            required
          />
        </div>

        {/* Optional Late Fine Checkbox */}
        {isLate && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                id="admin-pay-include-fine"
                checked={includeFine}
                onChange={(e) => setIncludeFine(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-amber-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-semibold text-amber-950 block text-sm">
                  Apply late fine of {formatRupees(lateFineAmount)}
                </span>
                <span className="text-amber-800 mt-0.5 block">
                  Payment date is after due date ({contribution.dueDateLabel || formatDateLong(contribution.dueDate)}).
                  Check this box if member paid the late fine.
                </span>
              </div>
            </label>
          </div>
        )}

        {/* Screenshot Upload (Only when ONLINE) */}
        {paymentMethod === 'ONLINE' && (
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
                <p className="text-xs text-slate-400 mt-0.5">PNG, JPG, or WebP up to 4MB</p>
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
        )}

        {/* Optional Note */}
        <Input
          label="Note (optional)"
          placeholder={paymentMethod === 'CASH' ? 'e.g. Received cash from member in person' : 'e.g. Paid via UPI / verification reference'}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={200}
        />

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-slate-100">
          <Button variant="secondary" type="button" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            loadingText="Recording..."
            disabled={paymentMethod === 'ONLINE' && !file}
            className={paymentMethod === 'CASH' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
          >
            {paymentMethod === 'CASH' ? 'Confirm Cash Payment' : 'Confirm Payment'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
