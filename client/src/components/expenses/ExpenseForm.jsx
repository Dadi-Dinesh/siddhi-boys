import { useState } from 'react'
import Alert from '../Alert'
import Button from '../Button'
import Input from '../Input'
import { todayInputDate } from '../../utils/format'

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/ // 800, 800.5, 800.50
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

// "2026-02-31" matches the pattern but isn't a real day, so check the parts survive a round trip.
function isRealDate(text) {
  if (!DATE_PATTERN.test(text)) return false
  const [y, m, d] = text.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
}

// Quick checks before sending. The backend checks everything again and has the final say.
function validate(values) {
  const errors = {}
  if (!values.title.trim()) errors.title = 'Expense title is required.'
  else if (values.title.trim().length > 100) errors.title = 'Title must be 100 characters or fewer.'

  if (values.description.trim().length > 500) errors.description = 'Description must be 500 characters or fewer.'

  const amount = values.amount.trim()
  if (!amount) errors.amount = 'Amount is required.'
  else if (!AMOUNT_PATTERN.test(amount) || Number(amount) <= 0)
    errors.amount = 'Enter a valid amount greater than 0 (up to 2 decimal places).'
  else if (Number(amount) > 99999999.99) errors.amount = 'Amount is too large.'

  if (!values.date) errors.date = 'Date is required.'
  else if (!isRealDate(values.date)) errors.date = 'Please choose a valid date.'

  return errors
}

// Used for both "Add Expense" and "Edit Expense".
//   expense   → existing expense when editing (null when adding)
//   onSubmit  → async function given { title, description, amount, date }. Throws on failure.
//   errorText → message from the page if saving failed
export default function ExpenseForm({ expense, onSubmit, onCancel, saving, errorText }) {
  const [values, setValues] = useState(() => ({
    title: expense?.title ?? '',
    description: expense?.description ?? '',
    amount: expense ? String(expense.amount) : '',
    date: expense?.date ?? todayInputDate(),
  }))
  const [errors, setErrors] = useState({})

  const update = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }))
    if (errors[field]) setErrors((errs) => ({ ...errs, [field]: undefined })) // clear error as they fix it
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (saving) return // never submit twice
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    onSubmit({
      title: values.title.trim(),
      description: values.description.trim(),
      amount: values.amount.trim(), // sent as text ("800.50"), so no floating-point rounding
      date: values.date,
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
      {errorText && <Alert>{errorText}</Alert>}
      <Input
        label="Expense title"
        value={values.title}
        onChange={update('title')}
        error={errors.title}
        placeholder="e.g. Birthday Cake"
        maxLength={100}
        autoFocus
      />
      <Input
        label="Description (optional)"
        multiline
        value={values.description}
        onChange={update('description')}
        error={errors.description}
        placeholder="e.g. Cake for Rahul's birthday"
        maxLength={500}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Amount"
          prefix="₹"
          inputMode="decimal"
          value={values.amount}
          onChange={update('amount')}
          error={errors.amount}
          placeholder="800"
        />
        <Input label="Date" type="date" value={values.date} onChange={update('date')} error={errors.date} />
      </div>
      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" loading={saving} loadingText="Saving...">
          {expense ? 'Save Changes' : 'Add Expense'}
        </Button>
      </div>
    </form>
  )
}
