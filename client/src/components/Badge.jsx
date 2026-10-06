const VARIANTS = {
  neutral: 'bg-slate-100 text-slate-700',
  primary: 'bg-primary-50 text-primary-700',
  success: 'bg-success-50 text-success-700',
  warning: 'bg-warning-50 text-warning-700',
  danger: 'bg-danger-50 text-danger-700',
}

// Small status label (PAID / UNPAID, ACTIVE / INACTIVE, IN / OUT). Always shown in capitals,
// with text (and usually an icon), so status is never shown by colour alone.
export default function Badge({ children, variant = 'neutral', icon: Icon }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${VARIANTS[variant]}`}
    >
      {Icon && <Icon size={12} aria-hidden="true" />}
      {children}
    </span>
  )
}
