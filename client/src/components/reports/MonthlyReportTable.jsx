import { Link } from 'react-router-dom'
import Card from '../Card'
import ProgressBar from '../ProgressBar'
import { formatPercent, formatRupees } from '../../utils/format'

const monthLink = (m) => `/admin/contributions?year=${m.year}&month=${m.month}`
const linkClass =
  'font-medium text-slate-900 hover:text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500'

// One row per month, newest first. Amounts are the amounts stored on each month's
// records, so old months keep their original contribution amount.
// Clicking a month opens it on the Contributions page.
export default function MonthlyReportTable({ months }) {
  return (
    <Card title="Monthly summary">
      {/* Desktop */}
      <table className="hidden w-full text-left text-sm lg:table">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <th scope="col" className="py-3 pr-4 font-medium">Month</th>
            <th scope="col" className="px-3 py-3 text-right font-medium">Expected</th>
            <th scope="col" className="px-3 py-3 text-right font-medium">Collected</th>
            <th scope="col" className="px-3 py-3 text-right font-medium">Pending</th>
            <th scope="col" className="px-3 py-3 text-right font-medium">Paid</th>
            <th scope="col" className="px-3 py-3 text-right font-medium">Unpaid</th>
            <th scope="col" className="w-40 py-3 pl-3 font-medium">Collection</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 tabular-nums">
          {months.map((m) => (
            <tr key={`${m.year}-${m.month}`}>
              <td className="py-3 pr-4">
                <Link to={monthLink(m)} className={linkClass}>
                  {m.label}
                </Link>
              </td>
              <td className="px-3 py-3 text-right text-slate-700">{formatRupees(m.expected)}</td>
              <td className="px-3 py-3 text-right text-slate-900">{formatRupees(m.collected)}</td>
              <td className="px-3 py-3 text-right text-slate-700">{formatRupees(m.pending)}</td>
              <td className="px-3 py-3 text-right text-slate-700">{m.paidMembers}</td>
              <td className="px-3 py-3 text-right text-slate-700">{m.unpaidMembers}</td>
              <td className="py-3 pl-3">
                <div className="flex items-center gap-2">
                  <ProgressBar
                    percent={m.collectionPercent ?? 0}
                    color={m.collectionPercent === 100 ? 'success' : 'primary'}
                    label={`${m.label}: ${formatPercent(m.collectionPercent)} collected`}
                  />
                  <span className="w-12 shrink-0 text-right font-medium text-slate-900">{formatPercent(m.collectionPercent)}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Phones & tablets */}
      <ul className="space-y-3 lg:hidden">
        {months.map((m) => (
          <li key={`${m.year}-${m.month}`} className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <Link to={monthLink(m)} className={linkClass}>
                {m.label}
              </Link>
              <span className="font-semibold text-slate-900">{formatPercent(m.collectionPercent)}</span>
            </div>
            <ProgressBar
              percent={m.collectionPercent ?? 0}
              color={m.collectionPercent === 100 ? 'success' : 'primary'}
              label={`${m.label}: ${formatPercent(m.collectionPercent)} collected`}
              className="mt-2"
            />
            <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <Mini label="Expected" value={formatRupees(m.expected)} />
              <Mini label="Collected" value={formatRupees(m.collected)} />
              <Mini label="Pending" value={formatRupees(m.pending)} />
              <Mini label="Paid members" value={m.paidMembers} />
              <Mini label="Unpaid members" value={m.unpaidMembers} />
            </dl>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function Mini({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="truncate font-medium tabular-nums text-slate-900">{value}</dd>
    </div>
  )
}
