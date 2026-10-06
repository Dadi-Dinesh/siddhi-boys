import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

const VARIANTS = {
  error: { icon: AlertCircle, classes: 'bg-danger-50 text-danger-700 border-danger-600/20' },
  success: { icon: CheckCircle2, classes: 'bg-success-50 text-success-700 border-success-600/20' },
  info: { icon: Info, classes: 'bg-primary-50 text-primary-700 border-primary-500/20' },
}

// A message box with an icon, so meaning isn't carried by colour alone.
// Pass onClose to show a small dismiss (×) button.
export default function Alert({ children, variant = 'error', onClose }) {
  const { icon: Icon, classes } = VARIANTS[variant]
  return (
    <div role={variant === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm ${classes}`}>
      <Icon size={18} className="mt-px shrink-0" aria-hidden="true" />
      <span className="flex-1">{children}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss message"
          className="-m-1 rounded p-1 opacity-70 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
