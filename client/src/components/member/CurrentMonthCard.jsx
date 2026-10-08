import { useState } from 'react'
import { CalendarClock, CheckCircle2, Clock, Eye } from 'lucide-react'
import { StatusBadge } from '../contributions/ContributionStatus'
import { formatDate, formatRupees } from '../../utils/format'
import Button from '../Button'
import ImageModal from '../ImageModal'

// The member's status for the current month. Three cases:
//   record PAID    → paid, with the date
//   record UNPAID  → owes this month's amount
//   no record yet  → the admin hasn't created this month (NOT shown as unpaid)
//   record:        this month's contribution record (or null)
//   monthLabel:    "October 2026" from the server
//   currentAmount: today's setting, only used when no record exists yet
export default function CurrentMonthCard({ record, monthLabel, currentAmount }) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const status = record ? record.status : 'NOT_CREATED'
  const hasScreenshot = Boolean(record?.verification?.screenshotUrl)

  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="current-month-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="current-month-title" className="text-sm font-medium text-slate-500">
            {monthLabel} · Monthly contribution
          </h2>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
            {record ? formatRupees(record.amount) : currentAmount != null ? formatRupees(currentAmount) : '—'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasScreenshot && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setPreviewOpen(true)}
              title="View payment screenshot"
            >
              <Eye size={14} aria-hidden="true" />
              Receipt
            </Button>
          )}
          <StatusBadge status={status} verification={record?.verification} paymentMethod={record?.paymentMethod} />
        </div>
      </div>

      <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
        {status === 'PAID' && (
          <>
            <CheckCircle2 size={16} className="text-success-600" aria-hidden="true" />
            Paid{record?.paymentMethod === 'CASH' ? ' via Cash' : ''} on {formatDate(record.paymentDate || record.paidAt)}. Thank you!
          </>
        )}
        {status === 'UNPAID' && (
          <>
            <Clock size={16} className="text-warning-600" aria-hidden="true" />
            Payment pending. Please pay {formatRupees(record.amount)} (online or cash) and submit your payment.
          </>
        )}
        {status === 'NOT_CREATED' && (
          <>
            <CalendarClock size={16} className="text-slate-400" aria-hidden="true" />
            This month&apos;s contribution record hasn&apos;t been created yet. Please check back later.
          </>
        )}
      </p>

      <dl className="mt-5 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-slate-500">{record ? 'Amount this month' : 'Current monthly amount'}</dt>
          <dd className="mt-0.5 font-medium text-slate-900">
            {record ? formatRupees(record.amount) : currentAmount != null ? formatRupees(currentAmount) : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Payment status</dt>
          <dd className="mt-0.5 font-medium text-slate-900">
            {status === 'PAID' ? 'Paid' : status === 'UNPAID' ? 'Unpaid' : 'Not created yet'}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Paid date</dt>
          <dd className="mt-0.5 font-medium text-slate-900">
            {record?.paidAt ? formatDate(record.paidAt) : record ? 'Not paid yet' : '—'}
          </dd>
        </div>
      </dl>

      {hasScreenshot && (
        <ImageModal
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          imageUrl={record.verification.screenshotUrl}
          title={`Payment Receipt · ${record.label}`}
          subtitle={`Amount: ${formatRupees(record.amount)} · Paid on ${formatDate(record.paidAt)}`}
        />
      )}
    </section>
  )
}
