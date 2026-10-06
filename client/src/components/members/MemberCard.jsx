import { ChevronRight, Phone } from 'lucide-react'
import Avatar from '../Avatar'
import { MemberActions, MemberStatusBadge } from './MemberStatus'

// Phone/tablet view: one card per member with photo, name, phone, email, and actions.
export default function MemberCard({ member: m, busy, onView, onEdit, onDeactivate, onActivate }) {
  const phoneDisplay = m.phoneNumber || m.phone

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <button
        type="button"
        onClick={() => onView(m)}
        className="flex w-full items-center justify-between gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Avatar src={m.profileImageUrl} name={m.name} size="md" />
          <div className="min-w-0">
            <span className={`block truncate font-medium text-base ${m.isActive ? 'text-slate-900' : 'text-slate-500'}`}>
              {m.name}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-0.5">
              <Phone size={12} className="shrink-0 text-slate-400" />
              <span className="truncate">{phoneDisplay || 'Phone not added'}</span>
            </div>
            <span className="block truncate text-xs text-slate-500 mt-0.5">{m.email}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <MemberStatusBadge isActive={m.isActive} />
          <ChevronRight size={18} className="text-slate-400" aria-hidden="true" />
          <span className="sr-only">View details</span>
        </div>
      </button>

      <MemberActions
        member={m}
        busy={busy}
        onEdit={onEdit}
        onDeactivate={onDeactivate}
        onActivate={onActivate}
        size="md"
        className="mt-3.5 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3"
      />
    </li>
  )
}
