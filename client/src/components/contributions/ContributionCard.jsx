import Badge from '../Badge'
import { formatDate, formatRupees } from '../../utils/format'
import { PaymentButton, ScreenshotIndicator, StatusBadge } from './ContributionStatus'

// Phone/tablet view: one card per member, with a full-width action button that's easy to tap.
export default function ContributionCard({
  contribution: c,
  pending,
  onMarkPaid,
  onMarkUnpaid,
  onViewScreenshot,
}) {
  const isPaid = c.status === 'PAID'
  const fineVal = Number(c.fineAmount || 0)
  const baseVal = Number(c.amount)
  const totalVal = isPaid
    ? (c.totalPaidAmount !== null && c.totalPaidAmount !== undefined ? Number(c.totalPaidAmount) : baseVal + fineVal)
    : baseVal

  return (
    <li className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-medium text-slate-900">
            <span className="truncate">{c.member.name}</span>
            {!c.member.isActive && <Badge>Inactive</Badge>}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {isPaid
              ? (c.paymentDate ? `Paid on ${formatDate(c.paymentDate)}` : `Paid on ${formatDate(c.paidAt)}`)
              : (c.dueDate ? `Due by ${formatDate(c.dueDate)}` : 'Not paid yet')}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="font-bold tabular-nums text-slate-900">{formatRupees(totalVal)}</span>
          <div className="flex items-center gap-1.5">
            <StatusBadge status={c.status} verification={c.verification} />
          </div>
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
        <div>
          <span>Base: <strong>{formatRupees(baseVal)}</strong></span>
          {fineVal > 0 ? (
            <span className="ml-2 text-amber-700 font-semibold">Fine: +{formatRupees(fineVal)}</span>
          ) : (
            <span className="ml-2 text-slate-400">Fine: ₹0</span>
          )}
        </div>
        {onViewScreenshot && c.verification?.screenshotUrl && (
          <ScreenshotIndicator contribution={c} onClick={onViewScreenshot} />
        )}
      </div>

      <PaymentButton
        contribution={c}
        pending={pending}
        onMarkPaid={onMarkPaid}
        onMarkUnpaid={onMarkUnpaid}
        size="md" // bigger tap target on phones
        className="mt-3 w-full"
      />
    </li>
  )
}
