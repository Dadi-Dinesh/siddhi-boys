import { formatDate } from '../../utils/format'
import { MemberActions, MemberStatusBadge } from './MemberStatus'

// Desktop view. Click a name to see that member's details and payment history.
export default function MemberTable({ members, busyId, onView, onEdit, onDeactivate, onActivate }) {
  return (
    <table className="w-full table-fixed text-left text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
          <th scope="col" className="w-[24%] py-3 pr-4 font-medium">Name</th>
          <th scope="col" className="px-4 py-3 font-medium">Email</th>
          <th scope="col" className="hidden w-24 px-4 py-3 font-medium xl:table-cell">Role</th>
          <th scope="col" className="w-28 px-4 py-3 font-medium">Status</th>
          <th scope="col" className="hidden w-32 px-4 py-3 font-medium xl:table-cell">Joined</th>
          <th scope="col" className="w-28 py-3 pl-4 text-right font-medium xl:w-60">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {members.map((m) => (
          <tr key={m.id} className={m.isActive ? '' : 'text-slate-500'}>
            <td className="py-3 pr-4">
              <button
                type="button"
                onClick={() => onView(m)}
                className="max-w-full truncate text-left font-medium text-slate-900 hover:text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                {m.name}
              </button>
            </td>
            <td className="truncate px-4 py-3" title={m.email}>
              {m.email}
            </td>
            <td className="hidden px-4 py-3 xl:table-cell">Member</td>
            <td className="px-4 py-3">
              <MemberStatusBadge isActive={m.isActive} />
            </td>
            <td className="hidden px-4 py-3 xl:table-cell">{formatDate(m.createdAt)}</td>
            <td className="py-3 pl-4">
              <MemberActions
                member={m}
                busy={busyId === m.id}
                onEdit={onEdit}
                onDeactivate={onDeactivate}
                onActivate={onActivate}
                compact
                className="flex justify-end gap-2"
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
