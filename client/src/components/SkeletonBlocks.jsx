// Grey placeholder shapes shown while a list page loads:
// a row of `stats` boxes, then a card with `rows` lines.
export default function SkeletonBlocks({ label, stats = 3, rows = 5, statsClassName = 'grid-cols-2 lg:grid-cols-3' }) {
  return (
    <div aria-busy="true">
      <span className="sr-only" role="status">
        {label}
      </span>
      {stats > 0 && (
        <div className={`grid gap-3 ${statsClassName}`}>
          {Array.from({ length: stats }, (_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200/70" />
          ))}
        </div>
      )}
      <div className="mt-6 space-y-3 rounded-2xl border border-slate-200/70 bg-white p-6">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
    </div>
  )
}
