import { useState } from 'react'
import { Calendar, CircleDot } from 'lucide-react'
import Button from '../Button'
import Card from '../Card'
import Input from '../Input'
import { formatDateLong, formatRupees } from '../../utils/format'

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/ // 100, 99.5, 99.50

function validate(values) {
  const errors = {}
  const name = values.groupName.trim()
  if (!name) errors.groupName = 'Group name is required.'
  else if (name.length > 100) errors.groupName = 'Group name must be 100 characters or fewer.'

  const amount = values.monthlyContribution.trim()
  if (!amount) errors.monthlyContribution = 'Monthly contribution is required.'
  else if (!AMOUNT_PATTERN.test(amount) || Number(amount) <= 0)
    errors.monthlyContribution = 'Enter a valid amount greater than 0 (up to 2 decimal places).'
  else if (Number(amount) > 99999999.99) errors.monthlyContribution = 'Amount is too large.'

  const fine = values.fineAmount.trim()
  if (fine === '') errors.fineAmount = 'Late fine is required.'
  else if (!AMOUNT_PATTERN.test(fine) || Number(fine) < 0)
    errors.fineAmount = 'Enter a valid non-negative amount (up to 2 decimal places).'
  else if (Number(fine) > 99999999.99) errors.fineAmount = 'Fine is too large.'

  if (!values.dueDate) {
    errors.dueDate = 'Payment due date is required.'
  }

  return errors
}

export default function SettingsForm({ settings, onSave, saving }) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const initialDueDay = settings.dueDay || 10
  const initialDueDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(initialDueDay).padStart(2, '0')}`

  const original = {
    groupName: settings.groupName,
    monthlyContribution: String(settings.monthlyContribution),
    dueDate: initialDueDate,
    fineAmount: String(settings.fineAmount ?? 20),
    applyToCurrentMonth: true,
  }

  const [values, setValues] = useState(original)
  const [errors, setErrors] = useState({})

  const update = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setValues((v) => ({ ...v, [field]: val }))
    if (errors[field]) setErrors((errs) => ({ ...errs, [field]: undefined }))
  }

  const nameChanged = values.groupName.trim() !== settings.groupName
  const amountChanged =
    values.monthlyContribution.trim() !== '' && Number(values.monthlyContribution) !== settings.monthlyContribution
  const amountEdited = values.monthlyContribution.trim() !== original.monthlyContribution
  const fineChanged =
    values.fineAmount.trim() !== '' && Number(values.fineAmount) !== Number(settings.fineAmount ?? 20)
  const dueDateChanged = values.dueDate !== original.dueDate
  const hasChanges = nameChanged || amountChanged || (amountEdited && !values.monthlyContribution.trim()) || fineChanged || dueDateChanged

  function handleSubmit(event) {
    event.preventDefault()
    if (saving || !hasChanges) return
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    const changes = {}
    if (nameChanged) changes.groupName = values.groupName.trim()
    if (amountChanged) changes.monthlyContribution = values.monthlyContribution.trim()
    if (fineChanged) changes.fineAmount = values.fineAmount.trim()
    if (dueDateChanged) {
      changes.dueDate = values.dueDate
      const d = new Date(`${values.dueDate}T00:00:00Z`)
      changes.dueDay = d.getUTCDate()
    }

    if (values.applyToCurrentMonth) {
      const d = new Date(`${values.dueDate}T00:00:00Z`)
      changes.month = d.getUTCMonth() + 1
      changes.year = d.getUTCFullYear()
    }

    onSave(changes)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <Card title="Group information">
        <Input
          label="Group name"
          value={values.groupName}
          onChange={update('groupName')}
          error={errors.groupName}
          maxLength={100}
          hint="This name is shown on the dashboard and to members."
        />
      </Card>

      <Card title="Contribution Deadline & Fine">
        <div className="space-y-4">
          <Input
            label="Contribution Amount"
            prefix="₹"
            inputMode="decimal"
            value={values.monthlyContribution}
            onChange={update('monthlyContribution')}
            error={errors.monthlyContribution}
            hint="Base contribution required from each member."
            className="sm:max-w-xs"
          />

          <div>
            <Input
              type="date"
              label="Payment Due Date"
              value={values.dueDate}
              onChange={update('dueDate')}
              error={errors.dueDate}
              hint={`Payments on or before ${formatDateLong(values.dueDate)} have ₹0 fine. Payments after incur late fine.`}
              className="sm:max-w-xs"
            />
            {values.dueDate && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                <Calendar size={13} className="text-primary-600" />
                Due Date: <span className="text-slate-900 font-semibold">{formatDateLong(values.dueDate)}</span>
              </p>
            )}
          </div>

          <Input
            label="Late Fine"
            prefix="₹"
            inputMode="decimal"
            value={values.fineAmount}
            onChange={update('fineAmount')}
            error={errors.fineAmount}
            hint="Additional contribution money collected from the member for payments made after the due date. Fines are NOT expenses."
            className="sm:max-w-xs"
          />

          {/* Example preview banner */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3.5 text-xs text-slate-700 space-y-1">
            <p className="font-semibold text-slate-900">How payment calculation works:</p>
            <p>• On or before {formatDateLong(values.dueDate)}: {formatRupees(values.monthlyContribution || 100)} (Fine: ₹0)</p>
            <p>• After {formatDateLong(values.dueDate)}: {formatRupees(Number(values.monthlyContribution || 100) + Number(values.fineAmount || 20))} (Base: {formatRupees(values.monthlyContribution || 100)} + Fine: {formatRupees(values.fineAmount || 20)})</p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="applyToCurrentMonth"
              checked={values.applyToCurrentMonth}
              onChange={update('applyToCurrentMonth')}
              className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="applyToCurrentMonth" className="text-xs text-slate-700">
              Apply these deadline & fine rules to unpaid contributions of the selected month
            </label>
          </div>
        </div>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        {hasChanges && (
          <p className="flex items-center gap-1.5 text-sm text-warning-700" role="status">
            <CircleDot size={14} aria-hidden="true" />
            You have unsaved changes.
          </p>
        )}
        {hasChanges && (
          <Button
            variant="secondary"
            onClick={() => {
              setValues(original)
              setErrors({})
            }}
            disabled={saving}
          >
            Discard
          </Button>
        )}
        <Button type="submit" loading={saving} loadingText="Saving..." disabled={!hasChanges}>
          Save Settings
        </Button>
      </div>
    </form>
  )
}
