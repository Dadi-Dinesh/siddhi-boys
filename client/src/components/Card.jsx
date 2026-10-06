// A white rounded box used for every section of the app.
// Optional title (and an action on the right, e.g. a "View all" link).
// h-full lets cards side by side in a grid row line up to the same height.
export default function Card({ children, title, action, className = '' }) {
  return (
    <section className={`h-full rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          {title && <h2 className="font-semibold text-slate-900">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
