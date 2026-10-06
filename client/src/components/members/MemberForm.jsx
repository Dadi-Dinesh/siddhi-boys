import { useRef, useState } from 'react'
import { Camera, Trash2, UploadCloud } from 'lucide-react'
import Alert from '../Alert'
import Avatar from '../Avatar'
import Button from '../Button'
import Input from '../Input'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const INDIAN_PHONE_PATTERN = /^(?:(?:\+91|91|0)?[6-9]\d{9})$/
const MIN_PASSWORD = 8

// Quick checks before sending (same rules as the backend, which checks again).
function validate(values, isEdit) {
  const errors = {}
  const name = values.name.trim()
  if (!name) errors.name = 'Name is required.'
  else if (name.length > 100) errors.name = 'Name must be 100 characters or fewer.'

  if (!values.email.trim()) errors.email = 'Email is required.'
  else if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Please enter a valid email address.'

  const phoneStr = (values.phoneNumber || values.phone || '').trim()
  const cleanDigits = phoneStr.replace(/[\s-]/g, '')
  if (!phoneStr) {
    if (!isEdit) {
      errors.phoneNumber = 'Phone number is required.'
    }
  } else if (!INDIAN_PHONE_PATTERN.test(cleanDigits)) {
    errors.phoneNumber = 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210 or +91 98765 43210).'
  }

  // New members get a default password from the server. When editing, the admin may set a
  // new one; blank means "keep current password".
  if (isEdit && values.password && values.password.length < MIN_PASSWORD)
    errors.password = `Password must be at least ${MIN_PASSWORD} characters.`
  else if (isEdit && values.password && values.password.length > 72)
    errors.password = 'Password must be 72 characters or fewer.'

  return errors
}

// e.g. "rahul@gmail.com" → "rahul@123" (the server sets the real password with the same rule)
function defaultPasswordHint(email) {
  const username = email.trim().toLowerCase().split('@')[0]
  return username ? `${username}@123` : 'username@123'
}

// Used for "Add Member" and "Edit Member".
//   member     → existing member when editing (null when adding)
//   onSubmit   → given the fields to send
//   serverError / emailTaken → shown when the backend rejects the save
export default function MemberForm({ member, onSubmit, onCancel, saving, serverError, emailTaken }) {
  const isEdit = Boolean(member)
  const fileInputRef = useRef(null)

  const [values, setValues] = useState(() => ({
    name: member?.name ?? '',
    email: member?.email ?? '',
    phoneNumber: member?.phoneNumber ?? member?.phone ?? '',
    phone: member?.phoneNumber ?? member?.phone ?? '',
    password: '', // never pre-filled: the app never receives existing passwords
    isActive: member ? String(member.isActive) : 'true',
  }))

  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(member?.profileImageUrl ?? null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const [errors, setErrors] = useState({})

  const update = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }))
    if (errors[field]) setErrors((errs) => ({ ...errs, [field]: undefined }))
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrors((errs) => ({ ...errs, photo: 'Please select an image file (JPEG, PNG, or WebP).' }))
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((errs) => ({ ...errs, photo: 'Photo size must be less than 5 MB.' }))
      return
    }

    setPhotoFile(file)
    setRemovePhoto(false)
    setPhotoPreview(URL.createObjectURL(file))
    setErrors((errs) => ({ ...errs, photo: undefined }))
  }

  function handleRemovePhoto() {
    setPhotoFile(null)
    setPhotoPreview(null)
    setRemovePhoto(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (saving) return // never submit twice
    const found = validate(values, isEdit)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    const phoneValue = (values.phoneNumber || values.phone || '').trim()
    const fields = {
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      phoneNumber: phoneValue,
      phone: phoneValue,
    }

    if (photoFile) {
      fields.photo = photoFile
    } else if (removePhoto) {
      fields.removePhoto = true
    }

    if (isEdit && values.password) fields.password = values.password
    if (isEdit) fields.isActive = values.isActive === 'true'
    onSubmit(fields)
  }

  const deactivating = isEdit && member.isActive && values.isActive === 'false'
  const hasPhoto = Boolean(photoPreview)

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
      {serverError && <Alert>{serverError}</Alert>}

      {/* Profile Photo Upload & Preview */}
      <div className="flex flex-col items-center sm:flex-row sm:items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
        <div className="relative group shrink-0">
          <Avatar
            src={photoPreview}
            name={values.name || 'Member'}
            size="xl"
            className="ring-2 ring-primary-500/20"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-900/40 text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
            title="Choose photo"
          >
            <Camera size={22} />
          </button>
        </div>

        <div className="flex-1 text-center sm:text-left">
          <p className="text-sm font-semibold text-slate-800">Profile Photo</p>
          <p className="text-xs text-slate-500 mt-0.5">
            JPG, PNG or WebP (max 5 MB). Uploads securely to Cloudinary.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoChange}
            className="hidden"
            id="member-photo-input"
          />

          <div className="mt-2.5 flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <UploadCloud size={14} />
              {hasPhoto ? 'Change Photo' : 'Upload Photo'}
            </button>

            {hasPhoto && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="inline-flex items-center gap-1.5 rounded-lg border border-danger-200 bg-danger-50 px-3 py-1.5 text-xs font-medium text-danger-700 hover:bg-danger-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-500"
              >
                <Trash2 size={13} />
                Remove
              </button>
            )}
          </div>
          {errors.photo && <p className="mt-1 text-xs text-danger-600">{errors.photo}</p>}
        </div>
      </div>

      <Input
        label="Name"
        value={values.name}
        onChange={update('name')}
        error={errors.name}
        placeholder="e.g. Rahul Kumar"
        maxLength={100}
        autoFocus
      />

      <Input
        label="Username / Email"
        type="email"
        inputMode="email"
        autoComplete="off"
        value={values.email}
        onChange={update('email')}
        error={errors.email || (emailTaken ? 'A member with this email already exists.' : undefined)}
        placeholder="rahul@example.com"
      />

      <Input
        label={isEdit ? 'Phone Number' : 'Phone Number (Required)'}
        type="tel"
        value={values.phoneNumber}
        onChange={update('phoneNumber')}
        error={errors.phoneNumber}
        placeholder="+91 98765 43210 or 9876543210"
        hint="10-digit Indian mobile number"
      />

      {isEdit ? (
        <Input
          label="New password (optional)"
          type="password"
          autoComplete="new-password"
          value={values.password}
          onChange={update('password')}
          error={errors.password}
          hint="Leave blank to keep the current password."
        />
      ) : (
        <div>
          <p className="mb-1.5 text-sm font-medium text-slate-700">Default password</p>
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
            {defaultPasswordHint(values.email)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">
            Set automatically: the username before &quot;@&quot;, followed by @123. The member logs in with their email.
          </p>
        </div>
      )}

      {/* Role is fixed */}
      <div>
        <p className="mb-1.5 text-sm font-medium text-slate-700">Role</p>
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">Member</p>
        <p className="mt-1.5 text-xs text-slate-500">Members can view their own payments and the group summary.</p>
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
