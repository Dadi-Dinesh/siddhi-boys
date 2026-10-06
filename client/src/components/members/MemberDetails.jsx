import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { getMember } from '../../services/memberService'
import { getErrorMessage } from '../../services/api'
import { formatDate, formatRupees } from '../../utils/format'
import Avatar from '../Avatar'
import { StatusBadge } from '../contributions/ContributionStatus'
import Loading from '../Loading'
import { MemberStatusBadge } from './MemberStatus'

// Contents of the "member details" pop-up: one request for this member only.
export default function MemberDetails({ memberId }) {
  const [state, setState] = useState({ loading: true })

  useEffect(() => {
    let active = true
    getMember(memberId)
      .then((data) => active && setState({ data }))
      .catch((err) => active && setState({ error: getErrorMessage(err) }))
    return () => {
      active = false
    }
  }, [memberId])

  if (state.loading) return <Loading label="Loading member..." />
  if (state.error)
    return (
      <p className="mt-4 flex items-center gap-2 text-sm text-danger-700" role="alert">
        <AlertCircle size={16} aria-hidden="true" /> Unable to load this member. {state.error}
      </p>
    )

  const { member, summary, paymentHistory } = state.data
  const phoneDisplay = member.phoneNumber || member.phone

  return (
    <div className="mt-1 space-y-5">
      {/* Member Profile Card */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-center sm:text-left">
        <Avatar src={member.profileImageUrl} name={member.name} size="xl" />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-slate-900">{member.name}</h2>
          <div className="mt-1 flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-sm text-slate-600">
            <span className="font-medium text-slate-900 tabular-nums">
              {phoneDisplay || <span className="text-slate-400 italic font-normal">Phone not added</span>}
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-600">{member.email}</span>
          </div>
          <div className="mt-2.5 flex items-center justify-center sm:justify-start gap-2 text-xs text-slate-500">
            <span>Member</span>
            <MemberStatusBadge isActive={member.isActive} />
            <span className="text-slate-400">· Joined {formatDate(member.createdAt)}</span>
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-2 text-center">
        {[
          ['Total paid', formatRupees(summary.totalContributed)],
          ['Months paid', summary.monthsPaid],
          ['Months unpaid', summary.monthsUnpaid],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-slate-50 p-3">
            <dt className="text-xs text-slate-500">{label}</dt>
            <dd className="mt-0.5 font-semibold text-slate-900">{value}</dd>
          </div>
        ))}
      </dl>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-900">Contribution history</h3>
        {paymentHistory.length === 0 ? (
          <p className="text-sm text-slate-500">No contribution records yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {paymentHistory.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                <span className="text-slate-800">{c.label}</span>
                <span className="flex items-center gap-3">
                  <span className="tabular-nums text-slate-600">{formatRupees(c.amount)}</span>
                  <StatusBadge status={c.status} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
