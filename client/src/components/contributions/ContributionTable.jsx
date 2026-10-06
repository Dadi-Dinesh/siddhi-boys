import Badge from '../Badge'
import { formatDate, formatRupees } from '../../utils/format'
import { PaymentButton, ScreenshotIndicator, StatusBadge } from './ContributionStatus'

// Wide-screen view: a table. (Phones and tablets use ContributionCard instead.)
export default function ContributionTable({
  items,
  pendingIds,
  onMarkPaid,
  onMarkUnpaid,
  onViewScreenshot,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <th scope="col" className="py-3 pr-3 font-medium">Member</th>
            <th scope="col" className="px-3 py-3 text-right font-medium">Base</th>
            <th scope="col" className="px-3 py-3 text-right font-medium">Fine</th>
            <th scope="col" className="px-3 py-3 text-right font-medium">Total</th>
            <th scope="col" className="px-3 py-3 font-medium">Status</th>
            <th scope="col" className="px-3 py-3 font-medium">Payment Date</th>
            <th scope="col" className="py-3 pl-3 text-right font-medium">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((c) => {
            const isPaid = c.status === 'PAID'
            const fineVal = Number(c.fineAmount || 0)
            const baseVal = Number(c.amount)
            const totalVal = isPaid
              ? (c.totalPaidAmount !== null && c.totalPaidAmount !== undefined ? Number(c.totalPaidAmount) : baseVal + fineVal)
              : baseVal

            return (
              <tr key={c.id} className="hover:bg-slate-50/50">
                <td className="py-3 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{c.member.name}</span>
                    {!c.member.isActive && <Badge>Inactive</Badge>}
                  </div>
                  <div className="text-xs text-slate-500">{c.member.email}</div>
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-slate-700 font-medium">{formatRupees(baseVal)}</td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {fineVal > 0 ? (
                    <span className="font-semibold text-amber-700">+{formatRupees(fineVal)}</span>
                  ) : (
                    <span className="text-slate-400">₹0</span>
                  )}
                </td>
                <td className="px-3 py-3 text-right tabular-nums font-bold text-slate-900">{formatRupees(totalVal)}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={c.status} verification={c.verification} />
                    {onViewScreenshot && <ScreenshotIndicator contribution={c} onClick={onViewScreenshot} />}
                  </div>
                </td>
                <td className="px-3 py-3 text-xs text-slate-600">
                  {isPaid ? (
                    <span>{c.paymentDate ? formatDate(c.paymentDate) : (c.paidAt ? formatDate(c.paidAt) : '—')}</span>
                  ) : (
                    <span className="text-slate-400">{c.dueDate ? `Due: ${formatDate(c.dueDate)}` : '—'}</span>
                  )}
                </td>
                <td className="py-3 pl-3 text-right">
                  <PaymentButton
                    contribution={c}
                    pending={pendingIds.has(c.id)}
                    onMarkPaid={onMarkPaid}
                    onMarkUnpaid={onMarkUnpaid}
                    className="min-w-28"
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
