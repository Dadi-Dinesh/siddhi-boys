import SearchInput from '../SearchInput'

const TYPES = [
  { value: 'ALL', label: 'All' },
  { value: 'IN', label: 'Money In' },
  { value: 'OUT', label: 'Money Out' },
]

const dateInput =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500'

// Search + All/In/Out + From/To dates. `filters` = { query, type, from, to }.
export default function TransactionFilters({ filters, onChange, onClear }) {
  const set = (field) => (value) => onChange({ ...filters, [field]: value })
  const active = filters.query || filters.type !== 'ALL' || filters.from || filters.to

  return (
    <div className="mb-4 space-y-3">
      <SearchInput
        value={filters.query}
        onChange={set('query')}
        placeholder="Search transactions..."
        label="Search transactions"
        className="sm:max-w-xs"
      />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        {/* Type: three toggle buttons */}
        <div role="group" aria-label="Transaction type" className="inline-flex self-start rounded-lg border border-slate-200 bg-slate-50 p-1">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              aria-pressed={filters.type === t.value}
              onClick={() => set('type')(t.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                filters.type === t.value ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Date range */}
        <div className="grid grid-cols-2 items-end gap-2 sm:flex">
          <label className="text-xs font-medium text-slate-600">
            From
            <input type="date" value={filters.from} max={filters.to || undefined} onChange={(e) => set('from')(e.target.value)} className={`mt-1 ${dateInput}`} />
          </label>
          <label className="text-xs font-medium text-slate-600">
            To
            <input type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => set('to')(e.target.value)} className={`mt-1 ${dateInput}`} />
          </label>
          {active && (
            <button
              type="button"
              onClick={onClear}
              className="col-span-2 rounded-lg px-3 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
