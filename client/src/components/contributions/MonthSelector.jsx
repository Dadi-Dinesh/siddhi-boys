import { ChevronLeft, ChevronRight } from 'lucide-react'
import { monthLabel, shiftMonth } from '../../utils/months'

// Previous / dropdown / next. Months that already have records are marked,
// so the admin can see at a glance which months exist.
export default function MonthSelector({ year, month, options, onChange }) {
  const value = `${year}-${month}`
  const go = (step) => onChange(shiftMonth(year, month, step))

  return (
    <div className="flex items-center gap-1">
      <IconButton label="Previous month" onClick={() => go(-1)}>
        <ChevronLeft size={18} />
      </IconButton>
      <label htmlFor="month-select" className="sr-only">
        Select month
      </label>
      <select
        id="month-select"
        value={value}
        onChange={(e) => {
          const [y, m] = e.target.value.split('-').map(Number)
          onChange({ year: y, month: m })
        }}
        className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-8 text-sm font-medium text-slate-800
          focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 sm:flex-none"
      >
        {options.map((o) => (
          <option key={`${o.year}-${o.month}`} value={`${o.year}-${o.month}`}>
            {monthLabel(o.year, o.month)}
            {o.created ? '' : ' (not created)'}
          </option>
        ))}
      </select>
      <IconButton label="Next month" onClick={() => go(1)}>
        <ChevronRight size={18} />
      </IconButton>
    </div>
  )
}

function IconButton({ label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      {children}
    </button>
  )
}
