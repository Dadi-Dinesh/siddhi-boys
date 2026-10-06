// A small summary number (e.g. "Total expenses ₹1,000.00"). Use inside a <dl> grid.
//   tone: extra classes for the value, e.g. 'text-success-700'
export default function StatCard({ label, value, hint, suffix, tone = '', className = '' }) {
  return (
    <div className={`rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm sm:p-5 ${className}`}>
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className={`mt-1 text-xl font-semibold tracking-tight text-slate-900 ${tone}`}>
        {value}
        {suffix && <span className="ml-1 text-sm font-medium text-slate-400">{suffix}</span>}
      </dd>
      {hint && <dd className="mt-0.5 text-xs text-slate-500">{hint}</dd>}
    </div>
  )
}
