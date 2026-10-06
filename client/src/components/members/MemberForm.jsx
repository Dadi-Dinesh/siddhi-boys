import { useState } from 'react'
import Alert from '../Alert'
import Button from '../Button'
import Input from '../Input'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^[+\d][\d\s-]{6,19}$/
const MIN_PASSWORD = 8

// Quick checks before sending (same rules as the backend, which checks again).
function validate(values, isEdit) {
  const errors = {}
  const name = values.name.trim()
  if (!name) errors.name = 'Name is required.'
  else if (name.length > 100) errors.name = 'Name must be 100 characters or fewer.'

  if (!values.email.trim()) errors.email = 'Email is required.'
  else if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Please enter a valid email address.'

  if (values.phone.trim() && !PHONE_PATTERN.test(values.phone.trim())) errors.phone = 'Please enter a valid phone number.'

  // Password is required for a new member; when editing, blank means "keep current password".
  if (!isEdit && !values.password) errors.password = 'Password is required.'
  else if (values.password && values.password.length < MIN_PASSWORD)
    errors.password = `Password must be at least ${MIN_PASSWORD} characters.`
  else if (values.password.length > 72) errors.password = 'Password must be 72 characters or fewer.'

  return errors
}

// Used for "Add Member" and "Edit Member".
//   member     → existing member when editing (null when adding)
//   onSubmit   → given the fields to send
//   serverError / emailTaken → shown when the backend rejects the save
export default function MemberForm({ member, onSubmit, onCancel, saving, serverError, emailTaken }) {
  const isEdit = Boolean(member)
  const [values, setValues] = useState(() => ({
    name: member?.name ?? '',
    email: member?.email ?? '',
    phone: member?.phone ?? '',
    password: '', // never pre-filled: the app never receives existing passwords
    isActive: member ? String(member.isActive) : 'true',
  }))
  const [errors, setErrors] = useState({})

  const update = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }))
    if (errors[field]) setErrors((errs) => ({ ...errs, [field]: undefined }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (saving) return // never submit twice
    const found = validate(values, isEdit)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    const fields = {
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      phone: values.phone.trim(),
    }
    if (values.password) fields.password = values.password
    if (isEdit) fields.isActive = values.isActive === 'true'
    onSubmit(fields)
  }

  const deactivating = isEdit && member.isActive && values.isActive === 'false'

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
      {serverError && <Alert>{serverError}</Alert>}
      <Input label="Name" value={values.name} onChange={update('name')} error={errors.name} placeholder="e.g. Rahul Kumar" maxLength={100} autoFocus />
      <Input
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="off"
        value={values.email}
        onChange={update('email')}
        error={errors.email || (emailTaken ? 'A member with this email already exists.' : undefined)}
        placeholder="rahul@example.com"
      />
      <Input
        label="Phone (optional)"
        type="tel"
        value={values.phone}
        onChange={update('phone')}
        error={errors.phone}
        placeholder="+91 98765 43210"
      />
      <Input
        label={isEdit ? 'New password (optional)' : 'Password'}
        type="password"
        autoComplete="new-password"
        value={values.password}
        onChange={update('password')}
        error={errors.password}
        hint={isEdit ? 'Leave blank to keep the current password.' : `At least ${MIN_PASSWORD} characters. Share it with the member privately.`}
      />

      {/* Role is fixed: this page only manages regular members (the server enforces it). */}
      <div>
        <p className="mb-1.5 text-sm font-medium text-slate-700">Role</p>
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">Member</p>
        <p className="mt-1.5 text-xs text-slate-500">Members can only view their own payments and the group summary.</p>
      </div>

      {isEdit && (
        <div>
          <label htmlFor="member-status" className="mb-1.5 block text-sm font-medium text-slate-700">
            Status
          </label>
          <select
            id="member-status"
            value={values.isActive}
            onChange={update('isActive')}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          {deactivating && (
            <p className="mt-1.5 text-xs text-warning-700">
              Inactive members can't log in and won't get records in new months. Their past contributions stay unchanged.
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" loading={saving} loadingText="Saving...">
          {isEdit ? 'Save Changes' : 'Add Member'}
        </Button>
      </div>
    </form>
  )
}
