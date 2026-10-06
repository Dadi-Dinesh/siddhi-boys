import { ChevronRight } from 'lucide-react'
import { MemberActions, MemberStatusBadge } from './MemberStatus'

// Phone/tablet view: one card per member with large buttons.
export default function MemberCard({ member: m, busy, onView, onEdit, onDeactivate, onActivate }) {
  return (
    <li className="rounded-xl border border-slate-200 p-4">
      <button
        type="button"
        onClick={() => onView(m)}
        className="flex w-full items-start justify-between gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        <span className="min-w-0">
          <span className={`block truncate font-medium ${m.isActive ? 'text-slate-900' : 'text-slate-500'}`}>{m.name}</span>
          <span className="block truncate text-sm text-slate-500">{m.email}</span>
          <span className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            Member <MemberStatusBadge isActive={m.isActive} />
          </span>
        </span>
        <ChevronRight size={18} className="mt-1 shrink-0 text-slate-400" aria-hidden="true" />
        <span className="sr-only">View details</span>
      </button>
      <MemberActions
        member={m}
        busy={busy}
        onEdit={onEdit}
        onDeactivate={onDeactivate}
        onActivate={onActivate}
        size="md"
        className="mt-3 grid grid-cols-2 gap-2"
      />
    </li>
  )
}
