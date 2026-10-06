import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { getMember } from '../../services/memberService'
import { getErrorMessage } from '../../services/api'
import { formatDate, formatRupees } from '../../utils/format'
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
  return (
    <div className="mt-1 space-y-5">
      <div>
        <p className="text-sm text-slate-500">{member.email}</p>
        {member.phone && <p className="text-sm text-slate-500">{member.phone}</p>}
        <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
          Member <MemberStatusBadge isActive={member.isActive} />
          <span className="text-slate-400">· Joined {formatDate(member.createdAt)}</span>
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
