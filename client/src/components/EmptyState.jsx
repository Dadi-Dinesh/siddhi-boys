// Friendly "nothing here yet" message used instead of empty or broken sections.
export default function EmptyState({ icon: Icon, title, children }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
      {Icon && <Icon size={24} className="mb-2 text-slate-300" aria-hidden="true" />}
      <p className="text-sm font-medium text-slate-600">{title}</p>
      {children && <div className="mt-1 text-sm text-slate-500">{children}</div>}
    </div>
  )
}
