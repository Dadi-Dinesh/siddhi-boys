import { useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

// Labelled input.
//   type="password" → adds a show/hide button automatically
//   multiline       → renders a <textarea>
//   prefix="₹"      → small fixed text inside the left edge
//   hint            → grey helper text under the field (hidden when there's an error)
export default function Input({ label, error, hint, prefix, multiline = false, type = 'text', className = '', ...props }) {
  const id = useId()
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  const fieldClasses = `w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400
    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
    ${error ? 'border-danger-600' : 'border-slate-300'} ${isPassword ? 'pr-11' : ''} ${prefix ? 'pl-8' : ''}`

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500" aria-hidden="true">
            {prefix}
          </span>
        )}
        {multiline ? (
          <textarea
            id={id}
            rows={3}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={`${fieldClasses} resize-y`}
            {...props}
          />
        ) : (
          <input
            id={id}
            type={isPassword && showPassword ? 'text' : type}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={fieldClasses}
            {...props}
          />
        )}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-slate-400
              hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-danger-600">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
