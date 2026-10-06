import { BarChart3 } from 'lucide-react'
import Card from '../Card'
import EmptyState from '../EmptyState'
import { formatRupees, formatRupeesShort } from '../../utils/format'

// Simple column chart drawn with plain HTML/CSS (no chart library needed).
// For each month: a light column = expected, a dark column inside it = collected.
// Hover or keyboard-focus a month to see its exact numbers.

const MONTHS_SHOWN = 6
const shortMonth = new Intl.DateTimeFormat('en-IN', { month: 'short' })

// Rounds the top of the y-axis up to a clean number: 1,200 → 1,500, 2,600 → 3,000, 840 → 1,000.
function niceMax(value) {
  if (value <= 0) return 0
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const step = [1, 1.5, 2, 2.5, 3, 5, 10].find((s) => s * magnitude >= value)
  return step * magnitude
}

// Centre each tooltip over its column, except the first/last, which are
// anchored inwards so they never stick out past the edge of a phone screen.
function tooltipPosition(index, count) {
  if (index === 0) return 'left-0'
  if (index === count - 1) return 'right-0'
  return 'left-1/2 -translate-x-1/2'
}

export default function MonthlyCollectionChart({ months }) {
  // API gives newest first; a chart reads left (old) → right (new).
  const data = months.slice(0, MONTHS_SHOWN).reverse()

  if (data.length < 2) {
    return (
      <Card title="Monthly collection">
        <EmptyState icon={BarChart3} title={data.length === 0 ? 'No contributions yet.' : 'Not enough history yet.'}>
          {data.length === 0
            ? 'No monthly contribution records have been created.'
            : 'The chart appears once there are at least two months of contributions.'}
        </EmptyState>
      </Card>
    )
  }

  const top = niceMax(Math.max(...data.map((m) => Math.max(m.expected, m.collected))))
  const ticks = [top, top / 2, 0]
  const height = (amount) => `${top ? (amount / top) * 100 : 0}%`

  return (
    <Card
      title="Monthly collection"
      action={
        <div className="flex items-center gap-4 text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-primary-600" aria-hidden="true" /> Collected
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-primary-100" aria-hidden="true" /> Expected
          </span>
        </div>
      }
    >
      <div className="flex gap-2" aria-hidden="true">
        {/* Y axis labels */}
        <div className="flex h-48 w-14 shrink-0 flex-col justify-between text-right text-xs tabular-nums text-slate-400">
          {ticks.map((t) => (
            <span key={t} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">
              {formatRupeesShort(t)}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          {/* Plot area with hairline gridlines */}
          <div className="relative h-48 border-b border-slate-200">
            <div className="absolute inset-x-0 top-0 border-t border-slate-100" />
            <div className="absolute inset-x-0 top-1/2 border-t border-slate-100" />
            <div className="relative flex h-full items-end justify-around">
              {data.map((m, i) => (
                <div
                  key={`${m.year}-${m.month}`}
                  tabIndex={0}
                  className="group relative flex h-full w-full max-w-16 items-end justify-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  {/* expected (track) with collected (fill) inside it */}
                  <div className="relative w-6 rounded-t bg-primary-100" style={{ height: height(m.expected) }}>
                    <div
                      className="absolute inset-x-0 bottom-0 rounded-t bg-primary-600"
                      style={{ height: m.expected ? `${Math.min(100, (m.collected / m.expected) * 100)}%` : 0 }}
                    />
                  </div>
                  {/* Tooltip */}
                  <div
                    className={`pointer-events-none absolute bottom-full z-10 mb-1 hidden w-max rounded-lg ${tooltipPosition(i, data.length)} bg-slate-900 px-3 py-2 text-xs text-white shadow-lg group-hover:block group-focus-visible:block`}
                  >
                    <p className="font-semibold">{m.label}</p>
                    <p>Collected: {formatRupees(m.collected)}</p>
                    <p className="text-slate-300">Expected: {formatRupees(m.expected)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* X axis labels */}
          <div className="mt-2 flex justify-around text-xs text-slate-500">
            {data.map((m) => (
              <span key={`${m.year}-${m.month}`} className="w-full max-w-16 text-center">
                {shortMonth.format(new Date(m.year, m.month - 1, 1))}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Same data as a table for screen readers. The wrapper div does the hiding:
          tables ignore sr-only's clipping and would widen the page on small phones. */}
      <div className="sr-only">
      <table>
        <caption>Monthly collection: collected vs expected</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Collected</th>
            <th scope="col">Expected</th>
          </tr>
        </thead>
        <tbody>
          {data.map((m) => (
            <tr key={`${m.year}-${m.month}`}>
              <th scope="row">{m.label}</th>
              <td>{formatRupees(m.collected)}</td>
              <td>{formatRupees(m.expected)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </Card>
  )
}
