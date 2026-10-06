// Grey placeholder blocks shown while the dashboard loads for the first time.
function Block({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/70 ${className}`} />
}

function CardSkeleton({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-3 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6 ${className}`}>
      <Block className="h-4 w-1/3" />
      {Array.from({ length: lines }, (_, i) => (
        <Block key={i} className="h-4 w-full" />
      ))}
    </div>
  )
}

export default function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading dashboard">
      <span className="sr-only" role="status">
        Loading dashboard...
      </span>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <CardSkeleton key={i} lines={1} />
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <CardSkeleton lines={4} className="xl:col-span-2" />
        <CardSkeleton lines={3} />
        <CardSkeleton lines={6} className="xl:col-span-2" />
        <CardSkeleton lines={5} />
      </div>
    </div>
  )
}
