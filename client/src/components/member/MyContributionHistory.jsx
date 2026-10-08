import { useState } from 'react'
import { Eye, History } from 'lucide-react'
import Card from '../Card'
import EmptyState from '../EmptyState'
import ImageModal from '../ImageModal'
import { StatusBadge } from '../contributions/ContributionStatus'
import { formatDate, formatRupees } from '../../utils/format'

// The member's own records, newest first. Each row shows the amount stored on
// that record, so old months keep their original amount even if the setting changes.
export default function MyContributionHistory({ items }) {
  const [selectedPreview, setSelectedPreview] = useState(null)

  return (
    <Card title="My contribution history">
      {items.length === 0 ? (
        <EmptyState icon={History} title="No contribution history yet." />
      ) : (
        <>
          {/* Tablet & desktop */}
          <table className="hidden w-full text-left text-sm sm:table">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th scope="col" className="py-3 pr-3 font-medium">Month</th>
                <th scope="col" className="px-3 py-3 text-right font-medium">Base</th>
                <th scope="col" className="px-3 py-3 text-right font-medium">Fine</th>
                <th scope="col" className="px-3 py-3 text-right font-medium">Total Paid</th>
                <th scope="col" className="px-3 py-3 font-medium">Status</th>
                <th scope="col" className="px-3 py-3 font-medium">Payment Date</th>
                <th scope="col" className="py-3 pl-3 text-right font-medium">Receipt</th>
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
                const payDate = c.paymentDate ? formatDate(c.paymentDate) : (c.paidAt ? formatDate(c.paidAt) : '—')

                return (
                  <tr key={c.id}>
                    <td className="py-3 pr-3 font-medium text-slate-900">{c.label}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-700">{formatRupees(baseVal)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {fineVal > 0 ? (
                        <span className="font-semibold text-amber-700">+{formatRupees(fineVal)}</span>
                      ) : (
                        <span className="text-slate-400">₹0</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums font-bold text-slate-900">{formatRupees(totalVal)}</td>
                    <td className="px-3 py-3">
                      <StatusBadge status={c.status} verification={c.verification} paymentMethod={c.paymentMethod} />
                    </td>
                    <td className="px-3 py-3 text-slate-600 text-xs">{payDate}</td>
                    <td className="py-3 pl-3 text-right">
                      {c.verification?.screenshotUrl ? (
                        <button
                          type="button"
                          onClick={() => setSelectedPreview(c)}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary-700 hover:bg-primary-50 transition-colors"
                          title="View payment receipt screenshot"
                        >
                          <Eye size={13} />
                          View
                        </button>
                      ) : (c.paymentMethod === 'CASH' || c.verification?.paymentMethod === 'CASH') ? (
                        <span className="text-emerald-700 font-medium text-xs">Cash</span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Phones */}
          <ul className="divide-y divide-slate-100 sm:hidden">
            {items.map((c) => {
              const isPaid = c.status === 'PAID'
              const isCash = c.paymentMethod === 'CASH' || c.verification?.paymentMethod === 'CASH'
              const fineVal = Number(c.fineAmount || 0)
              const baseVal = Number(c.amount)
              const totalVal = isPaid
                ? (c.totalPaidAmount !== null && c.totalPaidAmount !== undefined ? Number(c.totalPaidAmount) : baseVal + fineVal)
                : baseVal
              const payDate = c.paymentDate ? formatDate(c.paymentDate) : (c.paidAt ? formatDate(c.paidAt) : null)

              return (
                <li key={c.id} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{c.label}</p>
                      <p className="text-xs text-slate-500">{payDate ? `Paid on ${payDate}${isCash ? ' (Cash)' : ''}` : 'Not paid yet'}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="font-bold tabular-nums text-slate-900">{formatRupees(totalVal)}</span>
                      <StatusBadge status={c.status} verification={c.verification} paymentMethod={c.paymentMethod} />
                      {c.verification?.screenshotUrl && (
                        <button
                          type="button"
                          onClick={() => setSelectedPreview(c)}
                          className="rounded p-1 text-primary-700 hover:bg-primary-50"
                          title="View screenshot"
                        >
                          <Eye size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                  {fineVal > 0 && (
                    <div className="text-[11px] text-amber-800 bg-amber-50/60 rounded px-2 py-0.5 inline-block">
                      Includes late fine: +{formatRupees(fineVal)}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>

          {selectedPreview && (
            <ImageModal
              open={Boolean(selectedPreview)}
              onClose={() => setSelectedPreview(null)}
              imageUrl={selectedPreview.verification.screenshotUrl}
              title={`Payment Receipt · ${selectedPreview.label}`}
              subtitle={`Amount: ${formatRupees(selectedPreview.amount)} · ${selectedPreview.paidAt ? `Paid on ${formatDate(selectedPreview.paidAt)}` : 'Submitted'}`}
            />
          )}
        </>
      )}
    </Card>
  )
}
