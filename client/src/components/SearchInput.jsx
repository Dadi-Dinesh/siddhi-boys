import { useId } from 'react'
import { Search, X } from 'lucide-react'

// Search box with a magnifier icon and a clear (×) button. Used on every list page.
//   <SearchInput value={query} onChange={setQuery} placeholder="Search members..." label="Search members" />
export default function SearchInput({ value, onChange, placeholder, label, className = 'mb-4 sm:max-w-xs' }) {
  const id = useId()
  return (
    <div className={`relative ${className}`}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-9 text-sm placeholder:text-slate-400
          focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
