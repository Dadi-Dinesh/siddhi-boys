import { useState } from 'react'
import Alert from '../Alert'
import Button from '../Button'
import Input from '../Input'
import { formatRupees, todayInputDate } from '../../utils/format'

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/ // 3000, 3000.5, 3000.50

// Quick checks before sending. The backend checks everything again and has the final say.
function validate(values) {
  const errors = {}
  if (!values.memberId) errors.memberId = 'Please choose a member.'
  const amount = values.amount.trim()
  if (!amount) errors.amount = 'Amount is required.'
  else if (!AMOUNT_PATTERN.test(amount) || Number(amount) <= 0)
    errors.amount = 'Enter a valid amount greater than 0 (up to 2 decimal places).'
  if (!values.borrowedAt) errors.borrowedAt = 'Date is required.'
  else if (values.borrowedAt > todayInputDate()) errors.borrowedAt = 'Date cannot be in the future.'
  if (values.purpose.trim().length > 300) errors.purpose = 'Purpose must be 300 characters or fewer.'
  return errors
}

// "Add Borrowed" form. `members` = active members to choose from.
export default function BorrowedForm({ members, availableBalance, onSubmit, onCancel, saving, errorText }) {
  const [values, setValues] = useState({ memberId: '', amount: '', borrowedAt: todayInputDate(), purpose: '' })
  const [errors, setErrors] = useState({})

  const update = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }))
    if (errors[field]) setErrors((errs) => ({ ...errs, [field]: undefined }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (saving) return
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    onSubmit({
      memberId: values.memberId,
      amount: values.amount.trim(), // sent as text, so no floating-point rounding
      borrowedAt: values.borrowedAt,
      purpose: values.purpose.trim(),
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
      {errorText && <Alert>{errorText}</Alert>}
      <div>
        <label htmlFor="borrowed-member" className="mb-1.5 block text-sm font-medium text-slate-700">
          Member
        </label>
        <select
          id="borrowed-member"
          value={values.memberId}
          onChange={update('memberId')}
          aria-invalid={errors.memberId ? true : undefined}
          className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            errors.memberId ? 'border-danger-600' : 'border-slate-300'
          }`}
          autoFocus
        >
          <option value="">Choose a member</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        {errors.memberId && <p className="mt-1.5 text-sm text-danger-600">{errors.memberId}</p>}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Amount"
          prefix="₹"
          inputMode="decimal"
          value={values.amount}
          onChange={update('amount')}
          error={errors.amount}
          hint={`Available balance: ${formatRupees(availableBalance)}`}
          placeholder="3000"
        />
        <Input
          label="Date"
          type="date"
          value={values.borrowedAt}
          max={todayInputDate()}
          onChange={update('borrowedAt')}
          error={errors.borrowedAt}
        />
      </div>
      <Input
        label="Purpose (optional)"
        multiline
        value={values.purpose}
        onChange={update('purpose')}
        error={errors.purpose}
        placeholder="e.g. Personal emergency"
        maxLength={300}
      />
      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" loading={saving} loadingText="Saving...">
          Add Borrowed
        </Button>
      </div>
    </form>
  )
}
