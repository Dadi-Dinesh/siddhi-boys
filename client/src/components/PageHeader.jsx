import { useEffect } from 'react'

// The same title / subtitle / action area on every page.
// Also sets the browser tab title, e.g. "Expenses · SiddhiBoys".
//   <PageHeader title="Expenses" subtitle="Track ..." actions={<Button>...</Button>} />
export default function PageHeader({ title, subtitle, actions, documentTitle }) {
  const tabTitle = documentTitle ?? (typeof title === 'string' ? title : null)

  useEffect(() => {
    if (tabTitle) document.title = `${tabTitle} · SiddhiBoys`
  }, [tabTitle])

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  )
}
