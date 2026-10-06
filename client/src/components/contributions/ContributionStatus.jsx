import { CalendarClock, CheckCircle2, Clock, Eye, XCircle } from 'lucide-react'
import Badge from '../Badge'
import Button from '../Button'

// PAID / UNPAID / PENDING / DECLINED badge
export function StatusBadge({ status, verification }) {
  if (status === 'PAID') {
    return (
      <Badge variant="success" icon={CheckCircle2}>
        Paid
      </Badge>
    )
  }
  if (status === 'UNPAID') {
    if (verification?.status === 'PENDING') {
      return (
        <Badge variant="warning" icon={Clock}>
          Pending Verification
        </Badge>
      )
    }
    if (verification?.status === 'DECLINED') {
      return (
        <Badge variant="danger" icon={XCircle}>
          Declined
        </Badge>
      )
    }
    return (
      <Badge variant="warning" icon={Clock}>
        Unpaid
      </Badge>
    )
  }
  return <Badge icon={CalendarClock}>Not created</Badge>
}

// Indicator button that opens the screenshot preview modal
export function ScreenshotIndicator({ contribution, onClick }) {
  if (!contribution?.verification?.screenshotUrl) return null
  return (
    <button
      type="button"
      onClick={() => onClick(contribution)}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors"
      title="View payment screenshot"
    >
      <Eye size={12} aria-hidden="true" />
      Screenshot
    </button>
  )
}

// The action for an admin row: "Mark Paid" (opens upload verification modal) or "Mark Unpaid"
export function PaymentButton({ contribution, pending, onMarkPaid, onMarkUnpaid, size = 'sm', className = '' }) {
  const isPaid = contribution.status === 'PAID'
  const name = contribution.member?.name || 'member'

  return isPaid ? (
    <Button
      size={size}
      variant="secondary"
      loading={pending}
      loadingText="Updating..."
      onClick={() => onMarkUnpaid(contribution)}
      className={className}
    >
      Mark Unpaid<span className="sr-only"> for {name}</span>
    </Button>
  ) : (
    <Button
      size={size}
      loading={pending}
      loadingText="Updating..."
      onClick={() => onMarkPaid(contribution)}
      className={className}
    >
      Mark Paid<span className="sr-only"> for {name}</span>
    </Button>
  )
}
