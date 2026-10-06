import { Link } from 'react-router-dom'
import { CalendarDays } from 'lucide-react'
import Card from '../Card'
import EmptyState from '../EmptyState'
import ProgressBar from '../ProgressBar'
import { formatRupees, percentOf } from '../../utils/format'

const MONTHS_SHOWN = 6

// The latest months with how much was collected. Each month links to its Contributions page;
// "View all" opens Contributions, whose month selector lists every month.
export default function CollectionHistory({ months }) {
  const recent = months.slice(0, MONTHS_SHOWN)

  return (
    <Card
      title="Collection history"
      action={
        months.length > MONTHS_SHOWN && (
          <Link to="/admin/contributions" className="text-sm font-medium text-primary-600 hover:text-primary-700">
            View all
          </Link>
        )
      }
    >
      {recent.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No contributions yet.">
          No monthly contribution records have been created.
        </EmptyState>
      ) : (
        <ul className="space-y-4">
          {recent.map((m) => {
            const percent = percentOf(m.collected, m.expected)
            return (
              <li key={`${m.year}-${m.month}`}>
                <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
                  <Link
                    to={`/admin/contributions?year=${m.year}&month=${m.month}`}
                    className="font-medium text-slate-800 hover:text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  >
                    {m.label}
                  </Link>
                  <span className="font-semibold text-slate-900">{percent}%</span>
                </div>
                <ProgressBar
                  percent={percent}
                  color={percent === 100 ? 'success' : 'primary'}
                  label={`${m.label}: ${percent}% collected`}
                />
                <p className="mt-1 text-xs text-slate-500">
                  {formatRupees(m.collected)} / {formatRupees(m.expected)}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
